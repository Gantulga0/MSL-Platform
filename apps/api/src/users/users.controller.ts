import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Paginated } from '@msl/types';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/auth.types';
import { UsersService } from './users.service';
import { CreateClassCodeDto, CreateUserDto, UpdateUserDto, UsersQueryDto } from './dto';

@ApiTags('users')
@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Roles('admin')
  @Get('users')
  @ApiOperation({ summary: 'List/filter users (S-26)' })
  list(@Query() query: UsersQueryDto): Promise<Paginated<unknown>> {
    return this.users.list(query);
  }

  @Roles('admin')
  @Post('users')
  @ApiOperation({ summary: 'Create user / provision learner (S-26, G-1)' })
  create(@Body() dto: CreateUserDto): Promise<unknown> {
    return this.users.create(dto);
  }

  @Roles('admin')
  @Patch('users/:id')
  @ApiOperation({ summary: 'Update role/status (S-26)' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto): Promise<unknown> {
    return this.users.update(id, dto);
  }

  @Roles('admin')
  @Delete('users/:id')
  @ApiOperation({ summary: 'Soft-delete user (privacy, G-8)' })
  remove(@Param('id') id: string): Promise<{ id: string }> {
    return this.users.softDelete(id);
  }

  @Roles('teacher')
  @Post('class-codes')
  @ApiOperation({ summary: 'Create a class code (G-1)' })
  createClassCode(
    @Body() dto: CreateClassCodeDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<unknown> {
    return this.users.createClassCode(dto, user.id);
  }

  @Roles('teacher')
  @Get('class-codes')
  @ApiOperation({ summary: 'List class codes' })
  listClassCodes(): Promise<unknown> {
    return this.users.listClassCodes();
  }
}
