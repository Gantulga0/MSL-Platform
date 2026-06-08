import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateSubmissionDto {
  @ApiProperty({ example: 'Сайн уу' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  proposedLemma!: string;

  @ApiProperty({ example: 'Мэндчилгээний үг.' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  proposedDefinition!: string;

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
