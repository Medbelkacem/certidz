import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class UpdateWebhookDto {
  @ApiPropertyOptional({ example: 'https://example.dz/hooks/certidz' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  url?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  events?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
