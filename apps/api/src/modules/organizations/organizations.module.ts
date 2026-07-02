import { Module } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { PermissionsGuard } from './guards/permissions.guard';
import { TenantGuard } from './guards/tenant.guard';

/**
 * Multi-tenancy + RBAC. Guards (TenantGuard, PermissionsGuard) are exported so
 * feature modules can compose them; they depend only on the global
 * PrismaModule and Reflector, so `@UseGuards(...)` works anywhere.
 */
@Module({
  controllers: [OrganizationsController],
  providers: [OrganizationsService, TenantGuard, PermissionsGuard],
  exports: [OrganizationsService, TenantGuard, PermissionsGuard],
})
export class OrganizationsModule {}
