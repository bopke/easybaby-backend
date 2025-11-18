import {
  Injectable,
  UnauthorizedException,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/services/users.service';
import {
  LoginDto,
  RegisterDto,
  AuthResponseDto,
  ResendVerificationEmailDto,
} from '../dtos';
import { UserResponseDto } from '../../users/dtos';
import { JwtPayload } from '../strategies/jwt.strategy';
import { EmailService } from '../../email/services/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
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
    const expiresIn = 3600; // 1 hour

    this.logger.log(`User ${user.email} logged in successfully`);

    return new AuthResponseDto(
      accessToken,
      UserResponseDto.fromEntity(user),
      expiresIn,
    );
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const user = await this.usersService.create({
      email: registerDto.email,
      password: registerDto.password,
    });

    try {
      await this.emailService.sendRegistrationEmail(user);
    } catch (error) {
      // Do not create users with unsent email
      await this.usersService.remove(user.id);
      throw error;
    }
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      iss: this.configService.get<string>('jwt.issuer'),
      aud: this.configService.get<string>('jwt.audience'),
    };

    const accessToken = this.jwtService.sign(payload);
    const expiresIn = 3600; // 1 hour

    this.logger.log(`User ${user.email} registered successfully`);

    return new AuthResponseDto(
      accessToken,
      UserResponseDto.fromEntity(user),
      expiresIn,
    );
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
}
