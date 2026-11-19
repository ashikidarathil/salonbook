import dotenv from 'dotenv';
import { SignOptions } from 'jsonwebtoken';

const envFile = process.env.NODE_ENV === 'docker' ? '.env.docker' : '.env.local';

dotenv.config({ path: envFile });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is missing`);
  }
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'local',
  PORT: process.env.PORT || '5001',
  MONGODB_URI: requireEnv('MONGODB_URI'),
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_SECRET: requireEnv('JWT_SECRET'),
  GOOGLE_CLIENT_ID: requireEnv('GOOGLE_CLIENT_ID'),
  ACCESS_TOKEN_SECRET: requireEnv('ACCESS_TOKEN_SECRET'),
  REFRESH_TOKEN_SECRET: requireEnv('REFRESH_TOKEN_SECRET'),
  ACCESS_TOKEN_EXPIRES: process.env.ACCESS_TOKEN_EXPIRES as SignOptions['expiresIn'],
  REFRESH_TOKEN_EXPIRES: process.env.REFRESH_TOKEN_EXPIRES as SignOptions['expiresIn'],
  FRONTEND_ORIGIN: requireEnv('FRONTEND_ORIGIN'),
  // Set only when frontend and API share a custom domain (e.g. .salonbook.online)
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,

  SMTP_HOST: requireEnv('SMTP_HOST'),
  SMTP_PORT: requireEnv('SMTP_PORT'),
  SMTP_USER: requireEnv('SMTP_USER'),
  SMTP_PASS: requireEnv('SMTP_PASS'),
  SMTP_FROM: requireEnv('SMTP_FROM'),
  TWILIO_ACCOUNT_SID: requireEnv('TWILIO_ACCOUNT_SID'),
  TWILIO_AUTH_TOKEN: requireEnv('TWILIO_AUTH_TOKEN'),
  TWILIO_PHONE_NUMBER: requireEnv('TWILIO_PHONE_NUMBER'),
  CLOUDINARY_CLOUD_NAME: requireEnv('CLOUDINARY_CLOUD_NAME'),
  CLOUDINARY_API_KEY: requireEnv('CLOUDINARY_API_KEY'),
  CLOUDINARY_API_SECRET: requireEnv('CLOUDINARY_API_SECRET'),
  CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER || 'saloon-booking',
  RAZORPAY_KEY_ID: requireEnv('RAZORPAY_KEY_ID'),
  RAZORPAY_KEY_SECRET: requireEnv('RAZORPAY_KEY_SECRET'),
};
