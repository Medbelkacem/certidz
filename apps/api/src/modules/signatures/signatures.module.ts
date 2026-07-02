import { Module } from '@nestjs/common';
import { CertificatesModule } from '../certificates/certificates.module';
import { StorageModule } from '../storage/storage.module';
import { SignaturesController } from './signatures.controller';
import { SignaturesService } from './signatures.service';

/**
 * Digital signing (hash + detached CMS) and verification. Depends on the PKI
 * (CaService for issuance/chain, CertificatesService for revocation) and on
 * StorageService for the document bytes. SignaturesService is exported for the
 * envelopes module to invoke when a signer signs.
 */
@Module({
  imports: [CertificatesModule, StorageModule],
  controllers: [SignaturesController],
  providers: [SignaturesService],
  exports: [SignaturesService],
})
export class SignaturesModule {}
