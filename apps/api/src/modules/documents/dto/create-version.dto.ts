import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateVersionDto {
  @ApiProperty({ description: 'The s3Key of the newly uploaded version bytes' })
  @IsString()
  @MaxLength(1024)
  s3Key!: string;

  @ApiProperty({
    description: 'Lowercase hex SHA-256 of the new version bytes',
    example: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  })
  @IsString()
  @Matches(/^[a-f0-9]{64}$/, { message: 'sha256 must be 64 lowercase hex chars' })
  sha256!: string;

  @ApiProperty({ example: 20481 })
  @IsInt()
  @Min(1)
  size!: number;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  @MaxLength(255)
  mime!: string;

  @ApiPropertyOptional({ example: 'Fixed clause 4.2' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  changeNote?: string;
}
