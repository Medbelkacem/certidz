import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IdentityVerificationMethod } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateVerificationDto {
  @ApiPropertyOptional({
    description: 'Platform user being verified (omit for external signers).',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Email of an external subject verified without an account.',
  })
  @IsOptional()
  @IsEmail()
  subjectEmail?: string;

  @ApiProperty({
    enum: IdentityVerificationMethod,
    default: IdentityVerificationMethod.DOCUMENT_AND_SELFIE,
  })
  @IsEnum(IdentityVerificationMethod)
  method: IdentityVerificationMethod = IdentityVerificationMethod.DOCUMENT_AND_SELFIE;
}
