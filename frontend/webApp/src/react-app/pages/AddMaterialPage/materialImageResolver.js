import { getMaterialCategoryImage as getBaseCategoryImage, getMaterialImage as getBaseMaterialImage } from './materialImages.js';

const EXTRA_MATERIAL_IMAGES = {
  'cu|koleno 45°': '/materials/cu-elbow-45.webp',
  'cu|redukce': '/materials/cu-reducer.webp',
  'cu|přechodka m': '/materials/cu-male-adapter.webp',
  'cu|prechodka m': '/materials/cu-male-adapter.webp',
  'cu|zátka': '/materials/cu-cap.webp',
  'cu|zatka': '/materials/cu-cap.webp',
  'ppr|trubka': '/materials/ppr-pipe.webp',
  'ppr|spojka': '/materials/ppr-coupling.webp',
  'ppr|redukce': '/materials/ppr-reducer.webp',
  'ppr|přechodka m': '/materials/ppr-male-adapter.webp',
  'ppr|prechodka m': '/materials/ppr-male-adapter.webp',
};

export function getMaterialImage(item) {
  const base = getBaseMaterialImage(item);
  if (base) return base;
  if (!item) return null;
  const category = String(item.categoryKey || item.categoryLabel || '').trim().toLowerCase();
  const type = String(item.type || '').trim().toLowerCase();
  return EXTRA_MATERIAL_IMAGES[`${category}|${type}`] || null;
}

export function getMaterialCategoryImage(categoryKey) {
  return getBaseCategoryImage(categoryKey);
}
