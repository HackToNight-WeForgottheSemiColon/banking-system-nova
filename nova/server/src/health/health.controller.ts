import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { DataSource } from 'typeorm'

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  @ApiOperation({ summary: 'Check database connectivity and service health' })
  async checkHealth() {
    // Run simple DB query to check connection
    const result = await this.dataSource.query(
      'SELECT NOW() AS now, current_database() AS database'
    )

    return {
      ok: true,
      service: 'bank-api',
      database: result[0],
      env: process.env.NODE_ENV || 'development'
    }
  }
}
