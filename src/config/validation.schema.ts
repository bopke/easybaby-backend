import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_HOST: Joi.string().optional(),
  DATABASE_PORT: Joi.number().optional(),
  DATABASE_USER: Joi.string().optional(),
  DATABASE_PASSWORD: Joi.string().optional(),
  DATABASE_NAME: Joi.string().optional(),
  JWT_SECRET: Joi.string().optional(),
});
