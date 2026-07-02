import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class ConfirmUploadDto {
  @ApiProperty({ description: 'The s3Key returned by the upload-url request' })
  @IsString()
  @MaxLength(1024)
  s3Key!: string;

  @ApiProperty({ example: 'Service agreement' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    description: 'Lowercase hex SHA-256 of the uploaded bytes',
    example: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  })
  @IsString()
  @Matches(/^[a-f0-9]{64}$/, { message: 'sha256 must be 64 lowercase hex chars' })
  sha256!: string;

  @ApiProperty({ example: 20481, description: 'Size in bytes' })
  @IsInt()
  @Min(1)
  size!: number;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  @MaxLength(255)
  mime!: string;

  @ApiPropertyOptional({ example: '/contracts/2026', default: '/' })
  @IsOptional()
  @IsString()
  @Matches(/^\/[\w\-/]*$/, { message: 'folder must be an absolute path' })
  @MaxLength(512)
  folder?: string;

  @ApiPropertyOptional({ type: [String], example: ['contract', 'fr'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(30)
  tags?: string[];
}
