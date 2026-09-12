-- Add real connection-size variants for the Czech plumbing catalogue.
-- The existing UI uses the diameter field as the selectable size label, so compound
-- dimensions such as 32×25 mm and 32×20×32 mm work without changing old orders.
-- Generic placeholders for fittings whose second/third connection matters are hidden.

UPDATE "material_catalog_items"
SET "isActive" = false, "updatedAt" = CURRENT_TIMESTAMP
WHERE "isActive" = true
  AND (
    ("categoryKey" IN ('CU','PPR','MLCP','PEX','STEEL')
      AND "type" IN ('Redukce','T-kus','Přechodka M','Přechodka F'))
    OR
    ("categoryKey" IN ('HT','KG')
      AND "type" IN ('Redukce','Odbočka 45°','Odbočka 67°','Odbočka 87°','Dvojitá odbočka'))
  );

-- Pressure systems: reducers and reduced/equal tees.
WITH sizes("categoryKey","categoryLabel","size","slug","position") AS (
  VALUES
    ('CU','Cu','8','8',1),('CU','Cu','10','10',2),('CU','Cu','12','12',3),('CU','Cu','14','14',4),
    ('CU','Cu','15','15',5),('CU','Cu','16','16',6),('CU','Cu','18','18',7),('CU','Cu','22','22',8),
    ('CU','Cu','28','28',9),('CU','Cu','35','35',10),('CU','Cu','42','42',11),('CU','Cu','54','54',12),
    ('CU','Cu','64','64',13),('CU','Cu','76.1','76p1',14),('CU','Cu','88.9','88p9',15),('CU','Cu','108','108',16),

    ('PPR','PPR','16','16',1),('PPR','PPR','20','20',2),('PPR','PPR','25','25',3),('PPR','PPR','32','32',4),
    ('PPR','PPR','40','40',5),('PPR','PPR','50','50',6),('PPR','PPR','63','63',7),('PPR','PPR','75','75',8),
    ('PPR','PPR','90','90',9),('PPR','PPR','110','110',10),('PPR','PPR','125','125',11),('PPR','PPR','160','160',12),
    ('PPR','PPR','200','200',13),('PPR','PPR','250','250',14),

    ('MLCP','MLCP','14','14',1),('MLCP','MLCP','16','16',2),('MLCP','MLCP','18','18',3),('MLCP','MLCP','20','20',4),
    ('MLCP','MLCP','25','25',5),('MLCP','MLCP','26','26',6),('MLCP','MLCP','32','32',7),('MLCP','MLCP','40','40',8),
    ('MLCP','MLCP','50','50',9),('MLCP','MLCP','63','63',10),('MLCP','MLCP','75','75',11),('MLCP','MLCP','90','90',12),('MLCP','MLCP','110','110',13),

    ('PEX','PEX','16','16',1),('PEX','PEX','20','20',2),('PEX','PEX','25','25',3),('PEX','PEX','32','32',4),
    ('PEX','PEX','40','40',5),('PEX','PEX','50','50',6),('PEX','PEX','63','63',7),

    ('STEEL','Ocel','15','15',1),('STEEL','Ocel','18','18',2),('STEEL','Ocel','22','22',3),('STEEL','Ocel','28','28',4),
    ('STEEL','Ocel','35','35',5),('STEEL','Ocel','42','42',6),('STEEL','Ocel','54','54',7),('STEEL','Ocel','76.1','76p1',8),
    ('STEEL','Ocel','88.9','88p9',9),('STEEL','Ocel','108','108',10)
), reducers AS (
  SELECT
    a."categoryKey", a."categoryLabel", a."size" AS main_size, a."slug" AS main_slug,
    b."size" AS branch_size, b."slug" AS branch_slug,
    a."position" AS main_pos, b."position" AS branch_pos
  FROM sizes a
  JOIN sizes b ON b."categoryKey" = a."categoryKey" AND b."position" < a."position"
), tees AS (
  SELECT
    a."categoryKey", a."categoryLabel", a."size" AS main_size, a."slug" AS main_slug,
    b."size" AS branch_size, b."slug" AS branch_slug,
    a."position" AS main_pos, b."position" AS branch_pos
  FROM sizes a
  JOIN sizes b ON b."categoryKey" = a."categoryKey" AND b."position" <= a."position"
)
INSERT INTO "material_catalog_items" (
  "id","key","categoryKey","categoryLabel","diameter","type","name","unit","sortOrder","isActive","updatedAt"
)
SELECT
  lower(r."categoryKey") || '-' || r.main_slug || '-' || r.branch_slug || '-reducer',
  r."categoryKey" || '_' || upper(replace(r.main_slug,'.','P')) || '_' || upper(replace(r.branch_slug,'.','P')) || '_REDUCER_VARIANT',
  r."categoryKey", r."categoryLabel",
  r.main_size || '×' || r.branch_size || ' mm',
  'Redukce',
  r."categoryLabel" || ' ' || r.main_size || '×' || r.branch_size || ' mm — Redukce',
  'ks', 12000 + r.main_pos * 100 + r.branch_pos, true, CURRENT_TIMESTAMP
