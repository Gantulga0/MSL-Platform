import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Paginated } from '@msl/types';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/auth.types';
import { AdminService } from './admin.service';
import {
  AuditQueryDto,
  AdminWordsQueryDto,
  BulkImportDto,
  CreateWordDto,
  UpdateSettingDto,
  UpdateWordDto,
} from './dto';
import type { UploadedFile as MulterFile } from '../media/dto';

/** A manifest row for file-based bulk import (video matched by `file` filename). */
interface ImportFileRow {
  lemma: string;
  definition?: string;
  exampleSentence?: string;
  topicSlug?: string;
  file: string;
}
import {
  ApproveSubmissionDto,
  BatchApproveDto,
  EditSubmissionDto,
  RejectSubmissionDto,
  ReviewQueueQueryDto,
} from '../submissions/review.dto';

@ApiTags('admin')
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'KPI summary' })
  dashboard(): Promise<Record<string, number>> {
    return this.admin.dashboard();
  }

  @Get('reports/summary')
  @ApiOperation({ summary: 'Approved %, duplicates, usage' })
  reports(): Promise<Record<string, number>> {
    return this.admin.reportsSummary();
  }

  @Get('settings')
  @ApiOperation({ summary: 'List settings' })
  settings(): Promise<{ key: string; value: unknown }[]> {
    return this.admin.listSettings();
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Upsert a setting' })
  updateSetting(
    @Body() dto: UpdateSettingDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ key: string; value: unknown }> {
    return this.admin.updateSetting(dto, user.id);
  }

  @Get('consents')
  @ApiOperation({ summary: 'Consent records' })
  consents(@Query('page') page = '1', @Query('limit') limit = '20'): Promise<Paginated<unknown>> {
    return this.admin.listConsents(Number(page) || 1, Number(limit) || 20);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Filtered audit log' })
  auditLogs(@Query() query: AuditQueryDto): Promise<Paginated<unknown>> {
    return this.admin.listAuditLogs(query);
  }

  @Post('imports')
  @ApiOperation({ summary: 'Bulk word import (videos referenced by URL)' })
  bulkImport(
    @Body() dto: BulkImportDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ total: number; success: number; errors: { row: number; reason: string }[] }> {
    return this.admin.bulkImport(dto, user.id);
  }

  @Post('imports/files')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files'))
  @ApiOperation({ summary: 'Bulk word import with uploaded videos (object storage / R2)' })
  bulkImportFiles(
    @UploadedFiles() files: MulterFile[],
    @Body() body: { status?: string; manifest?: string },
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ total: number; success: number; errors: { row: number; reason: string }[] }> {
    const status = body.status === 'approved' ? 'approved' : 'pending';
    let parsed: unknown;
    try {
      parsed = JSON.parse(body.manifest ?? '[]');
    } catch {
      throw new BadRequestException('manifest must be valid JSON');
    }
    if (!Array.isArray(parsed)) {
      throw new BadRequestException('manifest must be a JSON array');
    }
    return this.admin.bulkImportFiles(files ?? [], parsed as ImportFileRow[], status, user.id);
  }

  //ҮГ

  @Get('words')
  @ApiOperation({ summary: 'List words for admin management' })
  listWords(@Query() query: AdminWordsQueryDto): Promise<Paginated<unknown>> {
    return this.admin.listWords(query);
  }

  @Post('words/create')
  @ApiOperation({ summary: 'Create an approved word directly (no submission)' })
  createWord(
    @Body() dto: CreateWordDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ id: string }> {
    return this.admin.createWord(dto, user.id);
  }

  @Patch('words/:id')
  @ApiOperation({ summary: 'Edit an existing word' })
  updateWord(
    @Param('id') id: string,
    @Body() dto: UpdateWordDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ id: string }> {
    return this.admin.updateWord(id, dto, user.id);
  }

  @Delete('words/:id')
  @ApiOperation({ summary: 'Soft-delete (archive) a word' })
  deleteWord(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ id: string }> {
    return this.admin.deleteWord(id, user.id);
  }

  //Үг оруулах

  @Get('submissions')
  @ApiOperation({ summary: 'Submission review queue' })
  submissionQueue(@Query() query: ReviewQueueQueryDto): Promise<Paginated<unknown>> {
    return this.admin.submissionQueue(query.status ?? 'pending', query.page, query.limit);
  }

  @Post('submissions/batch-approve')
  @ApiOperation({ summary: 'Batch approve submissions' })
  batchApproveSubmissions(
    @Body() dto: BatchApproveDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ approved: string[]; failed: string[] }> {
    return this.admin.batchApproveSubmissions(dto.ids, user.id);
  }

  @Get('submissions/:id')
  @ApiOperation({ summary: 'Submission detail + duplicate candidates' })
  submissionDetail(@Param('id') id: string): Promise<unknown> {
    return this.admin.submissionDetail(id);
  }

  @Post('submissions/:id/approve')
  @ApiOperation({ summary: 'Approve submission → create word' })
  approveSubmission(
    @Param('id') id: string,
    @Body() dto: ApproveSubmissionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ wordId: string }> {
    return this.admin.approveSubmission(id, dto, user.id);
  }

  @Post('submissions/:id/reject')
  @ApiOperation({ summary: 'Reject submission' })
  rejectSubmission(
    @Param('id') id: string,
    @Body() dto: RejectSubmissionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ id: string }> {
    return this.admin.rejectSubmission(id, dto, user.id);
  }

  @Patch('submissions/:id')
  @ApiOperation({ summary: 'Edit submission before approval' })
  editSubmission(
    @Param('id') id: string,
    @Body() dto: EditSubmissionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ id: string }> {
    return this.admin.editSubmission(id, dto, user.id);
  }
}
