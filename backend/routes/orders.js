import { prisma } from '../db/prisma.js';
import { requireAuth } from '../auth/current-user.js';
import { HttpError } from '../lib/errors.js';
import { readJsonBody, sendJson } from '../lib/http.js';
import { getCatalogCategoryLabel, getCatalogDisplayName, getCatalogImageUrl, serializeCatalogItem } from '../lib/material-catalog-presentation.js';
import { buildOrderSnapshot, createOrderPdf } from '../lib/order-document.js';
import { mergeOrderItemQuantity } from '../lib/order-item-quantity.js';
import { aggregateOrderItems, normalizeOrderSectionName } from '../lib/order-sections.js';

const ORDER_TITLE_MAX_LENGTH = 120;
const ORDER_NOTE_MAX_LENGTH = 500;
const ORDER_CATEGORIES = new Set(['Опалення', 'Водопостачання', 'Каналізація', 'Сантехніка', 'Інше']);
const MAX_QUANTITY = 99999;

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeOrderCategory(value) {
  const category = normalizeText(value);
  if (!category) return null;
  if (!ORDER_CATEGORIES.has(category)) throw new HttpError(400, 'Invalid order category');
  return category;
}

function normalizeOrderNote(value) {
  const note = normalizeText(value);
  if (note.length > ORDER_NOTE_MAX_LENGTH) throw new HttpError(400, 'Order note is too long');
  return note || null;
}

function getActiveMembership(user) {
  return (user.memberships || []).find(
    membership => membership.status === 'ACTIVE' && !membership.deletedAt,
  );
}

function requireMembership(user, role) {
  const membership = getActiveMembership(user);
  if (!membership) throw new HttpError(403, 'Company access is required');
  if (role && membership.role !== role) {
    throw new HttpError(403, `${role === 'MANAGER' ? 'Manager' : 'Employee'} access is required`);
  }
  return membership;
}

async function lockMembershipAccess(tx, membership) {
  const rows = await tx.$queryRaw`
    SELECT "id", "status", "deletedAt"
    FROM "company_memberships"
    WHERE "id" = ${membership.id} AND "companyId" = ${membership.companyId}
    FOR UPDATE
  `;
  const state = rows[0];
  if (!state || state.status !== 'ACTIVE' || state.deletedAt) {
    throw new HttpError(403, 'Company access is required');
  }
  return state;
}

async function requireProjectAccess(projectId, membership) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, companyId: membership.companyId },
    include: { assignments: { select: { membershipId: true } } },
  });
  if (!project) throw new HttpError(404, 'Project not found');
  if (
    membership.role === 'EMPLOYEE' &&
    !project.assignments.some(assignment => assignment.membershipId === membership.id)
  ) {
    throw new HttpError(403, 'Project access is required');
  }
  return project;
}

async function lockProjectAccess(tx, projectId, membership) {
  const rows = await tx.$queryRaw`
    SELECT "id", "status"
    FROM "projects"
    WHERE "id" = ${projectId} AND "companyId" = ${membership.companyId}
    FOR UPDATE
  `;
  if (!rows.length) throw new HttpError(404, 'Project not found');

  if (membership.role === 'EMPLOYEE') {
    const assignment = await tx.projectAssignment.findUnique({
      where: {
        projectId_membershipId: {
          projectId,
          membershipId: membership.id,
        },
      },
      select: { id: true },
    });
    if (!assignment) throw new HttpError(403, 'Project access is required');
  }

  return rows[0];
}

const orderInclude = {
  company: { select: { id: true, name: true } },
  project: { select: { id: true, name: true, address: true, status: true } },
  createdByMembership: {
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  },
  sections: {
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: { _count: { select: { items: true } } },
  },
  items: {
    orderBy: { createdAt: 'asc' },
    include: { section: { select: { id: true, name: true, sortOrder: true } } },
  },
  snapshot: true,
};

const orderSummaryInclude = {
  project: { select: { id: true, name: true, address: true, status: true } },
  createdByMembership: {
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  },
  _count: { select: { items: true } },
};

