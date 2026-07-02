import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

/** Payload for the consent step (records the consumer-disclosure agreement). */
export class ConsentDto {
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  consented?: boolean;
}

/** Payload for a decline action. */
export class DeclineDto {
  @ApiPropertyOptional({ example: 'Terms are not acceptable' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

/** Payload for voiding a whole envelope. */
export class VoidEnvelopeDto {
  @ApiPropertyOptional({ example: 'Superseded by a new contract' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
