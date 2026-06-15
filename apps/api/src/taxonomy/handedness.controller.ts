import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Handedness } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { TaxonomyService } from './taxonomy.service';
import { CreateHandednessDto, UpdateHandednessDto } from './dto';

@ApiTags('taxonomy')
@Controller('handedness')
export class HandednessController {
  constructor(private readonly taxonomy: TaxonomyService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List handedness options (one/two hands)' })
  list(): Promise<Handedness[]> {
    return this.taxonomy.listHandednesses();
  }

  @Roles('admin')
  @Post()
  create(@Body() dto: CreateHandednessDto): Promise<Handedness> {
    return this.taxonomy.createHandedness(dto);
  }

  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateHandednessDto): Promise<Handedness> {
    return this.taxonomy.updateHandedness(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ id: string }> {
    return this.taxonomy.deleteHandedness(id);
  }
}
