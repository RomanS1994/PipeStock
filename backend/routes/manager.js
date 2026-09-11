import { prisma } from '../db/prisma.js';
import { requireAuth } from '../auth/current-user.js';
import { HttpError } from '../lib/errors.js';
import { readJsonBody, sendJson } from '../lib/http.js';

function getManagerMembership(user) {
  const membership = (user.memberships || []).find(
    item => item.status === 'ACTIVE' && !item.deletedAt && item.role === 'MANAGER',
  );
  if (!membership) throw new HttpError(403, 'Manager access is required');
  return membership;
}

async function dashboard(request, response) {
  const user = await requireAuth(request);
  const membership = getManagerMembership(user);
  const companyId = membership.companyId;

  const [projectCount, employeeCount, draftCount, submittedCount, completedCount, recentOrders] = await Promise.all([
    prisma.project.count({ where: { companyId, status: { not: 'COMPLETED' } } }),
    prisma.companyMembership.count({
      where: { companyId, role: 'EMPLOYEE', status: 'ACTIVE', deletedAt: null },
    }),
    prisma.order.count({ where: { companyId, status: 'DRAFT' } }),
    prisma.order.count({ where: { companyId, status: 'SUBMITTED' } }),
    prisma.order.count({ where: { companyId, status: 'COMPLETED' } }),
    prisma.order.findMany({
      where: { companyId },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        number: true,
        title: true,
        status: true,
        updatedAt: true,
        project: { select: { id: true, name: true } },
        createdByMembership: {
          select: { user: { select: { id: true, name: true } } },
        },
        _count: { select: { items: true } },
      },
    }),
  ]);

  sendJson(response, 200, {
    stats: {
      activeProjects: projectCount,
      activeEmployees: employeeCount,
      draftOrders: draftCount,
      submittedOrders: submittedCount,
      completedOrders: completedCount,
    },
    recentOrders: recentOrders.map(order => ({
      id: order.id,
      number: order.number,
      title: order.title,
      status: order.status,
      updatedAt: order.updatedAt,
      project: order.project,
      worker: order.createdByMembership?.user || null,
      itemCount: order._count.items,
    })),
  });
}

async function listTeam(request, response) {
  const user = await requireAuth(request);
  const membership = getManagerMembership(user);

  const members = await prisma.companyMembership.findMany({
    where: {
      companyId: membership.companyId,
      role: 'EMPLOYEE',
      deletedAt: null,
    },
    orderBy: { createdAt: 'asc' },
    include: {
      user: {
        select: { id: true, name: true, firstName: true, lastName: true, email: true, phone: true },
      },
      _count: {
        select: { assignments: true, createdOrders: true },
      },
    },
  });

  sendJson(response, 200, {
    members: members.map(item => ({
      membershipId: item.id,
      status: item.status,
      joinedAt: item.createdAt,
      user: item.user,
      projectCount: item._count.assignments,
      orderCount: item._count.createdOrders,
    })),
  });
}

async function updateTeamMember(request, response, membershipId) {
  const user = await requireAuth(request);
  const manager = getManagerMembership(user);
  const body = await readJsonBody(request);
  const status = String(body.status || '').trim().toUpperCase();
  if (!['ACTIVE', 'INACTIVE'].includes(status)) throw new HttpError(400, 'Invalid member status');

  const member = await prisma.companyMembership.findFirst({
    where: {
      id: membershipId,
      companyId: manager.companyId,
      role: 'EMPLOYEE',
      deletedAt: null,
    },
  });
  if (!member) throw new HttpError(404, 'Employee not found');

  const updated = await prisma.companyMembership.update({
    where: { id: membershipId },
    data: { status },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      _count: { select: { assignments: true, createdOrders: true } },
    },
  });

  sendJson(response, 200, {
    member: {
      membershipId: updated.id,
      status: updated.status,
      joinedAt: updated.createdAt,
      user: updated.user,
      projectCount: updated._count.assignments,
      orderCount: updated._count.createdOrders,
    },
  });
}

export async function handleManagerRoutes(request, response, { pathName }) {
  if (request.method === 'GET' && pathName === '/api/dashboard') {
    await dashboard(request, response);
    return true;
  }

  if (request.method === 'GET' && pathName === '/api/team') {
    await listTeam(request, response);
    return true;
  }

  const memberMatch = pathName.match(/^\/api\/team\/([^/]+)$/);
  if (memberMatch && request.method === 'PATCH') {
    await updateTeamMember(request, response, decodeURIComponent(memberMatch[1]));
    return true;
  }

  return false;
}
