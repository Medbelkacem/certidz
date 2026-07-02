import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KeyAlgorithm } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Dev-mode server-side key generation: CertiDZ generates the keypair, signs a
 * leaf and returns the private key ONCE. TODO(prod): prefer CSR flow so the
 * private key never touches the server.
 */
export class GenerateCertificateDto {
  @ApiProperty({ example: 'Amina Benali' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  commonName!: string;

  @ApiPropertyOptional({ example: 'HISN Notariat' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  organization?: string;

  @ApiPropertyOptional({ example: 'Signing' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  organizationalUnit?: string;

  @ApiPropertyOptional({ example: 'DZ' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;

  @ApiPropertyOptional({ example: 'amina@example.dz' })
  @IsOptional()
  @IsEmail()
  email?: string;

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
