ALTER TABLE "companies" ADD COLUMN "joinCode" TEXT;
CREATE UNIQUE INDEX "companies_joinCode_key" ON "companies"("joinCode");
CREATE INDEX "companies_joinCode_idx" ON "companies"("joinCode");
