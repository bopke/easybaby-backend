import {
  Injectable,
  UnauthorizedException,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { UsersService } from '../../users/services/users.service';
import {
  LoginDto,
  RegisterDto,
  AuthResponseDto,
  ResendVerificationEmailDto,
  VerifyEmailDto,
  RefreshTokenDto,
  SessionResponseDto,
} from '../dtos';
import { UserResponseDto } from '../../users/dtos';
import { JwtPayload } from '../strategies/jwt.strategy';
import { EmailService } from '../../email/services/email.service';
import { RefreshTokenService } from './refresh-token.service';
import { Paginated, Pagination } from '../../common/pagination';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly dataSource: DataSource,
  ) {}

  async login(
    loginDto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      iss: this.configService.get<string>('jwt.issuer'),
      aud: this.configService.get<string>('jwt.audience'),
    };

    const accessToken = this.jwtService.sign(payload);
    const expiresIn = this.configService.get<number>(
      'jwt.accessTokenExpiration',
    );

    // Generate refresh token
    const { token: refreshToken, expiresIn: refreshTokenExpiresIn } =
      await this.refreshTokenService.generateRefreshToken(
        user,
        ipAddress,
        userAgent,
      );

    this.logger.log(`User ${user.email} logged in successfully`);

    return new AuthResponseDto(
      accessToken,
      UserResponseDto.fromEntity(user),
      expiresIn,
      refreshToken,
      refreshTokenExpiresIn,
    );
  }

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    const user = await this.usersService.create({
      email: registerDto.email,
      password: registerDto.password,
    });

    try {
      await this.emailService.sendRegistrationEmail(user);
    } catch (emailError) {
      // If email fails, ensure user is deleted
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        await queryRunner.manager.delete('users', { id: user.id });
        await queryRunner.commitTransaction();
        this.logger.warn(
          `User ${user.email} creation rolled back due to email failure`,
        );
      } catch (deleteError) {
        await queryRunner.rollbackTransaction();
        const errorMessage =
          deleteError instanceof Error ? deleteError.message : 'Unknown error';
        this.logger.error(
          `CRITICAL: Failed to cleanup user ${user.id} after email failure: ${errorMessage}. Manual cleanup required.`,
        );
      } finally {
        await queryRunner.release();
      }

      throw emailError;
    }

    this.logger.log(
      `User ${user.email} registered successfully. Verification email sent.`,
    );

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await this.usersService.comparePasswords(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async resendVerificationEmail(
    dto: ResendVerificationEmailDto,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new NotFoundException('User with this email not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    await this.emailService.sendRegistrationEmail(user);

    this.logger.log(`Verification email resent to ${user.email} with new code`);

    return { message: 'Verification email has been sent successfully' };
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<{ message: string }> {
    const user = await this.usersService.verifyEmail(
      dto.email,
      dto.verificationCode,
    );

    if (!user) {
      throw new BadRequestException(
        'Invalid verification code or user not found',
      );
    }

    this.logger.log(`Email verified successfully for ${user.email}`);

    return { message: 'Email verified successfully' };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(
    dto: RefreshTokenDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    // Validate and rotate refresh token
    const user = await this.usersService.findOne(
      (
        await this.refreshTokenService.validateRefreshToken(
          dto.refreshToken,
          ipAddress,
          userAgent,
        )
      ).sub,
    );

    // Rotate the refresh token (issue new one, revoke old one)
    const { token: newRefreshToken, expiresIn: refreshTokenExpiresIn } =
      await this.refreshTokenService.rotateRefreshToken(
        dto.refreshToken,
        user,
        ipAddress,
        userAgent,
      );

    // Generate new access token
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      iss: this.configService.get<string>('jwt.issuer'),
      aud: this.configService.get<string>('jwt.audience'),
    };

    const accessToken = this.jwtService.sign(payload);
    const expiresIn = this.configService.get<number>(
      'jwt.accessTokenExpiration',
    );

    this.logger.log(`Tokens refreshed for user ${user.email}`);

    return new AuthResponseDto(
      accessToken,
      UserResponseDto.fromEntity(user),
      expiresIn,
      newRefreshToken,
      refreshTokenExpiresIn,
    );
  }

  /**
   * Logout from current session (revoke refresh token)
   */
  async logout(refreshToken: string): Promise<{ message: string }> {
    const payload =
      await this.refreshTokenService.validateRefreshToken(refreshToken);
    await this.refreshTokenService.revokeTokenByJti(payload.jti);

    this.logger.log(`User ${payload.sub} logged out from current session`);

    return { message: 'Logged out successfully' };
  }

  /**
   * Logout from all devices (revoke all refresh tokens)
   */
  async logoutAllDevices(userId: string): Promise<{ message: string }> {
    await this.refreshTokenService.revokeAllUserTokens(userId);

    this.logger.log(`User ${userId} logged out from all devices`);

    return { message: 'Logged out from all devices successfully' };
  }

  /**
   * Get all active sessions for a user with pagination, filtering, and ordering
   */
  async getSessions(
    userId: string,
    pagination: Pagination = { page: 1, limit: 10 },
    filters: {
      ipAddress?: string;
      userAgent?: string;
      tokenFamily?: string;
    } = {},
    ordering: { order?: string[] } = {},
  ): Promise<Paginated<SessionResponseDto>> {
    const result = await this.refreshTokenService.getUserSessions(
      userId,
      pagination,
      filters,
      ordering,
    );

    return {
      ...result,
      data: result.data.map((session) =>
        SessionResponseDto.fromEntity(session),
      ),
    };
  }
}
