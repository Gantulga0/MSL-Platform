import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Paginated } from '@msl/types';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/auth.types';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { SubmissionsService, type CheckDuplicateResult } from './submissions.service';
import { ReviewService } from './review.service';
import { CheckDuplicateQueryDto, CreateSubmissionDto } from './dto';
import {
  ApproveSubmissionDto,
  BatchApproveDto,
  ClarifySubmissionDto,
  EditSubmissionDto,
  RejectSubmissionDto,
  ReviewQueueQueryDto,
} from './review.dto';

@ApiTags('submissions')
@Controller('submissions')
export class SubmissionsController {
  constructor(
    private readonly submissions: SubmissionsService,
    private readonly review: ReviewService,
  ) {}

  @Roles('contributor')
  @Post()
  @ApiOperation({ summary: 'Submit a new word — runs duplicate detection (FR-02/FR-03)' })
  create(
    @Body() dto: CreateSubmissionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ submission: unknown; duplicate: boolean; existingWord?: unknown }> {
    return this.submissions.create(dto, user.id);
  }

  // NOTE: static routes declared before any ':id' route (review detail, Slice 6).
  @Roles('contributor')
  @Get('check-duplicate')
  @ApiOperation({ summary: 'Live duplicate hint for the submit form (FR-03)' })
  checkDuplicate(@Query() query: CheckDuplicateQueryDto): Promise<CheckDuplicateResult> {
    return this.submissions.checkDuplicate(query.lemma, query.topic);
  }

  @Roles('contributor')
  @Get('mine')
  @ApiOperation({ summary: 'My submissions + status (FR-30)' })
  mine(
    @Query() page: PaginationQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Paginated<unknown>> {
    return this.submissions.mine(user.id, page.page, page.limit);
  }

  // ── Review (teacher/admin) — declared after the static contributor routes ──

  @Roles('teacher')
  @Get()
  @ApiOperation({ summary: 'Review queue, priority sort (FR-22)' })
  queue(@Query() query: ReviewQueueQueryDto): Promise<Paginated<unknown>> {
    return this.review.queue(query.status ?? 'pending', query.page, query.limit);
  }

  @Roles('teacher')
  @Post('batch-approve')
  @ApiOperation({ summary: 'Batch approve submissions (FR-22)' })
  batchApprove(
    @Body() dto: BatchApproveDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ approved: string[]; failed: string[] }> {
    return this.review.batchApprove(dto.ids, user.id);
  }

  @Roles('teacher')
  @Get(':id')
  @ApiOperation({ summary: 'Submission + duplicate candidates (S-21)' })
  detail(@Param('id') id: string): Promise<unknown> {
    return this.review.detail(id);
  }

  @Roles('teacher')
  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve → publish word (FR-04)' })
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveSubmissionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ wordId: string }> {
    return this.review.approve(id, dto, user.id);
  }

  @Roles('teacher')
  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject + comment' })
  reject(
    @Param('id') id: string,
    @Body() dto: RejectSubmissionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ id: string }> {
    return this.review.reject(id, dto, user.id);
  }

  @Roles('teacher')
  @Post(':id/request-clarification')
  @ApiOperation({ summary: 'Send back for clarification (FR-11)' })
  clarify(
    @Param('id') id: string,
    @Body() dto: ClarifySubmissionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ id: string }> {
    return this.review.clarify(id, dto, user.id);
  }

  @Roles('teacher')
  @Post(':id/edit')
  @ApiOperation({ summary: 'Edit submission fields (FR-12)' })
  edit(
    @Param('id') id: string,
    @Body() dto: EditSubmissionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ id: string }> {
    return this.review.edit(id, dto, user.id);
  }
}
