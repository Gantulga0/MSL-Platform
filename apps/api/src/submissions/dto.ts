import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
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
