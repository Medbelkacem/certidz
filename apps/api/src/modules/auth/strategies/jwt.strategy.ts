import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Env } from '../../../config/env';
import { PrismaService } from '../../../prisma/prisma.service';
import type { AuthUser, JwtPayload } from '../auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService<Env, true>,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET', { infer: true }),
    });
  }

  /**
   * Beyond signature/expiry, verify the session behind the token is still
   * alive so that revoking a session invalidates outstanding access tokens.
   */
  async validate(payload: JwtPayload): Promise<AuthUser> {
    const session = await this.prisma.session.findUnique({
      where: { id: payload.sid },
      select: { revokedAt: true, expiresAt: true },
    });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session is no longer valid');
    }
    return { id: payload.sub, email: payload.email, sessionId: payload.sid };
  }
}
