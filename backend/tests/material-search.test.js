import test from 'node:test';
import assert from 'node:assert/strict';

import { searchMaterials } from '../../frontend/webApp/src/react-app/pages/AddMaterialPage/materialSearchMatcher.js';

const catalog = [
  { id: 'ppr25', categoryKey: 'PPR', categoryLabel: 'PPR', name: 'T-kus 25 mm', type: 'T-kus', diameter: '25 mm', unit: 'ks' },
  { id: 'steel25', categoryKey: 'STEEL', categoryLabel: 'Uhlíková ocel', name: 'T-kus 25 mm', type: 'T-kus', diameter: '25 mm', unit: 'ks' },
  { id: 'reducer', categoryKey: 'PPR', categoryLabel: 'PPR', name: 'T-kus 25×20×25', type: 'T-kus', diameter: '25 × 20 × 25 mm', unit: 'ks' },
  { id: 'tee25x25x20', categoryKey: 'PPR', categoryLabel: 'PPR', name: 'T-kus 25×25×20', type: 'T-kus', diameter: '25 × 25 × 20 mm', unit: 'ks' },
  { id: 'tee250', categoryKey: 'PPR', categoryLabel: 'PPR', name: 'T-kus 25×250×25', type: 'T-kus', diameter: '25 × 250 × 25 mm', unit: 'ks' },
  { id: 'elbow', categoryKey: 'PPR', categoryLabel: 'PPR', name: 'Koleno 25 mm', type: 'Koleno 90°', diameter: '25 mm', unit: 'ks' },
];

const ids = query => searchMaterials(catalog, query).map(item => item.id);

test('tkus 25x25 finds equal-size tees and correctly ordered dimensional tees', () => {
  assert.deepEqual(ids('tkus 25x25'), ['ppr25', 'steel25', 'tee25x25x20']);
  assert.deepEqual(ids('T-kus 25 × 25'), ids('tkus 25x25'));
  assert.deepEqual(ids('t kus 25 x 25'), ids('tkus 25x25'));
});

test('dimension tokens do not confuse 25 with 250 or reduced branch sizes', () => {
  assert.deepEqual(ids('ppr tkus 25x20'), ['reducer']);
  assert.deepEqual(ids('tkus 25x250'), ['tee250']);
  assert.deepEqual(ids('ppr tkus 25'), ['ppr25', 'reducer', 'tee25x25x20', 'tee250']);
});

test('empty search has no results and category search still works', () => {
  assert.deepEqual(ids('  '), []);
  assert.deepEqual(ids('ppr koleno 25'), ['elbow']);
});
