import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/auth.types';
import { AuthService, type PublicUser } from './auth.service';
import { REFRESH_COOKIE, TokensService } from './tokens.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './auth.dto';

const AUTH_THROTTLE = { default: { ttl: 60_000, limit: 10 } };

function requestMeta(req: Request): { userAgent: string | null; ip: string | null } {
  return { userAgent: req.headers['user-agent'] ?? null, ip: req.ip ?? null };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly tokens: TokensService,
  ) {}

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('register')
  @ApiOperation({ summary: 'Register an email account (parent/community) — AUTH-02' })
  register(@Body() dto: RegisterDto, @Req() req: Request): Promise<{ message: string }> {
    return this.auth.register(dto, requestMeta(req));
  }

  @Public()
  @Post('verify-email')
  @ApiOperation({ summary: 'Confirm an email-verification token — AUTH-02' })
  verifyEmail(@Body() dto: VerifyEmailDto): Promise<{ message: string }> {
    return this.auth.verifyEmail(dto);
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('login')
  @ApiOperation({ summary: 'Login with email/username + password — AUTH-02/04/05' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string; user: PublicUser }> {
    const { accessToken, refreshToken, user } = await this.auth.login(dto, requestMeta(req));
    this.tokens.setRefreshCookie(res, refreshToken);
    return { accessToken, user };
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Rotate the refresh token and mint a new access token — AUTH-01' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const current = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    const { accessToken, refreshToken } = await this.auth.refresh(current, requestMeta(req));
    this.tokens.setRefreshCookie(res, refreshToken);
    return { accessToken };
  }

  @Public()
  @Post('logout')
  @ApiOperation({ summary: 'Revoke the refresh token and clear the cookie — AUTH-01' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const current = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    await this.auth.logout(current, undefined, requestMeta(req));
    this.tokens.clearRefreshCookie(res);
    return { message: 'Logged out.' };
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password-reset email — G-14' })
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    return this.auth.forgotPassword(dto);
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('reset-password')
  @ApiOperation({ summary: 'Complete a password reset with a token — G-14' })
  resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    return this.auth.resetPassword(dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Current authenticated user profile + role — AUTH /me' })
  @ApiOkResponse({ description: 'The authenticated user.' })
  me(@CurrentUser() user: AuthenticatedUser): Promise<PublicUser> {
    return this.auth.me(user.id);
  }
}
