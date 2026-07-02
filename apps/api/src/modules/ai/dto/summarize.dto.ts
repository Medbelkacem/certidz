import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SummarizeDto {
  @ApiProperty({ description: 'Document id to summarise.' })
  @IsString()
  documentId!: string;
}
