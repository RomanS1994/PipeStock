CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'COMPLETED');

CREATE TABLE "material_catalog_items" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "categoryKey" TEXT NOT NULL,
    "categoryLabel" TEXT NOT NULL,
    "diameter" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "sku" TEXT,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "material_catalog_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdByMembershipId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "note" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "catalogItemId" TEXT,
    "materialKey" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "categoryKey" TEXT NOT NULL,
    "categoryLabel" TEXT NOT NULL,
    "diameter" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "sku" TEXT,
    "imageUrl" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "material_catalog_items_key_key" ON "material_catalog_items"("key");
CREATE INDEX "material_catalog_items_categoryKey_diameter_isActive_idx" ON "material_catalog_items"("categoryKey", "diameter", "isActive");
CREATE INDEX "material_catalog_items_isActive_sortOrder_idx" ON "material_catalog_items"("isActive", "sortOrder");
CREATE UNIQUE INDEX "orders_number_key" ON "orders"("number");
CREATE INDEX "orders_companyId_status_idx" ON "orders"("companyId", "status");
CREATE INDEX "orders_projectId_createdAt_idx" ON "orders"("projectId", "createdAt");
CREATE INDEX "orders_createdByMembershipId_createdAt_idx" ON "orders"("createdByMembershipId", "createdAt");
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");
CREATE INDEX "order_items_catalogItemId_idx" ON "order_items"("catalogItemId");

ALTER TABLE "orders" ADD CONSTRAINT "orders_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_createdByMembershipId_fkey" FOREIGN KEY ("createdByMembershipId") REFERENCES "company_memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "material_catalog_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER SEQUENCE "orders_number_seq" RESTART WITH 1001;

