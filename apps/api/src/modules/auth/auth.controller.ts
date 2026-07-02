import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { AuthUser } from './auth.types';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { TotpEnrollmentResponse, VerifyTotpDto } from './dto/mfa.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { MfaService } from './mfa.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mfaService: MfaService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Create an account (argon2id password hashing)' })
  @ApiCreatedResponse({ description: 'Account created' })
  register(
    @Body() dto: RegisterDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.register(dto, { ip, userAgent });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Login with email/password (+ TOTP code when MFA is enrolled)',
  })
  @ApiOkResponse({
    description:
      'Token pair + user profile, or { mfaRequired: true } when a TOTP code must be supplied',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.login(dto, { ip, userAgent });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary:
      'Rotate the refresh token (single-use; replaying a rotated token revokes the whole session)',
  })
  @ApiOkResponse({ description: 'New access + refresh token pair' })
  @ApiUnauthorizedResponse({
    description: 'Invalid, expired or reused refresh token',
  })
  refresh(
    @Body() dto: RefreshDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.refresh(dto.refreshToken, { ip, userAgent });
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke the current session and its tokens' })
  async logout(@CurrentUser() user: AuthUser): Promise<void> {
    await this.authService.logout(user.id, user.sessionId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current token principal' })
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }

  @Post('mfa/totp/enroll')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start TOTP enrollment (returns otpauth:// URI)' })
  @ApiCreatedResponse({ type: TotpEnrollmentResponse })
  enrollTotp(@CurrentUser() user: AuthUser): Promise<TotpEnrollmentResponse> {
    return this.mfaService.enrollTotp(user.id, user.email);
  }

  @Post('mfa/totp/verify')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm TOTP enrollment with a first valid code' })
  async verifyTotp(
    @CurrentUser() user: AuthUser,
    @Body() dto: VerifyTotpDto,
  ): Promise<void> {
    await this.mfaService.verifyEnrollment(user.id, dto.code);
  }
}
