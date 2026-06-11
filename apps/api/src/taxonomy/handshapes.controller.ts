import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Handshape } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { TaxonomyService } from './taxonomy.service';
import { CreateHandshapeDto, UpdateHandshapeDto } from './dto';

@ApiTags('taxonomy')
@Controller('handshapes')
export class HandshapesController {
  constructor(private readonly taxonomy: TaxonomyService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List handshapes' })
  list(): Promise<Handshape[]> {
    return this.taxonomy.listHandshapes();
  }

  @Roles('admin')
  @Post()
  create(@Body() dto: CreateHandshapeDto): Promise<Handshape> {
    return this.taxonomy.createHandshape(dto);
  }

  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateHandshapeDto): Promise<Handshape> {
    return this.taxonomy.updateHandshape(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ id: string }> {
    return this.taxonomy.deleteHandshape(id);
  }
}
