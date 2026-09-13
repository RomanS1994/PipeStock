import { requireAuth } from '../auth/current-user.js';
import { prisma } from '../db/prisma.js';
import { HttpError } from '../lib/errors.js';
import { sendJson } from '../lib/http.js';

function getActiveMembership(user) {
  return (user.memberships || []).find(
    membership => membership.status === 'ACTIVE' && !membership.deletedAt,
  );
}

async function deleteOrder(request, response, orderId) {
  const user = await requireAuth(request);
  const membership = getActiveMembership(user);
  if (!membership) throw new HttpError(403, 'Company access is required');

  const existingOrder = await prisma.order.findFirst({
    where: { id: orderId, companyId: membership.companyId },
    select: { id: true, projectId: true },
  });
  if (!existingOrder) throw new HttpError(404, 'Order not found');

  await prisma.$transaction(async tx => {
    const membershipRows = await tx.$queryRaw`
      SELECT "id", "status", "deletedAt"
      FROM "company_memberships"
      WHERE "id" = ${membership.id} AND "companyId" = ${membership.companyId}
      FOR UPDATE
    `;
    const membershipState = membershipRows[0];
    if (!membershipState || membershipState.status !== 'ACTIVE' || membershipState.deletedAt) {
      throw new HttpError(403, 'Company access is required');
    }

    const projectRows = await tx.$queryRaw`
      SELECT "id"
      FROM "projects"
      WHERE "id" = ${existingOrder.projectId} AND "companyId" = ${membership.companyId}
      FOR UPDATE
    `;
    if (!projectRows.length) throw new HttpError(404, 'Project not found');

    if (membership.role === 'EMPLOYEE') {
      const assignment = await tx.projectAssignment.findUnique({
        where: {
          projectId_membershipId: {
            projectId: existingOrder.projectId,
            membershipId: membership.id,
          },
        },
        select: { id: true },
      });
      if (!assignment) throw new HttpError(403, 'Project access is required');
    }

    const orderRows = await tx.$queryRaw`
      SELECT "id", "status", "createdByMembershipId"
      FROM "orders"
      WHERE "id" = ${orderId} AND "companyId" = ${membership.companyId}
      FOR UPDATE
    `;
    const order = orderRows[0];
    if (!order) throw new HttpError(404, 'Order not found');

    if (
      membership.role === 'EMPLOYEE' &&
      (order.status !== 'DRAFT' || order.createdByMembershipId !== membership.id)
    ) {
      throw new HttpError(403, 'Employees can delete only their own draft orders');
    }

    await tx.order.delete({ where: { id: orderId } });
  });

  sendJson(response, 200, { ok: true });
}

export async function handleOrderListRoutes(request, response, { pathName }) {
  if (request.method === 'GET' && pathName === '/api/orders') {
    const user = await requireAuth(request);
    const membership = getActiveMembership(user);
    if (!membership) throw new HttpError(403, 'Company access is required');

    const orders = await prisma.order.findMany({
      where: {
        companyId: membership.companyId,
        ...(membership.role === 'EMPLOYEE'
          ? { project: { assignments: { some: { membershipId: membership.id } } } }
          : {}),
      },
      include: {
        project: { select: { id: true, name: true, address: true } },
        createdByMembership: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        _count: { select: { items: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    sendJson(response, 200, {
      orders: orders.map(order => ({
        id: order.id,
        number: order.number,
        title: order.title,
        category: order.category,
        status: order.status,
        submittedAt: order.submittedAt,
        completedAt: order.completedAt,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        project: order.project,
        worker: order.createdByMembership?.user || null,
        itemCount: order._count.items,
        documentAvailable: order.status !== 'DRAFT',
      })),
    });
    return true;
  }

  const orderMatch = pathName.match(/^\/api\/orders\/([^/]+)$/);
  if (orderMatch && request.method === 'DELETE') {
    await deleteOrder(request, response, decodeURIComponent(orderMatch[1]));
    return true;
  }

  return false;
}
