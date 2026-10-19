function rounded(value) {
  return Math.round(Number(value) * 100) / 100;
}

function materialIdentity(item) {
  return item.catalogItemId || item.materialKey || [
    item.categoryKey,
    item.diameter,
    item.thickness || '',
    item.type,
    item.unit,
  ].join('|');
}

export function aggregateOrderItems(items = []) {
  const grouped = new Map();

  for (const item of items) {
    const key = materialIdentity(item);
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        ...item,
        quantity: rounded(item.quantity),
        sectionId: undefined,
        section: undefined,
        sections: item.sectionId ? [item.sectionId] : [],
      });
      continue;
    }

    existing.quantity = rounded(existing.quantity + Number(item.quantity));
    if (item.sectionId && !existing.sections.includes(item.sectionId)) {
      existing.sections.push(item.sectionId);
    }
  }

  return [...grouped.values()];
}

export function normalizeOrderSectionName(value, maxLength = 120) {
  const name = String(value ?? '').trim();
  if (!name) throw new RangeError('Section name is required');
  if (name.length > maxLength) throw new RangeError('Section name is too long');
  return name;
}
