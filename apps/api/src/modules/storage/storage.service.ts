import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Env } from '../../config/env';

export interface PresignOptions {
  /** Seconds until the signed URL expires. Default 900 (15 min). */
  expiresIn?: number;
  contentType?: string;
}

export interface ObjectHead {
  contentLength?: number;
  contentType?: string;
  etag?: string;
  lastModified?: Date;
}

/**
 * Thin, typed wrapper over the S3-compatible object store (AWS S3, MinIO…).
 * All buckets/keys/credentials are read from validated env via ConfigService —
 * no direct process.env access. Presigned URLs let clients up/download bytes
 * without proxying large blobs through the API.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService<Env, true>) {
    const endpoint = this.config.get('S3_ENDPOINT', { infer: true });
    this.bucket = this.config.get('S3_BUCKET', { infer: true });
    this.client = new S3Client({
      region: this.config.get('S3_REGION', { infer: true }),
      // Custom endpoint for MinIO / non-AWS gateways; undefined = real AWS.
      ...(endpoint ? { endpoint } : {}),
      forcePathStyle: this.config.get('S3_FORCE_PATH_STYLE', { infer: true }),
      credentials: {
        accessKeyId: this.config.get('S3_ACCESS_KEY_ID', { infer: true }),
        secretAccessKey: this.config.get('S3_SECRET_ACCESS_KEY', { infer: true }),
      },
    });
  }

  /** Presigned PUT URL a client uses to upload bytes directly to the store. */
  getPresignedUploadUrl(key: string, options: PresignOptions = {}): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ...(options.contentType ? { ContentType: options.contentType } : {}),
    });
    return getSignedUrl(this.client, command, {
      expiresIn: options.expiresIn ?? 900,
    });
  }

  /** Presigned GET URL for direct download. */
  getPresignedDownloadUrl(
    key: string,
    options: PresignOptions = {},
  ): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, {
      expiresIn: options.expiresIn ?? 900,
    });
  }

  /** Server-side upload (used for CA material, generated PDFs, etc.). */
  async putObject(
    key: string,
    body: Buffer | Uint8Array | string,
    contentType?: string,
  ): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ...(contentType ? { ContentType: contentType } : {}),
      }),
    );
  }

  /** Fetch an object's bytes into memory. */
  async getObject(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    if (!response.Body) {
      throw new Error(`Empty body for object ${key}`);
    }
    const bytes = await response.Body.transformToByteArray();
    return Buffer.from(bytes);
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  /** HEAD metadata; returns null when the object does not exist. */
  async headObject(key: string): Promise<ObjectHead | null> {
    try {
      const response = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return {
        contentLength: response.ContentLength,
        contentType: response.ContentType,
        etag: response.ETag,
        lastModified: response.LastModified,
      };
    } catch (err: unknown) {
      if (this.isNotFound(err)) {
        return null;
      }
      throw err;
    }
  }

  /** True when the object exists. */
  async exists(key: string): Promise<boolean> {
    return (await this.headObject(key)) !== null;
  }

  private isNotFound(err: unknown): boolean {
    if (typeof err !== 'object' || err === null) {
      return false;
    }
    const meta = (err as { $metadata?: { httpStatusCode?: number } }).$metadata;
    const name = (err as { name?: string }).name;
    return meta?.httpStatusCode === 404 || name === 'NotFound' || name === 'NoSuchKey';
  }
}
