import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import type {
  AuthSession,
  AuthTokens,
} from '../../common/contracts/api.contracts.js';
import { RateLimit } from '../../common/rate-limit/rate-limit.decorator.js';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { Public } from './decorators/public.decorator.js';
import {
  ForgotPasswordDto,
  LoginDto,
  LogoutDto,
  RefreshDto,
  RegisterDto,
} from './dto/auth.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @RateLimit('strict')
  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered and logged in',
  })
  @ApiResponse({ status: 409, description: 'Email or username already taken' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
  ): Promise<AuthSession> {
    const ip = req.ip ?? req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.register(dto, ip, userAgent);
  }

  @Public()
  @RateLimit('strict')
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiResponse({ status: 200, description: 'Successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Account suspended' })
  @ApiResponse({ status: 429, description: 'Rate limited or locked out' })
  login(@Body() dto: LoginDto, @Req() req: Request): Promise<AuthSession> {
    const ip = req.ip ?? req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.login(dto, ip, userAgent);
  }

  @Public()
  @RateLimit('strict')
  @Post('demo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in as the seeded demo user' })
  @ApiResponse({ status: 200, description: 'Successfully logged in as demo' })
  @ApiResponse({ status: 403, description: 'Demo login disabled' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  loginAsDemo(@Req() req: Request): Promise<AuthSession> {
    const ip = req.ip ?? req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.loginAsDemo(ip, userAgent);
  }

  @Public()
  @RateLimit('strict')
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  @ApiResponse({ status: 200, description: 'Tokens successfully refreshed' })
  @ApiResponse({
    status: 401,
    description: 'Session expired or reuse detected',
  })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  refresh(@Body() dto: RefreshDto, @Req() req: Request): Promise<AuthTokens> {
    const ip = req.ip ?? req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.refresh(dto.refreshToken, ip, userAgent);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Log out and revoke refresh token' })
  @ApiResponse({ status: 204, description: 'Successfully logged out' })
  async logout(@Body() dto: LogoutDto): Promise<void> {
    await this.authService.logout(dto.refreshToken);
  }

  @Public()
  @RateLimit('strict')
  @Post('password/forgot')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Request password reset link' })
  @ApiResponse({
    status: 204,
    description: 'Password reset requested (always returns 204)',
  })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    await this.authService.requestPasswordReset(dto.email);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@CurrentUser() user: unknown): { user: unknown } {
    return { user };
  }
}
