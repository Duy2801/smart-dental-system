import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
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
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    @InjectQueue('mail-queue') private readonly mailQueue: Queue,
  ) {
    this.googleClient = new OAuth2Client();
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

  private async generatePatientCode() {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = `PAT-${new Date().getFullYear()}-${randomBytes(3).toString('hex').toUpperCase()}`;
      const existing = await this.prismaService.patient.findUnique({
        where: { patientCode: code },
        select: { id: true },
      });
      if (!existing) return code;
    }

    return `PAT-${Date.now()}`;
  }

  private async ensurePatientProfile(userId: string) {
    const existing = await this.prismaService.patient.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (existing) return;

    await this.prismaService.patient.create({
      data: {
        userId,
        patientCode: await this.generatePatientCode(),
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
    const patientCode = await this.generatePatientCode();
    const user = await this.prismaService.user.create({
      data: {
        email,
        passwordHash,
        fullName: data.fullName.trim(),
        phone: data.phone,
        roles: { create: { roleId: role.id } },
        patientProfile: {
          create: { patientCode },
        },
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
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: true } },
        patientProfile: {
          include: {
            appointments: {
              orderBy: { scheduledAt: 'desc' },
              take: 1,
              select: {
                id: true,
                scheduledAt: true,
                status: true,
                treatmentMethod: {
                  select: {
                    name: true,
                    service: { select: { name: true } },
                  },
                },
                doctor: {
                  select: {
                    user: { select: { fullName: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) throw new UnauthorizedException('user.not_found');

    const lastAppointment = user.patientProfile?.appointments[0] ?? null;

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      roles: user.roles.map(({ role }) => role.code),
      status: user.status,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      patientProfile: user.patientProfile
        ? {
            id: user.patientProfile.id,
            patientCode: user.patientProfile.patientCode,
            dateOfBirth: user.patientProfile.dateOfBirth,
            gender: user.patientProfile.gender,
            address: user.patientProfile.address,
            emergencyContactName: user.patientProfile.emergencyContactName,
            emergencyContactPhone: user.patientProfile.emergencyContactPhone,
            medicalHistory: user.patientProfile.medicalHistory,
          }
        : null,
      lastAppointment: lastAppointment
        ? {
            id: lastAppointment.id,
            scheduledAt: lastAppointment.scheduledAt,
            status: lastAppointment.status,
            serviceName:
              lastAppointment.treatmentMethod?.service?.name ??
              lastAppointment.treatmentMethod?.name ??
              'Dịch vụ',
            doctorName: lastAppointment.doctor.user.fullName,
          }
        : null,
    };
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
      include: {
        roles: { include: { role: true } },
        doctorProfile: { select: { id: true } },
      },
    });
    if (!sessionUser) throw new UnauthorizedException('user.not_found');
    return {
      user: this.toUserResponse({
        ...sessionUser,
        roles: sessionUser.roles.map(({ role }) => role.code),
        doctorId: sessionUser.doctorProfile?.id ?? null,
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
      const [accessToken, user] = await Promise.all([
        Promise.resolve(this.signAccessToken(payload.sub, payload.email)),
        this.me(payload.sub),
      ]);
      return { accessToken, user };
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
    await this.ensurePatientProfile(user.id);
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

  private getGoogleAudiences(): string[] {
    const rawIds = [
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_WEB_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_ANDROID_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_IOS_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_MOBILE_CLIENT_ID'),
    ];

    const audiences = rawIds
      .map((id) => id?.trim().replace(/^["']|["']$/g, ''))
      .filter((id): id is string => Boolean(id));

    return Array.from(new Set(audiences));
  }

  private async fetchGoogleUserInfo(accessToken: string): Promise<{
    sub: string;
    email: string;
    email_verified?: boolean;
    name?: string;
  }> {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new Error(`Google userinfo status: ${res.status}`);
    }
    const data = (await res.json()) as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
    };
    if (!data?.email || !data?.sub) {
      throw new Error('Google userinfo response missing email or sub');
    }
    return {
      sub: data.sub,
      email: data.email,
      email_verified: data.email_verified ?? false,
      name: data.name,
    };
  }

  private async verifyGoogleToken(rawToken: string): Promise<{
    sub: string;
    email: string;
    email_verified?: boolean;
    name?: string;
  }> {
    const token = rawToken?.trim();
    if (!token) {
      throw new UnauthorizedException('auth.google_invalid_token');
    }

    // Nếu token là OAuth2 Access Token (bắt đầu bằng ya29.)
    if (token.startsWith('ya29.')) {
      try {
        return await this.fetchGoogleUserInfo(token);
      } catch (err: any) {
        this.logger.warn(`Google access_token verification failed: ${err?.message || err}`);
        throw new UnauthorizedException('auth.google_invalid_token');
      }
    }

    // Token dạng JWT ID Token
    const audiences = this.getGoogleAudiences();
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: audiences.length > 0 ? audiences : undefined,
      });
      const payload = ticket.getPayload();
      if (payload?.email && payload?.sub) {
        return {
          sub: payload.sub,
          email: payload.email,
          email_verified: payload.email_verified ?? false,
          name: payload.name,
        };
      }
    } catch (err: any) {
      this.logger.warn(
        `Google verifyIdToken failed: ${err?.message || err}. Attempting userinfo fallback...`,
      );
    }

    // Fallback thử endpoint userinfo
    try {
      return await this.fetchGoogleUserInfo(token);
    } catch (err: any) {
      this.logger.warn(`Google userinfo fallback failed: ${err?.message || err}`);
      throw new UnauthorizedException('auth.google_invalid_token');
    }
  }

  async loginWithGoogle(rawToken: string) {
    const payload = await this.verifyGoogleToken(rawToken);
    if (!payload?.email) {
      throw new UnauthorizedException('auth.google_invalid_token');
    }

    const email = this.normalizeEmail(payload.email);
    let user = await this.prismaService.user.findFirst({
      where: { OR: [{ googleId: payload.sub }, { email }] },
      include: {
        roles: { include: { role: true } },
      },
    });

    if (!user) {
      const role = await this.getPatientRole();
      user = await this.prismaService.user.create({
        data: {
          email,
          fullName: payload.name ?? email.split('@')[0],
          googleId: payload.sub,
          emailVerified: payload.email_verified ?? true,
          roles: { create: { roleId: role.id } },
        },
        include: {
          roles: { include: { role: true } },
        },
      });
    } else if (!user.googleId) {
      user = await this.prismaService.user.update({
        where: { id: user.id },
        data: {
          googleId: payload.sub,
          emailVerified:
            user.emailVerified || (payload.email_verified ?? true),
        },
        include: {
          roles: { include: { role: true } },
        },
      });
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('auth.account_inactive');
    }

    // Đảm bảo mọi tài khoản bệnh nhân đăng nhập qua Google đều có PatientProfile
    const isPatient =
      user.roles.length === 0 ||
      user.roles.some((r) => r.role.code === 'PATIENT');
    if (isPatient) {
      await this.ensurePatientProfile(user.id);
    }

    return this.createSession(user);
  }
}

