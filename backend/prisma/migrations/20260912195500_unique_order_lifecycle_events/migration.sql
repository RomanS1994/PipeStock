DELETE FROM "order_events" AS duplicate
USING "order_events" AS keeper
WHERE duplicate."orderId" = keeper."orderId"
  AND duplicate."type" = keeper."type"
  AND (
    duplicate."createdAt" > keeper."createdAt"
    OR (
      duplicate."createdAt" = keeper."createdAt"
      AND duplicate."id" > keeper."id"
    )
  );

CREATE UNIQUE INDEX "order_events_orderId_type_key"
ON "order_events"("orderId", "type");
