import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the current user profile' })
  @ApiOkResponse({ description: 'Profile (without password hash)' })
  getMe(@CurrentUser() user: AuthUser) {
    return this.users.getProfile(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update profile (name, locale, timezone)' })
  updateMe(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.users.updateProfile(user.id, dto, { ip, userAgent });
  }

  @Get('me/sessions')
  @ApiOperation({ summary: 'List active sessions' })
  @ApiOkResponse({ description: 'Active sessions with the current one flagged' })
  listSessions(@CurrentUser() user: AuthUser) {
    return this.users.listSessions(user.id, user.sessionId);
  }

  @Delete('me/sessions/:sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'sessionId' })
  @ApiOperation({ summary: 'Revoke one of the current user sessions' })
  @ApiNoContentResponse()
  async revokeSession(
    @CurrentUser() user: AuthUser,
    @Param('sessionId') sessionId: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<void> {
    await this.users.revokeSession(user.id, sessionId, { ip, userAgent });
  }

  @Post('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Change password (argon2id); revokes all other sessions',
  })
  @ApiNoContentResponse()
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<void> {
    await this.users.changePassword(user.id, user.sessionId, dto, {
      ip,
      userAgent,
    });
  }
}
