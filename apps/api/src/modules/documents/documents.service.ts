import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { nanoid } from 'nanoid';
import {
  type Document,
  DocumentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AUDIT_RECORD_EVENT, type AuditRecordInput } from '../audit/audit.types';
import type { RequestContext } from '../auth/auth.types';
import {
  paginate,
  type Paginated,
} from '../../common/dto/pagination.dto';
import { StorageService } from '../storage/storage.service';
import type { ConfirmUploadDto } from './dto/confirm-upload.dto';
import type { CreateVersionDto } from './dto/create-version.dto';
import type { QueryDocumentsDto } from './dto/query-documents.dto';
import type { RequestUploadUrlDto } from './dto/request-upload-url.dto';
import type { UpdateTagsDto } from './dto/update-tags.dto';

export interface PresignedUpload {
  s3Key: string;
  uploadUrl: string;
  expiresInSeconds: number;
}

const UPLOAD_URL_TTL = 900;

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // -------------------------------------------------------------------------
  // Upload lifecycle
  // -------------------------------------------------------------------------

  /** Mint an object key + presigned PUT URL for a direct-to-storage upload. */
  async requestUploadUrl(
    orgId: string,
    dto: RequestUploadUrlDto,
  ): Promise<PresignedUpload> {
    const key = this.buildKey(orgId, dto.filename);
    const uploadUrl = await this.storage.getPresignedUploadUrl(key, {
      contentType: dto.mime,
      expiresIn: UPLOAD_URL_TTL,
    });
    return { s3Key: key, uploadUrl, expiresInSeconds: UPLOAD_URL_TTL };
  }

  /**
   * Persist a Document after the client has uploaded the bytes. Verifies the
   * object exists and that its stored size matches the claimed size, then
   * records v1 in DocumentVersion and emits `document.uploaded`.
   */
  async confirmUpload(
    orgId: string,
    userId: string,
    dto: ConfirmUploadDto,
    ctx: RequestContext,
  ): Promise<Document> {
    if (!dto.s3Key.startsWith(this.orgPrefix(orgId))) {
      throw new BadRequestException('s3Key does not belong to this organization');
    }

    const head = await this.storage.headObject(dto.s3Key);
    if (!head) {
      throw new BadRequestException('Uploaded object not found in storage');
    }
    if (head.contentLength !== undefined && head.contentLength !== dto.size) {
      throw new BadRequestException(
        `Size mismatch: storage=${head.contentLength}, claimed=${dto.size}`,
      );
    }

    const document = await this.prisma.$transaction(async (tx) => {
      const created = await tx.document.create({
        data: {
          orgId,
          createdById: userId,
          title: dto.title,
          description: dto.description,
          s3Key: dto.s3Key,
          sha256: dto.sha256,
          size: dto.size,
          mime: dto.mime,
          status: DocumentStatus.ACTIVE,
          folder: dto.folder ?? '/',
          tags: this.normalizeTags(dto.tags ?? []),
          currentVersion: 1,
        },
      });
      await tx.documentVersion.create({
        data: {
          documentId: created.id,
          version: 1,
          s3Key: dto.s3Key,
          sha256: dto.sha256,
          size: dto.size,
          mime: dto.mime,
          createdById: userId,
        },
      });
      return created;
    });

    this.audit({
      tenantId: orgId,
      actorId: userId,
      action: 'document.uploaded',
      resourceType: 'document',
      resourceId: document.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { sha256: dto.sha256, size: dto.size, mime: dto.mime },
    });

    return document;
  }

  /** Add a new version, updating the document's current pointer. */
  async createVersion(
    orgId: string,
    userId: string,
    documentId: string,
    dto: CreateVersionDto,
    ctx: RequestContext,
  ): Promise<Document> {
    const document = await this.getActive(orgId, documentId);

    if (!dto.s3Key.startsWith(this.orgPrefix(orgId))) {
      throw new BadRequestException('s3Key does not belong to this organization');
    }
    const head = await this.storage.headObject(dto.s3Key);
    if (!head) {
      throw new BadRequestException('Uploaded object not found in storage');
    }

    const nextVersion = document.currentVersion + 1;
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.documentVersion.create({
        data: {
          documentId: document.id,
          version: nextVersion,
          s3Key: dto.s3Key,
          sha256: dto.sha256,
          size: dto.size,
          mime: dto.mime,
          changeNote: dto.changeNote,
          createdById: userId,
        },
      });
      return tx.document.update({
        where: { id: document.id },
        data: {
          s3Key: dto.s3Key,
          sha256: dto.sha256,
          size: dto.size,
          mime: dto.mime,
          currentVersion: nextVersion,
        },
      });
    });

    this.audit({
      tenantId: orgId,
      actorId: userId,
      action: 'document.version_created',
      resourceType: 'document',
      resourceId: document.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { version: nextVersion, sha256: dto.sha256 },
    });

    return updated;
  }

  // -------------------------------------------------------------------------
  // Read
  // -------------------------------------------------------------------------

  async list(
    orgId: string,
    query: QueryDocumentsDto,
  ): Promise<Paginated<Document>> {
    const where: Prisma.DocumentWhereInput = {
      orgId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : { status: { not: DocumentStatus.DELETED } }),
      ...(query.folder ? { folder: query.folder } : {}),
      ...(query.tag ? { tags: { has: query.tag } } : {}),
      ...(query.search
        ? { title: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.document.count({ where }),
    ]);
    return paginate(items, total, query);
  }

  async getOne(orgId: string, documentId: string): Promise<Document> {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, orgId, deletedAt: null },
      include: { versions: { orderBy: { version: 'desc' } } },
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    return document;
  }

  /** Presigned GET URL for the current version bytes. */
  async getDownloadUrl(
    orgId: string,
    documentId: string,
  ): Promise<{ downloadUrl: string; expiresInSeconds: number }> {
    const document = await this.getActive(orgId, documentId);
    const downloadUrl = await this.storage.getPresignedDownloadUrl(document.s3Key, {
      expiresIn: UPLOAD_URL_TTL,
    });
    return { downloadUrl, expiresInSeconds: UPLOAD_URL_TTL };
  }

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  async updateTags(
    orgId: string,
    userId: string,
    documentId: string,
    dto: UpdateTagsDto,
    ctx: RequestContext,
  ): Promise<Document> {
    const document = await this.getActive(orgId, documentId);
    const current = new Set(document.tags);
    for (const t of dto.add ?? []) current.add(t.trim().toLowerCase());
    for (const t of dto.remove ?? []) current.delete(t.trim().toLowerCase());

    const updated = await this.prisma.document.update({
      where: { id: document.id },
      data: { tags: this.normalizeTags([...current]) },
    });
    this.audit({
      tenantId: orgId,
      actorId: userId,
      action: 'document.tags_updated',
      resourceType: 'document',
      resourceId: document.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { tags: updated.tags },
    });
    return updated;
  }

  async softDelete(
    orgId: string,
    userId: string,
    documentId: string,
    ctx: RequestContext,
  ): Promise<void> {
    const document = await this.getActive(orgId, documentId);
    await this.prisma.document.update({
      where: { id: document.id },
      data: { status: DocumentStatus.DELETED, deletedAt: new Date() },
    });
    this.audit({
      tenantId: orgId,
      actorId: userId,
      action: 'document.deleted',
      resourceType: 'document',
      resourceId: document.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private async getActive(orgId: string, documentId: string): Promise<Document> {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, orgId, deletedAt: null },
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    return document;
  }

  private orgPrefix(orgId: string): string {
    return `orgs/${orgId}/documents/`;
  }

  private buildKey(orgId: string, filename?: string): string {
    const safeName = (filename ?? 'file')
      .replace(/[^\w.\-]+/g, '_')
      .slice(-100);
    return `${this.orgPrefix(orgId)}${nanoid()}/${safeName}`;
  }

  private normalizeTags(tags: string[]): string[] {
    return [...new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean))];
  }

  private audit(input: AuditRecordInput): void {
    this.eventEmitter.emit(AUDIT_RECORD_EVENT, input);
  }
}
