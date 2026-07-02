import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard for the passport "local" (email/password) strategy. Pair with
 * {@link LocalStrategy} on a login route to populate `request.user` with the
 * verified user before the handler runs.
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
