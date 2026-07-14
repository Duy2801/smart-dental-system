import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { plainToInstance } from 'class-transformer';
import type { Queue } from 'bull';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { UserResponseDto } from '../user/dto/user-response.dto';
import { UserService } from '../user/user.service';
import { RegisterDto, ResetPasswordDto, VerifyOtpDto } from './dto';

const OTP_TTL_SECONDS = 3 * 60;
const RESET_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const MAX_RESEND = 3;
const RESEND_WINDOW_SECONDS = 3 * 60;

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    @InjectQueue('mail-queue') private readonly mailQueue: Queue,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private toUserResponse(user: object) {
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  private async getPatientRole() {
    return this.prismaService.role.upsert({
      where: { code: 'PATIENT' },
      update: {},
      create: {
        code: 'PATIENT',
        name: 'Patient',
        description: 'Bệnh nhân sử dụng hệ thống',
      },
    });
  }

  async register(data: RegisterDto, locale: 'en' | 'vi' = 'vi') {
    const email = this.normalizeEmail(data.email);
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser?.emailVerified) {
      throw new ConflictException('auth.email_exists');
    }
    if (existingUser) {
      await this.issueEmailOtp(
        existingUser.email,
        existingUser.fullName,
        locale,
      );
      return { message: 'auth.register_success' };
    }

    if (
      data.phone &&
      (await this.prismaService.user.findUnique({
        where: { phone: data.phone },
        select: { id: true },
      }))
    ) {
      throw new ConflictException('auth.phone_exists');
    }

    const role = await this.getPatientRole();
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await this.prismaService.user.create({
      data: {
        email,
        passwordHash,
        fullName: data.fullName.trim(),
        phone: data.phone,
        roles: { create: { roleId: role.id } },
      },
    });

    await this.issueEmailOtp(user.email, user.fullName, locale);
    return { message: 'auth.register_success' };
  }

  async login(emailInput: string, password: string) {
    const user = await this.userService.findByEmail(
      this.normalizeEmail(emailInput),
    );
    if (!user) throw new UnauthorizedException('auth.invalid_credentials');
    if (!user.passwordHash) {
      throw new UnauthorizedException('auth.account_google_only');
    }
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('auth.account_inactive');
    }
    if (!user.emailVerified) {
      throw new UnauthorizedException('auth.email_not_verified');
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('auth.invalid_credentials');
    }
    return this.createSession(user);
  }

  async me(userId: string) {
    return this.userService.findOne(userId);
  }

  async logout(userId: string) {
    await this.redisService.del(`refresh_token:${userId}`);
    return { message: 'auth.logout_success' };
  }

  private signAccessToken(userId: string, email: string) {
    return this.jwtService.sign(
      { sub: userId, email, tokenType: 'access' },
      {
        expiresIn: '15m',
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      },
    );
  }

  private signRefreshToken(userId: string, email: string) {
    return this.jwtService.sign(
      { sub: userId, email, tokenType: 'refresh' },
      {
        expiresIn: '7d',
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      },
    );
  }

  private async createSession(user: { id: string; email: string }) {
    const accessToken = this.signAccessToken(user.id, user.email);
    const refreshToken = this.signRefreshToken(user.id, user.email);
    await this.redisService.set(
      `refresh_token:${user.id}`,
      refreshToken,
      REFRESH_TOKEN_TTL_SECONDS,
    );
    const sessionUser = await this.prismaService.user.findUnique({
      where: { id: user.id },
      include: { roles: { include: { role: true } } },
    });
    if (!sessionUser) throw new UnauthorizedException('user.not_found');
    return {
      user: this.toUserResponse({
        ...sessionUser,
        roles: sessionUser.roles.map(({ role }) => role.code),
      }),
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(userId: string, presentedToken: string) {
    const storedToken = await this.redisService.get(`refresh_token:${userId}`);
    if (!storedToken || storedToken !== presentedToken) {
      throw new UnauthorizedException('auth.refresh_expired');
    }

    try {
      const payload = this.jwtService.verify<{
        sub: string;
        email: string;
        tokenType: string;
      }>(storedToken, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });
      if (payload.tokenType !== 'refresh' || payload.sub !== userId) {
        throw new Error('Invalid refresh token');
      }
      return { accessToken: this.signAccessToken(payload.sub, payload.email) };
    } catch {
      await this.redisService.del(`refresh_token:${userId}`);
      throw new UnauthorizedException('auth.refresh_expired');
    }
  }

  async verifyOtp({ email: emailInput, otp }: VerifyOtpDto) {
    const email = this.normalizeEmail(emailInput);
    const key = `email_otp:${email}`;
    const otpHash = await this.redisService.get(key);
    if (!otpHash) throw new BadRequestException('otp.expired_or_invalid');
    if (!(await bcrypt.compare(otp, otpHash))) {
      throw new BadRequestException('otp.incorrect');
    }

    await this.userService.markVerified(email);
    await this.redisService.del(key);
    const user = await this.userService.findByEmail(email);
    if (!user) throw new BadRequestException('user.not_found');
    return {
      ...(await this.createSession(user)),
      message: 'otp.verified',
    };
  }

  async resendOtp(emailInput: string, locale: 'en' | 'vi' = 'vi') {
    const email = this.normalizeEmail(emailInput);
    const user = await this.userService.findByEmail(email);
    if (!user) return { message: 'otp.resent' };
    if (user.emailVerified) return { message: 'otp.already_verified' };

    const limitKey = `otp_resend_limit:${email}`;
    const resendCount = Number(await this.redisService.get(limitKey)) || 0;
    if (resendCount >= MAX_RESEND) {
      throw new BadRequestException('otp.too_many_requests');
    }
    if (resendCount === 0) {
      await this.redisService.set(limitKey, '1', RESEND_WINDOW_SECONDS);
    } else {
      await this.redisService.incr(limitKey);
    }

    await this.issueEmailOtp(user.email, user.fullName, locale);
    return { message: 'otp.resent' };
  }

  private async issueEmailOtp(
    email: string,
    name: string,
    locale: 'en' | 'vi',
  ) {
    const otp = this.generateOtp();
    await this.redisService.set(
      `email_otp:${email}`,
      await bcrypt.hash(otp, 10),
      OTP_TTL_SECONDS,
    );
    await this.mailQueue.add('send-otp', { name, email, otp, locale });
  }

  async forgotPassword(emailInput: string, locale: 'en' | 'vi' = 'vi') {
    const email = this.normalizeEmail(emailInput);
    const user = await this.userService.findByEmail(email);
    // Luôn trả cùng một kết quả để không làm lộ email đã đăng ký.
    if (!user) return { message: 'auth.reset_email_sent' };

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await this.redisService.set(
      `password_reset:${tokenHash}`,
      user.id,
      RESET_TOKEN_TTL_SECONDS,
    );
    await this.mailQueue.add('send-password-reset', {
      name: user.fullName,
      email: user.email,
      token,
      locale,
    });
    return { message: 'auth.reset_email_sent' };
  }

  async resetPassword({ token, newPassword }: ResetPasswordDto) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const key = `password_reset:${tokenHash}`;
    const userId = await this.redisService.getDel(key);
    if (!userId) throw new BadRequestException('auth.reset_token_invalid');

    await this.prismaService.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(newPassword, 10) },
    });
    await this.redisService.del(`refresh_token:${userId}`);
    return { message: 'auth.password_reset_success' };
  }

  private async verifyGoogleToken(idToken: string) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
    });
    return ticket.getPayload();
  }

  async loginWithGoogle(idToken: string) {
    const payload = await this.verifyGoogleToken(idToken);
    if (!payload?.email) {
      throw new UnauthorizedException('auth.google_invalid_token');
    }

    const email = this.normalizeEmail(payload.email);
    let user = await this.prismaService.user.findFirst({
      where: { OR: [{ googleId: payload.sub }, { email }] },
    });
    if (!user) {
      const role = await this.getPatientRole();
      user = await this.prismaService.user.create({
        data: {
          email,
          fullName: payload.name ?? email.split('@')[0],
          googleId: payload.sub,
          emailVerified: payload.email_verified ?? false,
          roles: { create: { roleId: role.id } },
        },
      });
    } else if (!user.googleId) {
      user = await this.prismaService.user.update({
        where: { id: user.id },
        data: {
          googleId: payload.sub,
          emailVerified:
            user.emailVerified || (payload.email_verified ?? false),
        },
      });
    }
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('auth.account_inactive');
    }
    return this.createSession(user);
  }
}
