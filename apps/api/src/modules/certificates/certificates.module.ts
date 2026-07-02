import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { CaService } from './ca.service';
import { CertificatesController } from './certificates.controller';
import { CertificatesService } from './certificates.service';

/**
 * PKI: software dev CA + certificate lifecycle (issue/revoke/status).
 * CertificatesService is exported so the signatures module can consult
 * revocation state during verification.
 */
@Module({
  imports: [StorageModule],
  controllers: [CertificatesController],
  providers: [CaService, CertificatesService],
  exports: [CertificatesService, CaService],
})
export class CertificatesModule {}
