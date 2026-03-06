export const env = {
  server: {
    port: Number(process.env.PORT || process.env.BACKEND_PORT || 5000),
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || process.env.POSTGRES_DB || 'saas_db',
    user: process.env.DB_USER || process.env.POSTGRES_USER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'postgres',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev_jwt_secret_key_32_chars_min',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};
