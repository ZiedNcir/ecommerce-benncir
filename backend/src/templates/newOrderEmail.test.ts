import assert from 'node:assert/strict';
import test from 'node:test';
import { renderNewOrderEmail } from './newOrderEmail.ts';

test('new order email renders order data and escapes customer content', () => {
  const html = renderNewOrderEmail({
    orderNumber: 'BNC-TEST-100',
    customer: { fullName: '<Admin>', phone: '24 000 000', email: 'client@example.com', address: 'Tunis', city: 'Tunis' },
    items: [{ name: 'Produit <test>', quantity: 2, price: 10 }],
    subtotal: 20,
    deliveryFee: 8,
    total: 28,
  }, 'https://benncircommerce.com/admin/orders/100');

  assert.match(html, /BNC-TEST-100/);
  assert.match(html, /28\.00 DT/);
  assert.match(html, /8\.00 DT/);
  assert.match(html, /&lt;Admin&gt;/);
  assert.match(html, /Produit &lt;test&gt;/);
  assert.doesNotMatch(html, /<Admin>/);
});
