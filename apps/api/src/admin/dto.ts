import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Allow,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
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
