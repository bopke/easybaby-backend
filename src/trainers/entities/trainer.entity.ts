import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('trainers')
export class Trainer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  name: string;

  @Column()
  @Index()
  voivodeship: string;

  @Column()
  @Index()
  city: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  site?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  additionalOffer?: string;

  @Column()
  isVerified: boolean;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
