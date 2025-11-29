import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  CORS_ORIGIN: Joi.string().required(),
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_NAME: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_ISSUER: Joi.string().optional(),
  JWT_AUDIENCE: Joi.string().optional(),
  JWT_ACCESS_TOKEN_TTL: Joi.number().optional().default(3600),
  REFRESH_TOKEN_SECRET: Joi.string().optional(),
  JWT_REFRESH_TOKEN_TTL: Joi.number().optional().default(2592000),
  BREVO_API_KEY: Joi.string().optional(),
  DEFAULT_SENDER_EMAIL: Joi.string().optional(),
  DEFAULT_SENDER_NAME: Joi.string().optional(),
  CONTACT_EMAIL: Joi.string().email().optional(),
  TURNSTILE_SECRET_KEY: Joi.string().optional(),
});
