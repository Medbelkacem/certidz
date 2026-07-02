import { ApiProperty } from '@nestjs/swagger';
import { UsageMetric } from '@prisma/client';
import { IsEnum, IsInt, Min } from 'class-validator';

export class RecordUsageDto {
  @ApiProperty({ enum: UsageMetric })
  @IsEnum(UsageMetric)
  metric!: UsageMetric;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;
}
