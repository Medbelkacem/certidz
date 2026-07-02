import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrgPlan } from '@prisma/client';
import { IsEnum, IsOptional, IsUrl } from 'class-validator';

export class ChangePlanDto {
  @ApiProperty({ enum: OrgPlan })
  @IsEnum(OrgPlan)
  plan!: OrgPlan;

  @ApiPropertyOptional({ description: 'Redirect URL on successful checkout.' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  successUrl?: string;

  @ApiPropertyOptional({ description: 'Redirect URL on cancelled checkout.' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  cancelUrl?: string;
}
