import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateOrderTotals, canRestoreStock } from './orderRules.ts';

test('calculateOrderTotals derives subtotal and total from trusted item values', () => {
  assert.deepEqual(calculateOrderTotals([{ price: 19.9, quantity: 2 }, { price: 5, quantity: 1 }], 7), {
    subtotal: 44.8,
    total: 51.8,
  });
});

test('calculateOrderTotals rejects invalid item values', () => {
  assert.throws(() => calculateOrderTotals([{ price: 10, quantity: 0 }], 7), /quantity/i);
  assert.throws(() => calculateOrderTotals([{ price: -1, quantity: 1 }], 7), /price/i);
});

test('canRestoreStock is false once an order has been restored', () => {
  assert.equal(canRestoreStock({ stockRestored: false }), true);
  assert.equal(canRestoreStock({ stockRestored: true }), false);
  assert.equal(canRestoreStock({}), true);
});
