import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

const REVIEW_STATUSES = ['pending', 'needs_clarification', 'approved', 'rejected', 'duplicate'] as const;

export class ReviewQueueQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: REVIEW_STATUSES, default: 'pending' })
  @IsOptional()
  @IsIn(REVIEW_STATUSES)
  status?: (typeof REVIEW_STATUSES)[number];
}

/** Optional finalizing overrides applied when approving (FR-04/FR-12). */
export class ApproveSubmissionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  lemma?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  definition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  exampleSentence?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  topicId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  levelId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ageGroupId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

export class RejectSubmissionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

export class ClarifySubmissionDto {
  @ApiPropertyOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  comment!: string;
}

export class EditSubmissionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  proposedLemma?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  proposedDefinition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  exampleSentence?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  topicId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  levelId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ageGroupId?: string | null;
}

export class BatchApproveDto {
  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID('all', { each: true })
  ids!: string[];
}
