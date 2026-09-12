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
  'ht|odbočka 45°': '/materials/ht-branch-45.webp',
  'ht|odbocka 45°': '/materials/ht-branch-45.webp',
  'ht|spojka': '/materials/ht-coupling.webp',
  'ht|redukce': '/materials/ht-reducer.webp',
  'ht|zátka': '/materials/ht-cap.webp',
  'ht|zatka': '/materials/ht-cap.webp',
  'ht|revizní kus': '/materials/ht-cleanout.webp',
  'ht|revizni kus': '/materials/ht-cleanout.webp',
  'kg|trubka': '/materials/kg-pipe.webp',
  'kg|koleno 90°': '/materials/kg-elbow-90.svg',
  'kg|koleno 45°': '/materials/kg-elbow-45.webp',
  'kg|t-kus': '/materials/kg-tee.webp',
  'kg|odbočka 45°': '/materials/kg-branch-45.webp',
  'kg|odbocka 45°': '/materials/kg-branch-45.webp',
  'kg|spojka': '/materials/kg-coupling.webp',
  'kg|redukce': '/materials/kg-reducer.webp',
  'kg|zátka': '/materials/kg-cap.webp',
  'kg|zatka': '/materials/kg-cap.webp',
  'kg|přechod ht/kg': '/materials/kg-transition.webp',
  'kg|prechod ht/kg': '/materials/kg-transition.webp',
  'steel|trubka': '/materials/steel-pipe.webp',
  'valves|kulový ventil': '/materials/valve-ball.webp',
  'valves|kulovy ventil': '/materials/valve-ball.webp',
  'valves|rohový ventil': '/materials/valve-angle.svg',
  'valves|rohovy ventil': '/materials/valve-angle.svg',
  'valves|zpětná klapka': '/materials/valve-check.svg',
  'valves|zpetna klapka': '/materials/valve-check.svg',
  'valves|filtr': '/materials/valve-filter.svg',
  'valves|pojistný ventil': '/materials/valve-safety.svg',
  'valves|pojistny ventil': '/materials/valve-safety.svg',
  'valves|manometr': '/materials/valve-manometer.svg',
  'valves|odvzdušňovací ventil': '/materials/valve-airvent.svg',
  'valves|odvzdusnovaci ventil': '/materials/valve-airvent.svg',
  'valves|automatický odvzdušňovací ventil': '/materials/valve-airvent.svg',
  'valves|automaticky odvzdusnovaci ventil': '/materials/valve-airvent.svg',
  'valves|expanzní nádoba': '/materials/valve-expansion.svg',
  'valves|expanzni nadoba': '/materials/valve-expansion.svg',
  'geberit|duofix rám': '/materials/geberit-frame.svg',
  'geberit|duofix ram': '/materials/geberit-frame.svg',
  'geberit|instalační rám': '/materials/geberit-frame.svg',
  'geberit|instalacni ram': '/materials/geberit-frame.svg',
  'geberit|ovládací tlačítko': '/materials/geberit-flush-plate.svg',
  'geberit|ovladaci tlacitko': '/materials/geberit-flush-plate.svg',
  'sanita|sifon': '/materials/sanita-siphon.svg',
  'sanita|sprchový žlab': '/materials/sanita-shower-drain.svg',
  'sanita|sprchovy zlab': '/materials/sanita-shower-drain.svg',
  'sanita|závěsné wc': '/materials/sanita-wall-hung-wc.svg',
  'sanita|zavesne wc': '/materials/sanita-wall-hung-wc.svg',
  'sanita|pisoár': '/materials/sanita-urinal.svg',
  'sanita|pisoar': '/materials/sanita-urinal.svg',
};

const EXTRA_CATEGORY_IMAGES = {
  pex_mlcp: '/materials/pex-pipe.webp',
  kg: '/materials/kg-pipe.webp',
  steel: '/materials/steel-pipe.webp',
  valves: '/materials/valve-ball.webp',
  geberit: '/materials/geberit-frame.svg',
  sanita: '/materials/sanita-wall-hung-wc.svg',
};

export function getMaterialImage(item) {
  if (!item) return null;

  const category = String(item.categoryKey || item.categoryLabel || '').trim().toLowerCase();
  const type = String(item.type || '').trim().toLowerCase();
  const extraImage = EXTRA_MATERIAL_IMAGES[`${category}|${type}`] || null;

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
