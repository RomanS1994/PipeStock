CREATE TABLE "material_favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "catalogItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_favorites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "material_favorites_userId_catalogItemId_key" ON "material_favorites"("userId", "catalogItemId");
CREATE INDEX "material_favorites_userId_createdAt_idx" ON "material_favorites"("userId", "createdAt");

ALTER TABLE "material_favorites" ADD CONSTRAINT "material_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "material_favorites" ADD CONSTRAINT "material_favorites_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "material_catalog_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
