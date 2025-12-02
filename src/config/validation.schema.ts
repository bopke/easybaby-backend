import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  CORS_ORIGIN: Joi.string().required(),
  // Database configuration
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  // Database pool configuration
  DB_POOL_SIZE: Joi.number().optional().default(10),
  DB_POOL_MIN_SIZE: Joi.number().optional().default(5),
  DB_IDLE_TIMEOUT: Joi.number().optional().default(600000),
  DB_CONNECTION_TIMEOUT: Joi.number().optional().default(10000),
  DB_ACQUIRE_TIMEOUT: Joi.number().optional().default(60000),
  // JWT configuration
  JWT_SECRET: Joi.string().required(),
  JWT_ISSUER: Joi.string().optional(),
  JWT_AUDIENCE: Joi.string().optional(),
  JWT_ACCESS_TOKEN_TTL: Joi.number().optional().default(3600),
  REFRESH_TOKEN_SECRET: Joi.string().optional(),
  JWT_REFRESH_TOKEN_TTL: Joi.number().optional().default(2592000),
  // Email configuration
  BREVO_API_KEY: Joi.string().optional(),
  DEFAULT_SENDER_EMAIL: Joi.string().optional(),
  DEFAULT_SENDER_NAME: Joi.string().optional(),
  CONTACT_EMAIL: Joi.string().email().optional(),
  // Turnstile configuration
  TURNSTILE_SECRET_KEY: Joi.string().optional(),
  // Security configuration
  BCRYPT_SALT_ROUNDS: Joi.number().optional().default(10),
  // Rate limiting configuration
  THROTTLE_TTL: Joi.number().optional().default(60000),
  THROTTLE_LIMIT: Joi.number().optional().default(60),
  SENSITIVE_THROTTLE_TTL: Joi.number().optional().default(3600000),
  SENSITIVE_THROTTLE_LIMIT: Joi.number().optional().default(3),
});
