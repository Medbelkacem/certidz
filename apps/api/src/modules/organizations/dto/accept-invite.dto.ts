import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AcceptInviteDto {
  @ApiProperty({ description: 'Raw invite token from the invitation email' })
  @IsString()
  @MinLength(16)
  token!: string;
}
