import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Session, User } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { AUDIT_RECORD_EVENT, type AuditRecordInput } from '../audit/audit.types';
import type { RequestContext } from '../auth/auth.types';
import type { ChangePasswordDto } from './dto/change-password.dto';
import type { UpdateProfileDto } from './dto/update-profile.dto';

/** Argon2id parameters — must match the auth module so hashes interoperate. */
const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MiB
  timeCost: 3,
  parallelism: 4,
};

export type SafeUser = Omit<User, 'passwordHash'>;

export interface SessionView {
  id: string;
  ip: string | null;
  userAgent: string | null;
  device: string | null;
  lastSeenAt: Date;
  expiresAt: Date;
  createdAt: Date;
  current: boolean;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getProfile(userId: string): Promise<SafeUser> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.sanitize(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    ctx: RequestContext,
  ): Promise<SafeUser> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
        ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
        ...(dto.locale !== undefined ? { locale: dto.locale } : {}),
        ...(dto.timezone !== undefined ? { timezone: dto.timezone } : {}),
      },
    });
    this.audit({
      actorId: userId,
      action: 'user.profile_updated',
      resourceType: 'user',
      resourceId: userId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return this.sanitize(user);
  }

  /** Active (non-revoked, non-expired) sessions, flagging the current one. */
  async listSessions(
    userId: string,
    currentSessionId: string,
  ): Promise<SessionView[]> {
    const sessions = await this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastSeenAt: 'desc' },
    });
    return sessions.map((s: Session) => ({
      id: s.id,
      ip: s.ip,
      userAgent: s.userAgent,
      device: s.device,
      lastSeenAt: s.lastSeenAt,
      expiresAt: s.expiresAt,
      createdAt: s.createdAt,
      current: s.id === currentSessionId,
    }));
  }

  async revokeSession(
    userId: string,
    sessionId: string,
    ctx: RequestContext,
  ): Promise<void> {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
      select: { id: true },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
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
    this.audit({
      actorId: userId,
      action: 'user.session_revoked',
      resourceType: 'session',
      resourceId: sessionId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
  }

  /**
   * Change password (argon2id). Verifies the current password, then revokes
   * every OTHER session so a compromised credential can't outlive the change.
   */
  async changePassword(
    userId: string,
    currentSessionId: string,
    dto: ChangePasswordDto,
    ctx: RequestContext,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.passwordHash) {
      throw new ForbiddenException(
        'This account has no password set (OAuth-only). Use account linking instead.',
      );
    }

    const valid = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!valid) {
      this.audit({
        actorId: userId,
        action: 'user.password_change_failed',
        resourceType: 'user',
        resourceId: userId,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: { reason: 'bad_current_password' },
      });
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (await argon2.verify(user.passwordHash, dto.newPassword)) {
      throw new BadRequestException(
        'New password must differ from the current password',
      );
    }

    const newHash = await argon2.hash(dto.newPassword, ARGON2_OPTIONS);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      }),
      this.prisma.session.updateMany({
        where: { userId, id: { not: currentSessionId }, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: {
          userId,
          sessionId: { not: currentSessionId },
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      }),
    ]);

    this.audit({
      actorId: userId,
      action: 'user.password_changed',
      resourceType: 'user',
      resourceId: userId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
  }

  private sanitize(user: User): SafeUser {
    const { passwordHash: _passwordHash, ...safe } = user;
    return safe;
  }

  private audit(input: AuditRecordInput): void {
    this.eventEmitter.emit(AUDIT_RECORD_EVENT, input);
  }
}
