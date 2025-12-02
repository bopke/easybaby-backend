import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';
import { getTypeOrmConfig } from './config/typeorm.config';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { EmailModule } from './email/email.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard, RolesGuard } from './auth/guards';
import { TrainersModule } from './trainers/trainers.module';
import { ContactUsModule } from './contact_us/contact_us.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
      validationSchema: validationSchema,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getTypeOrmConfig(configService),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          limit: configService.get<number>('throttle.limit') || 60,
          ttl: configService.get<number>('throttle.ttl') || 60000,
        },
      ],
    }),
    ScheduleModule.forRoot(),
    HealthModule,
    UsersModule,
    EmailModule,
    AuthModule,
    TrainersModule,
    ContactUsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
