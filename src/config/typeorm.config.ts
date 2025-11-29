import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const isProduction = configService.get<string>('nodeEnv') === 'production';

  // Environment-specific connection pool configuration
  const poolConfig = isProduction
    ? {
        max: 25, // Higher for production load
        min: 5,
        idleTimeoutMillis: 600000, // 10 minutes (connections are expensive)
        connectionTimeoutMillis: 10000,
        acquireTimeoutMillis: 60000,
      }
    : {
        max: 10, // Sufficient for development
        min: 2,
        idleTimeoutMillis: 300000, // 5 minutes
        connectionTimeoutMillis: 5000,
        acquireTimeoutMillis: 30000,
      };

  return {
    type: 'postgres',
    host: configService.get<string>('database.host'),
    port: configService.get<number>('database.port'),
    username: configService.get<string>('database.user'),
    password: configService.get<string>('database.password'),
    database: configService.get<string>('database.name'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    synchronize: false, // Always use migrations instead of synchronize
    migrationsRun: true, // Automatically run migrations on startup
    logging: configService.get<string>('nodeEnv') === 'development',
    extra: poolConfig,
  };
};
