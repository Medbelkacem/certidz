import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  DocumentStatus,
  type Envelope,
  type EnvelopeSigner,
  Prisma,
  type SignatureField,
  SignerStatus,
  SigningOrder,
} from '@prisma/client';
import type { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { AUDIT_RECORD_EVENT, type AuditRecordInput } from '../audit/audit.types';
import type { RequestContext } from '../auth/auth.types';
import { SignaturesService } from '../signatures/signatures.service';
import type { AddFieldDto } from './dto/add-field.dto';
import type { AddSignerDto } from './dto/add-signer.dto';
import type { CreateEnvelopeDto } from './dto/create-envelope.dto';
import {
  actionableSigners,
  allSignersSigned,
  assertTransition,
  EnvelopeStatus,
  isSignerActionable,
  isTerminal,
  type SigningMode,
} from './envelope-state';
import {
  ENVELOPES_QUEUE,
  type NotifySignerJob,
} from './envelopes.queue';

@Injectable()
export class EnvelopesService {
  private readonly logger = new Logger(EnvelopesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly signatures: SignaturesService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue(ENVELOPES_QUEUE) private readonly queue: Queue,
  ) {}

  // -------------------------------------------------------------------------
  // Authoring (DRAFT only)
  // -------------------------------------------------------------------------

  async create(
    orgId: string,
    userId: string,
    dto: CreateEnvelopeDto,
    ctx: RequestContext,
  ): Promise<Envelope> {
    const document = await this.prisma.document.findFirst({
      where: { id: dto.documentId, orgId, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    if (document.status !== DocumentStatus.ACTIVE) {
      throw new BadRequestException('Document is not in an active state');
    }

    const envelope = await this.prisma.envelope.create({
      data: {
        orgId,
        documentId: dto.documentId,
        createdById: userId,
        title: dto.title,
        message: dto.message,
        signingOrder: dto.signingOrder ?? SigningOrder.SEQUENTIAL,
        expiresAt: dto.expiresAt,
        status: EnvelopeStatus.DRAFT,
      },
    });

    this.audit({
      tenantId: orgId,
      actorId: userId,
      action: 'envelope.created',
      resourceType: 'envelope',
      resourceId: envelope.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return envelope;
  }

  async addSigner(
    orgId: string,
    envelopeId: string,
    dto: AddSignerDto,
  ): Promise<EnvelopeSigner> {
    const envelope = await this.getDraft(orgId, envelopeId);
    const email = dto.email.toLowerCase();

    const existing = await this.prisma.envelopeSigner.findUnique({
      where: { envelopeId_email: { envelopeId: envelope.id, email } },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Signer with this email already exists');
    }

    return this.prisma.envelopeSigner.create({
      data: {
        envelopeId: envelope.id,
        email,
        fullName: dto.fullName,
        order: dto.order ?? 1,
        userId: dto.userId,
        ...(dto.channel ? { channel: dto.channel } : {}),
        ...(dto.authMethod ? { authMethod: dto.authMethod } : {}),
        status: SignerStatus.PENDING,
      },
    });
  }

  async addField(
    orgId: string,
    envelopeId: string,
    dto: AddFieldDto,
  ): Promise<SignatureField> {
    const envelope = await this.getDraft(orgId, envelopeId);
    const signer = await this.prisma.envelopeSigner.findFirst({
      where: { id: dto.signerId, envelopeId: envelope.id },
      select: { id: true },
    });
    if (!signer) {
      throw new BadRequestException('Signer does not belong to this envelope');
    }

    return this.prisma.signatureField.create({
      data: {
        envelopeId: envelope.id,
        signerId: dto.signerId,
        type: dto.type,
        page: dto.page,
        x: dto.x,
        y: dto.y,
        w: dto.w,
        h: dto.h,
        required: dto.required ?? true,
      },
    });
  }

  // -------------------------------------------------------------------------
  // Send
  // -------------------------------------------------------------------------

  async send(
    orgId: string,
    envelopeId: string,
    userId: string,
    ctx: RequestContext,
  ): Promise<Envelope> {
    const envelope = await this.prisma.envelope.findFirst({
      where: { id: envelopeId, orgId },
      include: { signers: true },
    });
    if (!envelope) {
      throw new NotFoundException('Envelope not found');
    }
    assertTransition(envelope.status, EnvelopeStatus.SENT);
    if (envelope.signers.length === 0) {
      throw new BadRequestException('Envelope has no signers');
    }

    const mode = envelope.signingOrder as SigningMode;
    const toNotify = actionableSigners(
      envelope.signers.map((s) => ({ id: s.id, order: s.order, status: s.status })),
      mode,
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      const env = await tx.envelope.update({
        where: { id: envelope.id },
        data: { status: EnvelopeStatus.SENT, sentAt: new Date() },
      });
      await tx.envelopeSigner.updateMany({
        where: { id: { in: toNotify.map((s) => s.id) } },
        data: { status: SignerStatus.NOTIFIED, notifiedAt: new Date() },
      });
      return env;
    });

    // Enqueue notifications for the currently-actionable signers.
    await Promise.all(
      toNotify.map((s) =>
        this.queue.add(
          'notify-signer',
          { envelopeId: envelope.id, signerId: s.id, orgId } as NotifySignerJob,
          { removeOnComplete: true, attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
        ),
      ),
    );

    // Schedule an expiry check if a deadline is set.
    if (envelope.expiresAt) {
      const delay = Math.max(0, envelope.expiresAt.getTime() - Date.now());
      await this.queue.add(
        'check-expiry',
        { envelopeId: envelope.id, orgId },
        { delay, removeOnComplete: true },
      );
    }

    this.audit({
      tenantId: orgId,
      actorId: userId,
      action: 'envelope.sent',
      resourceType: 'envelope',
      resourceId: envelope.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { signers: envelope.signers.length, mode },
    });

    return updated;
  }

  // -------------------------------------------------------------------------
  // Signer actions
  // -------------------------------------------------------------------------

  async markViewed(orgId: string, envelopeId: string, signerId: string): Promise<void> {
    const { envelope, signer } = await this.loadSigner(orgId, envelopeId, signerId);
    this.assertEnvelopeActionable(envelope.status);
    await this.prisma.$transaction(async (tx) => {
      if (!signer.viewedAt) {
        await tx.envelopeSigner.update({
          where: { id: signer.id },
          data: {
            viewedAt: new Date(),
            status:
              signer.status === SignerStatus.PENDING ||
              signer.status === SignerStatus.NOTIFIED
                ? SignerStatus.VIEWED
                : signer.status,
          },
        });
      }
      await this.maybeAdvanceToInProgress(tx, envelope.id, envelope.status);
    });
  }

  async consent(orgId: string, envelopeId: string, signerId: string): Promise<void> {
    const { envelope, signer } = await this.loadSigner(orgId, envelopeId, signerId);
    this.assertEnvelopeActionable(envelope.status);
    await this.prisma.envelopeSigner.update({
      where: { id: signer.id },
      data: { consentedAt: new Date(), status: SignerStatus.CONSENTED },
    });
  }

  /**
   * Apply a signer's signature. Enforces signing order, delegates cryptographic
   * signing to the signatures module, marks the signer SIGNED and advances the
   * envelope (→ IN_PROGRESS, then → COMPLETED when all have signed).
   */
  async sign(
    orgId: string,
    envelopeId: string,
    signerId: string,
    ctx: RequestContext,
  ): Promise<{ signatureId: string; envelopeStatus: EnvelopeStatus }> {
    const { envelope, signer, allSigners } = await this.loadSigner(
      orgId,
      envelopeId,
      signerId,
    );
    this.assertEnvelopeActionable(envelope.status);

    if (signer.status === SignerStatus.SIGNED) {
      throw new ConflictException('Signer has already signed');
    }
    const mode = envelope.signingOrder as SigningMode;
    if (
      !isSignerActionable(
        allSigners.map((s) => ({ id: s.id, order: s.order, status: s.status })),
        mode,
        signer.id,
      )
    ) {
      throw new ForbiddenException(
        'It is not this signer’s turn in the sequential signing order',
      );
    }

    // Cryptographic signing (hash + detached CMS) lives in the signatures module.
    const signature = await this.signatures.signForSigner({
      signerId: signer.id,
      orgId,
      userId: signer.userId ?? undefined,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    const newStatus = await this.prisma.$transaction(async (tx) => {
      await tx.envelopeSigner.update({
        where: { id: signer.id },
        data: { status: SignerStatus.SIGNED, signedAt: new Date() },
      });

      const refreshed = await tx.envelopeSigner.findMany({
        where: { envelopeId: envelope.id },
        select: { id: true, order: true, status: true },
      });

      let status: EnvelopeStatus = envelope.status;
      if (envelope.status === EnvelopeStatus.SENT) {
        assertTransition(status, EnvelopeStatus.IN_PROGRESS);
        status = EnvelopeStatus.IN_PROGRESS;
      }
      if (allSignersSigned(refreshed)) {
        assertTransition(status, EnvelopeStatus.COMPLETED);
        status = EnvelopeStatus.COMPLETED;
      }
      await tx.envelope.update({
        where: { id: envelope.id },
        data: {
          status,
          ...(status === EnvelopeStatus.COMPLETED
            ? { completedAt: new Date() }
            : {}),
        },
      });

      // Sequential: notify the next bucket now that this signer is done.
      if (status === EnvelopeStatus.IN_PROGRESS) {
        const next = actionableSigners(refreshed, mode).filter(
          (s) => s.status === SignerStatus.PENDING,
        );
        await tx.envelopeSigner.updateMany({
          where: { id: { in: next.map((s) => s.id) } },
          data: { status: SignerStatus.NOTIFIED, notifiedAt: new Date() },
        });
        for (const s of next) {
          await this.queue.add('notify-signer', {
            envelopeId: envelope.id,
            signerId: s.id,
            orgId,
          } as NotifySignerJob);
        }
      }
      return status;
    });

    this.audit({
      tenantId: orgId,
      actorId: signer.userId ?? null,
      action: 'signature.applied',
      resourceType: 'envelope_signer',
      resourceId: signer.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { envelopeId: envelope.id, signatureId: signature.id },
    });
    if (newStatus === EnvelopeStatus.COMPLETED) {
      this.audit({
        tenantId: orgId,
        action: 'envelope.completed',
        resourceType: 'envelope',
        resourceId: envelope.id,
      });
    }

    return { signatureId: signature.id, envelopeStatus: newStatus };
  }

  async decline(
    orgId: string,
    envelopeId: string,
    signerId: string,
    reason: string | undefined,
    ctx: RequestContext,
  ): Promise<void> {
    const { envelope, signer } = await this.loadSigner(orgId, envelopeId, signerId);
    this.assertEnvelopeActionable(envelope.status);

    await this.prisma.$transaction(async (tx) => {
      await tx.envelopeSigner.update({
        where: { id: signer.id },
        data: {
          status: SignerStatus.DECLINED,
          declinedAt: new Date(),
          declineReason: reason,
        },
      });
      // A single decline terminates the whole envelope.
      assertTransition(envelope.status, EnvelopeStatus.DECLINED);
      await tx.envelope.update({
        where: { id: envelope.id },
        data: { status: EnvelopeStatus.DECLINED },
      });
    });

    this.audit({
      tenantId: orgId,
      actorId: signer.userId ?? null,
      action: 'envelope.declined',
      resourceType: 'envelope',
      resourceId: envelope.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { signerId: signer.id, reason },
    });
  }

  // -------------------------------------------------------------------------
  // Void / status / expiry
  // -------------------------------------------------------------------------

  async void(
    orgId: string,
    envelopeId: string,
    userId: string,
    reason: string | undefined,
    ctx: RequestContext,
  ): Promise<Envelope> {
    const envelope = await this.prisma.envelope.findFirst({
      where: { id: envelopeId, orgId },
    });
    if (!envelope) {
      throw new NotFoundException('Envelope not found');
    }
    assertTransition(envelope.status, EnvelopeStatus.VOIDED);

    const updated = await this.prisma.envelope.update({
      where: { id: envelope.id },
      data: {
        status: EnvelopeStatus.VOIDED,
        voidedAt: new Date(),
        voidReason: reason,
      },
    });
    this.audit({
      tenantId: orgId,
      actorId: userId,
      action: 'envelope.voided',
      resourceType: 'envelope',
      resourceId: envelope.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { reason },
    });
    return updated;
  }

  async getStatus(orgId: string, envelopeId: string) {
    const envelope = await this.prisma.envelope.findFirst({
      where: { id: envelopeId, orgId },
      include: {
        signers: { orderBy: { order: 'asc' } },
        fields: true,
      },
    });
    if (!envelope) {
      throw new NotFoundException('Envelope not found');
    }
    const signed = envelope.signers.filter(
      (s) => s.status === SignerStatus.SIGNED,
    ).length;
    const mode = envelope.signingOrder as SigningMode;
    const actionable = actionableSigners(
      envelope.signers.map((s) => ({ id: s.id, order: s.order, status: s.status })),
      mode,
    ).map((s) => s.id);
    return {
      ...envelope,
      progress: {
        total: envelope.signers.length,
        signed,
        actionableSignerIds: actionable,
      },
    };
  }

  /** Outstanding (not yet completed) signers — used by the reminder worker. */
  async outstandingSigners(envelopeId: string): Promise<EnvelopeSigner[]> {
    return this.prisma.envelopeSigner.findMany({
      where: {
        envelopeId,
        status: { notIn: [SignerStatus.SIGNED, SignerStatus.DECLINED] },
      },
    });
  }

  /** Transition an overdue envelope to EXPIRED. Called by the expiry worker. */
  async expireIfDue(envelopeId: string): Promise<void> {
    const envelope = await this.prisma.envelope.findUnique({
      where: { id: envelopeId },
    });
    if (
      !envelope ||
      isTerminal(envelope.status) ||
      !envelope.expiresAt ||
      envelope.expiresAt > new Date()
    ) {
      return;
    }
    assertTransition(envelope.status, EnvelopeStatus.EXPIRED);
    await this.prisma.envelope.update({
      where: { id: envelope.id },
      data: { status: EnvelopeStatus.EXPIRED },
    });
    this.audit({
      tenantId: envelope.orgId,
      actorType: 'system',
      action: 'envelope.expired',
      resourceType: 'envelope',
      resourceId: envelope.id,
    });
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private async getDraft(orgId: string, envelopeId: string): Promise<Envelope> {
    const envelope = await this.prisma.envelope.findFirst({
      where: { id: envelopeId, orgId },
    });
    if (!envelope) {
      throw new NotFoundException('Envelope not found');
    }
    if (envelope.status !== EnvelopeStatus.DRAFT) {
      throw new BadRequestException(
        'Envelope can only be edited while in DRAFT',
      );
    }
    return envelope;
  }

  private async loadSigner(
    orgId: string,
    envelopeId: string,
    signerId: string,
  ): Promise<{
    envelope: Envelope;
    signer: EnvelopeSigner;
    allSigners: EnvelopeSigner[];
  }> {
    const envelope = await this.prisma.envelope.findFirst({
      where: { id: envelopeId, orgId },
      include: { signers: true },
    });
    if (!envelope) {
      throw new NotFoundException('Envelope not found');
    }
    const signer = envelope.signers.find((s) => s.id === signerId);
    if (!signer) {
      throw new NotFoundException('Signer not found');
    }
    return { envelope, signer, allSigners: envelope.signers };
  }

  private assertEnvelopeActionable(status: EnvelopeStatus): void {
    if (isTerminal(status)) {
      throw new BadRequestException(`Envelope is ${status} and cannot be acted on`);
    }
    if (status === EnvelopeStatus.DRAFT) {
      throw new BadRequestException('Envelope has not been sent yet');
    }
  }

  private async maybeAdvanceToInProgress(
    tx: Prisma.TransactionClient,
    envelopeId: string,
    currentStatus: EnvelopeStatus,
  ): Promise<void> {
    if (currentStatus === EnvelopeStatus.SENT) {
      await tx.envelope.update({
        where: { id: envelopeId },
        data: { status: EnvelopeStatus.IN_PROGRESS },
      });
    }
  }

  private audit(input: AuditRecordInput): void {
    this.eventEmitter.emit(AUDIT_RECORD_EVENT, input);
  }
}
