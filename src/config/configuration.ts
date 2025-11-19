export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
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
    issuer: process.env.JWT_ISSUER || 'workshops-api',
    audience: process.env.JWT_AUDIENCE || 'workshops-api',
  },
  refreshToken: {
    secret: process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
  },
  email: {
    brevoApiKey: process.env.BREVO_API_KEY,
    defaultSenderEmail: process.env.DEFAULT_SENDER_EMAIL,
    defaultSenderName: process.env.DEFAULT_SENDER_NAME,
  },
});
