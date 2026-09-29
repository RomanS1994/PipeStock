import { getMaterialCategoryImage as getBaseCategoryImage, getMaterialImage as getBaseMaterialImage } from './materialImages.js';

function withBasePath(source) {
  if (!source || source.startsWith('data:') || source.startsWith('http') || !source.startsWith('/')) return source;
  return `${import.meta.env?.BASE_URL || '/'}${source.slice(1)}`;
}

const CATEGORY_TYPE_IMAGES = {
  cu: {
    trubka: '/materials/cu-pipe.webp',
    'koleno 90°': '/materials/cu-elbow-90.webp',
    'koleno 45°': '/materials/cu-elbow-45.webp',
    'oblouk 90°': '/materials/cu-bend-90.webp',
    't-kus': '/materials/cu-tee.webp',
    spojka: '/materials/cu-coupling.webp',
    'přesuvná spojka': '/materials/cu-slip-coupling.webp',
    redukce: '/materials/cu-reducer.webp',
    přechodka: '/materials/cu-male-adapter.webp',
    'přechodka m': '/materials/cu-male-adapter.webp',
    'přechodka f': '/materials/cu-female-adapter.webp',
    šroubení: '/materials/cu-union.webp',
    zátka: '/materials/cu-cap.webp',
  },
  ppr: {
    trubka: '/materials/ppr-pipe.webp',
    'koleno 90°': '/materials/ppr-elbow-90.webp',
    'koleno 45°': '/materials/ppr-elbow-45.webp',
    't-kus': '/materials/ppr-tee.webp',
    spojka: '/materials/ppr-coupling.webp',
    redukce: '/materials/ppr-reducer.webp',
    příruba: '/materials/ppr-flange.webp',
    přechodka: '/materials/ppr-male-adapter.webp',
    'přechodka m': '/materials/ppr-male-adapter.webp',
    'přechodka f': '/materials/ppr-female-adapter.webp',
    'nástěnné koleno': '/materials/ppr-wall-elbow.webp',
    šroubení: '/materials/ppr-union.webp',
    křížení: '/materials/ppr-crossing.webp',
    'kompenzační smyčka': '/materials/ppr-compensation-loop.webp',
    zátka: '/materials/ppr-cap.webp',
  },
  mlcp: {
    trubka: '/materials/category-mlcp.webp',
    'koleno 90°': '/materials/mlcp-elbow-90.webp',
    'koleno 45°': '/materials/mlcp-elbow-45.webp',
    't-kus': '/materials/mlcp-tee.webp',
    spojka: '/materials/mlcp-coupling.webp',
    redukce: '/materials/mlcp-reducer.webp',
    'přechodka m': '/materials/mlcp-male-adapter.webp',
    'přechodka f': '/materials/mlcp-female-adapter.webp',
    šroubení: '/materials/mlcp-union.webp',
    zátka: '/materials/mlcp-cap.webp',
    'nástěnné koleno': '/materials/mlcp-wall-elbow.webp',
  },
  pex: {
    trubka: '/materials/pex-pipe.webp',
    'koleno 90°': '/materials/pex-elbow-90.webp',
    'koleno 45°': '/materials/pex-elbow-45.webp',
    't-kus': '/materials/pex-tee.webp',
    spojka: '/materials/pex-coupling.webp',
    redukce: '/materials/pex-reducer.webp',
    'přechodka m': '/materials/pex-adapter.webp',
    'přechodka f': '/materials/pex-female-adapter.webp',
    šroubení: '/materials/pex-union.webp',
    zátka: '/materials/pex-cap-photo.webp',
    'nástěnné koleno': '/materials/pex-wall-elbow.webp',
  },
  ht: {
    trubka: '/materials/ht-pipe.webp',
    'koleno 15°': '/materials/ht-elbow-15.webp',
    'koleno 30°': '/materials/ht-elbow-30.webp',
    'koleno 45°': '/materials/ht-elbow-45.webp',
    'koleno 67°': '/materials/ht-elbow-67.webp',
    'koleno 87°': '/materials/ht-elbow-87.webp',
    't-kus': '/materials/ht-tee.webp',
    'odbočka 45°': '/materials/ht-branch-45.webp',
    'odbočka 67°': '/materials/ht-branch-67.webp',
    'odbočka 87°': '/materials/ht-branch-87.webp',
    'dvojitá odbočka': '/materials/ht-double-branch.webp',
    spojka: '/materials/ht-coupling.webp',
    'přesuvné hrdlo': '/materials/ht-slip-socket.webp',
    redukce: '/materials/ht-reducer.webp',
    zátka: '/materials/ht-cap.webp',
    'revizní kus': '/materials/ht-cleanout.webp',
  },
  kg: {
    trubka: '/materials/kg-pipe.webp',
    'koleno 15°': '/materials/kg-elbow-15.webp',
    'koleno 30°': '/materials/kg-elbow-30.webp',
    'koleno 45°': '/materials/kg-elbow-45.webp',
    'koleno 67°': '/materials/kg-elbow-67.webp',
    'koleno 87°': '/materials/kg-elbow-87.webp',
    't-kus': '/materials/kg-tee.webp',
    'odbočka 45°': '/materials/kg-branch-45.webp',
    'odbočka 87°': '/materials/kg-branch-87.webp',
    spojka: '/materials/kg-coupling.webp',
    'přesuvná spojka': '/materials/kg-slip-coupling.webp',
    redukce: '/materials/kg-reducer.webp',
    zátka: '/materials/kg-cap.webp',
    'revizní kus': '/materials/kg-cleanout.webp',
    'přechod ht/kg': '/materials/kg-transition.webp',
  },
  steel: {
    trubka: '/materials/steel-pipe.webp',
    'koleno 90°': '/materials/steel-elbow-90.webp',
    'koleno 45°': '/materials/steel-elbow-45.webp',
    't-kus': '/materials/steel-tee.webp',
    spojka: '/materials/steel-coupling.webp',
    redukce: '/materials/steel-reducer.webp',
    'přechodka m': '/materials/steel-male-adapter.webp',
    'přechodka f': '/materials/steel-female-adapter.webp',
    šroubení: '/materials/steel-union.webp',
    zátka: '/materials/steel-cap.webp',
  },
  brass: {
    vsuvka: '/materials/brass-nipple.webp',
    mufna: '/materials/brass-coupling.webp',
    'koleno 90°': '/materials/brass-elbow-90.webp',
    't-kus': '/materials/brass-tee.webp',
    redukce: '/materials/brass-reducer.webp',
    prodloužení: '/materials/brass-extension.webp',
    šroubení: '/materials/brass-union.webp',
    zátka: '/materials/brass-cap.webp',
  },
  valves: {
    'kulový ventil': '/materials/valve-ball.webp',
    'rohový ventil': '/materials/valve-angle-photo.webp',
    'zpětná klapka': '/materials/valve-check-photo.webp',
    filtr: '/materials/valve-filter-photo.webp',
    'pojistný ventil': '/materials/valve-safety-photo.webp',
    'vypouštěcí ventil': '/materials/valve-drain-photo.webp',
    'redukční ventil': '/materials/valve-pressure-reducing-photo.webp',
    manometr: '/materials/valve-manometer-photo.webp',
    'odvzdušňovací ventil': '/materials/valve-airvent-photo.webp',
    'automatický odvzdušňovací ventil': '/materials/valve-auto-airvent-photo.webp',
    'expanzní nádoba': '/materials/valve-expansion-photo.webp',
  },
  geberit: {
    'duofix rám': '/materials/category-geberit.webp',
    'instalační rám': '/materials/category-geberit.webp',
    'instalační rám wc': '/materials/category-geberit.webp',
    'instalační rám umyvadlo': '/materials/geberit-frame-basin.webp',
    'instalační rám pisoár': '/materials/geberit-frame-urinal.webp',
    'instalační rám bidet': '/materials/geberit-frame-bidet.webp',
    'ovládací tlačítko': '/materials/geberit-flush-plate-photo.webp',
    'napouštěcí ventil': '/materials/geberit-fill-valve-photo.webp',
    'vypouštěcí ventil': '/materials/geberit-flush-valve-photo.webp',
    'připojovací souprava wc': '/materials/geberit-wc-connection-photo.webp',
    'kotvení rámu': '/materials/geberit-frame-anchor-photo.webp',
    'zvuková izolace wc': '/materials/geberit-sound-insulation-photo.webp',
  },
  sanita: {
    sifon: '/materials/sanita-basin-siphon-photo.webp',
    'sifon umyvadlový': '/materials/sanita-basin-siphon-photo.webp',
    'sifon dřezový': '/materials/sanita-sink-siphon-photo.webp',
    'sifon vanový': '/materials/sanita-bathtub-siphon-photo.webp',
    'sifon sprchový': '/materials/sanita-shower-siphon-photo.webp',
    'sprchový žlab': '/materials/sanita-shower-drain-photo.webp',
    'podlahová vpusť': '/materials/sanita-floor-drain-photo.webp',
    'závěsné wc': '/materials/sanita-wall-hung-wc-photo.webp',
    'stojící wc': '/materials/sanita-floor-wc-photo.webp',
    umyvadlo: '/materials/sanita-washbasin-photo.webp',
    bidet: '/materials/sanita-bidet-photo.webp',
    pisoár: '/materials/sanita-urinal-photo.webp',
    'wc manžeta': '/materials/sanita-wc-connector-photo.webp',
  },
  other: {
    jiné: '/materials/category-other.webp',
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

const MOUNTING_MATERIAL_SPRITES = {
  1: '/materials/other-materials-sprite-1.webp',
  2: '/materials/other-materials-sprite-2.webp',
  3: '/materials/other-materials-sprite-3.webp',
};
// Each tuple is [sprite number, column, row] in a 4×4 contact sheet.
const MOUNTING_MATERIAL_CELLS = {
  'Objímka potrubí': [1, 0, 0],
  'Montážní lišta': [1, 1, 0],
  'Izolace potrubí': [1, 2, 0],
  'Kaučuková izolace': [1, 3, 0],
  'Izolační páska': [1, 0, 1],
  'PTFE páska': [1, 1, 1],
  'Konopí': [1, 2, 1],
  'Těsnicí pasta': [1, 3, 1],
  'Sanitární silikon': [1, 0, 2],
  'Teflonová nit': [1, 1, 2],
  'Těsnicí šňůra': [1, 2, 2],
  'Anaerobní těsnění závitů': [1, 3, 2],
  'Zajišťovač závitů': [1, 0, 3],
  'Ploché těsnění': [1, 1, 3],
  'Sada O-kroužků': [1, 2, 3],
  'Mazivo na HT/KG těsnění': [1, 3, 3],
  'Hmoždinka': [2, 0, 0],
  'Vrut': [2, 1, 0],
  'Závitová tyč': [2, 2, 0],
  'Matice': [2, 3, 0],
  'Podložka': [2, 0, 1],
  'Montážní konzole': [2, 1, 1],
  'Matice do montážní lišty': [2, 2, 1],
  'Spojka montážní lišty': [2, 3, 1],
  'HT těsnění': [2, 0, 2],
  'KG těsnění': [2, 1, 2],
  'Přechodová manžeta': [2, 2, 2],
  'Perlátor': [2, 3, 2],
  'Flexi hadička': [2, 0, 3],
  'Krycí rozeta': [2, 1, 3],
  'Požární manžeta': [2, 2, 3],
  'Řezný kotouč kov': [3, 0, 0],
  'Řezný kotouč plast': [3, 1, 0],
  'Vrták': [3, 2, 0],
  'Brusný papír': [3, 3, 0],
  'Čisticí hadřík': [3, 0, 1],
  'Odmašťovač': [3, 1, 1],
  'Popisovač potrubí': [3, 2, 1],
  'Štítek na potrubí': [3, 3, 1],
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

  if (mappedImage) return withBasePath(mappedImage);

  return withBasePath(getBaseMaterialImage(item));
}

export function getMaterialVisual(item) {
  if (normalize(item?.categoryKey || item?.categoryLabel) === 'other') {
    const cell = MOUNTING_MATERIAL_CELLS[item?.type];
    if (cell) {
      const [sprite, column, row] = cell;
      const image = MOUNTING_MATERIAL_SPRITES[sprite];
      const imageUrl = withBasePath(image);
      return {
        kind: 'sprite',
        src: imageUrl,
        style: {
          backgroundImage: `url("${imageUrl}")`,
          backgroundPosition: `${column * (100 / 3)}% ${row * (100 / 3)}%`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: '400% 400%',
        },
      };
    }
  }

  const src = getMaterialImage(item);
  return src ? { kind: 'image', src } : null;
}

export function getMaterialCategoryImage(categoryKey) {
  const key = normalize(categoryKey);
  const extra = EXTRA_CATEGORY_IMAGES[key];
  if (extra) return withBasePath(extra);
  return withBasePath(getBaseCategoryImage(categoryKey));
}
