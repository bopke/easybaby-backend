import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticlesController } from './controllers';
import { ArticlesService } from './services';
import { Article } from './entities';
import { PaginationService } from '../common/services/pagination.service';

@Module({
  imports: [TypeOrmModule.forFeature([Article])],
  controllers: [ArticlesController],
  providers: [ArticlesService, PaginationService],
  exports: [ArticlesService],
})
export class ArticlesModule {}
