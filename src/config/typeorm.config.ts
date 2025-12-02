import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const poolConfig = {
    max: configService.get<number>('database.pool.size') || 10,
    min: configService.get<number>('database.pool.minSize') || 5,
    idleTimeoutMillis:
      configService.get<number>('database.pool.idleTimeout') || 600000,
    connectionTimeoutMillis:
      configService.get<number>('database.pool.connectionTimeout') || 10000,
    acquireTimeoutMillis:
      configService.get<number>('database.pool.acquireTimeout') || 60000,
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
    synchronize: false,
    migrationsRun: true, // Automatically run migrations on startup
    logging: configService.get<string>('nodeEnv') === 'development',
    extra: poolConfig,
  };
};
