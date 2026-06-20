import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { SearchService } from './search.service'

@ApiTags('Search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({
    summary: 'Secure search across users, accounts, and transactions'
  })
  @ApiQuery({ name: 'q', description: 'Search query', required: true })
  async search(@Query('q') q: string, @CurrentUser('userId') userId: number) {
    const results = await this.searchService.search(q || '', userId)
    return {
      ok: true,
      query: q || '',
      results
    }
  }
}
