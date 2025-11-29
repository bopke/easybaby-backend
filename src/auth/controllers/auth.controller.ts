import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  Ip,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from '../services/auth.service';
import {
  LoginDto,
  RegisterDto,
  AuthResponseDto,
  ResendVerificationEmailDto,
  VerifyEmailDto,
  RefreshTokenDto,
  SessionResponseDto,
  SessionQueryDto,
} from '../dtos';
import { Paginated } from '../../common/pagination';
import { Public } from '../guards';
import { CurrentUser, type JwtUser } from '../decorators';

@ApiTags('Authentication')
@ApiExtraModels(SessionResponseDto)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({
    status: 201,
    description: 'Registration successful. Verification email sent.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'Registration successful. Please check your email to verify your account.',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists',
  })
  // TODO: CAPTCHA FOR REGISTERS
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<{ message: string }> {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ipAddress: string,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    const userAgent = req.headers['user-agent'];
    return this.authService.login(loginDto, ipAddress, userAgent);
  }

  @Public()
  @Post('resend-verification-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification' })
  @ApiResponse({
    status: 200,
    description: 'Verification email sent successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Verification email has been sent successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Email is already verified',
  })
  @ApiResponse({
    status: 404,
    description: 'User with this email not found',
  })
  async resendVerificationEmail(
    @Body() dto: ResendVerificationEmailDto,
  ): Promise<{ message: string }> {
    return this.authService.resendVerificationEmail(dto);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address' })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Email verified successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid verification code or user not found',
  })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<{ message: string }> {
    return this.authService.verifyEmail(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  async refreshTokens(
    @Body() dto: RefreshTokenDto,
    @Ip() ipAddress: string,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    const userAgent = req.headers['user-agent'];
    return this.authService.refreshTokens(dto, ipAddress, userAgent);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout from current session' })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Logged out successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid refresh token',
  })
  async logout(@Body() dto: RefreshTokenDto): Promise<{ message: string }> {
    return this.authService.logout(dto.refreshToken);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiResponse({
    status: 200,
    description: 'Logged out from all devices successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Logged out from all devices successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async logoutAllDevices(
    @CurrentUser() user: JwtUser,
  ): Promise<{ message: string }> {
    return this.authService.logoutAllDevices(user.id);
  }

  @Get('sessions')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Get all active sessions for current user with optional filtering, ordering, and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of sessions matching the filters and ordering',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(SessionResponseDto) },
        },
        total: {
          type: 'number',
          description: 'Total number of sessions matching the filters',
          example: 5,
        },
        page: {
          type: 'number',
          description: 'Current page number',
          example: 1,
        },
        limit: {
          type: 'number',
          description: 'Number of items per page',
          example: 10,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getSessions(
    @CurrentUser() user: JwtUser,
    @Query() query: SessionQueryDto,
  ): Promise<Paginated<SessionResponseDto>> {
    const { page = 1, limit = 10, order, ...filters } = query;

    return this.authService.getSessions(
      user.id,
      { page, limit },
      filters,
      { order },
    );
  }
}
