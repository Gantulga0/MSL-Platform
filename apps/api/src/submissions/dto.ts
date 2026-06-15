import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CYRILLIC_LEMMA_PATTERN, CYRILLIC_LEMMA_MESSAGE } from '../common/cyrillic';

export class CreateSubmissionDto {
  @ApiProperty({ example: 'Сайн уу', description: 'Cyrillic-only word/phrase' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Matches(CYRILLIC_LEMMA_PATTERN, { message: CYRILLIC_LEMMA_MESSAGE })
  proposedLemma!: string;

  // Optional on submission: the public form only collects a name + video.
  // A definition is mandatory on the published Word and is enforced at approval.
  @ApiPropertyOptional({ example: 'Мэндчилгээний үг.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  proposedDefinition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  exampleSentence?: string;

  @ApiProperty({ description: 'Topic (required) — a subtopic also implies its parent' })
  @IsUUID()
  topicId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  levelId?: string;

  // Age group + hand count are required on the public submit form (FR-02).
  @ApiProperty({ description: 'Age group (required)' })
  @IsUUID()
  ageGroupId!: string;

  @ApiProperty({ description: 'Number of hands used — 1 or 2 (required)', enum: [1, 2] })
  @Type(() => Number)
  @IsIn([1, 2])
  handCount!: number;

  @ApiPropertyOptional({ description: 'Ids of pre-uploaded media to attach', type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUUID('all', { each: true })
  mediaIds?: string[];
}

export class CheckDuplicateQueryDto {
  @ApiProperty({ description: 'Proposed lemma to check' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  lemma!: string;

  @ApiPropertyOptional({ description: 'Topic id to scope the check' })
  @IsOptional()
  @IsUUID()
  topic?: string;
}
