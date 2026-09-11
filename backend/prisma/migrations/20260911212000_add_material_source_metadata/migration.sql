ALTER TABLE "material_catalog_items"
  ADD COLUMN "brand" TEXT,
  ADD COLUMN "manufacturerSku" TEXT,
  ADD COLUMN "sourceUrl" TEXT,
  ADD COLUMN "imageSourceUrl" TEXT,
  ADD COLUMN "sourceLabel" TEXT;

CREATE INDEX "material_catalog_items_brand_manufacturerSku_idx"
  ON "material_catalog_items"("brand", "manufacturerSku");
