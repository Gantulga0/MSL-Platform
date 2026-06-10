import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
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

  @ApiPropertyOptional({ description: 'Filter by sign-location id' })
  @IsOptional()
  @IsUUID()
  location?: string;

  @ApiPropertyOptional({ description: 'Filter by sign-movement id' })
  @IsOptional()
  @IsUUID()
  movement?: string;
}
