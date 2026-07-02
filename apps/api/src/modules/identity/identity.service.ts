import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  type IdentityDocument,
  type IdentityVerification,
  IdentityVerificationStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AUDIT_RECORD_EVENT, type AuditRecordInput } from '../audit/audit.types';
import type { RequestContext } from '../auth/auth.types';
import type { AddDocumentDto } from './dto/add-document.dto';
import type { CreateVerificationDto } from './dto/create-verification.dto';
import {
  checksForMethod,
  type DocumentInput,
  IDENTITY_PROVIDER_ADAPTER,
  type IdentityProviderAdapter,
} from './providers/identity-provider.interface';

/** Session considered approved above this aggregate confidence. */
const APPROVAL_THRESHOLD = 0.6;
/** Verification sessions expire this long after creation. */
const SESSION_TTL_MS = 24 * 3600 * 1000;

export interface VerificationResult {
  id: string;
  status: IdentityVerificationStatus;
  confidenceScore: number | null;
  riskFlags: string[];
}

@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(IDENTITY_PROVIDER_ADAPTER)
    private readonly provider: IdentityProviderAdapter,
  ) {}

  // -------------------------------------------------------------------------
  // Session lifecycle
  // -------------------------------------------------------------------------

  async createSession(
    orgId: string,
    dto: CreateVerificationDto,
    ctx: RequestContext & { actorId: string },
  ): Promise<IdentityVerification> {
    if (!dto.userId && !dto.subjectEmail) {
      throw new BadRequestException(
        'Either userId or subjectEmail is required',
      );
    }

    const verification = await this.prisma.identityVerification.create({
      data: {
        orgId,
        userId: dto.userId ?? null,
        subjectEmail: dto.subjectEmail ?? null,
        method: dto.method,
        provider: this.provider.name,
        status: IdentityVerificationStatus.PENDING_DOCUMENTS,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      },
    });

    this.audit(orgId, ctx, {
      action: 'identity.session_created',
      resourceId: verification.id,
      metadata: { method: dto.method, provider: this.provider.name },
    });

    return verification;
  }

  async addDocument(
    orgId: string,
    verificationId: string,
    dto: AddDocumentDto,
    ctx: RequestContext & { actorId: string },
  ): Promise<IdentityDocument> {
    const verification = await this.getOwned(orgId, verificationId);
    if (
      verification.status !== IdentityVerificationStatus.PENDING_DOCUMENTS &&
      verification.status !== IdentityVerificationStatus.CREATED
    ) {
      throw new BadRequestException(
        `Cannot add documents to a ${verification.status} verification`,
      );
    }

    const document = await this.prisma.identityDocument.create({
      data: {
        verificationId,
        type: dto.type,
        frontS3Key: dto.frontS3Key,
        backS3Key: dto.backS3Key ?? null,
        selfieS3Key: dto.selfieS3Key ?? null,
      },
    });

    this.audit(orgId, ctx, {
      action: 'identity.document_added',
      resourceId: verificationId,
      metadata: { documentId: document.id, type: dto.type },
    });

    return document;
  }

  /**
   * Runs the provider checks required by the session's method, aggregates a
   * confidence score, collects risk flags, and transitions the session to
   * APPROVED or REJECTED. Persists per-document face/liveness scores.
   */
  async runVerification(
    orgId: string,
    verificationId: string,
    ctx: RequestContext & { actorId: string },
  ): Promise<VerificationResult> {
    const verification = await this.getOwned(orgId, verificationId);
    const documents = await this.prisma.identityDocument.findMany({
      where: { verificationId },
    });
    if (documents.length === 0) {
      throw new BadRequestException('No documents to verify');
    }

    await this.prisma.identityVerification.update({
      where: { id: verificationId },
      data: { status: IdentityVerificationStatus.PROCESSING },
    });

    const need = checksForMethod(verification.method);
    const scores: number[] = [];
    const riskFlags = new Set<string>();

    for (const doc of documents) {
      const input: DocumentInput = {
        type: doc.type,
        frontS3Key: doc.frontS3Key,
        backS3Key: doc.backS3Key ?? undefined,
        selfieS3Key: doc.selfieS3Key ?? undefined,
      };

      const docResult = await this.provider.verifyDocument(input);
      scores.push(docResult.score);
      docResult.riskFlags.forEach((f) => riskFlags.add(f));

      let faceMatchScore: number | null = null;
      let livenessScore: number | null = null;

      if (need.face) {
        if (!doc.selfieS3Key) {
          riskFlags.add('SELFIE_MISSING');
        } else {
          const face = await this.provider.matchFace(input);
          faceMatchScore = face.score;
          scores.push(face.score);
          if (!face.match) {
            riskFlags.add('FACE_MISMATCH');
          }
        }
      }

      if (need.liveness) {
        if (!doc.selfieS3Key) {
          riskFlags.add('LIVENESS_MISSING');
        } else {
          const liveness = await this.provider.checkLiveness(input);
          livenessScore = liveness.score;
          scores.push(liveness.score);
          if (!liveness.live) {
            riskFlags.add('LIVENESS_FAILED');
          }
        }
      }

      await this.prisma.identityDocument.update({
        where: { id: doc.id },
        data: { faceMatchScore, livenessScore },
      });
    }

    const confidenceScore =
      scores.reduce((sum, s) => sum + s, 0) / scores.length;

    // A single blocking risk flag rejects regardless of the average score.
    const blocking = ['FACE_MISMATCH', 'LIVENESS_FAILED', 'DOCUMENT_EXPIRED'];
    const hasBlocking = [...riskFlags].some((f) => blocking.includes(f));
    const approved = confidenceScore >= APPROVAL_THRESHOLD && !hasBlocking;

    const status = approved
      ? IdentityVerificationStatus.APPROVED
      : IdentityVerificationStatus.REJECTED;
    const flags = [...riskFlags];

    const updated = await this.prisma.identityVerification.update({
      where: { id: verificationId },
      data: {
        status,
        confidenceScore,
        riskFlags: flags as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });

    this.audit(orgId, ctx, {
      action: approved ? 'identity.approved' : 'identity.rejected',
      resourceId: verificationId,
      metadata: { confidenceScore, riskFlags: flags },
    });

    return {
      id: updated.id,
      status: updated.status,
      confidenceScore: updated.confidenceScore,
      riskFlags: flags,
    };
  }

  async getResult(
    orgId: string,
    verificationId: string,
  ): Promise<VerificationResult> {
    const v = await this.getOwned(orgId, verificationId);
    return {
      id: v.id,
      status: v.status,
      confidenceScore: v.confidenceScore,
      riskFlags: this.toFlags(v.riskFlags),
    };
  }

  async get(
    orgId: string,
    verificationId: string,
  ): Promise<IdentityVerification & { documents: IdentityDocument[] }> {
    const v = await this.prisma.identityVerification.findFirst({
      where: { id: verificationId, orgId },
      include: { documents: true },
    });
    if (!v) {
      throw new NotFoundException('Verification not found');
    }
    return v;
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private async getOwned(
    orgId: string,
    verificationId: string,
  ): Promise<IdentityVerification> {
    const v = await this.prisma.identityVerification.findFirst({
      where: { id: verificationId, orgId },
    });
    if (!v) {
      throw new NotFoundException('Verification not found');
    }
    return v;
  }

  private toFlags(value: Prisma.JsonValue): string[] {
    return Array.isArray(value) ? value.map(String) : [];
  }

  private audit(
    orgId: string,
    ctx: RequestContext & { actorId: string },
    partial: Pick<AuditRecordInput, 'action' | 'resourceId' | 'metadata'>,
  ): void {
    this.eventEmitter.emit(AUDIT_RECORD_EVENT, {
      tenantId: orgId,
      actorId: ctx.actorId,
      resourceType: 'identity_verification',
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      ...partial,
    } satisfies AuditRecordInput);
  }
}
