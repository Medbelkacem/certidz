import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';

/**
 * Global so any feature module (documents, signatures, certificates) can
 * inject StorageService without re-importing. ConfigModule is already global.
 */
@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
