import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { SignMovement } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { TaxonomyService } from './taxonomy.service';
import { CreateSignMovementDto, UpdateSignMovementDto } from './dto';

@ApiTags('taxonomy')
@Controller('sign-movements')
export class SignMovementsController {
  constructor(private readonly taxonomy: TaxonomyService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List sign movements' })
  list(): Promise<SignMovement[]> {
    return this.taxonomy.listSignMovements();
  }

  @Roles('admin')
  @Post()
  create(@Body() dto: CreateSignMovementDto): Promise<SignMovement> {
    return this.taxonomy.createSignMovement(dto);
  }

  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSignMovementDto): Promise<SignMovement> {
    return this.taxonomy.updateSignMovement(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ id: string }> {
    return this.taxonomy.deleteSignMovement(id);
  }
}
