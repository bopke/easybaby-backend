import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactUsController } from './controllers/contact_us.controller';
import { ContactUsService } from './services/contact_us.service';
import { EmailModule } from '../email/email.module';
import { ContactUs } from './entities';
import { TurnstileService } from '../common/services/turnstile.service';

@Module({
  imports: [TypeOrmModule.forFeature([ContactUs]), EmailModule],
  controllers: [ContactUsController],
  providers: [ContactUsService, TurnstileService],
})
export class ContactUsModule {}