function serializeItem(item) {
  return {
    id: item.id,
    catalogItemId: item.catalogItemId,
    sectionId: item.sectionId,
    section: item.section ? { id: item.section.id, name: item.section.name, sortOrder: item.section.sortOrder ?? 0 } : null,
    materialKey: item.materialKey,
    materialName: item.materialName,
    categoryKey: item.categoryKey,
    categoryLabel: item.categoryLabel,
    diameter: item.diameter,
    thickness: item.thickness || null,
    type: item.type,
    unit: item.unit,
    imageUrl: item.imageUrl,
    quantity: Number(item.quantity),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function serializeSection(section) {
  return {
    id: section.id,
    name: section.name,
    sortOrder: section.sortOrder ?? 0,
    itemCount: section._count?.items ?? section.items?.length ?? 0,
    items: section.items ? section.items.map(serializeItem) : undefined,
    createdAt: section.createdAt,
    updatedAt: section.updatedAt,
  };
}

function serializeOrder(order) {
  const serializedItems = (order.items || []).map(serializeItem);
  const result = {
    id: order.id,
    number: order.number,
    title: order.title,
    category: order.category,
    note: order.note,
    status: order.status,
    submittedAt: order.submittedAt,
    completedAt: order.completedAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    project: order.project,
    worker: order.createdByMembership?.user || null,
    createdByMembershipId: order.createdByMembershipId,
    sections: (order.sections || []).map(serializeSection),
    sectionCount: order.sections?.length || 0,
    items: serializedItems,
    aggregatedItems: aggregateOrderItems(serializedItems),
    itemCount: serializedItems.length,
    documentAvailable: order.status !== 'DRAFT',
    snapshotCreatedAt: order.snapshot?.createdAt || null,
  };
  if (order.history) result.history = order.history.map(serializeEvent);
  return result;
}

function serializeOrderSummary(order) {
  return {
    id: order.id,
    number: order.number,
    title: order.title,
    category: order.category,
    note: order.note,
    status: order.status,
    submittedAt: order.submittedAt,
    completedAt: order.completedAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    project: order.project,
    worker: order.createdByMembership?.user || null,
    createdByMembershipId: order.createdByMembershipId,
    itemCount: order._count?.items || 0,
    documentAvailable: order.status !== 'DRAFT',
  };
}

function serializeEvent(event) {
  return {
    id: event.id,
    type: event.type,
    createdAt: event.createdAt,
    actor: event.actor?.user ? {
      id: event.actor.user.id,
      name: event.actor.user.name,
    } : null,
  };
}

async function findOrder(orderId, membership) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, companyId: membership.companyId },
    include: {
      ...orderInclude,
      project: {
        include: { assignments: { select: { membershipId: true } } },
      },
    },
  });
  if (!order) throw new HttpError(404, 'Order not found');
  if (
    membership.role === 'EMPLOYEE' &&
    !order.project.assignments.some(assignment => assignment.membershipId === membership.id)
  ) {
    throw new HttpError(403, 'Order access is required');
  }
  return order;
}

function assertDraftEditAccess(order, membership) {
  if (order.status !== 'DRAFT') throw new HttpError(409, 'Only draft orders can be edited');
  if (membership.role !== 'MANAGER' && order.createdByMembershipId !== membership.id) {
    throw new HttpError(403, 'Only the order creator can edit this draft');
  }
}

async function lockOrderState(tx, orderId) {
  const rows = await tx.$queryRaw`
    SELECT "id", "status", "createdByMembershipId"
    FROM "orders"
    WHERE "id" = ${orderId}
    FOR UPDATE
  `;
  if (!rows.length) throw new HttpError(404, 'Order not found');
  return rows[0];
}

async function lockDraftForWrite(tx, orderId, membership) {
  const state = await lockOrderState(tx, orderId);
  assertDraftEditAccess(state, membership);
  return state;
}

function parseQuantity(value) {
  const quantity = Number(value);
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > MAX_QUANTITY) {
    throw new HttpError(400, `Quantity must be greater than zero and at most ${MAX_QUANTITY}`);
  }
  return quantity;
}

