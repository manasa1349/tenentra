export const env = {
  server: {
    port: Number(process.env.BACKEND_PORT) || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev_jwt_secret_key_32_chars_min',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  frontendUrl: process.env.FRONTEND_URL,
};