FROM reducers r
UNION ALL
SELECT
  lower(t."categoryKey") || '-' || t.main_slug || '-' || t.branch_slug || '-tee',
  t."categoryKey" || '_' || upper(replace(t.main_slug,'.','P')) || '_' || upper(replace(t.branch_slug,'.','P')) || '_TEE_VARIANT',
  t."categoryKey", t."categoryLabel",
  t.main_size || '×' || t.branch_size || '×' || t.main_size || ' mm',
  'T-kus',
  t."categoryLabel" || ' ' || t.main_size || '×' || t.branch_size || '×' || t.main_size || ' mm — T-kus',
  'ks', 15000 + t.main_pos * 100 + t.branch_pos, true, CURRENT_TIMESTAMP
FROM tees t
ON CONFLICT ("key") DO UPDATE SET
  "diameter" = EXCLUDED."diameter", "type" = EXCLUDED."type", "name" = EXCLUDED."name",
  "unit" = EXCLUDED."unit", "sortOrder" = EXCLUDED."sortOrder", "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP;

-- Thread adapters. M = male thread, F = female thread.
WITH adapter_map("categoryKey","categoryLabel","pipeSize","pipeSlug","threadSize","threadSlug","position") AS (
  VALUES
    ('CU','Cu','10','10','3/8″','38',1),('CU','Cu','12','12','3/8″','38',2),('CU','Cu','12','12','1/2″','12',3),
    ('CU','Cu','15','15','1/2″','12',4),('CU','Cu','18','18','1/2″','12',5),('CU','Cu','18','18','3/4″','34',6),
    ('CU','Cu','22','22','3/4″','34',7),('CU','Cu','22','22','1″','1',8),('CU','Cu','28','28','1″','1',9),
    ('CU','Cu','35','35','1 1/4″','114',10),('CU','Cu','42','42','1 1/2″','112',11),('CU','Cu','54','54','2″','2',12),

    ('PPR','PPR','16','16','1/2″','12',20),('PPR','PPR','20','20','1/2″','12',21),('PPR','PPR','20','20','3/4″','34',22),
    ('PPR','PPR','25','25','1/2″','12',23),('PPR','PPR','25','25','3/4″','34',24),('PPR','PPR','25','25','1″','1',25),
    ('PPR','PPR','32','32','3/4″','34',26),('PPR','PPR','32','32','1″','1',27),('PPR','PPR','40','40','1 1/4″','114',28),
    ('PPR','PPR','50','50','1 1/2″','112',29),('PPR','PPR','63','63','2″','2',30),

    ('MLCP','MLCP','14','14','1/2″','12',40),('MLCP','MLCP','16','16','1/2″','12',41),('MLCP','MLCP','18','18','1/2″','12',42),
    ('MLCP','MLCP','20','20','1/2″','12',43),('MLCP','MLCP','20','20','3/4″','34',44),('MLCP','MLCP','25','25','3/4″','34',45),
    ('MLCP','MLCP','26','26','3/4″','34',46),('MLCP','MLCP','26','26','1″','1',47),('MLCP','MLCP','32','32','1″','1',48),
    ('MLCP','MLCP','40','40','1 1/4″','114',49),('MLCP','MLCP','50','50','1 1/2″','112',50),('MLCP','MLCP','63','63','2″','2',51),

    ('PEX','PEX','16','16','1/2″','12',60),('PEX','PEX','20','20','1/2″','12',61),('PEX','PEX','20','20','3/4″','34',62),
    ('PEX','PEX','25','25','3/4″','34',63),('PEX','PEX','25','25','1″','1',64),('PEX','PEX','32','32','1″','1',65),
    ('PEX','PEX','40','40','1 1/4″','114',66),('PEX','PEX','50','50','1 1/2″','112',67),('PEX','PEX','63','63','2″','2',68),

    ('STEEL','Ocel','15','15','1/2″','12',80),('STEEL','Ocel','18','18','1/2″','12',81),('STEEL','Ocel','22','22','3/4″','34',82),
    ('STEEL','Ocel','28','28','1″','1',83),('STEEL','Ocel','35','35','1 1/4″','114',84),('STEEL','Ocel','42','42','1 1/2″','112',85),
    ('STEEL','Ocel','54','54','2″','2',86)
), genders("suffix","type","sortOffset") AS (
  VALUES ('M','Přechodka M',0),('F','Přechodka F',1)
)
INSERT INTO "material_catalog_items" (
  "id","key","categoryKey","categoryLabel","diameter","type","name","unit","sortOrder","isActive","updatedAt"
)
SELECT
  lower(a."categoryKey") || '-' || a."pipeSlug" || '-' || a."threadSlug" || '-' || lower(g."suffix") || '-adapter',
  a."categoryKey" || '_' || upper(a."pipeSlug") || '_' || upper(a."threadSlug") || '_ADAPTER_' || g."suffix",
  a."categoryKey", a."categoryLabel",
  a."pipeSize" || ' mm × ' || a."threadSize",
  g."type",
  a."categoryLabel" || ' ' || a."pipeSize" || ' mm × ' || a."threadSize" || ' — ' || g."type",
  'ks', 18000 + a."position" * 10 + g."sortOffset", true, CURRENT_TIMESTAMP
