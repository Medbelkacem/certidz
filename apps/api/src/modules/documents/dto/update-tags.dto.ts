import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateTagsDto {
  @ApiPropertyOptional({ type: [String], example: ['urgent'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(30)
  add?: string[];

  @ApiPropertyOptional({ type: [String], example: ['draft'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(30)
  remove?: string[];
}
