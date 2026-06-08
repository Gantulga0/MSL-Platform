import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Paginated } from '@msl/types';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/auth.types';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { SubmissionsService, type CheckDuplicateResult } from './submissions.service';
import { CheckDuplicateQueryDto, CreateSubmissionDto } from './dto';

@ApiTags('submissions')
@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissions: SubmissionsService) {}

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
}
