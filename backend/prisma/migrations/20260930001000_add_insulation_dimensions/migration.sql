-- Store pipe size and insulation wall thickness as separate catalog dimensions.
-- Existing orders retain their copied material fields; obsolete generic insulation rows are deactivated.
ALTER TABLE "material_catalog_items" ADD COLUMN IF NOT EXISTS "thickness" TEXT;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "thickness" TEXT;

UPDATE "material_catalog_items"
SET "isActive" = false, "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" IN (
  'OTHER_15_PIPE_INSULATION', 'OTHER_18_PIPE_INSULATION', 'OTHER_22_PIPE_INSULATION',
  'OTHER_28_PIPE_INSULATION', 'OTHER_32_PIPE_INSULATION',
  'OTHER_22_RUBBER_INSULATION', 'OTHER_28_RUBBER_INSULATION'
);

WITH new_items("id","key","categoryKey","categoryLabel","diameter","thickness","type","name","unit","sortOrder") AS (
  VALUES
    ('other-mirelon-pe-15-6','OTHER_MIRELON_PE_15_6','OTHER','Montážní materiál','15 mm','6 mm','Mirelon (PE) pěna','Montážní materiál 15 mm · tloušťka 6 mm — Mirelon (PE) pěna','m',12068),
    ('other-mirelon-pe-15-9','OTHER_MIRELON_PE_15_9','OTHER','Montážní materiál','15 mm','9 mm','Mirelon (PE) pěna','Montážní materiál 15 mm · tloušťka 9 mm — Mirelon (PE) pěna','m',12069),
    ('other-mirelon-pe-15-13','OTHER_MIRELON_PE_15_13','OTHER','Montážní materiál','15 mm','13 mm','Mirelon (PE) pěna','Montážní materiál 15 mm · tloušťka 13 mm — Mirelon (PE) pěna','m',12070),
    ('other-mirelon-pe-15-20','OTHER_MIRELON_PE_15_20','OTHER','Montážní materiál','15 mm','20 mm','Mirelon (PE) pěna','Montážní materiál 15 mm · tloušťka 20 mm — Mirelon (PE) pěna','m',12071),
    ('other-mirelon-pe-18-6','OTHER_MIRELON_PE_18_6','OTHER','Montážní materiál','18 mm','6 mm','Mirelon (PE) pěna','Montážní materiál 18 mm · tloušťka 6 mm — Mirelon (PE) pěna','m',12072),
    ('other-mirelon-pe-18-9','OTHER_MIRELON_PE_18_9','OTHER','Montážní materiál','18 mm','9 mm','Mirelon (PE) pěna','Montážní materiál 18 mm · tloušťka 9 mm — Mirelon (PE) pěna','m',12073),
    ('other-mirelon-pe-18-13','OTHER_MIRELON_PE_18_13','OTHER','Montážní materiál','18 mm','13 mm','Mirelon (PE) pěna','Montážní materiál 18 mm · tloušťka 13 mm — Mirelon (PE) pěna','m',12074),
    ('other-mirelon-pe-18-20','OTHER_MIRELON_PE_18_20','OTHER','Montážní materiál','18 mm','20 mm','Mirelon (PE) pěna','Montážní materiál 18 mm · tloušťka 20 mm — Mirelon (PE) pěna','m',12075),
    ('other-mirelon-pe-22-6','OTHER_MIRELON_PE_22_6','OTHER','Montážní materiál','22 mm','6 mm','Mirelon (PE) pěna','Montážní materiál 22 mm · tloušťka 6 mm — Mirelon (PE) pěna','m',12076),
    ('other-mirelon-pe-22-9','OTHER_MIRELON_PE_22_9','OTHER','Montážní materiál','22 mm','9 mm','Mirelon (PE) pěna','Montážní materiál 22 mm · tloušťka 9 mm — Mirelon (PE) pěna','m',12077),
    ('other-mirelon-pe-22-13','OTHER_MIRELON_PE_22_13','OTHER','Montážní materiál','22 mm','13 mm','Mirelon (PE) pěna','Montážní materiál 22 mm · tloušťka 13 mm — Mirelon (PE) pěna','m',12078),
    ('other-mirelon-pe-22-20','OTHER_MIRELON_PE_22_20','OTHER','Montážní materiál','22 mm','20 mm','Mirelon (PE) pěna','Montážní materiál 22 mm · tloušťka 20 mm — Mirelon (PE) pěna','m',12079),
    ('other-mirelon-pe-22-25','OTHER_MIRELON_PE_22_25','OTHER','Montážní materiál','22 mm','25 mm','Mirelon (PE) pěna','Montážní materiál 22 mm · tloušťka 25 mm — Mirelon (PE) pěna','m',12080),
    ('other-mirelon-pe-28-6','OTHER_MIRELON_PE_28_6','OTHER','Montážní materiál','28 mm','6 mm','Mirelon (PE) pěna','Montážní materiál 28 mm · tloušťka 6 mm — Mirelon (PE) pěna','m',12081),
    ('other-mirelon-pe-28-9','OTHER_MIRELON_PE_28_9','OTHER','Montážní materiál','28 mm','9 mm','Mirelon (PE) pěna','Montážní materiál 28 mm · tloušťka 9 mm — Mirelon (PE) pěna','m',12082),
    ('other-mirelon-pe-28-13','OTHER_MIRELON_PE_28_13','OTHER','Montážní materiál','28 mm','13 mm','Mirelon (PE) pěna','Montážní materiál 28 mm · tloušťka 13 mm — Mirelon (PE) pěna','m',12083),
    ('other-mirelon-pe-28-20','OTHER_MIRELON_PE_28_20','OTHER','Montážní materiál','28 mm','20 mm','Mirelon (PE) pěna','Montážní materiál 28 mm · tloušťka 20 mm — Mirelon (PE) pěna','m',12084),
    ('other-mirelon-pe-28-25','OTHER_MIRELON_PE_28_25','OTHER','Montážní materiál','28 mm','25 mm','Mirelon (PE) pěna','Montážní materiál 28 mm · tloušťka 25 mm — Mirelon (PE) pěna','m',12085),
    ('other-mirelon-pe-32-6','OTHER_MIRELON_PE_32_6','OTHER','Montážní materiál','32 mm','6 mm','Mirelon (PE) pěna','Montážní materiál 32 mm · tloušťka 6 mm — Mirelon (PE) pěna','m',12086),
    ('other-mirelon-pe-32-9','OTHER_MIRELON_PE_32_9','OTHER','Montážní materiál','32 mm','9 mm','Mirelon (PE) pěna','Montážní materiál 32 mm · tloušťka 9 mm — Mirelon (PE) pěna','m',12087),
    ('other-mirelon-pe-32-13','OTHER_MIRELON_PE_32_13','OTHER','Montážní materiál','32 mm','13 mm','Mirelon (PE) pěna','Montážní materiál 32 mm · tloušťka 13 mm — Mirelon (PE) pěna','m',12088),
    ('other-mirelon-pe-32-20','OTHER_MIRELON_PE_32_20','OTHER','Montážní materiál','32 mm','20 mm','Mirelon (PE) pěna','Montážní materiál 32 mm · tloušťka 20 mm — Mirelon (PE) pěna','m',12089),
    ('other-mirelon-pe-32-25','OTHER_MIRELON_PE_32_25','OTHER','Montážní materiál','32 mm','25 mm','Mirelon (PE) pěna','Montážní materiál 32 mm · tloušťka 25 mm — Mirelon (PE) pěna','m',12090),
    ('other-rubber-insulation-15-8','OTHER_RUBBER_15_8','OTHER','Montážní materiál','15 mm','8 mm','Kaučuková izolace','Montážní materiál 15 mm · tloušťka 8 mm — Kaučuková izolace','m',12091),
    ('other-rubber-insulation-15-11-5','OTHER_RUBBER_15_11_5','OTHER','Montážní materiál','15 mm','11.5 mm','Kaučuková izolace','Montážní materiál 15 mm · tloušťka 11.5 mm — Kaučuková izolace','m',12092),
    ('other-rubber-insulation-15-14','OTHER_RUBBER_15_14','OTHER','Montážní materiál','15 mm','14 mm','Kaučuková izolace','Montážní materiál 15 mm · tloušťka 14 mm — Kaučuková izolace','m',12093),
    ('other-rubber-insulation-15-17','OTHER_RUBBER_15_17','OTHER','Montážní materiál','15 mm','17 mm','Kaučuková izolace','Montážní materiál 15 mm · tloušťka 17 mm — Kaučuková izolace','m',12094),
    ('other-rubber-insulation-15-32','OTHER_RUBBER_15_32','OTHER','Montážní materiál','15 mm','32 mm','Kaučuková izolace','Montážní materiál 15 mm · tloušťka 32 mm — Kaučuková izolace','m',12095),
    ('other-rubber-insulation-18-8','OTHER_RUBBER_18_8','OTHER','Montážní materiál','18 mm','8 mm','Kaučuková izolace','Montážní materiál 18 mm · tloušťka 8 mm — Kaučuková izolace','m',12096),
    ('other-rubber-insulation-18-11-5','OTHER_RUBBER_18_11_5','OTHER','Montážní materiál','18 mm','11.5 mm','Kaučuková izolace','Montážní materiál 18 mm · tloušťka 11.5 mm — Kaučuková izolace','m',12097),
    ('other-rubber-insulation-18-14','OTHER_RUBBER_18_14','OTHER','Montážní materiál','18 mm','14 mm','Kaučuková izolace','Montážní materiál 18 mm · tloušťka 14 mm — Kaučuková izolace','m',12098),
    ('other-rubber-insulation-18-17-5','OTHER_RUBBER_18_17_5','OTHER','Montážní materiál','18 mm','17.5 mm','Kaučuková izolace','Montážní materiál 18 mm · tloušťka 17.5 mm — Kaučuková izolace','m',12099),
    ('other-rubber-insulation-18-25','OTHER_RUBBER_18_25','OTHER','Montážní materiál','18 mm','25 mm','Kaučuková izolace','Montážní materiál 18 mm · tloušťka 25 mm — Kaučuková izolace','m',12100),
    ('other-rubber-insulation-18-32','OTHER_RUBBER_18_32','OTHER','Montážní materiál','18 mm','32 mm','Kaučuková izolace','Montážní materiál 18 mm · tloušťka 32 mm — Kaučuková izolace','m',12101),
    ('other-rubber-insulation-22-8-5','OTHER_RUBBER_22_8_5','OTHER','Montážní materiál','22 mm','8.5 mm','Kaučuková izolace','Montážní materiál 22 mm · tloušťka 8.5 mm — Kaučuková izolace','m',12102),
    ('other-rubber-insulation-22-12','OTHER_RUBBER_22_12','OTHER','Montážní materiál','22 mm','12 mm','Kaučuková izolace','Montážní materiál 22 mm · tloušťka 12 mm — Kaučuková izolace','m',12103),
    ('other-rubber-insulation-22-14-5','OTHER_RUBBER_22_14_5','OTHER','Montážní materiál','22 mm','14.5 mm','Kaučuková izolace','Montážní materiál 22 mm · tloušťka 14.5 mm — Kaučuková izolace','m',12104),
    ('other-rubber-insulation-22-18','OTHER_RUBBER_22_18','OTHER','Montážní materiál','22 mm','18 mm','Kaučuková izolace','Montážní materiál 22 mm · tloušťka 18 mm — Kaučuková izolace','m',12105),
    ('other-rubber-insulation-22-25','OTHER_RUBBER_22_25','OTHER','Montážní materiál','22 mm','25 mm','Kaučuková izolace','Montážní materiál 22 mm · tloušťka 25 mm — Kaučuková izolace','m',12106),
    ('other-rubber-insulation-22-33-5','OTHER_RUBBER_22_33_5','OTHER','Montážní materiál','22 mm','33.5 mm','Kaučuková izolace','Montážní materiál 22 mm · tloušťka 33.5 mm — Kaučuková izolace','m',12107),
    ('other-rubber-insulation-28-8-5','OTHER_RUBBER_28_8_5','OTHER','Montážní materiál','28 mm','8.5 mm','Kaučuková izolace','Montážní materiál 28 mm · tloušťka 8.5 mm — Kaučuková izolace','m',12108),
    ('other-rubber-insulation-28-12-5','OTHER_RUBBER_28_12_5','OTHER','Montážní materiál','28 mm','12.5 mm','Kaučuková izolace','Montážní materiál 28 mm · tloušťka 12.5 mm — Kaučuková izolace','m',12109),
    ('other-rubber-insulation-28-15-5','OTHER_RUBBER_28_15_5','OTHER','Montážní materiál','28 mm','15.5 mm','Kaučuková izolace','Montážní materiál 28 mm · tloušťka 15.5 mm — Kaučuková izolace','m',12110),
    ('other-rubber-insulation-28-19','OTHER_RUBBER_28_19','OTHER','Montážní materiál','28 mm','19 mm','Kaučuková izolace','Montážní materiál 28 mm · tloušťka 19 mm — Kaučuková izolace','m',12111),
    ('other-rubber-insulation-28-25','OTHER_RUBBER_28_25','OTHER','Montážní materiál','28 mm','25 mm','Kaučuková izolace','Montážní materiál 28 mm · tloušťka 25 mm — Kaučuková izolace','m',12112),
    ('other-rubber-insulation-28-35','OTHER_RUBBER_28_35','OTHER','Montážní materiál','28 mm','35 mm','Kaučuková izolace','Montážní materiál 28 mm · tloušťka 35 mm — Kaučuková izolace','m',12113),
    ('other-rubber-insulation-32-9','OTHER_RUBBER_32_9','OTHER','Montážní materiál','32 mm','9 mm','Kaučuková izolace','Montážní materiál 32 mm · tloušťka 9 mm — Kaučuková izolace','m',12114),
    ('other-rubber-insulation-32-13','OTHER_RUBBER_32_13','OTHER','Montážní materiál','32 mm','13 mm','Kaučuková izolace','Montážní materiál 32 mm · tloušťka 13 mm — Kaučuková izolace','m',12115),
    ('other-rubber-insulation-32-19-5','OTHER_RUBBER_32_19_5','OTHER','Montážní materiál','32 mm','19.5 mm','Kaučuková izolace','Montážní materiál 32 mm · tloušťka 19.5 mm — Kaučuková izolace','m',12116),
    ('other-rubber-insulation-32-26','OTHER_RUBBER_32_26','OTHER','Montážní materiál','32 mm','26 mm','Kaučuková izolace','Montážní materiál 32 mm · tloušťka 26 mm — Kaučuková izolace','m',12117),
    ('other-rubber-insulation-32-35','OTHER_RUBBER_32_35','OTHER','Montážní materiál','32 mm','35 mm','Kaučuková izolace','Montážní materiál 32 mm · tloušťka 35 mm — Kaučuková izolace','m',12118)
)
INSERT INTO "material_catalog_items" (
  "id","key","categoryKey","categoryLabel","diameter","thickness","type","name","unit","sortOrder","isActive","updatedAt"
)
SELECT "id","key","categoryKey","categoryLabel","diameter","thickness","type","name","unit","sortOrder",true,CURRENT_TIMESTAMP
FROM new_items
ON CONFLICT ("key") DO UPDATE SET
  "categoryKey" = EXCLUDED."categoryKey",
  "categoryLabel" = EXCLUDED."categoryLabel",
  "diameter" = EXCLUDED."diameter",
  "thickness" = EXCLUDED."thickness",
  "type" = EXCLUDED."type",
  "name" = EXCLUDED."name",
  "unit" = EXCLUDED."unit",
  "sortOrder" = EXCLUDED."sortOrder",
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP;
