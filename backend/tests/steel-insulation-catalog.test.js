import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationUrl = new URL('../prisma/migrations/20260930100000_add_carbon_steel_pipe_insulation/migration.sql', import.meta.url);
const expectedThicknesses = new Map([
  ['15 mm', ['8 mm', '11.5 mm', '14 mm', '17 mm', '32 mm']],
  ['18 mm', ['8 mm', '11.5 mm', '14 mm', '17.5 mm', '25 mm', '32 mm']],
  ['22 mm', ['8.5 mm', '12 mm', '14.5 mm', '18 mm', '25 mm', '33.5 mm']],
  ['28 mm', ['8.5 mm', '12.5 mm', '15.5 mm', '19 mm', '25 mm', '35 mm']],
  ['35 mm', ['9 mm', '13 mm', '16 mm', '19.5 mm', '27 mm', '35 mm']],
  ['42 mm', ['9 mm', '13.5 mm', '16.5 mm', '20.5 mm', '27 mm', '36.5 mm']],
  ['54 mm', ['9 mm', '13.5 mm', '17 mm', '21 mm', '28.5 mm', '38 mm']],
  ['76.1 mm', ['9.5 mm', '14 mm', '17.5 mm', '22 mm', '30 mm', '40.5 mm']],
  ['88.9 mm', ['9.5 mm', '14.5 mm', '18 mm', '22.5 mm', '30.5 mm', '41.5 mm']],
  ['108 mm', ['9.5 mm', '14.5 mm', '18 mm', '23 mm', '31 mm', '42.5 mm']],
]);

test('steel insulation migration contains only supported pipe diameter and AF thickness variants', async () => {
  const migration = await readFile(migrationUrl, 'utf8');
  const rows = [...migration.matchAll(/^\s+\('other-steel-insulation-[^']+','[^']+','OTHER','Montážní materiál','([^']+)','([^']+)','([^']+)','([^']+)','m',\d+\)/gm)];
  assert.equal(rows.length, 59);

  const variants = new Map();
  for (const [, diameter, thickness, type, name] of rows) {
    assert.equal(type, 'Kaučuková izolace · Uhlíková ocel');
    assert.ok(name.includes(diameter) && name.includes(thickness));
    if (!variants.has(diameter)) variants.set(diameter, []);
    variants.get(diameter).push(thickness);
  }

  assert.deepEqual([...variants.keys()], [...expectedThicknesses.keys()]);
  for (const [diameter, thicknesses] of expectedThicknesses) {
    assert.deepEqual(variants.get(diameter), thicknesses, diameter);
  }
});
