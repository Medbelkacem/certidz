import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'HISN Notariat' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({
    example: 'hisn-notariat',
    description: 'URL-safe identifier; derived from the name when omitted',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase alphanumeric with single dashes',
  })
  @MaxLength(60)
  slug?: string;

  @ApiPropertyOptional({ example: 'DZ', default: 'DZ' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;
}
