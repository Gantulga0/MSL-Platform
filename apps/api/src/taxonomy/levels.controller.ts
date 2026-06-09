import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Level } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { TaxonomyService } from './taxonomy.service';
import { CreateLevelDto, UpdateLevelDto } from './dto';

@ApiTags('taxonomy')
@Controller('levels')
export class LevelsController {
  constructor(private readonly taxonomy: TaxonomyService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List levels' })
  list(): Promise<Level[]> {
    return this.taxonomy.listLevels();
  }

  @Roles('admin')
  @Post()
  create(@Body() dto: CreateLevelDto): Promise<Level> {
    return this.taxonomy.createLevel(dto);
  }

  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLevelDto): Promise<Level> {
    return this.taxonomy.updateLevel(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ id: string }> {
    return this.taxonomy.deleteLevel(id);
  }
}
