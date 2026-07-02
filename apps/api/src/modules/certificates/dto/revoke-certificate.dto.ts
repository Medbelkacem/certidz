import { ApiProperty } from '@nestjs/swagger';
import { RevocationReason } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class RevokeCertificateDto {
  @ApiProperty({
    enum: RevocationReason,
    default: RevocationReason.UNSPECIFIED,
  })
  @IsOptional()
  @IsEnum(RevocationReason)
  reason?: RevocationReason;
}
