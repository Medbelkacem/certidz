import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SignatureFieldType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class AddFieldDto {
  @ApiProperty({ description: 'The signer this field is assigned to' })
  @IsString()
  signerId!: string;

  @ApiProperty({ enum: SignatureFieldType })
  @IsEnum(SignatureFieldType)
  type!: SignatureFieldType;

  @ApiProperty({ example: 1, description: '1-based page number' })
  @IsInt()
  @Min(1)
  page!: number;

  @ApiProperty({ example: 72.5, description: 'X position (points)' })
  @IsNumber()
  @Min(0)
  x!: number;

  @ApiProperty({ example: 640, description: 'Y position (points)' })
  @IsNumber()
  @Min(0)
  y!: number;

  @ApiProperty({ example: 180, description: 'Width (points)' })
  @IsNumber()
  @Min(0)
  w!: number;

  @ApiProperty({ example: 48, description: 'Height (points)' })
  @IsNumber()
  @Min(0)
  h!: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  required?: boolean;
}
