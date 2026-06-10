import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { SignLocation } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { TaxonomyService } from './taxonomy.service';
import { CreateSignLocationDto, UpdateSignLocationDto } from './dto';

@ApiTags('taxonomy')
@Controller('sign-locations')
export class SignLocationsController {
  constructor(private readonly taxonomy: TaxonomyService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List sign locations' })
  list(): Promise<SignLocation[]> {
    return this.taxonomy.listSignLocations();
  }

  @Roles('admin')
  @Post()
  create(@Body() dto: CreateSignLocationDto): Promise<SignLocation> {
    return this.taxonomy.createSignLocation(dto);
  }

  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSignLocationDto): Promise<SignLocation> {
    return this.taxonomy.updateSignLocation(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ id: string }> {
    return this.taxonomy.deleteSignLocation(id);
  }
}
