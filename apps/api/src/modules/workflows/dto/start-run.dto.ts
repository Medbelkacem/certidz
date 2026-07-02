import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';

export class StartRunDto {
  @ApiPropertyOptional({
    description: 'Initial run context available to condition evaluation.',
    default: {},
  })
  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;
}
