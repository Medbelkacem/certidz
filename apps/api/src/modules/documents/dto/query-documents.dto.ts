import { ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryDocumentsDto extends PaginationDto {
  @ApiPropertyOptional({ example: '/contracts/2026' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  folder?: string;

  @ApiPropertyOptional({ example: 'contract' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  tag?: string;

  @ApiPropertyOptional({ enum: DocumentStatus })
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @ApiPropertyOptional({ description: 'Full-text-ish title search' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;
}
