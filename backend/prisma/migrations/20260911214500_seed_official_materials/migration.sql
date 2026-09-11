ALTER TABLE "order_items"
ADD COLUMN "brand" TEXT,
ADD COLUMN "manufacturerSku" TEXT,
ADD COLUMN "sourceUrl" TEXT;

INSERT INTO "material_catalog_items" (
  "id", "key", "categoryKey", "categoryLabel", "diameter", "type", "name", "unit",
  "sku", "brand", "manufacturerSku", "sourceUrl", "imageSourceUrl", "sourceLabel", "sortOrder", "updatedAt"
) VALUES
('wavin-ppr-20-elbow90','WAVIN_PPR_20_ELBOW90','PPR','PPR','20 mm','Koleno 90°','Wavin PP-RCT 20 mm — Koleno 90°','ks','SKO02090RCT','Wavin','SKO02090RCT','https://wavin.com/cz/p/51693383-5798-4553-b973-251d8a4e0d75/KOLENO-90-20-PP-RCT','https://wavin.com/cz/p/51693383-5798-4553-b973-251d8a4e0d75/KOLENO-90-20-PP-RCT','Wavin CZ Product Catalogue',200,CURRENT_TIMESTAMP),
('wavin-ppr-25-elbow90','WAVIN_PPR_25_ELBOW90','PPR','PPR','25 mm','Koleno 90°','Wavin PP-RCT 25 mm — Koleno 90°','ks','SKO02590RCT','Wavin','SKO02590RCT','https://wavin.com/cz/p/1cbd0f89-2396-4127-b8ac-8cc4c5b456d0/koleno-90-25-pp-rct','https://wavin.com/cz/p/1cbd0f89-2396-4127-b8ac-8cc4c5b456d0/koleno-90-25-pp-rct','Wavin CZ Product Catalogue',201,CURRENT_TIMESTAMP),
('wavin-ppr-32-elbow90','WAVIN_PPR_32_ELBOW90','PPR','PPR','32 mm','Koleno 90°','Wavin PP-RCT 32 mm — Koleno 90°','ks','SKO03290RCT','Wavin','SKO03290RCT','https://wavin.com/cz/p/2dd4660c-1b45-43a7-be98-0331164c6746/KOLENO-90-32-PP-RCT','https://wavin.com/cz/p/2dd4660c-1b45-43a7-be98-0331164c6746/KOLENO-90-32-PP-RCT','Wavin CZ Product Catalogue',202,CURRENT_TIMESTAMP),
('geberit-mapress-cu-15-bend','GEBERIT_MAPRESS_CU_15_BEND','CU','Cu','15 mm','Oblouk','Geberit Mapress Copper bend 15 mm','ks','52222','Geberit','52222','https://catalog.international.geberit.com/en-GB/product/PRO_103342','https://catalog.international.geberit.com/en-GB/product/PRO_103342','Geberit Product Catalogue',210,CURRENT_TIMESTAMP),
('geberit-mapress-cu-18-bend','GEBERIT_MAPRESS_CU_18_BEND','CU','Cu','18 mm','Oblouk','Geberit Mapress Copper bend 18 mm','ks','52223','Geberit','52223','https://catalog.international.geberit.com/en-GB/product/PRO_103342','https://catalog.international.geberit.com/en-GB/product/PRO_103342','Geberit Product Catalogue',211,CURRENT_TIMESTAMP),
('geberit-mapress-cu-22-bend','GEBERIT_MAPRESS_CU_22_BEND','CU','Cu','22 mm','Oblouk','Geberit Mapress Copper bend 22 mm','ks','52224','Geberit','52224','https://catalog.international.geberit.com/en-GB/product/PRO_103342','https://catalog.international.geberit.com/en-GB/product/PRO_103342','Geberit Product Catalogue',212,CURRENT_TIMESTAMP),
('geberit-mapress-cu-28-bend','GEBERIT_MAPRESS_CU_28_BEND','CU','Cu','28 mm','Oblouk','Geberit Mapress Copper bend 28 mm','ks','52225','Geberit','52225','https://catalog.international.geberit.com/en-GB/product/PRO_103342','https://catalog.international.geberit.com/en-GB/product/PRO_103342','Geberit Product Catalogue',213,CURRENT_TIMESTAMP),
('geberit-mapress-cu-35-bend','GEBERIT_MAPRESS_CU_35_BEND','CU','Cu','35 mm','Oblouk','Geberit Mapress Copper bend 35 mm','ks','52226','Geberit','52226','https://catalog.international.geberit.com/en-GB/product/PRO_103342','https://catalog.international.geberit.com/en-GB/product/PRO_103342','Geberit Product Catalogue',214,CURRENT_TIMESTAMP),
('geberit-mapress-cu-42-bend','GEBERIT_MAPRESS_CU_42_BEND','CU','Cu','42 mm','Oblouk','Geberit Mapress Copper bend 42 mm','ks','52227','Geberit','52227','https://catalog.international.geberit.com/en-GB/product/PRO_103342','https://catalog.international.geberit.com/en-GB/product/PRO_103342','Geberit Product Catalogue',215,CURRENT_TIMESTAMP),
('geberit-mapress-cu-54-bend','GEBERIT_MAPRESS_CU_54_BEND','CU','Cu','54 mm','Oblouk','Geberit Mapress Copper bend 54 mm','ks','52228','Geberit','52228','https://catalog.international.geberit.com/en-GB/product/PRO_103342','https://catalog.international.geberit.com/en-GB/product/PRO_103342','Geberit Product Catalogue',216,CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
