import { getMaterialCategoryImage as getBaseCategoryImage, getMaterialImage as getBaseMaterialImage } from './materialImages.js';

const EXTRA_MATERIAL_IMAGES = {
  'cu|koleno 45°': '/materials/cu-elbow-45.webp',
  'cu|redukce': '/materials/cu-reducer.webp',
  'cu|přechodka': '/materials/cu-male-adapter.webp',
  'cu|prechodka': '/materials/cu-male-adapter.webp',
  'cu|přechodka m': '/materials/cu-male-adapter.webp',
  'cu|prechodka m': '/materials/cu-male-adapter.webp',
  'cu|zátka': '/materials/cu-cap.webp',
  'cu|zatka': '/materials/cu-cap.webp',
  'ppr|trubka': '/materials/ppr-pipe.webp',
  'ppr|koleno 45°': '/materials/ppr-elbow-45.webp',
  'ppr|spojka': '/materials/ppr-coupling.webp',
  'ppr|redukce': '/materials/ppr-reducer.webp',
  'ppr|přechodka': '/materials/ppr-male-adapter.webp',
  'ppr|prechodka': '/materials/ppr-male-adapter.webp',
  'ppr|přechodka m': '/materials/ppr-male-adapter.webp',
  'ppr|prechodka m': '/materials/ppr-male-adapter.webp',
  'pex_mlcp|trubka': '/materials/pex-pipe.webp',
  'pex_mlcp|koleno 90°': '/materials/pex-elbow-90.webp',
  'pex_mlcp|t-kus': '/materials/pex-tee.webp',
  'pex_mlcp|spojka': '/materials/pex-coupling.webp',
  'pex_mlcp|redukce': '/materials/pex-reducer.webp',
  'pex_mlcp|přechodka': '/materials/pex-adapter.webp',
  'pex_mlcp|prechodka': '/materials/pex-adapter.webp',
  'pex_mlcp|přechodka m': '/materials/pex-adapter.webp',
  'pex_mlcp|prechodka m': '/materials/pex-adapter.webp',
  'ht|koleno 45°': '/materials/ht-elbow-45.webp',
  'ht|koleno 87°': '/materials/ht-elbow-87.webp',
  'ht|t-kus': '/materials/ht-tee.webp',
  'ht|spojka': '/materials/ht-coupling.webp',
  'ht|redukce': '/materials/ht-reducer.webp',
  'kg|trubka': '/materials/kg-pipe.webp',
  'kg|koleno 45°': '/materials/kg-elbow-45.webp',
  'steel|trubka': '/materials/steel-pipe.webp',
  'valves|kulový ventil': '/materials/valve-ball.webp',
  'valves|kulovy ventil': '/materials/valve-ball.webp',
};

const EXTRA_CATEGORY_IMAGES = {
  pex_mlcp: '/materials/pex-pipe.webp',
  kg: '/materials/kg-pipe.webp',
  steel: '/materials/steel-pipe.webp',
  valves: '/materials/valve-ball.webp',
};

export function getMaterialImage(item) {
  if (!item) return null;

  const category = String(item.categoryKey || item.categoryLabel || '').trim().toLowerCase();
  const type = String(item.type || '').trim().toLowerCase();
  const extraImage = EXTRA_MATERIAL_IMAGES[`${category}|${type}`] || null;

  // PipeStock uses one consistent white PPR visual language. For PPR we always
  // prefer bundled/generated assets over a legacy catalog imageUrl so a stale
  // green manufacturer image cannot leak back into the material picker.
  if (category === 'ppr') {
    if (extraImage) return extraImage;
    return getBaseMaterialImage({ ...item, imageUrl: null });
  }

  const base = getBaseMaterialImage(item);
  if (base) return base;
  return extraImage;
}

export function getMaterialCategoryImage(categoryKey) {
  const base = getBaseCategoryImage(categoryKey);
  if (base) return base;
  const key = String(categoryKey || '').trim().toLowerCase();
  return EXTRA_CATEGORY_IMAGES[key] || null;
}
