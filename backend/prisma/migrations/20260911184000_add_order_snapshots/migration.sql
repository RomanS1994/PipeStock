CREATE TABLE "order_snapshots" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "order_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "order_snapshots_orderId_key" ON "order_snapshots"("orderId");
CREATE INDEX "order_snapshots_createdAt_idx" ON "order_snapshots"("createdAt");

ALTER TABLE "order_snapshots"
  ADD CONSTRAINT "order_snapshots_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
