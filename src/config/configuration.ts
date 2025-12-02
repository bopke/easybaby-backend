export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  cors: {
    origin: process.env.CORS_ORIGIN,
  },
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
    pool: {
      size: parseInt(process.env.DB_POOL_SIZE || '10', 10),
      minSize: parseInt(process.env.DB_POOL_MIN_SIZE || '5', 10),
      idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '600000', 10),
      connectionTimeout: parseInt(
        process.env.DB_CONNECTION_TIMEOUT || '10000',
        10,
      ),
      acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000', 10),
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    issuer: process.env.JWT_ISSUER || 'easybaby-api',
    audience: process.env.JWT_AUDIENCE || 'easybaby-api',
    accessTokenExpiration: parseInt(
      process.env.JWT_ACCESS_TOKEN_TTL || '3600',
      10,
    ), // 1 hour default
  },
  refreshToken: {
    secret: process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
    expiration: parseInt(process.env.JWT_REFRESH_TOKEN_TTL || '2592000', 10), // 30 days default
  },
  email: {
    brevoApiKey: process.env.BREVO_API_KEY,
    defaultSenderEmail: process.env.DEFAULT_SENDER_EMAIL,
    defaultSenderName: process.env.DEFAULT_SENDER_NAME,
    contactEmail: process.env.CONTACT_EMAIL,
  },
  turnstile: {
    secretKey: process.env.TURNSTILE_SECRET_KEY,
  },
  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  },
  throttle: {
    // Global rate limiting
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10), // 1 minute
    limit: parseInt(process.env.THROTTLE_LIMIT || '60', 10), // 60 requests per TTL
    // Sensitive endpoints rate limiting (contact form, etc.)
    sensitiveTtl: parseInt(process.env.SENSITIVE_THROTTLE_TTL || '3600000', 10), // 1 hour
    sensitiveLimit: parseInt(process.env.SENSITIVE_THROTTLE_LIMIT || '3', 10), // 3 requests per TTL
  },
});
