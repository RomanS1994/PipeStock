import assert from 'node:assert/strict';
import test from 'node:test';

import { OFFICIAL_MATERIALS } from '../data/official-materials.js';

test('official material catalog has unique keys and complete manufacturer metadata', () => {
  assert.ok(OFFICIAL_MATERIALS.length >= 10);

  const keys = new Set();
  const ids = new Set();
  for (const item of OFFICIAL_MATERIALS) {
    assert.ok(item.id);
    assert.ok(item.key);
    assert.ok(item.brand);
    assert.ok(item.manufacturerSku);
    assert.ok(item.sourceLabel);
    assert.match(item.sourceUrl, /^https:\/\//);
    assert.match(item.imageSourceUrl, /^https:\/\//);
    assert.equal(keys.has(item.key), false, `Duplicate key: ${item.key}`);
    assert.equal(ids.has(item.id), false, `Duplicate id: ${item.id}`);
    keys.add(item.key);
    ids.add(item.id);
  }
});

test('curated Wavin and Geberit records include verified starter SKUs', () => {
  const wavin25 = OFFICIAL_MATERIALS.find(item => item.manufacturerSku === 'SKO02590RCT');
  const geberit22 = OFFICIAL_MATERIALS.find(item => item.manufacturerSku === '52224');

  assert.equal(wavin25?.brand, 'Wavin');
  assert.equal(wavin25?.diameter, '25 mm');
  assert.equal(geberit22?.brand, 'Geberit');
  assert.equal(geberit22?.diameter, '22 mm');
});