FROM adapter_map a
CROSS JOIN genders g
ON CONFLICT ("key") DO UPDATE SET
  "diameter" = EXCLUDED."diameter", "type" = EXCLUDED."type", "name" = EXCLUDED."name",
  "unit" = EXCLUDED."unit", "sortOrder" = EXCLUDED."sortOrder", "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP;

-- HT/KG drainage reducers and branches with real main/branch dimensions.
WITH drain_sizes("categoryKey","categoryLabel","size","slug","position") AS (
  VALUES
    ('HT','HT','32','32',1),('HT','HT','40','40',2),('HT','HT','50','50',3),('HT','HT','75','75',4),
    ('HT','HT','110','110',5),('HT','HT','125','125',6),('HT','HT','160','160',7),
    ('KG','KG','110','110',1),('KG','KG','125','125',2),('KG','KG','160','160',3),('KG','KG','200','200',4),
    ('KG','KG','250','250',5),('KG','KG','315','315',6),('KG','KG','400','400',7),('KG','KG','500','500',8)
), reducer_pairs AS (
  SELECT a."categoryKey",a."categoryLabel",a."size" main_size,a."slug" main_slug,a."position" main_pos,
         b."size" branch_size,b."slug" branch_slug,b."position" branch_pos
  FROM drain_sizes a
  JOIN drain_sizes b ON b."categoryKey"=a."categoryKey" AND b."position" < a."position"
), branch_pairs AS (
  SELECT a."categoryKey",a."categoryLabel",a."size" main_size,a."slug" main_slug,a."position" main_pos,
         b."size" branch_size,b."slug" branch_slug,b."position" branch_pos
  FROM drain_sizes a
  JOIN drain_sizes b ON b."categoryKey"=a."categoryKey" AND b."position" <= a."position"
), branch_types("suffix","slug","type","position") AS (
  VALUES ('BR45','branch45','Odbočka 45°',1),('BR67','branch67','Odbočka 67°',2),('BR87','branch87','Odbočka 87°',3),('DBR','double-branch','Dvojitá odbočka',4)
)
INSERT INTO "material_catalog_items" (
  "id","key","categoryKey","categoryLabel","diameter","type","name","unit","sortOrder","isActive","updatedAt"
)
SELECT
  lower(r."categoryKey") || '-' || r.main_slug || '-' || r.branch_slug || '-reducer-variant',
  r."categoryKey" || '_' || r.main_slug || '_' || r.branch_slug || '_DRAIN_REDUCER',
  r."categoryKey",r."categoryLabel",
  r.main_size || '×' || r.branch_size || ' mm','Redukce',
  r."categoryLabel" || ' ' || r.main_size || '×' || r.branch_size || ' mm — Redukce','ks',
  21000 + r.main_pos * 100 + r.branch_pos,true,CURRENT_TIMESTAMP
FROM reducer_pairs r
UNION ALL
SELECT
  lower(b."categoryKey") || '-' || b.main_slug || '-' || b.branch_slug || '-' || bt.slug,
  b."categoryKey" || '_' || b.main_slug || '_' || b.branch_slug || '_' || bt."suffix",
  b."categoryKey",b."categoryLabel",
  b.main_size || '×' || b.branch_size || ' mm',bt."type",
  b."categoryLabel" || ' ' || b.main_size || '×' || b.branch_size || ' mm — ' || bt."type",'ks',
  23000 + b.main_pos * 100 + b.branch_pos * 10 + bt."position",true,CURRENT_TIMESTAMP
FROM branch_pairs b
CROSS JOIN branch_types bt
WHERE NOT (b."categoryKey"='KG' AND bt."suffix"='BR67')
ON CONFLICT ("key") DO UPDATE SET
  "diameter" = EXCLUDED."diameter", "type" = EXCLUDED."type", "name" = EXCLUDED."name",
  "unit" = EXCLUDED."unit", "sortOrder" = EXCLUDED."sortOrder", "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP;
