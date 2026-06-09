import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';

export interface HealthStatus {
  status: 'ok';
  service: string;
  timestamp: string;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check(): HealthStatus {
    return {
      status: 'ok',
      service: 'msl-api',
      timestamp: new Date().toISOString(),
    };
  }
}
