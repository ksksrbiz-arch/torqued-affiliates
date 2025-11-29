import dotenv from 'dotenv';
dotenv.config();

export const config = {
  PORT: process.env.PORT ? Number(process.env.PORT) : 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_SECRET: process.env.APP_SECRET || 'dev-secret',
  DATABASE_URL: process.env.DATABASE_URL || '',
  SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY || '',
  SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET || ''
};
