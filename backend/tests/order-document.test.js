import assert from 'node:assert/strict';
import test from 'node:test';

import { buildOrderSnapshot, createOrderPdf } from '../lib/order-document.js';

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
      materialKey: 'CU_22_ELBOW90',
      materialName: 'Cu 22 mm — Koleno 90°',
      categoryKey: 'CU',
      categoryLabel: 'Cu',
      diameter: '22 mm',
      type: 'Koleno 90°',
      unit: 'ks',
      quantity: { valueOf: () => 3 },
    }],
  }, { status: 'SUBMITTED', submittedAt });

  assert.equal(snapshot.order.status, 'SUBMITTED');
  assert.equal(snapshot.order.submittedAt, submittedAt.toISOString());
  assert.equal(snapshot.items[0].quantity, 3);
  assert.equal(snapshot.items[0].materialKey, 'CU_22_ELBOW90');
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
    items: [{ categoryLabel: 'Cu', diameter: '22 mm', type: 'Koleno 90°', quantity: 3, unit: 'ks' }],
  };

  const pdf = await createOrderPdf(snapshot);
  assert.ok(Buffer.isBuffer(pdf));
  assert.ok(pdf.length > 1000);
  assert.equal(pdf.subarray(0, 4).toString('ascii'), '%PDF');
});
