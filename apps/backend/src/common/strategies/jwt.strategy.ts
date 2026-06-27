import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../modules/prisma/prisma.service';

type AccessTokenPayload = {
  sub: string;
  email: string;
  tokenType: 'access' | 'refresh';
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: AccessTokenPayload) {
    if (payload.tokenType !== 'access') {
      throw new UnauthorizedException('auth.invalid_token');
    }
    const user = await this.prismaService.user.findUnique({
      where: { id: payload.sub },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('user.not_found');
    }
    return {
      userId: user.id,
      email: user.email,
      roles: user.roles.map(({ role }) => role.code),
      permissions: user.roles.flatMap(({ role }) =>
        role.permissions.map(({ permission }) => permission.code),
      ),
    };
  }
}
