CREATE TABLE "order_sections" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "order_sections_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "order_items" ADD COLUMN "sectionId" TEXT;

INSERT INTO "order_sections" ("id", "orderId", "name", "sortOrder", "createdAt", "updatedAt")
SELECT
  'legacy_' || "id",
  "id",
  'Загальний',
  0,
  "createdAt",
  CURRENT_TIMESTAMP
FROM "orders";

UPDATE "order_items"
SET "sectionId" = 'legacy_' || "orderId"
WHERE "sectionId" IS NULL;

ALTER TABLE "order_items" ALTER COLUMN "sectionId" SET NOT NULL;

DROP INDEX IF EXISTS "order_items_orderId_catalogItemId_key";

CREATE UNIQUE INDEX "order_items_sectionId_catalogItemId_key"
ON "order_items"("sectionId", "catalogItemId");

CREATE INDEX "order_sections_orderId_sortOrder_idx"
ON "order_sections"("orderId", "sortOrder");

CREATE INDEX "order_items_sectionId_idx"
ON "order_items"("sectionId");

ALTER TABLE "order_sections"
ADD CONSTRAINT "order_sections_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "orders"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_items"
ADD CONSTRAINT "order_items_sectionId_fkey"
FOREIGN KEY ("sectionId") REFERENCES "order_sections"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
