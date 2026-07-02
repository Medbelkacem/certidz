/* eslint-disable no-console */
import { createHash, randomBytes } from 'node:crypto';
import {
  DocumentStatus,
  EnvelopeStatus,
  MembershipRole,
  MembershipStatus,
  OrgPlan,
  PrismaClient,
  SignatureFieldType,
  SignerAuthMethod,
  SignerStatus,
  SigningOrder,
  UserStatus,
} from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

const sha256 = (data: string | Buffer): string =>
  createHash('sha256').update(data).digest('hex');

async function main(): Promise<void> {
  console.log('Seeding CertiDZ demo data…');

  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe!2026';
  const passwordHash = await argon2.hash(adminPassword, {
    type: argon2.argon2id,
  });

  // --- Demo organization ---------------------------------------------------
  const org = await prisma.organization.upsert({
    where: { slug: 'hisn-demo' },
    update: {},
    create: {
      name: 'HISN Demo Organization',
      slug: 'hisn-demo',
      plan: OrgPlan.BUSINESS,
      country: 'DZ',
      settings: {
        branding: { primaryColor: '#0B6E4F' },
        signaturePolicy: { defaultType: 'ADVANCED', requireMfaForQualified: true },
        retentionDays: 3650,
      },
    },
  });

  // --- Admin user ----------------------------------------------------------
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hisn-demo.dz' },
    update: {},
    create: {
      email: 'admin@hisn-demo.dz',
      emailVerified: new Date(),
      passwordHash,
      firstName: 'Amina',
      lastName: 'Benali',
      locale: 'fr-DZ',
      status: UserStatus.ACTIVE,
    },
  });

  const member = await prisma.user.upsert({
    where: { email: 'member@hisn-demo.dz' },
    update: {},
    create: {
      email: 'member@hisn-demo.dz',
      emailVerified: new Date(),
      passwordHash,
      firstName: 'Karim',
      lastName: 'Saidi',
      locale: 'ar-DZ',
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.membership.upsert({
    where: { orgId_userId: { orgId: org.id, userId: admin.id } },
    update: { role: MembershipRole.OWNER, status: MembershipStatus.ACTIVE },
    create: {
      orgId: org.id,
      userId: admin.id,
      role: MembershipRole.OWNER,
      status: MembershipStatus.ACTIVE,
      acceptedAt: new Date(),
    },
  });

  await prisma.membership.upsert({
    where: { orgId_userId: { orgId: org.id, userId: member.id } },
    update: { role: MembershipRole.MEMBER, status: MembershipStatus.ACTIVE },
    create: {
      orgId: org.id,
      userId: member.id,
      role: MembershipRole.MEMBER,
      status: MembershipStatus.ACTIVE,
      acceptedAt: new Date(),
      invitedById: admin.id,
    },
  });

  // --- Sample document -----------------------------------------------------
  const fakePdfBytes = Buffer.from(
    '%PDF-1.7\n% CertiDZ demo contract placeholder\n',
  );
  const docHash = sha256(fakePdfBytes);
  const s3Key = `orgs/${org.id}/documents/demo-contract-${randomBytes(4).toString('hex')}.pdf`;

  const document = await prisma.document.create({
    data: {
      orgId: org.id,
      createdById: admin.id,
      title: 'Contrat de prestation — Démo',
      description: 'Sample service agreement used for demos.',
      s3Key,
      sha256: docHash,
      size: fakePdfBytes.length,
      mime: 'application/pdf',
      status: DocumentStatus.ACTIVE,
      folder: '/contrats',
      tags: ['demo', 'contrat'],
      versions: {
        create: {
          version: 1,
          s3Key,
          sha256: docHash,
          size: fakePdfBytes.length,
          mime: 'application/pdf',
          changeNote: 'Initial upload',
          createdById: admin.id,
        },
      },
    },
  });

  // --- Sample envelope -----------------------------------------------------
  const envelope = await prisma.envelope.create({
    data: {
      orgId: org.id,
      documentId: document.id,
      createdById: admin.id,
      title: 'Signature du contrat de prestation',
      message: 'Merci de signer ce contrat avant la fin de semaine.',
      status: EnvelopeStatus.DRAFT,
      signingOrder: SigningOrder.SEQUENTIAL,
      expiresAt: new Date(Date.now() + 14 * 24 * 3600 * 1000),
      reminderConfig: { intervalHours: 48, maxReminders: 3 },
      signers: {
        create: [
          {
            userId: member.id,
            email: member.email,
            fullName: 'Karim Saidi',
            order: 1,
            status: SignerStatus.PENDING,
            authMethod: SignerAuthMethod.EMAIL_OTP,
          },
          {
            email: 'externe@example.dz',
            fullName: 'Partenaire Externe',
            order: 2,
            status: SignerStatus.PENDING,
            authMethod: SignerAuthMethod.EMAIL_OTP,
          },
        ],
      },
    },
    include: { signers: true },
  });

  const firstSigner = envelope.signers.find((s) => s.order === 1);
  if (firstSigner) {
    await prisma.signatureField.create({
      data: {
        envelopeId: envelope.id,
        signerId: firstSigner.id,
        type: SignatureFieldType.SIGNATURE,
        page: 1,
        x: 0.62,
        y: 0.82,
        w: 0.25,
        h: 0.06,
      },
    });
  }

  console.log('Seed complete:');
  console.log(`  org       ${org.slug} (${org.id})`);
  console.log(`  admin     ${admin.email} / ${adminPassword}`);
  console.log(`  member    ${member.email} / ${adminPassword}`);
  console.log(`  document  ${document.id}`);
  console.log(`  envelope  ${envelope.id}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
