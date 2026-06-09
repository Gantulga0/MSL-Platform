import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AgeGroup } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { TaxonomyService } from './taxonomy.service';
import { CreateAgeGroupDto, UpdateAgeGroupDto } from './dto';

@ApiTags('taxonomy')
@Controller('age-groups')
export class AgeGroupsController {
  constructor(private readonly taxonomy: TaxonomyService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List age groups' })
  list(): Promise<AgeGroup[]> {
    return this.taxonomy.listAgeGroups();
  }

  @Roles('admin')
  @Post()
  create(@Body() dto: CreateAgeGroupDto): Promise<AgeGroup> {
    return this.taxonomy.createAgeGroup(dto);
  }

  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAgeGroupDto): Promise<AgeGroup> {
    return this.taxonomy.updateAgeGroup(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ id: string }> {
    return this.taxonomy.deleteAgeGroup(id);
  }
}
