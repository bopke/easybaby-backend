import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticlesController } from './controllers';
import { ArticlesService } from './services';
import { Article, ArticleTag } from './entities';
import { PaginationService } from '../common/services/pagination.service';

@Module({
  imports: [TypeOrmModule.forFeature([Article, ArticleTag])],
  controllers: [ArticlesController],
  providers: [ArticlesService, PaginationService],
  exports: [ArticlesService],
})
export class ArticlesModule {}
