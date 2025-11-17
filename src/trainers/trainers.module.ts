import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainersController } from './controllers';
import { TrainersService } from './services';
import { Trainer } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([Trainer])],
  controllers: [TrainersController],
  providers: [TrainersService],
  exports: [TrainersService],
})
export class TrainersModule {}
