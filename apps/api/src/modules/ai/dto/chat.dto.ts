import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChatDto {
  @ApiProperty({ description: 'Document id to chat about.' })
  @IsString()
  documentId!: string;

  @ApiProperty({ description: 'User message / question.' })
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  message!: string;
}
