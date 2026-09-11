-- Add explicit project lifecycle and optional image reference.
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED');

ALTER TABLE "projects"
ADD COLUMN "imageUrl" TEXT,
ADD COLUMN "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE';

UPDATE "projects"
SET "status" = CASE
  WHEN "isActive" = TRUE THEN 'ACTIVE'::"ProjectStatus"
  ELSE 'PAUSED'::"ProjectStatus"
END;

ALTER TABLE "projects" DROP COLUMN "isActive";

DROP INDEX IF EXISTS "projects_companyId_isActive_idx";
CREATE INDEX "projects_companyId_status_idx" ON "projects"("companyId", "status");

CREATE TABLE "project_assignments" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "membershipId" TEXT NOT NULL,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "project_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "project_assignments_projectId_membershipId_key"
ON "project_assignments"("projectId", "membershipId");

CREATE INDEX "project_assignments_membershipId_idx"
ON "project_assignments"("membershipId");

ALTER TABLE "project_assignments"
ADD CONSTRAINT "project_assignments_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "project_assignments"
ADD CONSTRAINT "project_assignments_membershipId_fkey"
FOREIGN KEY ("membershipId") REFERENCES "company_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
