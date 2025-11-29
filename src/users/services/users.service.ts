import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { CreateUserDto, UpdateUserDto } from '../dtos';
import { UserRole } from '../entities/enums';
import { generateVerificationCode } from '../utils';

@Injectable()
export class UsersService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      this.SALT_ROUNDS,
    );

    const verificationCodeExpires = new Date();
    verificationCodeExpires.setHours(verificationCodeExpires.getHours() + 24); // 24 hours from now

    const user = this.usersRepository.create({
      email: createUserDto.email,
      password: hashedPassword,
      role: UserRole.NORMAL,
      emailVerificationCode: generateVerificationCode(),
      emailVerificationCodeExpires: verificationCodeExpires,
      isEmailVerified: false,
    });

    return this.usersRepository.save(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, { where: { id } });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      if (updateUserDto.email && updateUserDto.email !== user.email) {
        const existingUser = await queryRunner.manager.findOne(User, {
          where: { email: updateUserDto.email },
        });

        if (existingUser) {
          throw new ConflictException('User with this email already exists');
        }
      }

      const updateData: Partial<User> = { ...updateUserDto };

      if (updateUserDto.password) {
        updateData.password = await bcrypt.hash(
          updateUserDto.password,
          this.SALT_ROUNDS,
        );
      }

      Object.assign(user, updateData);
      const updatedUser = await queryRunner.manager.save(user);

      await queryRunner.commitTransaction();

      return updatedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async comparePasswords(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async verifyEmail(
    email: string,
    verificationCode: string,
  ): Promise<User | null> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { email },
      });

      if (!user) {
        await queryRunner.rollbackTransaction();
        return null;
      }

      if (user.emailVerificationCode !== verificationCode) {
        await queryRunner.rollbackTransaction();
        return null;
      }

      if (
        user.emailVerificationCodeExpires &&
        user.emailVerificationCodeExpires < new Date()
      ) {
        await queryRunner.rollbackTransaction();
        return null;
      }

      user.isEmailVerified = true;
      const verifiedUser = await queryRunner.manager.save(user);

      await queryRunner.commitTransaction();

      return verifiedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
