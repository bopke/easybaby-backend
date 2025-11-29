export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  cors: {
    origin: process.env.CORS_ORIGIN,
  },
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    name: process.env.DATABASE_NAME,
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
});
