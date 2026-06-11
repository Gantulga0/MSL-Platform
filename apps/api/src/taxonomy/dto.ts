import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
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

export class CreateSignLocationDto {
  @ApiProperty({ example: 'mouth' })
  @IsString()
  @MaxLength(64)
  code!: string;

  @ApiProperty({ example: 'Ам' })
  @IsString()
  @MaxLength(120)
  label!: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateSignLocationDto extends PartialType(CreateSignLocationDto) {}

export class CreateSignMovementDto {
  @ApiProperty({ example: 'circular' })
  @IsString()
  @MaxLength(64)
  code!: string;

  @ApiProperty({ example: 'Тойрог' })
  @IsString()
  @MaxLength(120)
  label!: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateSignMovementDto extends PartialType(CreateSignMovementDto) {}

export class CreateHandshapeDto {
  @ApiProperty({ example: 'flat' })
  @IsString()
  @MaxLength(64)
  code!: string;

  @ApiProperty({ example: 'Алга дэлгэсэн' })
  @IsString()
  @MaxLength(120)
  label!: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateHandshapeDto extends PartialType(CreateHandshapeDto) {}
