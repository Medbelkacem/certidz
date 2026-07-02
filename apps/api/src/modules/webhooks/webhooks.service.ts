import { randomBytes } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Webhook } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AUDIT_RECORD_EVENT, type AuditRecordInput } from '../audit/audit.types';
import type { RequestContext } from '../auth/auth.types';
import type { CreateWebhookDto } from './dto/create-webhook.dto';
import type { UpdateWebhookDto } from './dto/update-webhook.dto';

/** Webhook with the signing secret stripped for API responses. */
export type SafeWebhook = Omit<Webhook, 'secret'>;

@Injectable()
export class WebhooksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    orgId: string,
    dto: CreateWebhookDto,
    ctx: RequestContext & { actorId: string },
  ): Promise<{ webhook: SafeWebhook; secret: string }> {
    const secret = dto.secret ?? `whsec_${randomBytes(24).toString('hex')}`;
    const webhook = await this.prisma.webhook.create({
      data: {
        orgId,
        url: dto.url,
        events: dto.events,
        secret,
      },
    });
    this.audit(orgId, ctx, {
      action: 'webhook.created',
      resourceId: webhook.id,
      metadata: { url: dto.url, events: dto.events },
    });
    // Secret returned once at creation, never again.
    return { webhook: this.sanitize(webhook), secret };
  }

  async list(orgId: string): Promise<SafeWebhook[]> {
    const hooks = await this.prisma.webhook.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });
    return hooks.map((h) => this.sanitize(h));
  }

  async get(orgId: string, id: string): Promise<SafeWebhook> {
    return this.sanitize(await this.getOwned(orgId, id));
  }

  async update(
    orgId: string,
    id: string,
    dto: UpdateWebhookDto,
    ctx: RequestContext & { actorId: string },
  ): Promise<SafeWebhook> {
    await this.getOwned(orgId, id);
    const webhook = await this.prisma.webhook.update({
      where: { id },
      data: {
        ...(dto.url !== undefined ? { url: dto.url } : {}),
        ...(dto.events !== undefined ? { events: dto.events } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
    });
    this.audit(orgId, ctx, { action: 'webhook.updated', resourceId: id });
    return this.sanitize(webhook);
  }

  async remove(
    orgId: string,
    id: string,
    ctx: RequestContext & { actorId: string },
  ): Promise<void> {
    await this.getOwned(orgId, id);
    await this.prisma.webhook.delete({ where: { id } });
    this.audit(orgId, ctx, { action: 'webhook.deleted', resourceId: id });
  }

  async listDeliveries(orgId: string, id: string) {
    await this.getOwned(orgId, id);
    return this.prisma.webhookDelivery.findMany({
      where: { webhookId: id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  // -------------------------------------------------------------------------

  private async getOwned(orgId: string, id: string): Promise<Webhook> {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id, orgId },
    });
    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }
    return webhook;
  }

  private sanitize(webhook: Webhook): SafeWebhook {
    const { secret: _secret, ...safe } = webhook;
    return safe;
  }

  private audit(
    orgId: string,
    ctx: RequestContext & { actorId: string },
    partial: Pick<AuditRecordInput, 'action' | 'resourceId' | 'metadata'>,
  ): void {
    this.eventEmitter.emit(AUDIT_RECORD_EVENT, {
      tenantId: orgId,
      actorId: ctx.actorId,
      resourceType: 'webhook',
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      ...partial,
    } satisfies AuditRecordInput);
  }
}
