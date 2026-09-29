-- Keep the mounting catalog unambiguous where sized variants already exist.
-- Existing orders remain intact because they store their own material snapshot.
UPDATE "material_catalog_items"
SET "isActive" = false, "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" IN ('OTHER_PIPE_CLAMP', 'OTHER_PIPE_INSULATION');
