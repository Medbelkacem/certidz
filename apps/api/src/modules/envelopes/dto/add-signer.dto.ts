import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SignerAuthMethod, SignerChannel } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class AddSignerDto {
  @ApiProperty({ example: 'karim@example.dz' })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ example: 'Karim Haddad' })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  fullName!: string;

  @ApiPropertyOptional({
    example: 1,
    description: '1-based order for SEQUENTIAL signing; ignored for PARALLEL',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  order?: number;

  @ApiPropertyOptional({ description: 'Link to a platform user, if any' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ enum: SignerChannel, default: SignerChannel.EMAIL })
  @IsOptional()
  @IsEnum(SignerChannel)
  channel?: SignerChannel;

  @ApiPropertyOptional({
    enum: SignerAuthMethod,
    default: SignerAuthMethod.EMAIL_OTP,
  })
  @IsOptional()
  @IsEnum(SignerAuthMethod)
  authMethod?: SignerAuthMethod;
}
