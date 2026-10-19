import assert from 'node:assert/strict';
import test from 'node:test';

import { aggregateOrderItems, normalizeOrderSectionName } from '../lib/order-sections.js';

test('aggregateOrderItems sums the same catalog material across sections', () => {
  const result = aggregateOrderItems([
    { catalogItemId: 'mat-1', materialKey: 'PPR-25-90', quantity: 2, unit: 'ks', sectionId: 'a', type: 'Koleno 90°' },
    { catalogItemId: 'mat-1', materialKey: 'PPR-25-90', quantity: 3, unit: 'ks', sectionId: 'b', type: 'Koleno 90°' },
  ]);

  assert.equal(result.length, 1);
  assert.equal(result[0].quantity, 5);
  assert.deepEqual(result[0].sections, ['a', 'b']);
});

test('aggregateOrderItems keeps different materials separate', () => {
  const result = aggregateOrderItems([
    { catalogItemId: 'mat-1', quantity: 1, sectionId: 'a' },
    { catalogItemId: 'mat-2', quantity: 1, sectionId: 'a' },
  ]);
  assert.equal(result.length, 2);
});

test('normalizeOrderSectionName trims and validates section names', () => {
  assert.equal(normalizeOrderSectionName('  Byt 101  '), 'Byt 101');
  assert.throws(() => normalizeOrderSectionName(''), RangeError);
  assert.throws(() => normalizeOrderSectionName('x'.repeat(121)), RangeError);
});
