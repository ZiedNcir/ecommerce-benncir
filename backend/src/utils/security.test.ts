import assert from 'node:assert/strict';
import test from 'node:test';
import { escapeRegex } from './security.ts';

test('escapeRegex treats regex metacharacters as literal text', () => {
  const pattern = new RegExp(escapeRegex('phone+ (sale) [2026]')).toString();

  assert.equal(pattern, '/phone\\+ \\(sale\\) \\[2026\\]/');
});
