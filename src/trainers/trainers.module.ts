import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainersController } from './controllers';
import { TrainersService } from './services';
import { Trainer } from './entities';
import { PaginationService } from '../common/services/pagination.service';

@Module({
  imports: [TypeOrmModule.forFeature([Trainer])],
  controllers: [TrainersController],
  providers: [TrainersService, PaginationService],
  exports: [TrainersService],
})
export class TrainersModule {}
