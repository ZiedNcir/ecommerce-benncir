import { isPlaceholderSecret } from '../utils/security.ts';

export function isProduction(env: NodeJS.ProcessEnv): boolean {
  return env.NODE_ENV === 'production';
}

export function assertRuntimeConfig(env: NodeJS.ProcessEnv) {
  const mongoUri = String(env.MONGO_URI || '').trim();
  const jwtSecret = String(env.JWT_SECRET || '').trim();
  const clientUrl = String(env.CLIENT_URL || '').trim();
  const missing: string[] = [];

  if (!mongoUri) missing.push('MONGO_URI');
  if (!jwtSecret) missing.push('JWT_SECRET');
  if (isProduction(env) && !clientUrl) missing.push('CLIENT_URL');
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`);

  if (isProduction(env) && (jwtSecret.length < 32 || isPlaceholderSecret(jwtSecret))) {
    throw new Error('JWT_SECRET must be a random secret with at least 32 characters in production');
  }

  return { mongoUri, jwtSecret, clientUrl };
}
