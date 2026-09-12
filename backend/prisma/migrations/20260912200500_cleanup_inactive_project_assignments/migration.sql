DELETE FROM "project_assignments" AS pa
USING "company_memberships" AS cm
WHERE pa."membershipId" = cm."id"
  AND (cm."status" <> 'ACTIVE' OR cm."deletedAt" IS NOT NULL);
