type OrderRuleItem = { price: number; quantity: number };

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateOrderTotals(items: OrderRuleItem[], deliveryFee: number) {
  if (!Array.isArray(items) || items.length === 0) throw new Error('Order must contain at least one item');
  if (!Number.isFinite(deliveryFee) || deliveryFee < 0) throw new Error('Invalid delivery fee');

  const subtotal = items.reduce((sum, item) => {
    if (!Number.isFinite(item.price) || item.price < 0) throw new Error('Invalid price');
    if (!Number.isInteger(item.quantity) || item.quantity < 1) throw new Error('Invalid quantity');
    return sum + item.price * item.quantity;
  }, 0);

  return { subtotal: roundCurrency(subtotal), total: roundCurrency(subtotal + deliveryFee) };
}

export function canRestoreStock(order: { stockRestored?: boolean }): boolean {
  return order.stockRestored !== true;
}
