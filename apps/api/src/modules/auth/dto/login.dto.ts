import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@hisn-demo.dz' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'ChangeMe!2026' })
  @IsString()
  password!: string;

  @ApiPropertyOptional({
    description: '6-digit TOTP code, required when MFA is enrolled',
    example: '123456',
  })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  totpCode?: string;
}
