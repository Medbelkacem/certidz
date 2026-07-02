import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { EventEmitter2 } from '@nestjs/event-emitter';
import type { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import type { PrismaService } from '../../prisma/prisma.service';
import { AUDIT_RECORD_EVENT } from '../audit/audit.types';
import { AuthService } from './auth.service';
import type { MfaService } from './mfa.service';

jest.mock('argon2');

const mockedArgon = argon2 as jest.Mocked<typeof argon2>;

/** Build the AuthService under test with fully-mocked collaborators. */
function setup() {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
    session: {
      create: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    $transaction: jest.fn(async (arg: unknown) => {
      if (typeof arg === 'function') {
        const txFn = arg as (tx: unknown) => Promise<unknown>;
        return txFn({
          refreshToken: {
            create: jest.fn().mockResolvedValue({ id: 'rt_next' }),
            update: jest.fn().mockResolvedValue({}),
          },
          session: { update: jest.fn().mockResolvedValue({}) },
        });
      }
      return Promise.all(arg as Promise<unknown>[]);
    }),
  };

  const jwtService = {
    signAsync: jest.fn().mockResolvedValue('signed.access.token'),
  };
  const config = {
    get: jest.fn((key: string) =>
      key === 'JWT_REFRESH_TTL_DAYS' ? 30 : '15m',
    ),
  };
  const mfaService = {
    hasVerifiedTotp: jest.fn().mockResolvedValue(false),
    validateTotp: jest.fn(),
  };
  const eventEmitter = { emit: jest.fn() };

  const service = new AuthService(
    prisma as unknown as PrismaService,
    jwtService as unknown as JwtService,
    config as unknown as ConfigService<never, true>,
    mfaService as unknown as MfaService,
    eventEmitter as unknown as EventEmitter2,
  );

  return { service, prisma, jwtService, mfaService, eventEmitter };
}

const ctx = { ip: '127.0.0.1', userAgent: 'jest' };

const baseUser = {
  id: 'user_1',
  email: 'amina@example.dz',
  passwordHash: 'stored-argon-hash',
  firstName: 'Amina',
  lastName: 'Benali',
  status: UserStatus.ACTIVE,
};

describe('AuthService.register', () => {
  it('hashes the password with argon2id and never returns the hash', async () => {
    const { service, prisma, eventEmitter } = setup();
    prisma.user.findUnique.mockResolvedValue(null);
    mockedArgon.hash.mockResolvedValue('new-hash');
    prisma.user.create.mockResolvedValue({ ...baseUser, passwordHash: 'new-hash' });

    const result = await service.register(
      {
        email: 'Amina@Example.dz',
        password: 'S3cure-Passw0rd!',
        firstName: 'Amina',
        lastName: 'Benali',
      },
      ctx,
    );

    expect(mockedArgon.hash).toHaveBeenCalledWith(
      'S3cure-Passw0rd!',
      expect.objectContaining({ type: argon2.argon2id }),
    );
    // email lower-cased before persistence
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: 'amina@example.dz' }),
      }),
    );
    expect(result).not.toHaveProperty('passwordHash');
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      AUDIT_RECORD_EVENT,
      expect.objectContaining({ action: 'auth.register' }),
    );
  });

  it('rejects a duplicate email', async () => {
    const { service, prisma } = setup();
    prisma.user.findUnique.mockResolvedValue({ id: 'existing' });
    await expect(
      service.register(
        {
          email: 'amina@example.dz',
          password: 'S3cure-Passw0rd!',
          firstName: 'A',
          lastName: 'B',
        },
        ctx,
      ),
    ).rejects.toThrow(/already exists/);
  });
});

describe('AuthService.login', () => {
  it('issues a token pair on valid credentials', async () => {
    const { service, prisma } = setup();
    prisma.user.findUnique.mockResolvedValue(baseUser);
    mockedArgon.verify.mockResolvedValue(true);
    prisma.session.create.mockResolvedValue({ id: 'sess_1' });
    prisma.refreshToken.create.mockResolvedValue({ id: 'rt_1' });

    const result = await service.login(
      { email: 'amina@example.dz', password: 'S3cure-Passw0rd!' },
      ctx,
    );

    expect('accessToken' in result).toBe(true);
    if ('accessToken' in result) {
      expect(result.accessToken).toBe('signed.access.token');
      expect(typeof result.refreshToken).toBe('string');
      expect(result.user).not.toHaveProperty('passwordHash');
    }
    expect(prisma.session.create).toHaveBeenCalled();
  });

  it('rejects a wrong password and audits the failure', async () => {
    const { service, prisma, eventEmitter } = setup();
    prisma.user.findUnique.mockResolvedValue(baseUser);
    mockedArgon.verify.mockResolvedValue(false);

    await expect(
      service.login(
        { email: 'amina@example.dz', password: 'wrong' },
        ctx,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.session.create).not.toHaveBeenCalled();
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      AUDIT_RECORD_EVENT,
      expect.objectContaining({
        action: 'auth.login_failed',
        metadata: expect.objectContaining({ reason: 'bad_password' }),
      }),
    );
  });

  it('rejects an unknown email uniformly', async () => {
    const { service, prisma } = setup();
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.login({ email: 'nobody@example.dz', password: 'x' }, ctx),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

describe('AuthService.refresh — rotation + reuse detection', () => {
  const future = new Date(Date.now() + 3_600_000);

  it('rotates a valid token and returns a new pair', async () => {
    const { service, prisma } = setup();
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'rt_1',
      userId: 'user_1',
      sessionId: 'sess_1',
      revokedAt: null,
      expiresAt: future,
      session: { revokedAt: null, expiresAt: future },
      user: { email: 'amina@example.dz' },
    });

    const result = await service.refresh('raw-refresh-token', ctx);

    expect(result.accessToken).toBe('signed.access.token');
    expect(typeof result.refreshToken).toBe('string');
    expect(result.refreshToken).not.toBe('raw-refresh-token');
    // rotation performed inside a transaction
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('detects reuse of a rotated token and revokes the whole session', async () => {
    const { service, prisma, eventEmitter } = setup();
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'rt_old',
      userId: 'user_1',
      sessionId: 'sess_1',
      revokedAt: new Date(), // already rotated → reuse
      expiresAt: future,
      session: { revokedAt: null, expiresAt: future },
      user: { email: 'amina@example.dz' },
    });

    await expect(
      service.refresh('replayed-token', ctx),
    ).rejects.toThrow(/reuse detected/i);

    // The whole session family is revoked (session + tokens).
    expect(prisma.session.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'sess_1' } }),
    );
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { sessionId: 'sess_1', revokedAt: null },
      }),
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      AUDIT_RECORD_EVENT,
      expect.objectContaining({ action: 'auth.refresh_reuse_detected' }),
    );
  });

  it('rejects an unknown refresh token', async () => {
    const { service, prisma } = setup();
    prisma.refreshToken.findUnique.mockResolvedValue(null);
    await expect(service.refresh('nope', ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
