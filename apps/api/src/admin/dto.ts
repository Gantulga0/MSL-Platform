import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Allow,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSettingDto {
  @ApiProperty({ example: 'duplicate_trigram_threshold' })
  @IsString()
  @MaxLength(120)
  key!: string;

  @ApiProperty({ description: 'JSON value', example: 0.45 })
  @Allow()
  value!: unknown;
}

export class ImportWordDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  lemma!: string;

  @ApiPropertyOptional({ description: 'Optional text definition' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  definition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  exampleSentence?: string;

  @ApiPropertyOptional({ description: 'Topic slug to classify under' })
  @IsOptional()
  @IsString()
  topicSlug?: string;

  // Required for every word, but kept optional at the DTO layer so a single bad
  // row yields a per-row error instead of rejecting the whole batch. The service
  // enforces presence + URL validity (Г).
  @ApiProperty({
    description: 'URL of a pre-uploaded sign video to attach to the word (required)',
    example: 'https://cdn.example.com/signs/eej.mp4',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  videoUrl?: string;
}

export class BulkImportDto {
  @ApiProperty({ enum: ['pending', 'approved'], default: 'pending' })
  @IsIn(['pending', 'approved'])
  status!: 'pending' | 'approved';

  @ApiProperty({
    type: [ImportWordDto],
    example: [
      { lemma: 'Ээж', topicSlug: 'family', videoUrl: 'https://cdn.example.com/signs/eej.mp4' },
      { lemma: 'Аав', topicSlug: 'family', videoUrl: 'https://cdn.example.com/signs/aav.mp4' },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportWordDto)
  words!: ImportWordDto[];
}

export class AuditQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit = 20;
}

export class CreateWordDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  lemma!: string;

  @ApiPropertyOptional({ description: 'Optional text definition' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  definition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  exampleSentence?: string;

  @ApiProperty()
  @IsUUID()
  topicId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  levelId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ageGroupId?: string;

  @ApiPropertyOptional({
    description: 'Ids of pre-uploaded media (e.g. the sign video) to attach to the word',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  mediaIds?: string[];

  @ApiPropertyOptional({ description: 'Number of hands (1 or 2)', enum: [1, 2] })
  @IsOptional()
  @Type(() => Number)
  @IsIn([1, 2])
  handCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  source?: string;
}

export class UpdateWordDto {
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
  levelId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ageGroupId?: string | null;

  @ApiPropertyOptional({ description: 'Number of hands (1 or 2)', enum: [1, 2] })
  @IsOptional()
  @Type(() => Number)
  @IsIn([1, 2])
  handCount?: number | null;

  @ApiPropertyOptional({ enum: ['draft', 'pending', 'approved', 'rejected', 'archived'] })
  @IsOptional()
  @IsIn(['draft', 'pending', 'approved', 'rejected', 'archived'])
  status?: 'draft' | 'pending' | 'approved' | 'rejected' | 'archived';
}

export class AdminWordsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @ApiPropertyOptional({ enum: ['draft', 'pending', 'approved', 'rejected', 'archived'] })
  @IsOptional()
  @IsIn(['draft', 'pending', 'approved', 'rejected', 'archived'])
  status?: 'draft' | 'pending' | 'approved' | 'rejected' | 'archived';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit = 20;
}
