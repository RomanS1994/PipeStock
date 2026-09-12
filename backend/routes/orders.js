import { prisma } from '../db/prisma.js';
import { requireAuth } from '../auth/current-user.js';
import { HttpError } from '../lib/errors.js';
import { readJsonBody, sendJson } from '../lib/http.js';
import { buildOrderSnapshot, createOrderPdf } from '../lib/order-document.js';

function normalizeText(value) {
  return String(value ?? '').trim();
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

const orderInclude = {
  company: { select: { id: true, name: true } },
  project: { select: { id: true, name: true, address: true, status: true } },
  createdByMembership: {
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  },
  items: { orderBy: { createdAt: 'asc' } },
  snapshot: true,
};

function serializeItem(item) {
  return {
    id: item.id,
    catalogItemId: item.catalogItemId,
    materialKey: item.materialKey,
    materialName: item.materialName,
    categoryKey: item.categoryKey,
    categoryLabel: item.categoryLabel,
    diameter: item.diameter,
    type: item.type,
    unit: item.unit,
    imageUrl: item.imageUrl,
    quantity: Number(item.quantity),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function serializeOrder(order) {
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
    items: (order.items || []).map(serializeItem),
    itemCount: order.items?.length || 0,
    documentAvailable: order.status !== 'DRAFT',
    snapshotCreatedAt: order.snapshot?.createdAt || null,
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
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 99999) {
    throw new HttpError(400, 'Quantity must be greater than zero');
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
    items: items.map(item => ({
      id: item.id,
      key: item.key,
      categoryKey: item.categoryKey,
      categoryLabel: item.categoryLabel,
      diameter: item.diameter,
      type: item.type,
      name: item.name,
      unit: item.unit,
      imageUrl: item.imageUrl,
    })),
  });
}

async function listProjectOrders(request, response, projectId) {
  const user = await requireAuth(request);
  const membership = requireMembership(user);
  await requireProjectAccess(projectId, membership);
  const orders = await prisma.order.findMany({
    where: { projectId, companyId: membership.companyId },
    include: orderInclude,
    orderBy: { createdAt: 'desc' },
  });
  sendJson(response, 200, { orders: orders.map(serializeOrder) });
}

async function createOrder(request, response, projectId) {
  const user = await requireAuth(request);
  const membership = requireMembership(user);
  await requireProjectAccess(projectId, membership);

  const body = await readJsonBody(request);
  const title = normalizeText(body.title);
  if (!title) throw new HttpError(400, 'Order title is required');
  if (title.length > 120) throw new HttpError(400, 'Order title is too long');

  const order = await prisma.$transaction(async tx => {
    const projectRows = await tx.$queryRaw`
      SELECT "status"
      FROM "projects"
      WHERE "id" = ${projectId} AND "companyId" = ${membership.companyId}
      FOR UPDATE
    `;
    if (!projectRows.length) throw new HttpError(404, 'Project not found');
    if (projectRows[0].status === 'COMPLETED') {
      throw new HttpError(409, 'Completed projects cannot accept new orders');
    }

    const created = await tx.order.create({
      data: {
        companyId: membership.companyId,
        projectId,
        createdByMembershipId: membership.id,
        title,
        category: normalizeText(body.category) || null,
        note: normalizeText(body.note) || null,
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
  const normalizedOrder = { ...order, project: { ...order.project, assignments: undefined } };
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
  await findOrder(orderId, membership);
  const body = await readJsonBody(request);
  const data = {};
  if (body.title !== undefined) {
    const title = normalizeText(body.title);
    if (!title) throw new HttpError(400, 'Order title is required');
    if (title.length > 120) throw new HttpError(400, 'Order title is too long');
    data.title = title;
  }
  if (body.category !== undefined) data.category = normalizeText(body.category) || null;
  if (body.note !== undefined) data.note = normalizeText(body.note) || null;

  const order = await prisma.$transaction(async tx => {
    await lockDraftForWrite(tx, orderId, membership);
    return tx.order.update({ where: { id: orderId }, data, include: orderInclude });
  });
  sendJson(response, 200, { order: serializeOrder(order) });
}

async function addItem(request, response, orderId) {
  const user = await requireAuth(request);
  const membership = requireMembership(user);
  await findOrder(orderId, membership);
  const body = await readJsonBody(request);
  const catalogItemId = normalizeText(body.catalogItemId);
  if (!catalogItemId) throw new HttpError(400, 'Material is required');
  const quantity = parseQuantity(body.quantity);
  const catalogItem = await prisma.materialCatalogItem.findFirst({
    where: { id: catalogItemId, isActive: true },
  });
  if (!catalogItem) throw new HttpError(404, 'Material was not found');

  const item = await prisma.$transaction(async tx => {
    await lockDraftForWrite(tx, orderId, membership);
    return tx.orderItem.create({
      data: {
        orderId,
        catalogItemId: catalogItem.id,
        materialKey: catalogItem.key,
        materialName: catalogItem.name,
        categoryKey: catalogItem.categoryKey,
        categoryLabel: catalogItem.categoryLabel,
        diameter: catalogItem.diameter,
        type: catalogItem.type,
        unit: catalogItem.unit,
        imageUrl: catalogItem.imageUrl,
        quantity,
      },
    });
  });
  sendJson(response, 201, { item: serializeItem(item) });
}

async function updateItem(request, response, orderId, itemId) {
  const user = await requireAuth(request);
  const membership = requireMembership(user);
  await findOrder(orderId, membership);
  const body = await readJsonBody(request);
  const quantity = parseQuantity(body.quantity);

  const item = await prisma.$transaction(async tx => {
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
  await findOrder(orderId, membership);

  await prisma.$transaction(async tx => {
    await lockDraftForWrite(tx, orderId, membership);
    const result = await tx.orderItem.deleteMany({ where: { id: itemId, orderId } });
    if (!result.count) throw new HttpError(404, 'Order item not found');
  });
  sendJson(response, 200, { ok: true });
}

async function submitOrder(request, response, orderId) {
  const user = await requireAuth(request);
  const membership = requireMembership(user);
  await findOrder(orderId, membership);

  const submittedAt = new Date();
  const updated = await prisma.$transaction(async tx => {
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
  if (order.status === 'DRAFT') throw new HttpError(409, 'Submit the order before downloading PDF');

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

  const buffer = await createOrderPdf(snapshot.payload);
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
