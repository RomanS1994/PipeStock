import { getMaterialCategoryImage as getBaseCategoryImage, getMaterialImage as getBaseMaterialImage } from './materialImages.js';

const CATEGORY_TYPE_IMAGES = {
  cu: {
    trubka: '/materials/cu-pipe.webp',
    'koleno 90°': '/materials/cu-elbow-90.webp',
    'koleno 45°': '/materials/cu-elbow-45.webp',
    'oblouk 90°': '/materials/cu-elbow-45.webp',
    't-kus': '/materials/cu-tee.webp',
    spojka: '/materials/cu-coupling.webp',
    'přesuvná spojka': '/materials/cu-coupling.webp',
    redukce: '/materials/cu-reducer.webp',
    přechodka: '/materials/cu-male-adapter.webp',
    'přechodka m': '/materials/cu-male-adapter.webp',
    'přechodka f': '/materials/cu-male-adapter.webp',
    šroubení: '/materials/cu-male-adapter.webp',
    zátka: '/materials/cu-cap.webp',
  },
  ppr: {
    trubka: '/materials/ppr-pipe.webp',
    'koleno 90°': '/materials/ppr-elbow-90.webp',
    'koleno 45°': '/materials/ppr-elbow-45.webp',
    't-kus': '/materials/ppr-tee.webp',
    spojka: '/materials/ppr-coupling.webp',
    redukce: '/materials/ppr-reducer.webp',
    příruba: '/materials/ppr-pipe.webp',
    přechodka: '/materials/ppr-male-adapter.webp',
    'přechodka m': '/materials/ppr-male-adapter.webp',
    'přechodka f': '/materials/ppr-male-adapter.webp',
    'nástěnné koleno': '/materials/ppr-elbow-45.webp',
    šroubení: '/materials/ppr-male-adapter.webp',
    křížení: '/materials/ppr-tee.webp',
    'kompenzační smyčka': '/materials/ppr-pipe.webp',
    zátka: '/materials/ppr-cap.svg',
  },
  mlcp: {
    trubka: '/materials/category-mlcp.webp',
    'koleno 90°': '/materials/pex-elbow-90.webp',
    'koleno 45°': '/materials/pex-elbow-90.webp',
    't-kus': '/materials/pex-tee.webp',
    spojka: '/materials/pex-coupling.webp',
    redukce: '/materials/pex-reducer.webp',
    'přechodka m': '/materials/pex-adapter.webp',
    'přechodka f': '/materials/pex-adapter.webp',
    šroubení: '/materials/pex-adapter.webp',
    zátka: '/materials/pex-cap.svg',
    'nástěnné koleno': '/materials/pex-elbow-90.webp',
  },
  pex: {
    trubka: '/materials/pex-pipe.webp',
    'koleno 90°': '/materials/pex-elbow-90.webp',
    'koleno 45°': '/materials/pex-elbow-90.webp',
    't-kus': '/materials/pex-tee.webp',
    spojka: '/materials/pex-coupling.webp',
    redukce: '/materials/pex-reducer.webp',
    'přechodka m': '/materials/pex-adapter.webp',
    'přechodka f': '/materials/pex-adapter.webp',
    šroubení: '/materials/pex-adapter.webp',
    zátka: '/materials/pex-cap.svg',
    'nástěnné koleno': '/materials/pex-elbow-90.webp',
  },
  ht: {
    trubka: '/materials/ht-pipe.webp',
    'koleno 15°': '/materials/ht-elbow-45.webp',
    'koleno 30°': '/materials/ht-elbow-45.webp',
    'koleno 45°': '/materials/ht-elbow-45.webp',
    'koleno 67°': '/materials/ht-elbow-87.webp',
    'koleno 87°': '/materials/ht-elbow-87.webp',
    't-kus': '/materials/ht-tee.webp',
    'odbočka 45°': '/materials/ht-branch-45-photo.svg',
    'odbočka 67°': '/materials/ht-branch-45-photo.svg',
    'odbočka 87°': '/materials/ht-tee.webp',
    'dvojitá odbočka': '/materials/ht-tee.webp',
    spojka: '/materials/ht-coupling.webp',
    'přesuvné hrdlo': '/materials/ht-coupling.webp',
    redukce: '/materials/ht-reducer.webp',
    zátka: '/materials/ht-cap.webp',
    'revizní kus': '/materials/ht-cleanout-photo.svg',
  },
  kg: {
    trubka: '/materials/kg-pipe.webp',
    'koleno 15°': '/materials/kg-elbow-45.webp',
    'koleno 30°': '/materials/kg-elbow-45.webp',
    'koleno 45°': '/materials/kg-elbow-45.webp',
    'koleno 67°': '/materials/kg-elbow-45.webp',
    'koleno 87°': '/materials/kg-elbow-45.webp',
    't-kus': '/materials/kg-tee.webp',
    'odbočka 45°': '/materials/kg-branch-45.webp',
    'odbočka 87°': '/materials/kg-tee.webp',
    spojka: '/materials/kg-coupling.webp',
    'přesuvná spojka': '/materials/kg-coupling.webp',
    redukce: '/materials/kg-reducer.webp',
    zátka: '/materials/kg-cap.webp',
    'revizní kus': '/materials/kg-transition.webp',
    'přechod ht/kg': '/materials/kg-transition.webp',
  },
  steel: {
    trubka: '/materials/steel-pipe.webp',
    'koleno 90°': '/materials/category-steel.webp',
    'koleno 45°': '/materials/category-steel.webp',
    't-kus': '/materials/category-steel.webp',
    spojka: '/materials/category-steel.webp',
    redukce: '/materials/category-steel.webp',
    'přechodka m': '/materials/category-steel.webp',
    'přechodka f': '/materials/category-steel.webp',
    šroubení: '/materials/category-steel.webp',
    zátka: '/materials/category-steel.webp',
  },
  brass: {
    vsuvka: '/materials/category-brass.webp',
    mufna: '/materials/category-brass.webp',
    'koleno 90°': '/materials/category-brass.webp',
    't-kus': '/materials/category-brass.webp',
    redukce: '/materials/category-brass.webp',
    prodloužení: '/materials/category-brass.webp',
    šroubení: '/materials/category-brass.webp',
    zátka: '/materials/category-brass.webp',
  },
  valves: {
    'kulový ventil': '/materials/valve-ball.webp',
    'rohový ventil': '/materials/valve-ball.webp',
    'zpětná klapka': '/materials/valve-check.svg',
    filtr: '/materials/valve-filter.svg',
    'pojistný ventil': '/materials/valve-safety.svg',
    'vypouštěcí ventil': '/materials/valve-ball.webp',
    'redukční ventil': '/materials/valve-safety.svg',
    manometr: '/materials/valve-manometer.svg',
    'odvzdušňovací ventil': '/materials/valve-airvent.svg',
    'automatický odvzdušňovací ventil': '/materials/valve-airvent.svg',
    'expanzní nádoba': '/materials/valve-expansion.svg',
  },
  geberit: {
    'duofix rám': '/materials/category-geberit.webp',
    'instalační rám': '/materials/category-geberit.webp',
    'instalační rám wc': '/materials/category-geberit.webp',
    'instalační rám umyvadlo': '/materials/category-geberit.webp',
    'instalační rám pisoár': '/materials/category-geberit.webp',
    'instalační rám bidet': '/materials/category-geberit.webp',
    'ovládací tlačítko': '/materials/geberit-flush-plate.svg',
    'napouštěcí ventil': '/materials/geberit-part.svg',
    'vypouštěcí ventil': '/materials/geberit-part.svg',
    'připojovací souprava wc': '/materials/geberit-part.svg',
    'kotvení rámu': '/materials/geberit-part.svg',
    'zvuková izolace wc': '/materials/geberit-part.svg',
  },
  sanita: {
    sifon: '/materials/sanita-siphon.svg',
    'sifon umyvadlový': '/materials/sanita-siphon.svg',
    'sifon dřezový': '/materials/sanita-siphon.svg',
    'sifon vanový': '/materials/sanita-siphon.svg',
    'sifon sprchový': '/materials/sanita-siphon.svg',
    'sprchový žlab': '/materials/sanita-shower-drain.svg',
    'podlahová vpusť': '/materials/sanita-floor-drain.svg',
    'závěsné wc': '/materials/sanita-wall-hung-wc.svg',
    'stojící wc': '/materials/sanita-floor-wc.svg',
    umyvadlo: '/materials/sanita-washbasin.svg',
    bidet: '/materials/sanita-bidet.svg',
    pisoár: '/materials/sanita-urinal.svg',
    'wc manžeta': '/materials/sanita-wc-connector.svg',
  },
  other: {
    jiné: '/materials/other-material.svg',
  },
};

