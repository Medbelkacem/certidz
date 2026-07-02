import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateOrganizationDto {
  @ApiPropertyOptional({ example: 'HISN Notariat SARL' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'DZ' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;

  @ApiPropertyOptional({ example: '000016001234567' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  taxId?: string;

  @ApiPropertyOptional({ example: 'https://cdn.certidz.dz/logos/hisn.png' })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'Tenant settings blob (branding, signature policies, …)',
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}
