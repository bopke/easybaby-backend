export default () => ({
  nodeEnv: process.env.NODE_ENV!,
  port: parseInt(process.env.PORT!, 10),
  cors: {
    origin: process.env.CORS_ORIGIN!,
  },
  database: {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!, 10),
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    name: process.env.DB_NAME!,
    pool: {
      size: parseInt(process.env.DB_POOL_SIZE!, 10),
      minSize: parseInt(process.env.DB_POOL_MIN_SIZE!, 10),
      idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT!, 10),
      connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT!, 10),
      acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT!, 10),
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
    issuer: process.env.JWT_ISSUER!,
    audience: process.env.JWT_AUDIENCE!,
    accessTokenExpiration: parseInt(process.env.JWT_ACCESS_TOKEN_TTL!, 10),
  },
  refreshToken: {
    secret: process.env.REFRESH_TOKEN_SECRET!,
    expiration: parseInt(process.env.JWT_REFRESH_TOKEN_TTL!, 10),
  },
  email: {
    brevoApiKey: process.env.BREVO_API_KEY!,
    defaultSenderEmail: process.env.DEFAULT_SENDER_EMAIL!,
    defaultSenderName: process.env.DEFAULT_SENDER_NAME!,
    contactEmail: process.env.CONTACT_EMAIL!,
  },
  turnstile: {
    secretKey: process.env.TURNSTILE_SECRET_KEY!,
  },
  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS!, 10),
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL!, 10),
    limit: parseInt(process.env.THROTTLE_LIMIT!, 10),
    sensitiveTtl: parseInt(process.env.SENSITIVE_THROTTLE_TTL!, 10),
    sensitiveLimit: parseInt(process.env.SENSITIVE_THROTTLE_LIMIT!, 10),
  },
});
