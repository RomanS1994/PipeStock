-- Merge duplicate catalog-backed order items before enforcing uniqueness.
WITH ranked AS (
  SELECT
    "id",
    "orderId",
    "catalogItemId",
    ROW_NUMBER() OVER (
      PARTITION BY "orderId", "catalogItemId"
      ORDER BY "createdAt" ASC, "id" ASC
    ) AS row_number,
    SUM("quantity") OVER (
      PARTITION BY "orderId", "catalogItemId"
    ) AS total_quantity
  FROM "order_items"
  WHERE "catalogItemId" IS NOT NULL
),
keepers AS (
  SELECT "id", total_quantity
  FROM ranked
  WHERE row_number = 1
)
UPDATE "order_items" AS item
SET "quantity" = keepers.total_quantity
FROM keepers
WHERE item."id" = keepers."id";

WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "orderId", "catalogItemId"
      ORDER BY "createdAt" ASC, "id" ASC
    ) AS row_number
  FROM "order_items"
  WHERE "catalogItemId" IS NOT NULL
)
DELETE FROM "order_items"
WHERE "id" IN (
  SELECT "id"
  FROM ranked
  WHERE row_number > 1
);

CREATE UNIQUE INDEX "order_items_orderId_catalogItemId_key"
ON "order_items"("orderId", "catalogItemId");
