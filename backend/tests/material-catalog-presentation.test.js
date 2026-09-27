import test from 'node:test';
import assert from 'node:assert/strict';

import { serializeCatalogItem } from '../lib/material-catalog-presentation.js';

test('catalog presentation normalizes copper label, name, and image', () => {
  const item = serializeCatalogItem({
    id: 'cu-22-elbow90',
    key: 'CU_22_ELBOW90',
    categoryKey: 'CU',
    categoryLabel: 'Cu',
    diameter: '22 mm',
    type: 'Koleno 90°',
    name: 'Cu 22 mm — Koleno 90°',
    unit: 'ks',
    imageUrl: null,
  });

  assert.equal(item.categoryLabel, 'Měď');
  assert.equal(item.name, 'Měď 22 mm · Koleno 90°');
  assert.equal(item.imageUrl, '/materials/cu-elbow-90.webp');
});

test('catalog presentation normalizes carbon steel label and image', () => {
  const item = serializeCatalogItem({
    id: 'steel-20-pipe',
    key: 'STEEL_20_PIPE',
    categoryKey: 'STEEL',
    categoryLabel: 'Steel',
    diameter: '20 mm',
    type: 'Trubka',
    name: 'Steel 20 mm — Trubka',
    unit: 'm',
    imageUrl: null,
  });

  assert.equal(item.categoryLabel, 'Uhlíková ocel');
  assert.equal(item.name, 'Uhlíková ocel 20 mm · Trubka');
  assert.equal(item.imageUrl, '/materials/steel-pipe.webp');
});

test('catalog presentation turns OTHER into mounting material category', () => {
  const item = serializeCatalogItem({
    id: 'other-ptfe-tape',
    key: 'OTHER_PTFE_TAPE',
    categoryKey: 'OTHER',
    categoryLabel: 'Jiné',
    diameter: '—',
    type: 'PTFE páska',
    name: 'Jiné — PTFE páska',
    unit: 'ks',
    imageUrl: null,
  });

  assert.equal(item.categoryLabel, 'Montážní materiál');
  assert.equal(item.name, 'Montážní materiál · PTFE páska');
  assert.equal(item.imageUrl, '/materials/category-other.webp');
});
