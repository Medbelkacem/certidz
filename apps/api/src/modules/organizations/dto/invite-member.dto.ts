import { ApiProperty } from '@nestjs/swagger';
import { MembershipRole } from '@prisma/client';
import { IsEmail, IsEnum, MaxLength } from 'class-validator';

export class InviteMemberDto {
  @ApiProperty({ example: 'karim@example.dz' })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ enum: MembershipRole, example: MembershipRole.MEMBER })
  @IsEnum(MembershipRole)
  role!: MembershipRole;
}
