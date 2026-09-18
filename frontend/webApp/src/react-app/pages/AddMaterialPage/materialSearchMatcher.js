const CATEGORY_NAMES = { CU: 'Měď', STEEL: 'Uhlíková ocel' };

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('cs')
    .replace(/\bt[\s-]*kus\b/g, 'tkus')
    .replace(/(\d)\s*[×xх]\s*(?=\d)/g, '$1x')
    .replace(/[^\p{L}\p{N}.,x]+/gu, ' ')
    .trim();
}

function getDimensions(value) {
  return String(value ?? '')
    .replace(/,/g, '.')
    .match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
}

function matchesDimension(term, item) {
  const requested = term.split('x').map(Number);
  const actual = getDimensions(item.diameter);
  if (!actual.length) return false;
  if (actual.length === 1) {
    // The catalog stores equal-size tees as one diameter (e.g. “25 mm”).
    return normalize(item.type).includes('tkus') && requested.every(size => size === actual[0]);
  }
  return requested.length <= actual.length && requested.every((size, index) => size === actual[index]);
}

export function matchesMaterialSearch(item, query) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return false;

  const category = CATEGORY_NAMES[String(item.categoryKey ?? '').toUpperCase()] || item.categoryLabel;
  const text = normalize([category, item.categoryLabel, item.categoryKey, item.name, item.type, item.diameter, item.unit].join(' '));
  return terms.every(term => {
    if (/^\d+(?:[.,]\d+)?(?:x\d+(?:[.,]\d+)?)+$/.test(term)) return matchesDimension(term.replace(/,/g, '.'), item);
    if (/^\d+(?:[.,]\d+)?$/.test(term)) return getDimensions(item.diameter).includes(Number(term.replace(',', '.')));
    return text.includes(term);
  });
}

export function searchMaterials(catalog, query) {
  if (!String(query ?? '').trim()) return [];
  return catalog.filter(item => matchesMaterialSearch(item, query));
}
