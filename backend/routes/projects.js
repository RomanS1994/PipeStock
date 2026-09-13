import { prisma } from '../db/prisma.js';
import { requireAuth } from '../auth/current-user.js';
import { verifyStoredImageAsset } from '../lib/cloudinary.js';
import { HttpError } from '../lib/errors.js';
import { readJsonBody, sendJson } from '../lib/http.js';

const PROJECT_STATUSES = new Set(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED']);

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

async function lockProjectRow(tx, projectId, companyId) {
  const rows = await tx.$queryRaw`
    SELECT "id", "imageUrl"
    FROM "projects"
    WHERE "id" = ${projectId} AND "companyId" = ${companyId}
    FOR UPDATE
  `;
  if (!rows.length) throw new HttpError(404, 'Project not found');
  return rows[0];
}

function normalizeStatus(value, fallback = 'ACTIVE') {
  const status = normalizeText(value || fallback).toUpperCase();
  if (!PROJECT_STATUSES.has(status)) throw new HttpError(400, 'Invalid project status');
  return status;
}

async function verifyProjectImageUrl(value, companyId) {
  const imageUrl = normalizeText(value);
  if (!imageUrl) return null;
  try {
    const asset = await verifyStoredImageAsset({ url: imageUrl, kind: 'project', companyId });
    return asset?.url || null;
  } catch (error) {
    throw new HttpError(400, error?.message || 'Invalid project image');
  }
}

function normalizeEmployeeMembershipIds(value) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw new HttpError(400, 'employeeMembershipIds must be an array');
  return [...new Set(value.map(normalizeText).filter(Boolean))];
}

async function validateEmployeeMembershipIds(tx, companyId, ids) {
  if (!ids?.length) return [];

  const lockedIds = [];
  for (const id of [...ids].sort()) {
    const rows = await tx.$queryRaw`
      SELECT "id"
      FROM "company_memberships"
      WHERE "id" = ${id}
        AND "companyId" = ${companyId}
        AND "role" = 'EMPLOYEE'
        AND "status" = 'ACTIVE'
        AND "deletedAt" IS NULL
      FOR UPDATE
    `;
    if (!rows.length) {
      throw new HttpError(400, 'One or more selected employees are not available in this company');
    }
    lockedIds.push(rows[0].id);
  }

  return lockedIds;
}

const projectInclude = {
  assignments: {
    orderBy: { assignedAt: 'asc' },
    include: {
      membership: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      },
    },
  },
};

function serializeProject(project) {
  return {
    id: project.id,
    name: project.name,
    address: project.address,
    description: project.description,
    imageUrl: project.imageUrl,
    status: project.status,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    employees: (project.assignments || []).map(assignment => ({
      membershipId: assignment.membershipId,
      assignedAt: assignment.assignedAt,
      user: assignment.membership.user,
    })),
  };
}

async function getProjectForMembership(projectId, membership) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, companyId: membership.companyId },
    include: projectInclude,
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

async function listProjects(request, response) {
  const user = await requireAuth(request);
  const membership = requireMembership(user);

  const where = {
    companyId: membership.companyId,
    ...(membership.role === 'EMPLOYEE'
      ? { assignments: { some: { membershipId: membership.id } } }
      : {}),
  };

  const projects = await prisma.project.findMany({
    where,
    include: projectInclude,
    orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
  });

  sendJson(response, 200, { projects: projects.map(serializeProject) });
}

async function getProject(request, response, projectId) {
  const user = await requireAuth(request);
  const membership = requireMembership(user);
  const project = await getProjectForMembership(projectId, membership);
  sendJson(response, 200, { project: serializeProject(project) });
}

async function createProject(request, response) {
  const user = await requireAuth(request);
  const membership = requireMembership(user, 'MANAGER');
  const body = await readJsonBody(request);

  const name = normalizeText(body.name);
  if (!name) throw new HttpError(400, 'Project name is required');
  if (name.length > 120) throw new HttpError(400, 'Project name is too long');

  const imageUrl = await verifyProjectImageUrl(body.imageUrl, membership.companyId);
  const employeeMembershipIds = normalizeEmployeeMembershipIds(body.employeeMembershipIds) || [];
  const project = await prisma.$transaction(async tx => {
    const validatedEmployeeIds = await validateEmployeeMembershipIds(
      tx,
      membership.companyId,
      employeeMembershipIds,
    );

    return tx.project.create({
      data: {
        companyId: membership.companyId,
        name,
        address: normalizeText(body.address) || null,
        description: normalizeText(body.description) || null,
        imageUrl,
        status: normalizeStatus(body.status),
        assignments: {
          create: validatedEmployeeIds.map(membershipId => ({ membershipId })),
        },
      },
      include: projectInclude,
    });
  });

  sendJson(response, 201, { project: serializeProject(project) });
}

