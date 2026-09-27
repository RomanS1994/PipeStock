const CATEGORY_LABELS = {
  BRASS: 'Mosaz',
  CU: 'Měď',
  GEBERIT: 'Geberit',
  HT: 'HT',
  KG: 'KG',
  MLCP: 'MLCP',
  OTHER: 'Montážní materiál',
  PEX: 'PEX',
  PPR: 'PPR',
  SANITA: 'Sanita',
  STEEL: 'Uhlíková ocel',
  VALVES: 'Ventily',
};

const CATEGORY_IMAGES = {
  BRASS: '/materials/category-brass.webp',
  CU: '/materials/category-cu.webp',
  GEBERIT: '/materials/category-geberit.webp',
  HT: '/materials/category-ht.webp',
  KG: '/materials/category-kg.webp',
  MLCP: '/materials/category-mlcp.webp',
  OTHER: '/materials/category-other.webp',
  PEX: '/materials/category-pex.webp',
  PPR: '/materials/category-ppr.webp',
  SANITA: '/materials/category-sanita.webp',
  STEEL: '/materials/category-steel.webp',
  VALVES: '/materials/category-valves.webp',
};

const TYPE_IMAGES = {
  BRASS: {
    'Vsuvka': '/materials/brass-nipple.webp',
    'Mufna': '/materials/brass-coupling.webp',
    'Koleno 90°': '/materials/brass-elbow-90.webp',
    'T-kus': '/materials/brass-tee.webp',
    'Redukce': '/materials/brass-reducer.webp',
    'Prodloužení': '/materials/brass-extension.webp',
    'Šroubení': '/materials/brass-union.webp',
    'Zátka': '/materials/brass-cap.webp',
  },
  CU: {
    'Trubka': '/materials/cu-pipe.webp',
    'Koleno 90°': '/materials/cu-elbow-90.webp',
    'Koleno 45°': '/materials/cu-elbow-45.webp',
    'Oblouk': '/materials/cu-bend-90.webp',
    'Oblouk 90°': '/materials/cu-bend-90.webp',
    'T-kus': '/materials/cu-tee.webp',
    'Spojka': '/materials/cu-coupling.webp',
    'Přesuvná spojka': '/materials/cu-slip-coupling.webp',
    'Redukce': '/materials/cu-reducer.webp',
    'Přechodka': '/materials/cu-male-adapter.webp',
    'Přechodka M': '/materials/cu-male-adapter.webp',
    'Přechodka F': '/materials/cu-female-adapter.webp',
    'Šroubení': '/materials/cu-union.webp',
    'Zátka': '/materials/cu-cap.webp',
  },
  GEBERIT: {
    'Duofix rám': '/materials/category-geberit.webp',
    'Instalační rám': '/materials/category-geberit.webp',
    'Instalační rám WC': '/materials/category-geberit.webp',
    'Instalační rám umyvadlo': '/materials/geberit-frame-basin.webp',
    'Instalační rám pisoár': '/materials/geberit-frame-urinal.webp',
    'Instalační rám bidet': '/materials/geberit-frame-bidet.webp',
    'Ovládací tlačítko': '/materials/geberit-flush-plate-photo.webp',
    'Napouštěcí ventil': '/materials/geberit-fill-valve-photo.webp',
    'Vypouštěcí ventil': '/materials/geberit-flush-valve-photo.webp',
    'Připojovací souprava WC': '/materials/geberit-wc-connection-photo.webp',
    'Kotvení rámu': '/materials/geberit-frame-anchor-photo.webp',
    'Zvuková izolace WC': '/materials/geberit-sound-insulation-photo.webp',
  },
  HT: {
    'Trubka': '/materials/ht-pipe.webp',
    'Koleno 15°': '/materials/ht-elbow-15.webp',
    'Koleno 30°': '/materials/ht-elbow-30.webp',
    'Koleno 45°': '/materials/ht-elbow-45.webp',
    'Koleno 67°': '/materials/ht-elbow-67.webp',
    'Koleno 87°': '/materials/ht-elbow-87.webp',
    'Koleno 90°': '/materials/ht-elbow-90.webp',
    'T-kus': '/materials/ht-tee.webp',
    'Odbočka 45°': '/materials/ht-branch-45.webp',
    'Odbočka 67°': '/materials/ht-branch-67.webp',
    'Odbočka 87°': '/materials/ht-branch-87.webp',
    'Dvojitá odbočka': '/materials/ht-double-branch.webp',
    'Spojka': '/materials/ht-coupling.webp',
    'Přesuvné hrdlo': '/materials/ht-slip-socket.webp',
    'Redukce': '/materials/ht-reducer.webp',
    'Zátka': '/materials/ht-cap.webp',
    'Revizní kus': '/materials/ht-cleanout.webp',
  },
  KG: {
    'Trubka': '/materials/kg-pipe.webp',
    'Koleno 15°': '/materials/kg-elbow-15.webp',
    'Koleno 30°': '/materials/kg-elbow-30.webp',
    'Koleno 45°': '/materials/kg-elbow-45.webp',
    'Koleno 67°': '/materials/kg-elbow-67.webp',
    'Koleno 87°': '/materials/kg-elbow-87.webp',
    'Koleno 90°': '/materials/kg-elbow-90.svg',
    'T-kus': '/materials/kg-tee.webp',
    'Odbočka 45°': '/materials/kg-branch-45.webp',
    'Odbočka 87°': '/materials/kg-branch-87.webp',
    'Spojka': '/materials/kg-coupling.webp',
    'Přesuvná spojka': '/materials/kg-slip-coupling.webp',
    'Redukce': '/materials/kg-reducer.webp',
    'Zátka': '/materials/kg-cap.webp',
    'Revizní kus': '/materials/kg-cleanout.webp',
    'Přechod HT/KG': '/materials/kg-transition.webp',
  },
  MLCP: {
    'Trubka': '/materials/category-mlcp.webp',
    'Koleno 90°': '/materials/mlcp-elbow-90.webp',
    'Koleno 45°': '/materials/mlcp-elbow-45.webp',
    'T-kus': '/materials/mlcp-tee.webp',
    'Spojka': '/materials/mlcp-coupling.webp',
    'Redukce': '/materials/mlcp-reducer.webp',
    'Přechodka M': '/materials/mlcp-male-adapter.webp',
    'Přechodka F': '/materials/mlcp-female-adapter.webp',
    'Šroubení': '/materials/mlcp-union.webp',
    'Zátka': '/materials/mlcp-cap.webp',
    'Nástěnné koleno': '/materials/mlcp-wall-elbow.webp',
  },
  PEX: {
    'Trubka': '/materials/pex-pipe.webp',
    'Koleno 90°': '/materials/pex-elbow-90.webp',
    'Koleno 45°': '/materials/pex-elbow-45.webp',
    'T-kus': '/materials/pex-tee.webp',
    'Spojka': '/materials/pex-coupling.webp',
    'Redukce': '/materials/pex-reducer.webp',
    'Přechodka M': '/materials/pex-adapter.webp',
    'Přechodka F': '/materials/pex-female-adapter.webp',
    'Šroubení': '/materials/pex-union.webp',
    'Zátka': '/materials/pex-cap-photo.webp',
    'Nástěnné koleno': '/materials/pex-wall-elbow.webp',
  },
  PPR: {
    'Trubka': '/materials/ppr-pipe.webp',
    'Koleno 90°': '/materials/ppr-elbow-90.webp',
    'Koleno 45°': '/materials/ppr-elbow-45.webp',
    'T-kus': '/materials/ppr-tee.webp',
    'Spojka': '/materials/ppr-coupling.webp',
    'Redukce': '/materials/ppr-reducer.webp',
    'Příruba': '/materials/ppr-flange.webp',
    'Přechodka': '/materials/ppr-male-adapter.webp',
    'Přechodka M': '/materials/ppr-male-adapter.webp',
    'Přechodka F': '/materials/ppr-female-adapter.webp',
    'Nástěnné koleno': '/materials/ppr-wall-elbow.webp',
    'Šroubení': '/materials/ppr-union.webp',
    'Křížení': '/materials/ppr-crossing.webp',
    'Kompenzační smyčka': '/materials/ppr-compensation-loop.webp',
    'Zátka': '/materials/ppr-cap.webp',
  },
  SANITA: {
    'Sifon': '/materials/sanita-basin-siphon-photo.webp',
    'Sifon umyvadlový': '/materials/sanita-basin-siphon-photo.webp',
    'Sifon dřezový': '/materials/sanita-sink-siphon-photo.webp',
    'Sifon vanový': '/materials/sanita-bathtub-siphon-photo.webp',
    'Sifon sprchový': '/materials/sanita-shower-siphon-photo.webp',
    'Sprchový žlab': '/materials/sanita-shower-drain-photo.webp',
    'Podlahová vpusť': '/materials/sanita-floor-drain-photo.webp',
    'Závěsné WC': '/materials/sanita-wall-hung-wc-photo.webp',
    'Stojící WC': '/materials/sanita-floor-wc-photo.webp',
    'Umyvadlo': '/materials/sanita-washbasin-photo.webp',
    'Bidet': '/materials/sanita-bidet-photo.webp',
    'Pisoár': '/materials/sanita-urinal-photo.webp',
    'WC manžeta': '/materials/sanita-wc-connector-photo.webp',
  },
  STEEL: {
    'Trubka': '/materials/steel-pipe.webp',
    'Koleno 90°': '/materials/steel-elbow-90.webp',
    'Koleno 45°': '/materials/steel-elbow-45.webp',
    'T-kus': '/materials/steel-tee.webp',
    'Spojka': '/materials/steel-coupling.webp',
    'Redukce': '/materials/steel-reducer.webp',
    'Přechodka M': '/materials/steel-male-adapter.webp',
    'Přechodka F': '/materials/steel-female-adapter.webp',
    'Šroubení': '/materials/steel-union.webp',
    'Zátka': '/materials/steel-cap.webp',
  },
  VALVES: {
    'Kulový ventil': '/materials/valve-ball.webp',
    'Rohový ventil': '/materials/valve-angle-photo.webp',
    'Zpětná klapka': '/materials/valve-check-photo.webp',
    'Filtr': '/materials/valve-filter-photo.webp',
    'Pojistný ventil': '/materials/valve-safety-photo.webp',
    'Vypouštěcí ventil': '/materials/valve-drain-photo.webp',
    'Redukční ventil': '/materials/valve-pressure-reducing-photo.webp',
    'Manometr': '/materials/valve-manometer-photo.webp',
    'Odvzdušňovací ventil': '/materials/valve-airvent-photo.webp',
    'Automatický odvzdušňovací ventil': '/materials/valve-auto-airvent-photo.webp',
    'Expanzní nádoba': '/materials/valve-expansion-photo.webp',
  },
};

