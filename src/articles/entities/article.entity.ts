import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('articles')
export class Article {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  slug: string;

  @Column()
  metaTitle: string;

  @Column()
  metaDescription: string;

  @Column()
  header: string;

  @Column()
  subheader: string;

  @Column('text')
  contents: string;

  @Column()
  @Index()
  author: string;

  @Column()
  @Index()
  publishedDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
