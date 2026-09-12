import { prisma } from '../db/prisma.js';
import { requireAuth } from '../auth/current-user.js';
import { hasActiveCompanyMembershipInTx, lockUserForMembershipChange } from '../auth/membership-policy.js';
import { HttpError } from '../lib/errors.js';
import { readJsonBody, sendJson } from '../lib/http.js';
import { createInviteCode } from '../lib/invite-code.js';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getManagerMembership(user) {
  const membership = (user.memberships || []).find(
    item => item.status === 'ACTIVE' && !item.deletedAt && item.role === 'MANAGER',
  );
  if (!membership) throw new HttpError(403, 'Manager access is required');
  return membership;
}

async function uniqueInviteCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = createInviteCode();
    if (!(await prisma.company.findUnique({ where: { joinCode: code } }))) return code;
  }
  throw new HttpError(503, 'Could not generate invite code');
}

function serializeInvite(company) {
  const active = Boolean(
    company.joinCode &&
    !company.joinCodeRevokedAt &&
    company.joinCodeExpiresAt &&
    company.joinCodeExpiresAt > new Date(),
  );
  return {
    code: company.joinCode,
    createdAt: company.joinCodeCreatedAt,
    expiresAt: company.joinCodeExpiresAt,
    revokedAt: company.joinCodeRevokedAt,
    active,
  };
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

  const target = await prisma.companyMembership.findFirst({
    where: {
      id: membershipId,
      companyId: manager.companyId,
      role: 'EMPLOYEE',
      deletedAt: null,
    },
    select: { id: true, userId: true },
  });
  if (!target) throw new HttpError(404, 'Employee not found');

  const updated = await prisma.$transaction(async tx => {
    if (!(await lockUserForMembershipChange(tx, target.userId))) {
      throw new HttpError(404, 'Employee not found');
    }

    const member = await tx.companyMembership.findFirst({
      where: {
        id: membershipId,
        companyId: manager.companyId,
        role: 'EMPLOYEE',
        deletedAt: null,
      },
      select: { id: true, userId: true, status: true },
    });
    if (!member) throw new HttpError(404, 'Employee not found');

    if (
      status === 'ACTIVE' &&
      member.status !== 'ACTIVE' &&
      await hasActiveCompanyMembershipInTx(tx, member.userId, member.id)
    ) {
      throw new HttpError(409, 'Employee already belongs to another active company');
    }

    const statusChanged = status !== member.status;
    if (statusChanged) {
      // Access to projects never survives a membership status transition. This keeps
      // reactivation explicit: a manager must assign the employee to projects again.
      await tx.projectAssignment.deleteMany({ where: { membershipId } });
    }

    const nextMember = await tx.companyMembership.update({
      where: { id: membershipId },
      data: { status },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        _count: { select: { assignments: true, createdOrders: true } },
      },
    });

    if (status === 'INACTIVE' && statusChanged) {
      await tx.session.deleteMany({ where: { userId: member.userId } });
    }

    return nextMember;
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

async function getInvite(request, response) {
  const user = await requireAuth(request);
  const membership = getManagerMembership(user);
  const company = await prisma.company.findUnique({ where: { id: membership.companyId } });
  if (!company) throw new HttpError(404, 'Company not found');
  sendJson(response, 200, { invite: serializeInvite(company) });
}

async function regenerateInvite(request, response) {
  const user = await requireAuth(request);
  const membership = getManagerMembership(user);
  const now = new Date();
  const company = await prisma.company.update({
    where: { id: membership.companyId },
    data: {
      joinCode: await uniqueInviteCode(),
      joinCodeCreatedAt: now,
      joinCodeExpiresAt: new Date(now.getTime() + INVITE_TTL_MS),
      joinCodeRevokedAt: null,
    },
  });
  sendJson(response, 200, { invite: serializeInvite(company) });
}

async function revokeInvite(request, response) {
  const user = await requireAuth(request);
  const membership = getManagerMembership(user);
  const company = await prisma.company.update({
    where: { id: membership.companyId },
    data: { joinCodeRevokedAt: new Date() },
  });
  sendJson(response, 200, { invite: serializeInvite(company) });
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

  if (request.method === 'GET' && pathName === '/api/team/invite') {
    await getInvite(request, response);
    return true;
  }

  if (request.method === 'POST' && pathName === '/api/team/invite') {
    await regenerateInvite(request, response);
    return true;
  }

  if (request.method === 'DELETE' && pathName === '/api/team/invite') {
    await revokeInvite(request, response);
    return true;
  }

  const memberMatch = pathName.match(/^\/api\/team\/([^/]+)$/);
  if (memberMatch && request.method === 'PATCH') {
    await updateTeamMember(request, response, decodeURIComponent(memberMatch[1]));
    return true;
  }

  return false;
}
