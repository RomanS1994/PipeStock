import { requireAuth } from '../auth/current-user.js';
import { prisma } from '../db/prisma.js';
import { HttpError } from '../lib/errors.js';
import { readJsonBody, sendJson } from '../lib/http.js';

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

function normalizeText(value) {
  return String(value ?? '').trim();
}

function assertHttpsUrl(value, fieldName) {
  if (!value) return null;
  if (value.length > 2000) throw new HttpError(400, `${fieldName} is too long`);
  if (!/^https:\/\//i.test(value)) throw new HttpError(400, `${fieldName} must use HTTPS`);
  return value;
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
    sku: item.sku,
    imageUrl: item.imageUrl,
    brand: item.brand,
    manufacturerSku: item.manufacturerSku,
    sourceUrl: item.sourceUrl,
    imageSourceUrl: item.imageSourceUrl,
    sourceLabel: item.sourceLabel,
    ...extra,
  };
}

async function listSourceMetadata(request, response) {
  const user = await requireAuth(request);
  requireMembership(user, 'MANAGER');
  const items = await prisma.materialCatalogItem.findMany({
    where: { isActive: true },
    select: {
      id: true,
      brand: true,
      manufacturerSku: true,
      sourceUrl: true,
      imageSourceUrl: true,
      sourceLabel: true,
      imageUrl: true,
    },
  });
  sendJson(response, 200, { items });
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

async function requireCatalogItem(catalogItemId) {
  const item = await prisma.materialCatalogItem.findFirst({ where: { id: catalogItemId, isActive: true } });
  if (!item) throw new HttpError(404, 'Material was not found');
  return item;
}

async function updateCatalogImage(request, response, catalogItemId) {
  const user = await requireAuth(request);
  requireMembership(user, 'MANAGER');
  await requireCatalogItem(catalogItemId);
  const body = await readJsonBody(request);
  const imageUrl = assertHttpsUrl(normalizeText(body.imageUrl), 'Image URL');

  const item = await prisma.materialCatalogItem.update({
    where: { id: catalogItemId },
    data: { imageUrl },
  });
  sendJson(response, 200, { item: serializeCatalogItem(item) });
}

async function updateCatalogSource(request, response, catalogItemId) {
  const user = await requireAuth(request);
  requireMembership(user, 'MANAGER');
  await requireCatalogItem(catalogItemId);
  const body = await readJsonBody(request);

  const brand = normalizeText(body.brand);
  const manufacturerSku = normalizeText(body.manufacturerSku);
  const sourceLabel = normalizeText(body.sourceLabel);
  const sourceUrl = assertHttpsUrl(normalizeText(body.sourceUrl), 'Source URL');
  const imageSourceUrl = assertHttpsUrl(normalizeText(body.imageSourceUrl), 'Image source URL');
  const imageUrl = body.imageUrl === undefined
    ? undefined
    : assertHttpsUrl(normalizeText(body.imageUrl), 'Image URL');

  if (brand.length > 120) throw new HttpError(400, 'Brand is too long');
  if (manufacturerSku.length > 120) throw new HttpError(400, 'Manufacturer SKU is too long');
  if (sourceLabel.length > 160) throw new HttpError(400, 'Source label is too long');

  const item = await prisma.materialCatalogItem.update({
    where: { id: catalogItemId },
    data: {
      brand: brand || null,
      manufacturerSku: manufacturerSku || null,
      sourceLabel: sourceLabel || null,
      sourceUrl,
      imageSourceUrl,
      ...(imageUrl !== undefined ? { imageUrl } : {}),
    },
  });

  sendJson(response, 200, { item: serializeCatalogItem(item) });
}

export async function handleMaterialRoutes(request, response, { pathName }) {
  if (request.method === 'GET' && pathName === '/api/material-catalog/sources') {
    await listSourceMetadata(request, response);
    return true;
  }

  if (request.method === 'GET' && pathName === '/api/materials/favorites') {
    await listFavorites(request, response);
    return true;
  }

  if (request.method === 'GET' && pathName === '/api/materials/recent') {
    await listRecent(request, response);
    return true;
  }

  const sourceMatch = pathName.match(/^\/api\/material-catalog\/([^/]+)\/source$/);
  if (sourceMatch && request.method === 'PATCH') {
    await updateCatalogSource(request, response, decodeURIComponent(sourceMatch[1]));
    return true;
  }

  const imageMatch = pathName.match(/^\/api\/material-catalog\/([^/]+)\/image$/);
  if (imageMatch && request.method === 'PATCH') {
    await updateCatalogImage(request, response, decodeURIComponent(imageMatch[1]));
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