function normalize(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function findTypeImage(categoryKey, type) {
  const group = TYPE_IMAGES[categoryKey];
  if (!group) return null;
  if (group[type]) return group[type];
  const normalizedType = normalize(type);
  const match = Object.entries(group).find(([key]) => normalize(key) === normalizedType);
  return match?.[1] || null;
}

export function getCatalogCategoryLabel(item) {
  return CATEGORY_LABELS[String(item?.categoryKey || '').toUpperCase()] || item?.categoryLabel || '';
}

export function getCatalogImageUrl(item) {
  return item?.imageUrl || findTypeImage(String(item?.categoryKey || '').toUpperCase(), item?.type) || CATEGORY_IMAGES[String(item?.categoryKey || '').toUpperCase()] || null;
}

export function getCatalogDisplayName(item) {
  const category = getCatalogCategoryLabel(item);
  const diameter = String(item?.diameter || '').trim();
  const type = String(item?.type || '').trim();
  if (!category && !diameter && !type) return item?.name || '';
  if (!diameter || diameter === '—') return `${category} · ${type}`.trim();
  return `${category} ${diameter} · ${type}`.trim();
}

export function serializeCatalogItem(item, extra = {}) {
  return {
    id: item.id,
    key: item.key,
    categoryKey: item.categoryKey,
    categoryLabel: getCatalogCategoryLabel(item),
    diameter: item.diameter,
    type: item.type,
    name: getCatalogDisplayName(item),
    unit: item.unit,
    imageUrl: getCatalogImageUrl(item),
    ...extra,
  };
}
