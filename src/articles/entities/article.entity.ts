import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ArticleTag } from './tag.entity';

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

  @OneToMany(() => ArticleTag, (tag) => tag.article, {
    cascade: true,
    eager: true,
  })
  tags: ArticleTag[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
