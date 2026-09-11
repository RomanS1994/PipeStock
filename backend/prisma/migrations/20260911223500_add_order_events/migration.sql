CREATE TABLE "order_events" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "actorMembershipId" TEXT,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "order_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "order_events_orderId_createdAt_idx" ON "order_events"("orderId", "createdAt");
CREATE INDEX "order_events_actorMembershipId_idx" ON "order_events"("actorMembershipId");

ALTER TABLE "order_events" ADD CONSTRAINT "order_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_actorMembershipId_fkey" FOREIGN KEY ("actorMembershipId") REFERENCES "company_memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "order_events" ("id", "orderId", "actorMembershipId", "type", "createdAt")
SELECT CONCAT('legacy-created-', "id"), "id", "createdByMembershipId", 'CREATED', "createdAt"
FROM "orders";

INSERT INTO "order_events" ("id", "orderId", "actorMembershipId", "type", "createdAt")
SELECT CONCAT('legacy-submitted-', "id"), "id", "createdByMembershipId", 'SUBMITTED', "submittedAt"
FROM "orders"
WHERE "submittedAt" IS NOT NULL;

INSERT INTO "order_events" ("id", "orderId", "type", "createdAt")
SELECT CONCAT('legacy-completed-', "id"), "id", 'COMPLETED', "completedAt"
FROM "orders"
WHERE "completedAt" IS NOT NULL;
