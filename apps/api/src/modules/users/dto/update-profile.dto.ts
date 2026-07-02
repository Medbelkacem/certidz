import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Amina' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Benali' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ enum: ['fr-DZ', 'ar-DZ', 'en'], example: 'ar-DZ' })
  @IsOptional()
  @IsIn(['fr-DZ', 'ar-DZ', 'en'])
  locale?: string;

  @ApiPropertyOptional({ example: 'Africa/Algiers' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  timezone?: string;
}
