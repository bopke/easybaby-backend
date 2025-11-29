import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Not a part of NestJS setup, so envvars loaded directly
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

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

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false, // Never use synchronize with migrations
  logging: process.env.NODE_ENV === 'development',
  extra: poolConfig,
});
