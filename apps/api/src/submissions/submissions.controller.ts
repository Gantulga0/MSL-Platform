import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Paginated } from '@msl/types';
import { Public } from '../common/decorators/public.decorator';
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

  @Roles('user')
  @Post()
  @ApiOperation({ summary: 'Suggest a new word — runs duplicate detection' })
  create(
    @Body() dto: CreateSubmissionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ submission: unknown; duplicate: boolean; existingWord?: unknown }> {
    return this.submissions.create(dto, user.id);
  }

  @Public()
  @Get('check-duplicate')
  @ApiOperation({ summary: 'Live duplicate hint for the submit form' })
  checkDuplicate(@Query() query: CheckDuplicateQueryDto): Promise<CheckDuplicateResult> {
    return this.submissions.checkDuplicate(query.lemma, query.topic);
  }

  @Roles('user')
  @Get('mine')
  @ApiOperation({ summary: 'My word suggestions + status' })
  mine(
    @Query() page: PaginationQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Paginated<unknown>> {
    return this.submissions.mine(user.id, page.page, page.limit);
  }
}
