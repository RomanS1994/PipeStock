import assert from 'node:assert/strict';
import test from 'node:test';

import { buildOrderSnapshot, createOrderPdf, formatOrderCategoryCs, formatOrderStatusCs } from '../lib/order-document.js';

test('buildOrderSnapshot freezes order metadata and material quantities', () => {
  const submittedAt = new Date('2026-09-11T18:45:00.000Z');
  const snapshot = buildOrderSnapshot({
    id: 'order-1',
    number: 1001,
    title: 'Сантехніка 1 поверх',
    category: 'Вода',
    note: 'Терміново',
    status: 'DRAFT',
    createdAt: new Date('2026-09-11T18:00:00.000Z'),
    company: { id: 'company-1', name: 'Test Company' },
    project: { id: 'project-1', name: 'Objekt A', address: 'Praha 8' },
    createdByMembership: { user: { id: 'user-1', name: 'Roman', email: 'roman@example.com' } },
    items: [{
      materialKey: 'OTHER_MIRELON_PE_22_13',
      materialName: 'Montážní materiál 22 mm · 13 mm — Mirelon (PE) pěna',
      categoryKey: 'OTHER',
      categoryLabel: 'Montážní materiál',
      diameter: '22 mm',
      thickness: '13 mm',
      type: 'Mirelon (PE) pěna',
      unit: 'm',
      quantity: { valueOf: () => 3 },
    }, {
      materialKey: 'OTHER_STEEL_INSULATION_76_1_30',
      materialName: 'Montážní materiál 76.1 mm · tloušťka 30 mm — Kaučuková izolace · Uhlíková ocel',
      categoryKey: 'OTHER',
      categoryLabel: 'Montážní materiál',
      diameter: '76.1 mm',
      thickness: '30 mm',
      type: 'Kaučuková izolace · Uhlíková ocel',
      unit: 'm',
      quantity: { valueOf: () => 2 },
    }],
  }, { status: 'SUBMITTED', submittedAt });

  assert.equal(snapshot.order.status, 'SUBMITTED');
  assert.equal(snapshot.order.submittedAt, submittedAt.toISOString());
  assert.equal(snapshot.items[0].quantity, 3);
  assert.equal(snapshot.items[0].materialKey, 'OTHER_MIRELON_PE_22_13');
  assert.equal(snapshot.items[0].thickness, '13 mm');
  assert.equal(snapshot.items[1].diameter, '76.1 mm');
  assert.equal(snapshot.items[1].thickness, '30 mm');
  assert.equal(snapshot.items[1].type, 'Kaučuková izolace · Uhlíková ocel');
  assert.equal(snapshot.worker.name, 'Roman');
});

test('createOrderPdf returns a valid PDF buffer with Unicode content', async () => {
  const snapshot = {
    version: 1,
    createdAt: '2026-09-11T18:45:00.000Z',
    order: {
      number: 1001,
      title: 'Сантехніка 1 поверх',
      category: 'Вода',
      note: 'Терміново',
      status: 'SUBMITTED',
      submittedAt: '2026-09-11T18:45:00.000Z',
    },
    company: { name: 'PipeStock Test' },
    project: { name: 'Об’єкт A', address: 'Praha 8' },
    worker: { name: 'Роман', email: 'roman@example.com' },
    items: [
      { categoryLabel: 'Montážní materiál', diameter: '22 mm', thickness: '13 mm', type: 'Mirelon (PE) pěna', quantity: 3, unit: 'm' },
      { categoryLabel: 'Montážní materiál', diameter: '76.1 mm', thickness: '30 mm', type: 'Kaučuková izolace · Uhlíková ocel', quantity: 2, unit: 'm' },
    ],
  };

  const pdf = await createOrderPdf(snapshot);
  assert.ok(Buffer.isBuffer(pdf));
  assert.ok(pdf.length > 1000);
  assert.equal(pdf.subarray(0, 4).toString('ascii'), '%PDF');
});


test('Czech PDF labels map stored order status and legacy categories', () => {
  assert.equal(formatOrderStatusCs('DRAFT'), 'ROZPRACOVÁNO');
  assert.equal(formatOrderStatusCs('SUBMITTED'), 'ODESLÁNO');
  assert.equal(formatOrderStatusCs('COMPLETED'), 'DOKONČENO');
  assert.equal(formatOrderCategoryCs('Опалення'), 'Vytápění');
  assert.equal(formatOrderCategoryCs('Водопостачання'), 'Vodoinstalace');
  assert.equal(formatOrderCategoryCs('Каналізація'), 'Kanalizace');
  assert.equal(formatOrderCategoryCs('Сантехніка'), 'Sanitární technika');
  assert.equal(formatOrderCategoryCs('Інше'), 'Ostatní');
  assert.equal(formatOrderCategoryCs('Jiná vlastní hodnota'), 'Jiná vlastní hodnota');
});
