import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KeyAlgorithm } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class IssueFromCsrDto {
  @ApiProperty({
    description: 'PEM-encoded PKCS#10 certificate signing request',
    example: '-----BEGIN CERTIFICATE REQUEST-----\n...\n-----END CERTIFICATE REQUEST-----',
  })
  @IsString()
  csrPem!: string;

  @ApiPropertyOptional({ enum: KeyAlgorithm, default: KeyAlgorithm.RSA_2048 })
  @IsOptional()
  @IsEnum(KeyAlgorithm)
  keyAlgorithm?: KeyAlgorithm;

  @ApiPropertyOptional({ default: 365, minimum: 1, maximum: 1825 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1825)
  validityDays?: number;
}
