import { MembershipRole } from '@prisma/client';

/**
 * Fine-grained, resource-scoped permissions. Values are stable `resource:action`
 * strings so they can be persisted (API-key scopes) and reasoned about in logs.
 * The `MembershipRole` → `Permission[]` matrix below is the single source of
 * truth for tenant RBAC; guards resolve a member's role and check membership.
 */
export enum Permission {
  DOCUMENTS_READ = 'documents:read',
  DOCUMENTS_WRITE = 'documents:write',
  DOCUMENTS_DELETE = 'documents:delete',

  ENVELOPES_READ = 'envelopes:read',
  ENVELOPES_SEND = 'envelopes:send',
  ENVELOPES_VOID = 'envelopes:void',

  CERTIFICATES_READ = 'certificates:read',
  CERTIFICATES_ISSUE = 'certificates:issue',
  CERTIFICATES_REVOKE = 'certificates:revoke',

  IDENTITY_READ = 'identity:read',
  IDENTITY_VERIFY = 'identity:verify',

  MEMBERS_READ = 'members:read',
  MEMBERS_MANAGE = 'members:manage',

  BILLING_READ = 'billing:read',
  BILLING_MANAGE = 'billing:manage',

  AUDIT_READ = 'audit:read',

  SETTINGS_MANAGE = 'settings:manage',
  ORG_MANAGE = 'org:manage',
}

/** Every permission the platform knows about — used to grant "full access". */
export const ALL_PERMISSIONS: Permission[] = Object.values(Permission);

const READ_ONLY: Permission[] = [
  Permission.DOCUMENTS_READ,
  Permission.ENVELOPES_READ,
  Permission.CERTIFICATES_READ,
  Permission.IDENTITY_READ,
  Permission.MEMBERS_READ,
  Permission.BILLING_READ,
  Permission.AUDIT_READ,
];

/**
 * Role → allowed permissions. OWNER/ADMIN are superusers; COMPLIANCE_OFFICER
 * owns the trust surface (certs, identity, audit); MANAGER runs day-to-day
 * signing and their team; MEMBER is a standard contributor; AUDITOR is
 * strictly read-only (segregation of duties for attestations).
 */
export const ROLE_PERMISSIONS: Record<MembershipRole, Permission[]> = {
  [MembershipRole.OWNER]: ALL_PERMISSIONS,

  [MembershipRole.ADMIN]: ALL_PERMISSIONS.filter(
    (p) => p !== Permission.ORG_MANAGE,
  ),

  [MembershipRole.COMPLIANCE_OFFICER]: [
    Permission.DOCUMENTS_READ,
    Permission.ENVELOPES_READ,
    Permission.ENVELOPES_VOID,
    Permission.CERTIFICATES_READ,
    Permission.CERTIFICATES_ISSUE,
    Permission.CERTIFICATES_REVOKE,
    Permission.IDENTITY_READ,
    Permission.IDENTITY_VERIFY,
    Permission.MEMBERS_READ,
    Permission.AUDIT_READ,
  ],

  [MembershipRole.MANAGER]: [
    Permission.DOCUMENTS_READ,
    Permission.DOCUMENTS_WRITE,
    Permission.DOCUMENTS_DELETE,
    Permission.ENVELOPES_READ,
    Permission.ENVELOPES_SEND,
    Permission.ENVELOPES_VOID,
    Permission.CERTIFICATES_READ,
    Permission.IDENTITY_READ,
    Permission.IDENTITY_VERIFY,
    Permission.MEMBERS_READ,
  ],

  [MembershipRole.MEMBER]: [
    Permission.DOCUMENTS_READ,
    Permission.DOCUMENTS_WRITE,
    Permission.ENVELOPES_READ,
    Permission.ENVELOPES_SEND,
    Permission.CERTIFICATES_READ,
  ],

  [MembershipRole.AUDITOR]: READ_ONLY,
};

/** Returns true when the given role is granted the permission. */
export function roleHasPermission(
  role: MembershipRole,
  permission: Permission,
): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Returns true when the role satisfies every required permission. */
export function roleHasAllPermissions(
  role: MembershipRole,
  required: Permission[],
): boolean {
  return required.every((p) => roleHasPermission(role, p));
}

/**
 * Privilege ordering used for role-change authorization: an actor may only
 * assign/modify roles strictly below their own rank (OWNER excepted, handled
 * explicitly), and can never elevate someone above themselves.
 */
export const ROLE_RANK: Record<MembershipRole, number> = {
  [MembershipRole.OWNER]: 100,
  [MembershipRole.ADMIN]: 80,
  [MembershipRole.COMPLIANCE_OFFICER]: 60,
  [MembershipRole.MANAGER]: 40,
  [MembershipRole.MEMBER]: 20,
  [MembershipRole.AUDITOR]: 10,
};
