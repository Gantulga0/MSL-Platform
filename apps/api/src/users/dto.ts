import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsByteLength,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

const ROLES = ['learner', 'contributor', 'teacher', 'admin'] as const;
const PASSWORD = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export class UsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ROLES })
  @IsOptional()
  @IsIn(ROLES)
  role?: (typeof ROLES)[number];

  @ApiPropertyOptional({ description: 'Search by display name / username / email' })
  @IsOptional()
  @IsString()
  q?: string;
}

export class CreateUserDto {
  @ApiProperty({ enum: ROLES })
  @IsIn(ROLES)
  role!: (typeof ROLES)[number];

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName!: string;

  @ApiPropertyOptional({ description: 'Required for learners (no email)' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  username?: string;

  @ApiPropertyOptional({ description: 'Required for email accounts' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(PASSWORD, { message: 'Password must be 8+ chars with a letter and a number' })
  password?: string;

  @ApiPropertyOptional({ description: 'Learner PIN (4–8 digits)' })
  @IsOptional()
  @Matches(/^\d{4,8}$/, { message: 'PIN must be 4–8 digits' })
  pin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  schoolId?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ enum: ROLES })
  @IsOptional()
  @IsIn(ROLES)
  role?: (typeof ROLES)[number];

  @ApiPropertyOptional({ enum: ['active', 'suspended'] })
  @IsOptional()
  @IsIn(['active', 'suspended'])
  status?: 'active' | 'suspended';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string;
}

export class CreateClassCodeDto {
  @ApiProperty({ example: 'CLASS-3A-2026' })
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  code!: string;

  @ApiProperty({ example: '3-р анги' })
  @IsString()
  @MaxLength(120)
  label!: string;

  @ApiPropertyOptional({ description: 'ISO date string' })
  @IsOptional()
  @Type(() => String)
  @IsByteLength(0, 40)
  expiresAt?: string;
}
