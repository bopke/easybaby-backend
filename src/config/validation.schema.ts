import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
  PORT: Joi.number().required(),
  CORS_ORIGIN: Joi.string().required(),
  // Database configuration
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  // Database pool configuration
  DB_POOL_SIZE: Joi.number().required(),
  DB_POOL_MIN_SIZE: Joi.number().required(),
  DB_IDLE_TIMEOUT: Joi.number().required(),
  DB_CONNECTION_TIMEOUT: Joi.number().required(),
  DB_ACQUIRE_TIMEOUT: Joi.number().required(),
  // JWT configuration
  JWT_SECRET: Joi.string().required(),
  JWT_ISSUER: Joi.string().required(),
  JWT_AUDIENCE: Joi.string().required(),
  JWT_ACCESS_TOKEN_TTL: Joi.number().required(),
  REFRESH_TOKEN_SECRET: Joi.string().required(),
  JWT_REFRESH_TOKEN_TTL: Joi.number().required(),
  // Email configuration
  BREVO_API_KEY: Joi.string().required(),
  DEFAULT_SENDER_EMAIL: Joi.string().required(),
  DEFAULT_SENDER_NAME: Joi.string().required(),
  CONTACT_EMAIL: Joi.string().email().required(),
  // Turnstile configuration
  TURNSTILE_SECRET_KEY: Joi.string().required(),
  // Security configuration
  BCRYPT_SALT_ROUNDS: Joi.number().required(),
  // Rate limiting configuration
  THROTTLE_TTL: Joi.number().required(),
  THROTTLE_LIMIT: Joi.number().required(),
  SENSITIVE_THROTTLE_TTL: Joi.number().required(),
  SENSITIVE_THROTTLE_LIMIT: Joi.number().required(),
});
