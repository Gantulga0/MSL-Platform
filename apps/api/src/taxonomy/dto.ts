import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateTopicDto {
  @ApiProperty({ example: 'Шинжлэх ухаан' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'science', description: 'lowercase-kebab unique slug' })
  @IsString()
  @Matches(SLUG, { message: 'slug must be lowercase-kebab' })
  @MaxLength(120)
  slug!: string;

  @ApiPropertyOptional({ description: 'Parent topic id for hierarchy' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  icon?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateTopicDto extends PartialType(CreateTopicDto) {}

export class CreateLevelDto {
  @ApiProperty({ example: 'beginner' })
  @IsString()
  @MaxLength(64)
  code!: string;

  @ApiProperty({ example: 'Анхан' })
  @IsString()
  @MaxLength(120)
  label!: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateLevelDto extends PartialType(CreateLevelDto) {}

export class CreateAgeGroupDto {
  @ApiProperty({ example: '7-10' })
  @IsString()
  @MaxLength(64)
  code!: string;

  @ApiProperty({ example: '7-10 нас' })
  @IsString()
  @MaxLength(120)
  label!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  minAge?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  maxAge?: number;
}

export class UpdateAgeGroupDto extends PartialType(CreateAgeGroupDto) {}

export class CreateHandednessDto {
  @ApiProperty({ example: 'one' })
  @IsString()
  @MaxLength(64)
  code!: string;

  @ApiProperty({ example: 'Нэг гар' })
  @IsString()
  @MaxLength(120)
  label!: string;

  @ApiProperty({ description: 'Maps to Word.handCount', enum: [1, 2], example: 1 })
  @IsInt()
  @Min(1)
  handCount!: number;

  @ApiPropertyOptional({ description: 'Image URL/path for the option', example: '/api/v1/options/images/handedness/one.png' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  imageUrl?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateHandednessDto extends PartialType(CreateHandednessDto) {}

/** Multipart body for uploading a new option image + creating the option. */
export class UploadOptionDto {
  @ApiProperty({ description: 'Unique code (internal reference)', example: 'pinch' })
  @IsString()
  @MaxLength(64)
  code!: string;

  @ApiProperty({ description: 'Internal label (not shown to end users)', example: 'Чимхсэн' })
  @IsString()
  @MaxLength(120)
  label!: string;

  @ApiPropertyOptional({ description: 'Required for handedness — maps to Word.handCount', enum: [1, 2] })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  handCount?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
