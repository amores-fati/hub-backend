import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AmoresFatiLogger } from '../../../utils/logger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly logger: AmoresFatiLogger) {
    this.logger.setContext(HealthController.name);
  }

  @Get()
  @ApiOperation({ summary: 'Check API health status' })
  check() {
    this.logger.info('Checking API health');
    const result = {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
    this.logger.info('API health check succeeded');
    return result;
  }
}
