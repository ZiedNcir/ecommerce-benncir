import assert from 'node:assert/strict';
import test from 'node:test';
import { requireEmail, requirePositiveInteger, requireText } from './validation.ts';

test('requireText rejects blank and overlong values', () => {
  assert.throws(() => requireText('   ', 'Nom'), /Nom/);
  assert.throws(() => requireText('12345', 'Message', { max: 4 }), /Message/);
  assert.equal(requireText('  Bên Ncîr  ', 'Nom', { max: 20 }), 'Bên Ncîr');
});

test('requireEmail normalizes valid addresses and rejects malformed ones', () => {
  assert.equal(requireEmail('  CUSTOMER@EXAMPLE.COM '), 'customer@example.com');
  assert.throws(() => requireEmail('invalid-email'), /email/i);
});

test('requirePositiveInteger rejects zero, fractions, and non-numeric values', () => {
  assert.equal(requirePositiveInteger('2', 'Quantité'), 2);
  assert.throws(() => requirePositiveInteger(0, 'Quantité'), /Quantité/);
  assert.throws(() => requirePositiveInteger(1.5, 'Quantité'), /Quantité/);
  assert.throws(() => requirePositiveInteger('many', 'Quantité'), /Quantité/);
});