INSERT INTO "material_catalog_items" ("id", "key", "categoryKey", "categoryLabel", "diameter", "type", "name", "unit", "sortOrder", "updatedAt") VALUES
('cu-15-pipe','CU_15_PIPE','CU','Cu','15 mm','Trubka','Cu 15 mm — Trubka','m',10,CURRENT_TIMESTAMP),
('cu-15-elbow90','CU_15_ELBOW90','CU','Cu','15 mm','Koleno 90°','Cu 15 mm — Koleno 90°','ks',11,CURRENT_TIMESTAMP),
('cu-15-tee','CU_15_TEE','CU','Cu','15 mm','T-kus','Cu 15 mm — T-kus','ks',12,CURRENT_TIMESTAMP),
('cu-18-pipe','CU_18_PIPE','CU','Cu','18 mm','Trubka','Cu 18 mm — Trubka','m',13,CURRENT_TIMESTAMP),
('cu-18-elbow90','CU_18_ELBOW90','CU','Cu','18 mm','Koleno 90°','Cu 18 mm — Koleno 90°','ks',14,CURRENT_TIMESTAMP),
('cu-22-pipe','CU_22_PIPE','CU','Cu','22 mm','Trubka','Cu 22 mm — Trubka','m',15,CURRENT_TIMESTAMP),
('cu-22-elbow90','CU_22_ELBOW90','CU','Cu','22 mm','Koleno 90°','Cu 22 mm — Koleno 90°','ks',16,CURRENT_TIMESTAMP),
('cu-22-elbow45','CU_22_ELBOW45','CU','Cu','22 mm','Koleno 45°','Cu 22 mm — Koleno 45°','ks',17,CURRENT_TIMESTAMP),
('cu-22-tee','CU_22_TEE','CU','Cu','22 mm','T-kus','Cu 22 mm — T-kus','ks',18,CURRENT_TIMESTAMP),
('cu-22-coupling','CU_22_COUPLING','CU','Cu','22 mm','Spojka','Cu 22 mm — Spojka','ks',19,CURRENT_TIMESTAMP),
('cu-28-pipe','CU_28_PIPE','CU','Cu','28 mm','Trubka','Cu 28 mm — Trubka','m',20,CURRENT_TIMESTAMP),
('cu-28-elbow90','CU_28_ELBOW90','CU','Cu','28 mm','Koleno 90°','Cu 28 mm — Koleno 90°','ks',21,CURRENT_TIMESTAMP),
('ppr-20-pipe','PPR_20_PIPE','PPR','PPR','20 mm','Trubka','PPR 20 mm — Trubka','m',30,CURRENT_TIMESTAMP),
('ppr-20-elbow90','PPR_20_ELBOW90','PPR','PPR','20 mm','Koleno 90°','PPR 20 mm — Koleno 90°','ks',31,CURRENT_TIMESTAMP),
('ppr-20-tee','PPR_20_TEE','PPR','PPR','20 mm','T-kus','PPR 20 mm — T-kus','ks',32,CURRENT_TIMESTAMP),
('ppr-25-pipe','PPR_25_PIPE','PPR','PPR','25 mm','Trubka','PPR 25 mm — Trubka','m',33,CURRENT_TIMESTAMP),
('ppr-25-elbow90','PPR_25_ELBOW90','PPR','PPR','25 mm','Koleno 90°','PPR 25 mm — Koleno 90°','ks',34,CURRENT_TIMESTAMP),
('ppr-25-tee','PPR_25_TEE','PPR','PPR','25 mm','T-kus','PPR 25 mm — T-kus','ks',35,CURRENT_TIMESTAMP),
('ppr-32-pipe','PPR_32_PIPE','PPR','PPR','32 mm','Trubka','PPR 32 mm — Trubka','m',36,CURRENT_TIMESTAMP),
('ppr-32-elbow90','PPR_32_ELBOW90','PPR','PPR','32 mm','Koleno 90°','PPR 32 mm — Koleno 90°','ks',37,CURRENT_TIMESTAMP),
('pex-16-pipe','PEX_16_PIPE','PEX_MLCP','PEX/MLCP','16 mm','Trubka','PEX/MLCP 16 mm — Trubka','m',50,CURRENT_TIMESTAMP),
('pex-16-elbow90','PEX_16_ELBOW90','PEX_MLCP','PEX/MLCP','16 mm','Koleno 90°','PEX/MLCP 16 mm — Koleno 90°','ks',51,CURRENT_TIMESTAMP),
('pex-16-tee','PEX_16_TEE','PEX_MLCP','PEX/MLCP','16 mm','T-kus','PEX/MLCP 16 mm — T-kus','ks',52,CURRENT_TIMESTAMP),
('pex-20-pipe','PEX_20_PIPE','PEX_MLCP','PEX/MLCP','20 mm','Trubka','PEX/MLCP 20 mm — Trubka','m',53,CURRENT_TIMESTAMP),
('pex-20-tee','PEX_20_TEE','PEX_MLCP','PEX/MLCP','20 mm','T-kus','PEX/MLCP 20 mm — T-kus','ks',54,CURRENT_TIMESTAMP),
('ht-50-pipe','HT_50_PIPE','HT','HT','50 mm','Trubka','HT 50 mm — Trubka','m',70,CURRENT_TIMESTAMP),
('ht-50-elbow45','HT_50_ELBOW45','HT','HT','50 mm','Koleno 45°','HT 50 mm — Koleno 45°','ks',71,CURRENT_TIMESTAMP),
('ht-50-elbow87','HT_50_ELBOW87','HT','HT','50 mm','Koleno 87°','HT 50 mm — Koleno 87°','ks',72,CURRENT_TIMESTAMP),
('ht-110-pipe','HT_110_PIPE','HT','HT','110 mm','Trubka','HT 110 mm — Trubka','m',73,CURRENT_TIMESTAMP),
('ht-110-tee','HT_110_TEE','HT','HT','110 mm','T-kus','HT 110 mm — T-kus','ks',74,CURRENT_TIMESTAMP),
('kg-110-pipe','KG_110_PIPE','KG','KG','110 mm','Trubka','KG 110 mm — Trubka','m',90,CURRENT_TIMESTAMP),
('kg-110-elbow45','KG_110_ELBOW45','KG','KG','110 mm','Koleno 45°','KG 110 mm — Koleno 45°','ks',91,CURRENT_TIMESTAMP),
('steel-15-pipe','STEEL_15_PIPE','STEEL','Steel','15 mm','Trubka','Steel 15 mm — Trubka','m',110,CURRENT_TIMESTAMP),
('steel-20-pipe','STEEL_20_PIPE','STEEL','Steel','20 mm','Trubka','Steel 20 mm — Trubka','m',111,CURRENT_TIMESTAMP),
('valve-half-ball','VALVE_HALF_BALL','VALVES','Ventily','1/2"','Kulový ventil','Ventil 1/2" — Kulový','ks',130,CURRENT_TIMESTAMP),
('valve-threequarter-ball','VALVE_34_BALL','VALVES','Ventily','3/4"','Kulový ventil','Ventil 3/4" — Kulový','ks',131,CURRENT_TIMESTAMP);
