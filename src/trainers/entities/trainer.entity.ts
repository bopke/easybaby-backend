import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('trainers')
// TODO: Discuss what really is nullable and what information should be stored
export class Trainer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  level: string;

  @Column()
  voivodeship: string;

  @Column()
  city: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  site?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  additionalOffer?: string;

  @Column({ nullable: true })
  expirationDate?: Date;

  @Column({ nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
