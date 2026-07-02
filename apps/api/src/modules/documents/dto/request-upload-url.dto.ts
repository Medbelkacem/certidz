import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class RequestUploadUrlDto {
  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  @MaxLength(255)
  mime!: string;

  @ApiPropertyOptional({ example: 'contract.pdf' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  filename?: string;

  @ApiPropertyOptional({ example: '/contracts/2026', default: '/' })
  @IsOptional()
  @IsString()
  @Matches(/^\/[\w\-/]*$/, { message: 'folder must be an absolute path' })
  @MaxLength(512)
  folder?: string;
}
