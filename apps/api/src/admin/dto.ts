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

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  definition!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  exampleSentence?: string;

  @ApiPropertyOptional({ description: 'Topic slug to classify under' })
  @IsOptional()
  @IsString()
  topicSlug?: string;
}

export class BulkImportDto {
  @ApiProperty({ enum: ['pending', 'approved'], default: 'pending' })
  @IsIn(['pending', 'approved'])
  status!: 'pending' | 'approved';

  @ApiProperty({ type: [ImportWordDto] })
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

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  definition!: string;

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
