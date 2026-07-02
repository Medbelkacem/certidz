import { MembershipRole } from '@prisma/client';
import { OrganizationsService } from './organizations.service';
import {
  Permission,
  ROLE_PERMISSIONS,
  roleHasAllPermissions,
  roleHasPermission,
} from './permissions';

describe('OrganizationsService — RBAC', () => {
  describe('role → permission resolution', () => {
    it('grants OWNER every permission', () => {
      for (const permission of Object.values(Permission)) {
        expect(roleHasPermission(MembershipRole.OWNER, permission)).toBe(true);
      }
    });

    it('restricts AUDITOR to read-only permissions', () => {
      expect(roleHasPermission(MembershipRole.AUDITOR, Permission.AUDIT_READ)).toBe(
        true,
      );
      expect(
        roleHasPermission(MembershipRole.AUDITOR, Permission.DOCUMENTS_READ),
      ).toBe(true);
      expect(
        roleHasPermission(MembershipRole.AUDITOR, Permission.DOCUMENTS_WRITE),
      ).toBe(false);
      expect(
        roleHasPermission(MembershipRole.AUDITOR, Permission.ENVELOPES_SEND),
      ).toBe(false);
      // No write/manage permission leaks into the auditor set.
      const writeish = ROLE_PERMISSIONS[MembershipRole.AUDITOR].filter((p) =>
        /:(write|send|void|issue|revoke|manage|verify)$/.test(p),
      );
      expect(writeish).toHaveLength(0);
    });

    it('lets COMPLIANCE_OFFICER issue and revoke certificates but not send envelopes', () => {
      expect(
        roleHasPermission(
          MembershipRole.COMPLIANCE_OFFICER,
          Permission.CERTIFICATES_ISSUE,
        ),
      ).toBe(true);
      expect(
        roleHasPermission(
          MembershipRole.COMPLIANCE_OFFICER,
          Permission.CERTIFICATES_REVOKE,
        ),
      ).toBe(true);
      expect(
        roleHasPermission(
          MembershipRole.COMPLIANCE_OFFICER,
          Permission.ENVELOPES_SEND,
        ),
      ).toBe(false);
    });

    it('lets MEMBER send envelopes but not manage members', () => {
      expect(
        roleHasPermission(MembershipRole.MEMBER, Permission.ENVELOPES_SEND),
      ).toBe(true);
      expect(
        roleHasPermission(MembershipRole.MEMBER, Permission.MEMBERS_MANAGE),
      ).toBe(false);
    });

    it('roleHasAllPermissions requires every permission', () => {
      expect(
        roleHasAllPermissions(MembershipRole.MANAGER, [
          Permission.DOCUMENTS_READ,
          Permission.ENVELOPES_SEND,
        ]),
      ).toBe(true);
      expect(
        roleHasAllPermissions(MembershipRole.MANAGER, [
          Permission.DOCUMENTS_READ,
          Permission.BILLING_MANAGE,
        ]),
      ).toBe(false);
    });

    it('defines a permission set for every role', () => {
      for (const role of Object.values(MembershipRole)) {
        expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true);
      }
    });
  });

  describe('canAssignRole — role-change authorization', () => {
    it('lets OWNER assign any role including OWNER', () => {
      expect(
        OrganizationsService.canAssignRole(
          MembershipRole.OWNER,
          MembershipRole.MEMBER,
          MembershipRole.OWNER,
        ),
      ).toBe(true);
    });

    it('forbids non-owners from creating owners', () => {
      expect(
        OrganizationsService.canAssignRole(
          MembershipRole.ADMIN,
          MembershipRole.MEMBER,
          MembershipRole.OWNER,
        ),
      ).toBe(false);
    });

    it('lets ADMIN promote a MEMBER to MANAGER', () => {
      expect(
        OrganizationsService.canAssignRole(
          MembershipRole.ADMIN,
          MembershipRole.MEMBER,
          MembershipRole.MANAGER,
        ),
      ).toBe(true);
    });

    it('forbids an actor from modifying a peer or superior', () => {
      // MANAGER cannot touch an ADMIN…
      expect(
        OrganizationsService.canAssignRole(
          MembershipRole.MANAGER,
          MembershipRole.ADMIN,
          MembershipRole.MEMBER,
        ),
      ).toBe(false);
      // …nor another MANAGER (peer).
      expect(
        OrganizationsService.canAssignRole(
          MembershipRole.MANAGER,
          MembershipRole.MANAGER,
          MembershipRole.MEMBER,
        ),
      ).toBe(false);
    });

    it('forbids elevating a member above the actor', () => {
      expect(
        OrganizationsService.canAssignRole(
          MembershipRole.MANAGER,
          MembershipRole.MEMBER,
          MembershipRole.ADMIN,
        ),
      ).toBe(false);
    });
  });
});
