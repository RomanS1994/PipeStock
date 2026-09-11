import { prisma } from '../db/prisma.js';
import { OFFICIAL_MATERIALS } from '../data/official-materials.js';

async function main() {
  let created = 0;
  let updated = 0;

  for (const material of OFFICIAL_MATERIALS) {
    const existing = await prisma.materialCatalogItem.findUnique({ where: { key: material.key } });
    const data = {
      categoryKey: material.categoryKey,
      categoryLabel: material.categoryLabel,
      diameter: material.diameter,
      type: material.type,
      name: material.name,
      unit: material.unit,
      sku: material.sku || null,
      brand: material.brand || null,
      manufacturerSku: material.manufacturerSku || null,
      sourceUrl: material.sourceUrl || null,
      imageSourceUrl: material.imageSourceUrl || null,
      sourceLabel: material.sourceLabel || null,
      sortOrder: material.sortOrder || 0,
      isActive: true,
    };

    await prisma.materialCatalogItem.upsert({
      where: { key: material.key },
      update: data,
      create: { id: material.id, key: material.key, ...data },
    });

    if (existing) updated += 1;
    else created += 1;
  }

  console.log(`Official material catalog synced: ${created} created, ${updated} updated.`);
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
