import test from 'node:test';
import assert from 'node:assert/strict';

import { getMaterialVisual } from '../../frontend/webApp/src/react-app/pages/AddMaterialPage/materialImageResolver.js';

const mountingMaterialTypes = [
  'Objímka potrubí', 'Montážní lišta', 'Izolace potrubí', 'Kaučuková izolace',
  'Izolační páska', 'PTFE páska', 'Konopí', 'Těsnicí pasta', 'Sanitární silikon',
  'Teflonová nit', 'Těsnicí šňůra', 'Anaerobní těsnění závitů', 'Zajišťovač závitů',
  'Ploché těsnění', 'Sada O-kroužků', 'Mazivo na HT/KG těsnění', 'Hmoždinka',
  'Vrut', 'Závitová tyč', 'Matice', 'Podložka', 'Montážní konzole',
  'Matice do montážní lišty', 'Spojka montážní lišty', 'HT těsnění', 'KG těsnění',
  'Přechodová manžeta', 'Perlátor', 'Flexi hadička', 'Krycí rozeta',
  'Požární manžeta', 'Řezný kotouč kov', 'Řezný kotouč plast', 'Vrták',
  'Brusný papír', 'Čisticí hadřík', 'Odmašťovač', 'Popisovač potrubí',
  'Štítek na potrubí',
];

test('mounting material types use distinct product photo cells', () => {
  const visuals = mountingMaterialTypes.map((type) => getMaterialVisual({ categoryKey: 'other', type }));

  assert.ok(visuals.every((visual) => visual?.kind === 'sprite'));
  const uniqueCells = new Set(visuals.map(({ src, style }) => `${src}|${style.backgroundPosition}`));
  assert.equal(uniqueCells.size, mountingMaterialTypes.length);
  assert.ok(visuals.every(({ style }) => style.backgroundSize === '400% 400%'));
});

test('insulation product families use different photos across size and thickness variants', () => {
  const mirelon = getMaterialVisual({ categoryKey: 'other', type: 'Mirelon (PE) pěna', diameter: '22 mm', thickness: '13 mm' });
  const rubber = getMaterialVisual({ categoryKey: 'other', type: 'Kaučuková izolace', diameter: '22 mm', thickness: '14.5 mm' });

  assert.notEqual(`${mirelon.src}|${mirelon.style.backgroundPosition}`, `${rubber.src}|${rubber.style.backgroundPosition}`);
});
