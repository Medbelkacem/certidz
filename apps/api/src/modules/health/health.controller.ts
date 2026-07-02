import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiOkResponse({ description: 'Process is alive' })
  liveness() {
    return this.health.liveness();
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Readiness probe (Postgres + Redis)' })
  @ApiOkResponse({ description: 'All dependencies reachable' })
  @ApiServiceUnavailableResponse({ description: 'A dependency is down' })
  readiness() {
    // Body carries per-dependency status; orchestrators can also key off it.
    return this.health.readiness();
  }
}
