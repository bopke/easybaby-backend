import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const poolConfig = {
    max: configService.get<number>('database.pool.size')!,
    min: configService.get<number>('database.pool.minSize')!,
    idleTimeoutMillis: configService.get<number>('database.pool.idleTimeout')!,
    connectionTimeoutMillis: configService.get<number>(
      'database.pool.connectionTimeout',
    )!,
    acquireTimeoutMillis: configService.get<number>(
      'database.pool.acquireTimeout',
    )!,
  };

  return {
    type: 'postgres',
    host: configService.get<string>('database.host')!,
    port: configService.get<number>('database.port')!,
    username: configService.get<string>('database.user')!,
    password: configService.get<string>('database.password')!,
    database: configService.get<string>('database.name')!,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    synchronize: false,
    migrationsRun: true,
    logging: configService.get<string>('nodeEnv') === 'development',
    extra: poolConfig,
  };
};