async function updateProject(request, response, projectId) {
  const user = await requireAuth(request);
  const membership = requireMembership(user, 'MANAGER');
  const existingProject = await getProjectForMembership(projectId, membership);
  const body = await readJsonBody(request);

  const data = {};
  if (body.name !== undefined) {
    const name = normalizeText(body.name);
    if (!name) throw new HttpError(400, 'Project name is required');
    if (name.length > 120) throw new HttpError(400, 'Project name is too long');
    data.name = name;
  }
  if (body.address !== undefined) data.address = normalizeText(body.address) || null;
  if (body.description !== undefined) data.description = normalizeText(body.description) || null;
  if (body.status !== undefined) data.status = normalizeStatus(body.status);

  const imageProvided = body.imageUrl !== undefined;
  const requestedImageUrl = imageProvided ? normalizeText(body.imageUrl) : undefined;
  let preparedImageUrl;
  if (imageProvided) {
    if (!requestedImageUrl) preparedImageUrl = null;
    else if (requestedImageUrl === existingProject.imageUrl) preparedImageUrl = requestedImageUrl;
    else preparedImageUrl = await verifyProjectImageUrl(requestedImageUrl, membership.companyId);
  }

  const employeeMembershipIds = normalizeEmployeeMembershipIds(body.employeeMembershipIds);

  const project = await prisma.$transaction(async tx => {
    const lockedProject = await lockProjectRow(tx, projectId, membership.companyId);

    if (imageProvided) {
      let nextImageUrl = preparedImageUrl;

      // A form often submits the image value it originally loaded even when the user
      // only edited text. Preserve a newer concurrent image instead of restoring stale data.
      if (
        requestedImageUrl &&
        requestedImageUrl === existingProject.imageUrl &&
        lockedProject.imageUrl !== existingProject.imageUrl
      ) {
        nextImageUrl = lockedProject.imageUrl;
      }

      if (nextImageUrl !== lockedProject.imageUrl) data.imageUrl = nextImageUrl;
    }

    if (employeeMembershipIds !== undefined) {
      const validatedEmployeeIds = await validateEmployeeMembershipIds(
        tx,
        membership.companyId,
        employeeMembershipIds,
      );
      await tx.projectAssignment.deleteMany({ where: { projectId } });
      if (validatedEmployeeIds.length) {
        await tx.projectAssignment.createMany({
          data: validatedEmployeeIds.map(membershipId => ({ projectId, membershipId })),
        });
      }
    }

    return tx.project.update({
      where: { id: projectId },
      data,
      include: projectInclude,
    });
  });

  sendJson(response, 200, { project: serializeProject(project) });
}

async function listEmployees(request, response) {
  const user = await requireAuth(request);
  const membership = requireMembership(user, 'MANAGER');

  const memberships = await prisma.companyMembership.findMany({
    where: {
      companyId: membership.companyId,
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      deletedAt: null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  sendJson(response, 200, {
    employees: memberships.map(item => ({
      membershipId: item.id,
      user: item.user,
    })),
  });
}

export async function handleProjectRoutes(request, response, { pathName }) {
  if (request.method === 'GET' && pathName === '/api/projects') {
    await listProjects(request, response);
    return true;
  }

  if (request.method === 'POST' && pathName === '/api/projects') {
    await createProject(request, response);
    return true;
  }

  if (request.method === 'GET' && pathName === '/api/employees') {
    await listEmployees(request, response);
    return true;
  }

  const match = pathName.match(/^\/api\/projects\/([^/]+)$/);
  if (!match) return false;

  const projectId = decodeURIComponent(match[1]);
  if (request.method === 'GET') {
    await getProject(request, response, projectId);
    return true;
  }
  if (request.method === 'PATCH') {
    await updateProject(request, response, projectId);
    return true;
  }

  return false;
}
