import { requireAuth } from '../auth/current-user.js';
import { prisma } from '../db/prisma.js';
import { HttpError } from '../lib/errors.js';
import { sendJson } from '../lib/http.js';

function getActiveMembership(user) {
  return (user.memberships || []).find(
    membership => membership.status === 'ACTIVE' && !membership.deletedAt,
  );
}

function requireMembership(user, role) {
  const membership = getActiveMembership(user);
  if (!membership) throw new HttpError(403, 'Company access is required');
  if (role && membership.role !== role) throw new HttpError(403, 'Manager access is required');
  return membership;
}

function serializeCatalogItem(item, extra = {}) {
  return {
    id: item.id,
    key: item.key,
    categoryKey: item.categoryKey,
    categoryLabel: item.categoryLabel,
    diameter: item.diameter,
    type: item.type,
    name: item.name,
    unit: item.unit,
    imageUrl: item.imageUrl,
    ...extra,
  };
}

async function listFavorites(request, response) {
  const user = await requireAuth(request);
  requireMembership(user);

  const favorites = await prisma.materialFavorite.findMany({
    where: { userId: user.id, catalogItem: { isActive: true } },
    include: { catalogItem: true },
    orderBy: { createdAt: 'desc' },
  });

  sendJson(response, 200, {
    items: favorites.map(favorite => serializeCatalogItem(favorite.catalogItem, {
      favorite: true,
      favoritedAt: favorite.createdAt,
    })),
  });
}

async function listRecent(request, response) {
  const user = await requireAuth(request);
  const membership = requireMembership(user);

  const items = await prisma.orderItem.findMany({
    where: {
      catalogItemId: { not: null },
      order: {
        companyId: membership.companyId,
        createdByMembership: { userId: user.id },
      },
      catalogItem: { isActive: true },
    },
    include: { catalogItem: true },
    orderBy: { createdAt: 'desc' },
    take: 40,
  });

  const seen = new Set();
  const recent = [];
  for (const item of items) {
    if (!item.catalogItem || seen.has(item.catalogItem.id)) continue;
    seen.add(item.catalogItem.id);
    recent.push(serializeCatalogItem(item.catalogItem, { lastUsedAt: item.createdAt }));
    if (recent.length >= 12) break;
  }

  sendJson(response, 200, { items: recent });
}

async function addFavorite(request, response, catalogItemId) {
  const user = await requireAuth(request);
  requireMembership(user);

  const item = await prisma.materialCatalogItem.findFirst({
    where: { id: catalogItemId, isActive: true },
  });
  if (!item) throw new HttpError(404, 'Material was not found');

  await prisma.materialFavorite.upsert({
    where: { userId_catalogItemId: { userId: user.id, catalogItemId } },
    update: {},
    create: { userId: user.id, catalogItemId },
  });

  sendJson(response, 200, { item: serializeCatalogItem(item, { favorite: true }) });
}

async function removeFavorite(request, response, catalogItemId) {
  const user = await requireAuth(request);
  requireMembership(user);
  await prisma.materialFavorite.deleteMany({ where: { userId: user.id, catalogItemId } });
  sendJson(response, 200, { ok: true });
}

export async function handleMaterialRoutes(request, response, { pathName }) {
  if (request.method === 'GET' && pathName === '/api/materials/favorites') {
    await listFavorites(request, response);
    return true;
  }

  if (request.method === 'GET' && pathName === '/api/materials/recent') {
    await listRecent(request, response);
    return true;
  }

  const favoriteMatch = pathName.match(/^\/api\/materials\/favorites\/([^/]+)$/);
  if (!favoriteMatch) return false;

  const catalogItemId = decodeURIComponent(favoriteMatch[1]);
  if (request.method === 'POST') {
    await addFavorite(request, response, catalogItemId);
    return true;
  }
  if (request.method === 'DELETE') {
    await removeFavorite(request, response, catalogItemId);
    return true;
  }

  return false;
}
