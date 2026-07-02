import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class ContractReviewDto {
  @ApiProperty({ description: 'Document id of the contract to review.' })
  @IsString()
  documentId!: string;

  @ApiPropertyOptional({
    description: 'Focus areas, e.g. ["liability", "termination"].',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  focus?: string[];
}