const EXTRA_CATEGORY_IMAGES = {
  cu: '/materials/category-cu.webp',
  ppr: '/materials/category-ppr.webp',
  mlcp: '/materials/category-mlcp.webp',
  pex: '/materials/category-pex.webp',
  ht: '/materials/category-ht.webp',
  kg: '/materials/category-kg.webp',
  steel: '/materials/category-steel.webp',
  brass: '/materials/category-brass.webp',
  valves: '/materials/category-valves.webp',
  geberit: '/materials/category-geberit.webp',
  sanita: '/materials/category-sanita.webp',
  other: '/materials/category-other.webp',
};

function normalize(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function findMappedImage(category, type) {
  const group = CATEGORY_TYPE_IMAGES[category];
  if (!group) return null;
  if (group[type]) return group[type];
  const normalizedType = normalize(type);
  const match = Object.entries(group).find(([key]) => normalize(key) === normalizedType);
  return match?.[1] || null;
}

export function getMaterialImage(item) {
  if (!item) return null;

  const category = normalize(item.categoryKey || item.categoryLabel);
  const type = String(item.type || '').trim().toLowerCase();
  const mappedImage = findMappedImage(category, type);

  if (mappedImage) return mappedImage;

  return getBaseMaterialImage(item);
}

export function getMaterialCategoryImage(categoryKey) {
  const key = normalize(categoryKey);
  const extra = EXTRA_CATEGORY_IMAGES[key];
  if (extra) return extra;
  return getBaseCategoryImage(categoryKey);
}
