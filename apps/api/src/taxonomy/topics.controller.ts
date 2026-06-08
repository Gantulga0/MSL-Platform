import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { TaxonomyService, type TopicNode } from './taxonomy.service';
import { CreateTopicDto, UpdateTopicDto } from './dto';
import type { Topic } from '@prisma/client';

@ApiTags('taxonomy')
@Controller('topics')
export class TopicsController {
  constructor(private readonly taxonomy: TaxonomyService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Topic tree (hierarchical) — FR-08' })
  tree(): Promise<TopicNode[]> {
    return this.taxonomy.topicTree();
  }

  @Roles('admin')
  @Post()
  @ApiOperation({ summary: 'Create topic (admin) — S-27' })
  create(@Body() dto: CreateTopicDto): Promise<Topic> {
    return this.taxonomy.createTopic(dto);
  }

  @Roles('admin')
  @Patch(':id')
  @ApiOperation({ summary: 'Update topic (admin) — S-27' })
  update(@Param('id') id: string, @Body() dto: UpdateTopicDto): Promise<Topic> {
    return this.taxonomy.updateTopic(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete topic (admin, if empty) — S-27' })
  remove(@Param('id') id: string): Promise<{ id: string }> {
    return this.taxonomy.deleteTopic(id);
  }
}
