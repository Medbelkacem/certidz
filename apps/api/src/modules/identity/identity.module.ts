import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env';
import { IdentityController } from './identity.controller';
import { IdentityService } from './identity.service';
import { IDENTITY_PROVIDER_ADAPTER } from './providers/identity-provider.interface';
import { MockIdentityProvider } from './providers/mock-identity.provider';

@Module({
  controllers: [IdentityController],
  providers: [
    IdentityService,
    MockIdentityProvider,
    {
      // Select the identity provider from config (only "mock" ships today).
      provide: IDENTITY_PROVIDER_ADAPTER,
      inject: [ConfigService, MockIdentityProvider],
      useFactory: (
        config: ConfigService<Env, true>,
        mock: MockIdentityProvider,
      ) => {
        const provider = config.get('IDENTITY_PROVIDER', { infer: true });
        switch (provider) {
          case 'mock':
          default:
            return mock;
        }
      },
    },
  ],
  exports: [IdentityService],
})
export class IdentityModule {}
