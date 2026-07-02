import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class VerifyTotpDto {
  @ApiProperty({ example: '123456', description: '6-digit TOTP code' })
  @IsString()
  @Length(6, 6)
  code!: string;
}

export class TotpEnrollmentResponse {
  @ApiProperty({ description: 'Base32 TOTP secret (show once)' })
  secret!: string;

  @ApiProperty({
    description: 'otpauth:// URI for authenticator apps / QR codes',
  })
  otpauthUrl!: string;
}
