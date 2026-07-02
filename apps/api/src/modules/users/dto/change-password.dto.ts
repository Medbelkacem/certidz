import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'Old-Passw0rd!' })
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @ApiProperty({
    example: 'N3w-Secure-Passw0rd!',
    description:
      'Min 12 chars, at least one lowercase, one uppercase and one digit',
  })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'password must contain lowercase, uppercase and digit characters',
  })
  newPassword!: string;
}
