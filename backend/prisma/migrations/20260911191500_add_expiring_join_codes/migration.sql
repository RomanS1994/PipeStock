ALTER TABLE "companies"
ADD COLUMN "joinCodeCreatedAt" TIMESTAMP(3),
ADD COLUMN "joinCodeExpiresAt" TIMESTAMP(3),
ADD COLUMN "joinCodeRevokedAt" TIMESTAMP(3);

UPDATE "companies"
SET
  "joinCodeCreatedAt" = COALESCE("updatedAt", NOW()),
  "joinCodeExpiresAt" = NOW() + INTERVAL '7 days'
WHERE "joinCode" IS NOT NULL;

CREATE INDEX "companies_joinCodeExpiresAt_idx" ON "companies"("joinCodeExpiresAt");
