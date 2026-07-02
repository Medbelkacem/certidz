import { createHash, randomBytes } from 'node:crypto';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { type Session, type User, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import type { Env } from '../../config/env';
import { PrismaService } from '../../prisma/prisma.service';
import { AUDIT_RECORD_EVENT, type AuditRecordInput } from '../audit/audit.types';
import type { JwtPayload, RequestContext, TokenPair } from './auth.types';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { MfaService } from './mfa.service';

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MiB
  timeCost: 3,
  parallelism: 4,
};

export type SafeUser = Omit<User, 'passwordHash'>;

export interface LoginResult extends TokenPair {
  user: SafeUser;
}

export interface MfaChallengeResult {
  mfaRequired: true;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<Env, true>,
    private readonly mfaService: MfaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // -------------------------------------------------------------------------
  // Registration
  // -------------------------------------------------------------------------

  async register(dto: RegisterDto, ctx: RequestContext): Promise<SafeUser> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await argon2.hash(dto.password, ARGON2_OPTIONS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        locale: dto.locale ?? 'fr-DZ',
        // TODO(email): switch to PENDING_VERIFICATION once the transactional
        // email provider is wired and a verification flow exists.
        status: UserStatus.ACTIVE,
      },
    });

    this.audit({
      actorId: user.id,
      action: 'auth.register',
      resourceType: 'user',
      resourceId: user.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return this.sanitize(user);
  }

  // -------------------------------------------------------------------------
  // Login
  // -------------------------------------------------------------------------

  async login(
    dto: LoginDto,
    ctx: RequestContext,
  ): Promise<LoginResult | MfaChallengeResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // Same error for unknown email / OAuth-only account / bad password
    // to prevent account enumeration.
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      this.audit({
        actorId: user.id,
        action: 'auth.login_failed',
        resourceType: 'user',
        resourceId: user.id,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: { reason: 'bad_password' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException(`Account is ${user.status.toLowerCase()}`);
    }

    // MFA step-up: password alone is not enough once TOTP is enrolled.
    if (await this.mfaService.hasVerifiedTotp(user.id)) {
      if (!dto.totpCode) {
        return { mfaRequired: true };
      }
      const totpValid = await this.mfaService.validateTotp(
        user.id,
        dto.totpCode,
      );
      if (!totpValid) {
        this.audit({
          actorId: user.id,
          action: 'auth.login_failed',
          resourceType: 'user',
          resourceId: user.id,
          ip: ctx.ip,
          userAgent: ctx.userAgent,
          metadata: { reason: 'bad_totp' },
        });
        throw new UnauthorizedException('Invalid TOTP code');
      }
    }

    const session = await this.createSession(user.id, ctx);
    const tokens = await this.issueTokenPair(user, session);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    this.audit({
      actorId: user.id,
      action: 'auth.login',
      resourceType: 'session',
      resourceId: session.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return { user: this.sanitize(user), ...tokens };
  }

  // -------------------------------------------------------------------------
  // Refresh-token rotation with reuse detection
  // -------------------------------------------------------------------------

  async refresh(rawToken: string, ctx: RequestContext): Promise<TokenPair> {
    const tokenHash = this.hashToken(rawToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { session: true, user: true },
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // REUSE DETECTION: a rotated (revoked) token is being presented again.
    // Either the legitimate client replayed an old token, or the token was
    // stolen. Both cases invalidate the entire session family.
    if (stored.revokedAt) {
      await this.revokeSession(stored.sessionId);
      this.audit({
        actorId: stored.userId,
        action: 'auth.refresh_reuse_detected',
        resourceType: 'session',
        resourceId: stored.sessionId,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: { tokenId: stored.id },
      });
      this.logger.warn(
        `Refresh token reuse detected for user ${stored.userId}; session ${stored.sessionId} revoked`,
      );
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }
    if (
      stored.session.revokedAt ||
      stored.session.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('Session is no longer valid');
    }

    // Rotation: mint a successor, then retire the presented token and link
    // it via replacedById so the chain is reconstructable in forensics.
    const rawNext = this.generateOpaqueToken();
    const nextExpiry = this.refreshExpiry();

    const next = await this.prisma.$transaction(async (tx) => {
      const created = await tx.refreshToken.create({
        data: {
          tokenHash: this.hashToken(rawNext),
          userId: stored.userId,
          sessionId: stored.sessionId,
          expiresAt: nextExpiry,
        },
      });
      await tx.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date(), replacedById: created.id },
      });
      await tx.session.update({
        where: { id: stored.sessionId },
        data: { lastSeenAt: new Date() },
      });
      return created;
    });

    const accessToken = await this.signAccessToken({
      sub: stored.userId,
      email: stored.user.email,
      sid: stored.sessionId,
    });

    this.logger.debug(`Rotated refresh token ${stored.id} -> ${next.id}`);
    return { accessToken, refreshToken: rawNext };
  }

  // -------------------------------------------------------------------------
  // Logout
  // -------------------------------------------------------------------------

  async logout(userId: string, sessionId: string): Promise<void> {
    await this.revokeSession(sessionId);
    this.audit({
      actorId: userId,
      action: 'auth.logout',
      resourceType: 'session',
      resourceId: sessionId,
    });
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.session.update({
        where: { id: sessionId },
        data: { revokedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { sessionId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private async createSession(
    userId: string,
    ctx: RequestContext,
  ): Promise<Session> {
    return this.prisma.session.create({
      data: {
        userId,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        expiresAt: this.refreshExpiry(),
      },
    });
  }

  private async issueTokenPair(
    user: Pick<User, 'id' | 'email'>,
    session: Pick<Session, 'id'>,
  ): Promise<TokenPair> {
    const accessToken = await this.signAccessToken({
      sub: user.id,
      email: user.email,
      sid: session.id,
    });

    const rawRefresh = this.generateOpaqueToken();
    await this.prisma.refreshToken.create({
      data: {
        tokenHash: this.hashToken(rawRefresh),
        userId: user.id,
        sessionId: session.id,
        expiresAt: this.refreshExpiry(),
      },
    });

    return { accessToken, refreshToken: rawRefresh };
  }

  private signAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      expiresIn: this.config.get('JWT_ACCESS_TTL', { infer: true }),
    });
  }

  private generateOpaqueToken(): string {
    return randomBytes(48).toString('base64url');
  }

  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private refreshExpiry(): Date {
    const days = this.config.get('JWT_REFRESH_TTL_DAYS', { infer: true });
    return new Date(Date.now() + days * 24 * 3600 * 1000);
  }

  private sanitize(user: User): SafeUser {
    const { passwordHash: _passwordHash, ...safe } = user;
    return safe;
  }

  private audit(input: AuditRecordInput): void {
    this.eventEmitter.emit(AUDIT_RECORD_EVENT, input);
  }
}