async function listCatalog(request, response) {
  const user = await requireAuth(request);
  requireMembership(user);
  const items = await prisma.materialCatalogItem.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
  sendJson(response, 200, {
    items: items.map(item => serializeCatalogItem(item)),
  });
}

async function listProjectOrders(request, response, projectId) {
  const user = await requireAuth(request);
  const membership = requireMembership(user);
  await requireProjectAccess(projectId, membership);
  const orders = await prisma.order.findMany({
    where: { projectId, companyId: membership.companyId },
    include: orderSummaryInclude,
    orderBy: { createdAt: 'desc' },
  });
  sendJson(response, 200, { orders: orders.map(serializeOrderSummary) });
}

async function createOrder(request, response, projectId) {
  const user = await requireAuth(request);
  const membership = requireMembership(user);
  await requireProjectAccess(projectId, membership);

  const body = await readJsonBody(request);
  const title = normalizeText(body.title);
  if (!title) throw new HttpError(400, 'Order title is required');
  if (title.length > ORDER_TITLE_MAX_LENGTH) throw new HttpError(400, 'Order title is too long');
  const category = normalizeOrderCategory(body.category);
  const note = normalizeOrderNote(body.note);

  const order = await prisma.$transaction(async tx => {
    await lockMembershipAccess(tx, membership);
    const project = await lockProjectAccess(tx, projectId, membership);
    if (project.status === 'COMPLETED') {
      throw new HttpError(409, 'Completed projects cannot accept new orders');
    }

    const created = await tx.order.create({
      data: {
        companyId: membership.companyId,
        projectId,
        createdByMembershipId: membership.id,
        title,
        category,
        note,
      },
      include: orderInclude,
    });

    await tx.orderEvent.create({
      data: {
        orderId: created.id,
        actorMembershipId: membership.id,
        type: 'CREATED',
        createdAt: created.createdAt,
      },
    });

    return created;
  });

  sendJson(response, 201, { order: serializeOrder(order) });
}

