import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { Strategy } from 'passport-local';
import { PrismaService } from '../../../prisma/prisma.service';
import type { SafeUser } from '../auth.service';

/**
 * Passport "local" strategy for email/password authentication.
 *
 * Self-contained credential verification (Prisma + argon2) so it does not
 * depend on new AuthService methods. Returns the sanitised user on success.
 *
 * NOTE: to activate, register `LocalStrategy` (and use {@link LocalAuthGuard})
 * in AuthModule providers. It is not wired by default to avoid editing the
 * existing AuthModule.
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly prisma: PrismaService) {
    // The DTO/login form uses `email` (not the default `username`).
    super({ usernameField: 'email', passwordField: 'password' });
  }

  async validate(email: string, password: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Uniform failure — never disclose which factor was wrong.
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(`Account is ${user.status.toLowerCase()}`);
    }

    const { passwordHash: _passwordHash, ...safe } = user;
    return safe;
  }
}
