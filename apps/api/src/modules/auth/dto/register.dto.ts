import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'amina@example.dz' })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({
    example: 'S3cure-Passw0rd!',
    description:
      'Min 12 chars, at least one lowercase, one uppercase and one digit',
  })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'password must contain lowercase, uppercase and digit characters',
  })
  password!: string;

  @ApiProperty({ example: 'Amina' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ example: 'Benali' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName!: string;

  @ApiPropertyOptional({ enum: ['fr-DZ', 'ar-DZ', 'en'], default: 'fr-DZ' })
  @IsOptional()
  @IsIn(['fr-DZ', 'ar-DZ', 'en'])
  locale?: string;
}
