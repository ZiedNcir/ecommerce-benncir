import assert from 'node:assert/strict';
import test from 'node:test';
import { assertRuntimeConfig } from './runtime.ts';

const validEnvironment = {
  NODE_ENV: 'production',
  MONGO_URI: 'mongodb://localhost:27017/bencir',
  JWT_SECRET: 'a-production-secret-that-is-longer-than-thirty-two-characters',
  CLIENT_URL: 'https://shop.example.tn',
};

test('production configuration requires CLIENT_URL', () => {
  const environment = { ...validEnvironment, CLIENT_URL: '' };

  assert.throws(() => assertRuntimeConfig(environment), /CLIENT_URL/);
});

test('production configuration rejects placeholder JWT secrets', () => {
  const environment = { ...validEnvironment, JWT_SECRET: 'replace-with-a-long-random-secret' };

  assert.throws(() => assertRuntimeConfig(environment), /JWT_SECRET/);
});
