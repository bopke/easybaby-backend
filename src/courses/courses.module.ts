import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesController } from './controllers/courses.controller';
import { CoursesService } from './services/courses.service';
import { Course } from './entities/course.entity';
import { PaginationService } from '../common/services/pagination.service';

@Module({
  imports: [TypeOrmModule.forFeature([Course])],
  controllers: [CoursesController],
  providers: [CoursesService, PaginationService],
  exports: [CoursesService],
})
export class CoursesModule {}
