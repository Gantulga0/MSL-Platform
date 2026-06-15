import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

export class WordsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Free-text search over lemma + definition' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by topic id' })
  @IsOptional()
  @IsUUID()
  topic?: string;

  @ApiPropertyOptional({ description: 'Filter by level id' })
  @IsOptional()
  @IsUUID()
  level?: string;

  @ApiPropertyOptional({ description: 'Filter by age-group id' })
  @IsOptional()
  @IsUUID()
  age?: string;

  @ApiPropertyOptional({ description: 'Filter by number of hands (1 or 2)', enum: [1, 2] })
  @IsOptional()
  @Type(() => Number)
  @IsIn([1, 2])
  hands?: number;
}
