import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RefreshTokenGuard } from '../../common/guards/jwt-refresh.guard';
import { AuthService } from './auth.service';
import {
  EmailDto,
  GoogleLoginDto,
  LoginDto,
  RegisterDto,
  ResendOtpDto,
  ResetPasswordDto,
  VerifyOtpDto,
} from './dto';

type LocalizedRequest = Request & {
  locale?: 'en' | 'vi';
  user?: { sub: string };
  refreshToken?: string;
};

@ApiTags('Auth')
@Controller(['auth', 'admin/auth'])
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  private setRefreshCookie(response: Response, refreshToken: string) {
    const isProduction =
      process.env.NODE_ENV === 'production' ||
      this.config.get<string>('NODE_ENV') === 'production';
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    });
  }

  private clearRefreshCookie(response: Response) {
    const isProduction =
      process.env.NODE_ENV === 'production' ||
      this.config.get<string>('NODE_ENV') === 'production';
    response.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/api/v1/auth',
    });
  }

  private hideRefreshToken<T extends { refreshToken: string }>(
    session: T,
    response: Response,
  ): T {
    this.setRefreshCookie(response, session.refreshToken);
    return session;
  }

  @Post('register')
  register(@Body() dto: RegisterDto, @Req() req: LocalizedRequest) {
    return this.auth.register(dto, req.locale ?? 'vi');
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.auth.login(dto.email, dto.password);
    return this.hideRefreshToken(session, response);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: Request & { user: { userId: string } }) {
    return this.auth.me(req.user.userId);
  }

  @ApiCookieAuth('refreshToken')
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  refreshToken(@Req() req: LocalizedRequest) {
    return this.auth.refreshToken(req.user!.sub, req.refreshToken!);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @Req() req: Request & { user: { userId: string } },
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.logout(req.user.userId);
    this.clearRefreshCookie(response);
    return result;
  }

  @Post('verify-otp')
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.auth.verifyOtp(dto);
    return this.hideRefreshToken(session, response);
  }

  @Post('resend-otp')
  resendOtp(@Body() dto: ResendOtpDto, @Req() req: LocalizedRequest) {
    return this.auth.resendOtp(dto.email, req.locale ?? 'vi');
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: EmailDto, @Req() req: LocalizedRequest) {
    return this.auth.forgotPassword(dto.email, req.locale ?? 'vi');
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @Post('google')
  async googleLogin(
    @Body() dto: GoogleLoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const rawToken = dto.idToken || dto.accessToken || dto.token;
    if (!rawToken) {
      throw new BadRequestException('auth.google_token_required');
    }
    const session = await this.auth.loginWithGoogle(rawToken);
    return this.hideRefreshToken(session, response);
  }
}
