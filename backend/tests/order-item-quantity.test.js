import assert from 'node:assert/strict';
import test from 'node:test';

import { mergeOrderItemQuantity } from '../lib/order-item-quantity.js';

test('mergeOrderItemQuantity adds matching material quantities', () => {
  assert.equal(mergeOrderItemQuantity(1, 1), 2);
  assert.equal(mergeOrderItemQuantity('2', 3), 5);
});

test('mergeOrderItemQuantity preserves two-decimal material quantities', () => {
  assert.equal(mergeOrderItemQuantity(0.29, 0.1), 0.39);
  assert.equal(mergeOrderItemQuantity(1.25, 2.5), 3.75);
});

test('mergeOrderItemQuantity rejects invalid or excessive totals', () => {
  assert.throws(() => mergeOrderItemQuantity(99999, 1), RangeError);
  assert.throws(() => mergeOrderItemQuantity(1, 0), RangeError);
});
