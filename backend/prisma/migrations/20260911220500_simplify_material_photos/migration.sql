-- PipeStock materials are generic. External manufacturer catalogs are used only as photo sources.
-- Remove manufacturer-specific starter rows introduced by the previous catalog experiment.
DELETE FROM "material_catalog_items"
WHERE "id" IN (
  'wavin-ppr-20-elbow90',
  'wavin-ppr-25-elbow90',
  'wavin-ppr-32-elbow90',
  'geberit-mapress-cu-15-bend',
  'geberit-mapress-cu-18-bend',
  'geberit-mapress-cu-22-bend',
  'geberit-mapress-cu-28-bend',
  'geberit-mapress-cu-35-bend',
  'geberit-mapress-cu-42-bend',
  'geberit-mapress-cu-54-bend'
);

DROP INDEX IF EXISTS "material_catalog_items_brand_manufacturerSku_idx";

ALTER TABLE "material_catalog_items"
  DROP COLUMN IF EXISTS "sku",
  DROP COLUMN IF EXISTS "brand",
  DROP COLUMN IF EXISTS "manufacturerSku",
  DROP COLUMN IF EXISTS "sourceUrl",
  DROP COLUMN IF EXISTS "imageSourceUrl",
  DROP COLUMN IF EXISTS "sourceLabel";

ALTER TABLE "order_items"
  DROP COLUMN IF EXISTS "sku",
  DROP COLUMN IF EXISTS "brand",
  DROP COLUMN IF EXISTS "manufacturerSku",
  DROP COLUMN IF EXISTS "sourceUrl";
