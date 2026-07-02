import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MfaFactorType } from '@prisma/client';
import { authenticator } from 'otplib';
import { PrismaService } from '../../prisma/prisma.service';
import type { TotpEnrollmentResponse } from './dto/mfa.dto';

const TOTP_ISSUER = 'CertiDZ';

@Injectable()
export class MfaService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Starts TOTP enrollment: generates a fresh secret and stores an
   * unverified factor. The factor only becomes active after the user
   * proves possession by submitting a valid code.
   *
   * TODO(security): encrypt `secret` at rest with a KMS-managed key.
   */
  async enrollTotp(
    userId: string,
    email: string,
  ): Promise<TotpEnrollmentResponse> {
    const existing = await this.prisma.mfaFactor.findFirst({
      where: { userId, type: MfaFactorType.TOTP, verifiedAt: { not: null } },
    });
    if (existing) {
      throw new BadRequestException('A verified TOTP factor already exists');
    }

    const secret = authenticator.generateSecret();

    // Replace any previous unverified enrollment attempt.
    await this.prisma.$transaction([
      this.prisma.mfaFactor.deleteMany({
        where: { userId, type: MfaFactorType.TOTP, verifiedAt: null },
      }),
      this.prisma.mfaFactor.create({
        data: {
          userId,
          type: MfaFactorType.TOTP,
          secret,
          label: 'authenticator',
        },
      }),
    ]);

    return {
      secret,
      otpauthUrl: authenticator.keyuri(email, TOTP_ISSUER, secret),
    };
  }

  /** Confirms an enrollment by verifying the first code. */
  async verifyEnrollment(userId: string, code: string): Promise<void> {
    const factor = await this.prisma.mfaFactor.findFirst({
      where: { userId, type: MfaFactorType.TOTP, verifiedAt: null },
    });
    if (!factor) {
      throw new NotFoundException('No pending TOTP enrollment');
    }
    if (!authenticator.verify({ token: code, secret: factor.secret })) {
      throw new BadRequestException('Invalid TOTP code');
    }
    await this.prisma.mfaFactor.update({
      where: { id: factor.id },
      data: { verifiedAt: new Date(), lastUsedAt: new Date() },
    });
  }

  /** True when the user has at least one verified TOTP factor. */
  async hasVerifiedTotp(userId: string): Promise<boolean> {
    const count = await this.prisma.mfaFactor.count({
      where: { userId, type: MfaFactorType.TOTP, verifiedAt: { not: null } },
    });
    return count > 0;
  }

  /** Validates a login-time TOTP code against the verified factor. */
  async validateTotp(userId: string, code: string): Promise<boolean> {
    const factor = await this.prisma.mfaFactor.findFirst({
      where: { userId, type: MfaFactorType.TOTP, verifiedAt: { not: null } },
    });
    if (!factor) {
      return false;
    }
    const valid = authenticator.verify({ token: code, secret: factor.secret });
    if (valid) {
      await this.prisma.mfaFactor.update({
        where: { id: factor.id },
        data: { lastUsedAt: new Date() },
      });
    }
    return valid;
  }
}
