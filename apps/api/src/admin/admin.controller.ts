import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Paginated } from '@msl/types';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/auth.types';
import { AdminService } from './admin.service';
import { AuditQueryDto, BulkImportDto, UpdateSettingDto } from './dto';

@ApiTags('admin')
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'KPI summary (FR-06, S-25)' })
  dashboard(): Promise<Record<string, number>> {
    return this.admin.dashboard();
  }

  @Get('reports/summary')
  @ApiOperation({ summary: 'Approved %, duplicates, usage (FR-25, S-32)' })
  reports(): Promise<Record<string, number>> {
    return this.admin.reportsSummary();
  }

  @Get('settings')
  @ApiOperation({ summary: 'List settings (S-34)' })
  settings(): Promise<{ key: string; value: unknown }[]> {
    return this.admin.listSettings();
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Upsert a setting (S-34)' })
  updateSetting(
    @Body() dto: UpdateSettingDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ key: string; value: unknown }> {
    return this.admin.updateSetting(dto, user.id);
  }

  @Get('consents')
  @ApiOperation({ summary: 'Consent records (FR-24, S-31)' })
  consents(@Query('page') page = '1', @Query('limit') limit = '20'): Promise<Paginated<unknown>> {
    return this.admin.listConsents(Number(page) || 1, Number(limit) || 20);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Filtered audit log (FR-23, S-33)' })
  auditLogs(@Query() query: AuditQueryDto): Promise<Paginated<unknown>> {
    return this.admin.listAuditLogs(query);
  }

  @Post('imports')
  @ApiOperation({ summary: 'Bulk word import (G-13, S-29)' })
  bulkImport(
    @Body() dto: BulkImportDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ total: number; success: number; errors: { row: number; reason: string }[] }> {
    return this.admin.bulkImport(dto, user.id);
  }
}
