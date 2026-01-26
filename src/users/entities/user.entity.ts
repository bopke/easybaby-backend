import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { UserRole } from './enums';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  @Index()
  id: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.NORMAL,
  })
  role: UserRole;

  @Column()
  emailVerificationCode: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  emailVerificationCodeExpires: Date | null;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  imageUrl?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
