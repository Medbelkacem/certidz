import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';

export class CreateWebhookDto {
  @ApiProperty({ example: 'https://example.dz/hooks/certidz' })
  @IsUrl({ require_tld: false })
  url!: string;

  @ApiProperty({
    description: 'Subscribed event names.',
    example: ['envelope.completed', 'document.uploaded'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  events!: string[];

  @ApiPropertyOptional({
    description: 'HMAC signing secret. Auto-generated when omitted.',
  })
  @IsOptional()
  @IsString()
  @MinLength(16)
  secret?: string;
}
