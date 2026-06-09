import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Paginated } from '@msl/types';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/auth.types';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UsersQueryDto } from './dto';

@ApiTags('users')
@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Roles('admin')
  @Get('users')
  @ApiOperation({ summary: 'List/filter users' })
  list(@Query() query: UsersQueryDto): Promise<Paginated<unknown>> {
    return this.users.list(query);
  }

  @Roles('admin')
  @Post('users')
  @ApiOperation({ summary: 'Create user account' })
  create(@Body() dto: CreateUserDto): Promise<unknown> {
    return this.users.create(dto);
  }

  @Roles('admin')
  @Patch('users/:id')
  @ApiOperation({ summary: 'Update role/status' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto): Promise<unknown> {
    return this.users.update(id, dto);
  }

  @Roles('admin')
  @Delete('users/:id')
  @ApiOperation({ summary: 'Soft-delete user' })
  remove(@Param('id') id: string): Promise<{ id: string }> {
    return this.users.softDelete(id);
  }
}
