import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

const ROLES = ['user', 'admin'] as const;
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
  @ApiProperty({ enum: ROLES, default: 'user' })
  @IsIn(ROLES)
  role!: (typeof ROLES)[number];

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName!: string;

  @ApiPropertyOptional({ description: 'Minor account (username + PIN login)' })
  @IsOptional()
  @IsBoolean()
  isMinor?: boolean;

  @ApiPropertyOptional({ description: 'Required for minor accounts' })
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

  @ApiPropertyOptional({ description: 'Minor PIN (4–8 digits)' })
  @IsOptional()
  @Matches(/^\d{4,8}$/, { message: 'PIN must be 4–8 digits' })
  pin?: string;
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
