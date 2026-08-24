import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  // Database
  DATABASE_URL: z.string().default('postgresql://user:password@localhost:5432/healthcare_db?schema=public'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 chars').default('default_jwt_access_secret_for_development_min_32_chars'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 chars').default('default_jwt_refresh_secret_for_development_min_32_chars'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Encryption
  DATA_ENCRYPTION_KEY: z.string().default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),

  // LLM
  LLM_PROVIDER: z.enum(['gemini', 'mock']).default('gemini'),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),

  // Google Calendar OAuth
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  GOOGLE_REDIRECT_URI: z.string().default('http://localhost:5000/api/calendar/callback'),

  // Email
  EMAIL_PROVIDER: z.enum(['smtp', 'mock']).default('smtp'),
  SMTP_HOST: z.string().default('smtp.ethereal.email'),
  SMTP_PORT: z.string().default('587').transform((val) => parseInt(val, 10)),
  SMTP_SECURE: z.string().default('false').transform((val) => val === 'true'),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  EMAIL_FROM: z.string().default('"Healthcare Clinic" <no-reply@healthcareclinic.com>'),

  // Business Rules
  SLOT_HOLD_DURATION_MINUTES: z.string().default('5').transform((val) => parseInt(val, 10)),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:\n', result.error.format());
    // In production, exit immediately; in development, use validated defaults
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  return result.success ? result.data : envSchema.parse({});
};

export const env = parseEnv();
