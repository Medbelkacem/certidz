import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SigningOrder } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateEnvelopeDto {
  @ApiProperty({ description: 'The document to be signed' })
  @IsString()
  documentId!: string;

  @ApiProperty({ example: 'Service agreement — please sign' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ example: 'Kindly review and sign by Friday.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  @ApiPropertyOptional({ enum: SigningOrder, default: SigningOrder.SEQUENTIAL })
  @IsOptional()
  @IsEnum(SigningOrder)
  signingOrder?: SigningOrder;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date;
}