async function getOrder(request, response, orderId) {
  const user = await requireAuth(request);
  const membership = requireMembership(user);
  const order = await findOrder(orderId, membership);
  const history = order.status === 'DRAFT' ? [] : await prisma.orderEvent.findMany({
    where: { orderId },
    include: {
      actor: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
  const normalizedOrder = { ...order, history, project: { ...order.project, assignments: undefined } };
  sendJson(response, 200, { order: serializeOrder(normalizedOrder) });
}

async function listOrderHistory(request, response, orderId) {
  const user = await requireAuth(request);
  const membership = requireMembership(user);
  await findOrder(orderId, membership);

  const events = await prisma.orderEvent.findMany({
    where: { orderId },
    include: {
      actor: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  sendJson(response, 200, { events: events.map(serializeEvent) });
}

async function updateOrder(request, response, orderId) {
  const user = await requireAuth(request);
  const membership = requireMembership(user);
  const accessibleOrder = await findOrder(orderId, membership);
  const body = await readJsonBody(request);
  const data = {};
  if (body.title !== undefined) {
    const title = normalizeText(body.title);
    if (!title) throw new HttpError(400, 'Order title is required');
    if (title.length > ORDER_TITLE_MAX_LENGTH) throw new HttpError(400, 'Order title is too long');
    data.title = title;
  }
  if (body.category !== undefined) data.category = normalizeOrderCategory(body.category);
  if (body.note !== undefined) data.note = normalizeOrderNote(body.note);

  const order = await prisma.$transaction(async tx => {
    await lockMembershipAccess(tx, membership);
    await lockProjectAccess(tx, accessibleOrder.project.id, membership);
    await lockDraftForWrite(tx, orderId, membership);
    return tx.order.update({ where: { id: orderId }, data, include: orderInclude });
  });
  sendJson(response, 200, { order: serializeOrder(order) });
}

async function addItem(request, response, orderId) {
  const user = await requireAuth(request);
  const membership = requireMembership(user);
  const accessibleOrder = await findOrder(orderId, membership);
  const body = await readJsonBody(request);
  const catalogItemId = normalizeText(body.catalogItemId);
  const sectionId = normalizeText(body.sectionId);
  if (!catalogItemId) throw new HttpError(400, 'Material is required');
  if (!sectionId) throw new HttpError(400, 'Section is required');
  const quantity = parseQuantity(body.quantity);
  const catalogItem = await prisma.materialCatalogItem.findFirst({
    where: { id: catalogItemId, isActive: true },
  });
  if (!catalogItem) throw new HttpError(404, 'Material was not found');

  const result = await prisma.$transaction(async tx => {
    await lockMembershipAccess(tx, membership);
    await lockProjectAccess(tx, accessibleOrder.project.id, membership);
    await lockDraftForWrite(tx, orderId, membership);
    const section = await tx.orderSection.findFirst({ where: { id: sectionId, orderId } });
    if (!section) throw new HttpError(404, 'Section not found');

    const existing = await tx.orderItem.findFirst({
      where: { sectionId, catalogItemId: catalogItem.id },
    });

    if (existing) {
      let mergedQuantity;
      try {
        mergedQuantity = mergeOrderItemQuantity(existing.quantity, quantity);
      } catch {
        throw new HttpError(400, `Quantity must be greater than zero and at most ${MAX_QUANTITY}`);
      }
      const item = await tx.orderItem.update({
        where: { id: existing.id },
        data: { quantity: mergedQuantity },
      });
      return { item, created: false };
    }

    const item = await tx.orderItem.create({
      data: {
        orderId,
        sectionId,
        catalogItemId: catalogItem.id,
        materialKey: catalogItem.key,
        materialName: getCatalogDisplayName(catalogItem),
        categoryKey: catalogItem.categoryKey,
        categoryLabel: getCatalogCategoryLabel(catalogItem),
        diameter: catalogItem.diameter,
        thickness: catalogItem.thickness,
        type: catalogItem.type,
        unit: catalogItem.unit,
        imageUrl: getCatalogImageUrl(catalogItem),
        quantity,
      },
    });
    return { item, created: true };
  });
  sendJson(response, result.created ? 201 : 200, { item: serializeItem(result.item), merged: !result.created });
}


async function createSection(request, response, orderId) {
  const user = await requireAuth(request);
  const membership = requireMembership(user);
  const accessibleOrder = await findOrder(orderId, membership);
  const body = await readJsonBody(request);
  let name;
  try {
    name = normalizeOrderSectionName(body.name);
  } catch (error) {
    throw new HttpError(400, error.message);
  }

  const section = await prisma.$transaction(async tx => {
    await lockMembershipAccess(tx, membership);
    await lockProjectAccess(tx, accessibleOrder.project.id, membership);
    await lockDraftForWrite(tx, orderId, membership);
    const last = await tx.orderSection.findFirst({
      where: { orderId },
      orderBy: [{ sortOrder: 'desc' }, { createdAt: 'desc' }],
      select: { sortOrder: true },
    });
    return tx.orderSection.create({
      data: { orderId, name, sortOrder: (last?.sortOrder ?? -1) + 1 },
      include: { _count: { select: { items: true } } },
    });
  });

  sendJson(response, 201, { section: serializeSection(section) });
}

async function getSection(request, response, orderId, sectionId) {
  const user = await requireAuth(request);
  const membership = requireMembership(user);
  await findOrder(orderId, membership);
  const section = await prisma.orderSection.findFirst({
    where: { id: sectionId, orderId },
    include: {
      items: {
        orderBy: { createdAt: 'asc' },
        include: { section: { select: { id: true, name: true, sortOrder: true } } },
      },
    },
  });
  if (!section) throw new HttpError(404, 'Section not found');
  sendJson(response, 200, { section: serializeSection(section) });
}

async function updateSection(request, response, orderId, sectionId) {
  const user = await requireAuth(request);
  const membership = requireMembership(user);
  const accessibleOrder = await findOrder(orderId, membership);
  const body = await readJsonBody(request);
  let name;
  try {
    name = normalizeOrderSectionName(body.name);
  } catch (error) {
    throw new HttpError(400, error.message);
  }

  const section = await prisma.$transaction(async tx => {
    await lockMembershipAccess(tx, membership);
    await lockProjectAccess(tx, accessibleOrder.project.id, membership);
    await lockDraftForWrite(tx, orderId, membership);
    const existing = await tx.orderSection.findFirst({ where: { id: sectionId, orderId } });
    if (!existing) throw new HttpError(404, 'Section not found');
    return tx.orderSection.update({
      where: { id: sectionId },
      data: { name },
      include: { _count: { select: { items: true } } },
    });
  });
  sendJson(response, 200, { section: serializeSection(section) });
}

async function deleteSection(request, response, orderId, sectionId) {
  const user = await requireAuth(request);
  const membership = requireMembership(user);
  const accessibleOrder = await findOrder(orderId, membership);
  await prisma.$transaction(async tx => {
    await lockMembershipAccess(tx, membership);
    await lockProjectAccess(tx, accessibleOrder.project.id, membership);
    await lockDraftForWrite(tx, orderId, membership);
    const result = await tx.orderSection.deleteMany({ where: { id: sectionId, orderId } });
    if (!result.count) throw new HttpError(404, 'Section not found');
  });
  sendJson(response, 200, { ok: true });
}

function buildSectionSnapshot(order, sectionId) {
  const base = buildOrderSnapshot(order);
  const section = (base.sections || []).find(item => item.id === sectionId);
  if (!section) throw new HttpError(404, 'Section not found');
  return {
    ...base,
    order: { ...base.order, title: `${base.order.title} · ${section.name}` },
    items: section.items || [],
    section: { id: section.id, name: section.name },
  };
}

async function downloadSectionPdf(request, response, orderId, sectionId) {
  const user = await requireAuth(request);
  const membership = requireMembership(user);
  const order = await findOrder(orderId, membership);
  let payload;

  if (order.status === 'DRAFT') {
    const section = order.sections?.find(item => item.id === sectionId);
    if (!section) throw new HttpError(404, 'Section not found');
    const hasItems = order.items?.some(item => item.sectionId === sectionId);
    if (!hasItems) throw new HttpError(409, 'Add at least one material before previewing PDF');
    payload = buildSectionSnapshot(order, sectionId);
  } else if (order.snapshot?.payload?.sections) {
    const section = order.snapshot.payload.sections.find(item => item.id === sectionId);
    if (!section) throw new HttpError(404, 'Section not found');
    payload = {
      ...order.snapshot.payload,
      order: { ...order.snapshot.payload.order, title: `${order.snapshot.payload.order.title} · ${section.name}` },
      items: section.items || [],
      section: { id: section.id, name: section.name },
    };
  } else {
    payload = buildSectionSnapshot(order, sectionId);
  }

  const buffer = await createOrderPdf(payload);
  response.writeHead(200, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="pipestock-order-${order.number}-section.pdf"`,
    'Content-Length': String(buffer.length),
    'Cache-Control': 'private, no-store',
  });
  response.end(buffer);
}

async function updateItem(request, response, orderId, itemId) {
  const user = await requireAuth(request);
  const membership = requireMembership(user);
  const accessibleOrder = await findOrder(orderId, membership);
  const body = await readJsonBody(request);
  const quantity = parseQuantity(body.quantity);

  const item = await prisma.$transaction(async tx => {
    await lockMembershipAccess(tx, membership);
    await lockProjectAccess(tx, accessibleOrder.project.id, membership);
    await lockDraftForWrite(tx, orderId, membership);
    const existing = await tx.orderItem.findFirst({ where: { id: itemId, orderId } });
    if (!existing) throw new HttpError(404, 'Order item not found');
    return tx.orderItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  });
  sendJson(response, 200, { item: serializeItem(item) });
}

async function deleteItem(request, response, orderId, itemId) {
  const user = await requireAuth(request);
  const membership = requireMembership(user);
  const accessibleOrder = await findOrder(orderId, membership);

  await prisma.$transaction(async tx => {
    await lockMembershipAccess(tx, membership);
    await lockProjectAccess(tx, accessibleOrder.project.id, membership);
    await lockDraftForWrite(tx, orderId, membership);
    const result = await tx.orderItem.deleteMany({ where: { id: itemId, orderId } });
    if (!result.count) throw new HttpError(404, 'Order item not found');
  });
  sendJson(response, 200, { ok: true });
}

async function submitOrder(request, response, orderId) {
  const user = await requireAuth(request);
  const membership = requireMembership(user);
  const accessibleOrder = await findOrder(orderId, membership);

  const submittedAt = new Date();
  const updated = await prisma.$transaction(async tx => {
    await lockMembershipAccess(tx, membership);
    await lockProjectAccess(tx, accessibleOrder.project.id, membership);
    await lockDraftForWrite(tx, orderId, membership);
    const order = await tx.order.findUnique({ where: { id: orderId }, include: orderInclude });
    if (!order?.items?.length) throw new HttpError(409, 'Add at least one material before submitting');

    const snapshotPayload = buildOrderSnapshot(order, {
      status: 'SUBMITTED',
      submittedAt,
    });

    await tx.orderSnapshot.upsert({
      where: { orderId },
      update: {},
      create: {
        orderId,
        version: 1,
        payload: snapshotPayload,
      },
    });

    const nextOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: 'SUBMITTED', submittedAt },
      include: orderInclude,
    });

    await tx.orderEvent.create({
      data: {
        orderId,
        actorMembershipId: membership.id,
        type: 'SUBMITTED',
        createdAt: submittedAt,
      },
    });

    return nextOrder;
  });

  sendJson(response, 200, { order: serializeOrder(updated) });
}

async function completeOrder(request, response, orderId) {
  const user = await requireAuth(request);
  const membership = requireMembership(user, 'MANAGER');
  await findOrder(orderId, membership);

  const completedAt = new Date();
  const updated = await prisma.$transaction(async tx => {
    await lockMembershipAccess(tx, membership);
    const state = await lockOrderState(tx, orderId);
    if (state.status !== 'SUBMITTED') throw new HttpError(409, 'Only submitted orders can be completed');

    const order = await tx.order.findUnique({ where: { id: orderId }, include: orderInclude });
    if (!order.snapshot) {
      await tx.orderSnapshot.upsert({
        where: { orderId },
        update: {},
        create: {
          orderId,
          version: 1,
          payload: buildOrderSnapshot(order),
        },
      });
    }

    const nextOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: 'COMPLETED', completedAt },
      include: orderInclude,
    });

    await tx.orderEvent.create({
      data: {
        orderId,
        actorMembershipId: membership.id,
        type: 'COMPLETED',
        createdAt: completedAt,
      },
    });

    return nextOrder;
  });

  sendJson(response, 200, { order: serializeOrder(updated) });
}

async function downloadOrderPdf(request, response, orderId) {
  const user = await requireAuth(request);
  const membership = requireMembership(user);
  const order = await findOrder(orderId, membership);

  let snapshotPayload;
  if (order.status === 'DRAFT') {
    if (!order.items?.length) throw new HttpError(409, 'Add at least one material before previewing PDF');
    snapshotPayload = buildOrderSnapshot(order);
  } else {
    let snapshot = order.snapshot;
    if (!snapshot) {
      snapshot = await prisma.orderSnapshot.upsert({
        where: { orderId },
        update: {},
        create: {
          orderId,
          version: 1,
          payload: buildOrderSnapshot(order),
        },
      });
    }
    snapshotPayload = snapshot.payload;
  }

  const buffer = await createOrderPdf(snapshotPayload);
  if (response.writableEnded) return;
  response.writeHead(200, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="pipestock-order-${order.number}.pdf"`,
    'Content-Length': String(buffer.length),
    'Cache-Control': 'private, no-store',
  });
  response.end(buffer);
}

export async function handleOrderRoutes(request, response, { pathName }) {
  if (request.method === 'GET' && pathName === '/api/material-catalog') {
    await listCatalog(request, response);
    return true;
  }

  const projectOrders = pathName.match(/^\/api\/projects\/([^/]+)\/orders$/);
  if (projectOrders) {
    const projectId = decodeURIComponent(projectOrders[1]);
    if (request.method === 'GET') {
      await listProjectOrders(request, response, projectId);
      return true;
    }
    if (request.method === 'POST') {
      await createOrder(request, response, projectId);
      return true;
    }
  }

  const sectionPdfMatch = pathName.match(/^\/api\/orders\/([^/]+)\/sections\/([^/]+)\/pdf$/);
  if (sectionPdfMatch && request.method === 'GET') {
    await downloadSectionPdf(request, response, decodeURIComponent(sectionPdfMatch[1]), decodeURIComponent(sectionPdfMatch[2]));
    return true;
  }

  const sectionMatch = pathName.match(/^\/api\/orders\/([^/]+)\/sections\/([^/]+)$/);
  if (sectionMatch) {
    const orderId = decodeURIComponent(sectionMatch[1]);
    const sectionId = decodeURIComponent(sectionMatch[2]);
    if (request.method === 'GET') {
      await getSection(request, response, orderId, sectionId);
      return true;
    }
    if (request.method === 'PATCH') {
      await updateSection(request, response, orderId, sectionId);
      return true;
    }
    if (request.method === 'DELETE') {
      await deleteSection(request, response, orderId, sectionId);
      return true;
    }
  }

  const sectionsMatch = pathName.match(/^\/api\/orders\/([^/]+)\/sections$/);
  if (sectionsMatch && request.method === 'POST') {
    await createSection(request, response, decodeURIComponent(sectionsMatch[1]));
    return true;
  }

  const itemMatch = pathName.match(/^\/api\/orders\/([^/]+)\/items\/([^/]+)$/);
  if (itemMatch) {
    const orderId = decodeURIComponent(itemMatch[1]);
    const itemId = decodeURIComponent(itemMatch[2]);
    if (request.method === 'PATCH') {
      await updateItem(request, response, orderId, itemId);
      return true;
    }
    if (request.method === 'DELETE') {
      await deleteItem(request, response, orderId, itemId);
      return true;
    }
  }

  const addItemMatch = pathName.match(/^\/api\/orders\/([^/]+)\/items$/);
  if (addItemMatch && request.method === 'POST') {
    await addItem(request, response, decodeURIComponent(addItemMatch[1]));
    return true;
  }

  const historyMatch = pathName.match(/^\/api\/orders\/([^/]+)\/history$/);
  if (historyMatch && request.method === 'GET') {
    await listOrderHistory(request, response, decodeURIComponent(historyMatch[1]));
    return true;
  }

  const submitMatch = pathName.match(/^\/api\/orders\/([^/]+)\/submit$/);
  if (submitMatch && request.method === 'POST') {
    await submitOrder(request, response, decodeURIComponent(submitMatch[1]));
    return true;
  }

  const completeMatch = pathName.match(/^\/api\/orders\/([^/]+)\/complete$/);
  if (completeMatch && request.method === 'POST') {
    await completeOrder(request, response, decodeURIComponent(completeMatch[1]));
    return true;
  }

  const pdfMatch = pathName.match(/^\/api\/orders\/([^/]+)\/pdf$/);
  if (pdfMatch && request.method === 'GET') {
    await downloadOrderPdf(request, response, decodeURIComponent(pdfMatch[1]));
    return true;
  }

  const orderMatch = pathName.match(/^\/api\/orders\/([^/]+)$/);
  if (orderMatch) {
    const orderId = decodeURIComponent(orderMatch[1]);
    if (request.method === 'GET') {
      await getOrder(request, response, orderId);
      return true;
    }
    if (request.method === 'PATCH') {
      await updateOrder(request, response, orderId);
      return true;
    }
  }

  return false;
}
