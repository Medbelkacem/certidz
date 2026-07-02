import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkflowStepType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class WorkflowStepDto {
  @ApiProperty({ example: 'Manager approval' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ enum: WorkflowStepType })
  @IsEnum(WorkflowStepType)
  type!: WorkflowStepType;

  @ApiProperty({ description: '0-based order within the workflow', example: 0 })
  @IsInt()
  @Min(0)
  position!: number;

  @ApiPropertyOptional({
    description: 'Step-type config (assignees, template ids, urls…)',
    default: {},
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @ApiPropertyOptional({
    description:
      'JSON condition tree ({field,op,value} / {and|or|not}); step is skipped when false. Null = always run.',
  })
  @IsOptional()
  @IsObject()
  condition?: Record<string, unknown> | null;
}

export class CreateWorkflowDto {
  @ApiProperty({ example: 'Contract approval' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ type: [WorkflowStepDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  steps!: WorkflowStepDto[];
}
