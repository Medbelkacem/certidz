import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IdentityDocumentType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

/**
 * Document *metadata* only — the binary is uploaded to object storage
 * out-of-band (presigned S3 URL) and referenced here by its key.
 */
export class AddDocumentDto {
  @ApiProperty({ enum: IdentityDocumentType })
  @IsEnum(IdentityDocumentType)
  type!: IdentityDocumentType;

  @ApiProperty({ description: 'S3 key of the document front image.' })
  @IsString()
  frontS3Key!: string;

  @ApiPropertyOptional({ description: 'S3 key of the document back image.' })
  @IsOptional()
  @IsString()
  backS3Key?: string;

  @ApiPropertyOptional({ description: 'S3 key of the liveness/selfie capture.' })
  @IsOptional()
  @IsString()
  selfieS3Key?: string;
}
