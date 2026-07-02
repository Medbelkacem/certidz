import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditController } from './audit.controller';
import { AuditInterceptor } from './audit.interceptor';
import { AuditListener } from './audit.listener';
import { AuditService } from './audit.service';

@Global()
@Module({
  controllers: [AuditController],
  providers: [
    AuditService,
    AuditListener,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [AuditService],
})
export class AuditModule {}
