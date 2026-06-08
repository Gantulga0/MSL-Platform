import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Paginated } from '@msl/types';
import { Public } from '../common/decorators/public.decorator';
import { WordsService } from './words.service';
import { WordsQueryDto } from './words.query.dto';

@ApiTags('dictionary')
@Controller('words')
export class WordsController {
  constructor(private readonly words: WordsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List/search approved words — FR-01/FR-08' })
  list(@Query() query: WordsQueryDto): Promise<Paginated<unknown>> {
    return this.words.list(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Word detail incl. variants + media — FR-09' })
  detail(@Param('id') id: string): Promise<unknown> {
    return this.words.detail(id);
  }

  @Public()
  @Get(':id/variants')
  @ApiOperation({ summary: 'List word variants — FR-10' })
  variants(@Param('id') id: string): Promise<unknown> {
    return this.words.variants(id);
  }
}
