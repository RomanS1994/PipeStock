import { requireAuth } from '../auth/current-user.js';
import { prisma } from '../db/prisma.js';
import { HttpError } from '../lib/errors.js';
import { sendJson } from '../lib/http.js';

function getActiveMembership(user) {
  return (user.memberships || []).find(
    membership => membership.status === 'ACTIVE' && !membership.deletedAt,
  );
}

export async function handleOrderListRoutes(request, response, { pathName }) {
  if (request.method !== 'GET' || pathName !== '/api/orders') return false;

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
