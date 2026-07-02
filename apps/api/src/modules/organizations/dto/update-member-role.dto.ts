import { ApiProperty } from '@nestjs/swagger';
import { MembershipRole } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: MembershipRole, example: MembershipRole.MANAGER })
  @IsEnum(MembershipRole)
  role!: MembershipRole;
}
