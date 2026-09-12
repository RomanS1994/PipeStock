import { getMaterialCategoryImage as getBaseCategoryImage, getMaterialImage as getBaseMaterialImage } from './materialImages.js';

const CATEGORY_TYPE_IMAGES = {
  cu: {
    'koleno 45°': '/materials/cu-elbow-45.webp',
    'oblouk 90°': '/materials/cu-elbow-45.webp',
    'přesuvná spojka': '/materials/fitting-slip.svg',
    redukce: '/materials/cu-reducer.webp',
    'přechodka': '/materials/cu-male-adapter.webp',
    'přechodka m': '/materials/cu-male-adapter.webp',
    'přechodka f': '/materials/cu-male-adapter.webp',
    šroubení: '/materials/cu-male-adapter.webp',
    zátka: '/materials/cu-cap.webp',
  },
  ppr: {
    trubka: '/materials/ppr-pipe.webp',
    'koleno 45°': '/materials/ppr-elbow-45.webp',
    spojka: '/materials/ppr-coupling.webp',
    redukce: '/materials/ppr-reducer.webp',
    příruba: '/materials/fitting-flange.svg',
    'přechodka': '/materials/ppr-male-adapter.webp',
    'přechodka m': '/materials/ppr-male-adapter.webp',
    'přechodka f': '/materials/ppr-male-adapter.webp',
    'nástěnné koleno': '/materials/fitting-wall-elbow.svg',
    šroubení: '/materials/ppr-male-adapter.webp',
    křížení: '/materials/ppr-tee.webp',
    'kompenzační smyčka': '/materials/ppr-pipe.webp',
    zátka: '/materials/ppr-cap.svg',
  },
  mlcp: {
    trubka: '/materials/pex-pipe.webp',
    'koleno 90°': '/materials/pex-elbow-90.webp',
    't-kus': '/materials/pex-tee.webp',
    spojka: '/materials/pex-coupling.webp',
    redukce: '/materials/pex-reducer.webp',
    'přechodka m': '/materials/pex-adapter.webp',
    'přechodka f': '/materials/pex-adapter.webp',
    šroubení: '/materials/pex-adapter.webp',
    zátka: '/materials/pex-cap.svg',
    'nástěnné koleno': '/materials/fitting-wall-elbow.svg',
  },
  pex: {
    trubka: '/materials/pex-pipe.webp',
    'koleno 90°': '/materials/pex-elbow-90.webp',
    't-kus': '/materials/pex-tee.webp',
    spojka: '/materials/pex-coupling.webp',
    redukce: '/materials/pex-reducer.webp',
    'přechodka m': '/materials/pex-adapter.webp',
    'přechodka f': '/materials/pex-adapter.webp',
    šroubení: '/materials/pex-adapter.webp',
    zátka: '/materials/pex-cap.svg',
    'nástěnné koleno': '/materials/fitting-wall-elbow.svg',
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
    'přesuvné hrdlo': '/materials/fitting-slip.svg',
    redukce: '/materials/ht-reducer.webp',
    zátka: '/materials/ht-cap.webp',
    'revizní kus': '/materials/ht-cleanout-photo.svg',
  },
  kg: {
    trubka: '/materials/kg-pipe.webp',
    'koleno 15°': '/materials/kg-elbow-45.webp',
    'koleno 30°': '/materials/kg-elbow-45.webp',
    'koleno 45°': '/materials/kg-elbow-45.webp',
    'koleno 67°': '/materials/kg-elbow-90.svg',
    'koleno 87°': '/materials/kg-elbow-90.svg',
    't-kus': '/materials/kg-tee.webp',
    'odbočka 45°': '/materials/kg-branch-45.webp',
    'odbočka 87°': '/materials/kg-tee.webp',
    spojka: '/materials/kg-coupling.webp',
    'přesuvná spojka': '/materials/fitting-slip.svg',
    redukce: '/materials/kg-reducer.webp',
    zátka: '/materials/kg-cap.webp',
    'revizní kus': '/materials/kg-transition.webp',
    'přechod ht/kg': '/materials/kg-transition.webp',
  },
  steel: {
    trubka: '/materials/steel-pipe.webp',
    'koleno 90°': '/materials/steel-fitting.svg',
    'koleno 45°': '/materials/steel-fitting.svg',
    't-kus': '/materials/steel-fitting.svg',
    spojka: '/materials/steel-fitting.svg',
    redukce: '/materials/steel-fitting.svg',
    'přechodka m': '/materials/steel-fitting.svg',
    'přechodka f': '/materials/steel-fitting.svg',
    šroubení: '/materials/steel-fitting.svg',
    zátka: '/materials/steel-fitting.svg',
  },
  brass: {
    vsuvka: '/materials/brass-fitting.svg',
    mufna: '/materials/brass-fitting.svg',
    'koleno 90°': '/materials/brass-fitting.svg',
    't-kus': '/materials/brass-fitting.svg',
    redukce: '/materials/brass-fitting.svg',
    prodloužení: '/materials/brass-fitting.svg',
    šroubení: '/materials/brass-fitting.svg',
    zátka: '/materials/brass-fitting.svg',
  },
  valves: {
    'kulový ventil': '/materials/valve-ball.webp',
    'rohový ventil': '/materials/valve-angle.svg',
    'zpětná klapka': '/materials/valve-check.svg',
    filtr: '/materials/valve-filter.svg',
    'pojistný ventil': '/materials/valve-safety.svg',
    'vypouštěcí ventil': '/materials/valve-angle.svg',
    'redukční ventil': '/materials/valve-safety.svg',
    manometr: '/materials/valve-manometer.svg',
    'odvzdušňovací ventil': '/materials/valve-airvent.svg',
    'automatický odvzdušňovací ventil': '/materials/valve-airvent.svg',
    'expanzní nádoba': '/materials/valve-expansion.svg',
  },
  geberit: {
    'duofix rám': '/materials/geberit-frame.svg',
    'instalační rám': '/materials/geberit-frame.svg',
    'instalační rám wc': '/materials/geberit-frame.svg',
    'instalační rám umyvadlo': '/materials/geberit-frame.svg',
    'instalační rám pisoár': '/materials/geberit-frame.svg',
    'instalační rám bidet': '/materials/geberit-frame.svg',
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
  mlcp: '/materials/pex-pipe.webp',
  pex: '/materials/pex-pipe.webp',
  kg: '/materials/kg-pipe.webp',
  steel: '/materials/steel-pipe.webp',
  brass: '/materials/brass-fitting.svg',
  valves: '/materials/valve-ball.webp',
  geberit: '/materials/geberit-frame.svg',
  sanita: '/materials/sanita-wall-hung-wc.svg',
  other: '/materials/other-material.svg',
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

  if (category === 'ppr') {
    if (mappedImage) return mappedImage;
    return getBaseMaterialImage({ ...item, imageUrl: null });
  }

  const base = getBaseMaterialImage(item);
  if (base) return base;
  return mappedImage;
}

export function getMaterialCategoryImage(categoryKey) {
  const base = getBaseCategoryImage(categoryKey);
  if (base) return base;
  return EXTRA_CATEGORY_IMAGES[normalize(categoryKey)] || null;
}
