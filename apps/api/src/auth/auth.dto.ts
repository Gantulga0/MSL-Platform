import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

// Password policy (AUTH-04): ≥ 8 chars with letters + numbers (complexity).
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const PASSWORD_MESSAGE = 'Password must be at least 8 characters and include a letter and a number';

export class RegisterDto {
  @ApiProperty({ example: 'parent@example.mn' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  password!: string;

  @ApiProperty({ example: 'Бат-Эрдэнэ' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  displayName!: string;
}

export class VerifyEmailDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token!: string;
}

export class LoginDto {
  @ApiProperty({ description: 'Email or username', example: 'parent@example.mn' })
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class ClassCodeLoginDto {
  @ApiProperty({ example: 'bat_erdene' })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({ description: 'Class code provisioned by the teacher', example: 'CLASS-3A-2026' })
  @IsString()
  @IsNotEmpty()
  classCode!: string;

  @ApiPropertyOptional({ description: 'Optional learner PIN' })
  @IsOptional()
  @IsString()
  pin?: string;
}

export class ForgotPasswordDto {
  @ApiProperty()
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  password!: string;
}
