WITH diameters("diameter", "size", "position") AS (
  VALUES
    ('12 mm', '12', 0),
    ('15 mm', '15', 1),
    ('18 mm', '18', 2),
    ('22 mm', '22', 3),
    ('28 mm', '28', 4),
    ('35 mm', '35', 5),
    ('42 mm', '42', 6),
    ('54 mm', '54', 7)
),
types("keySuffix", "idSuffix", "type", "unit", "position") AS (
  VALUES
    ('PIPE', 'pipe', 'Trubka', 'm', 0),
    ('ELBOW90', 'elbow90', 'Koleno 90°', 'ks', 1),
    ('ELBOW45', 'elbow45', 'Koleno 45°', 'ks', 2),
    ('TEE', 'tee', 'T-kus', 'ks', 3),
    ('COUPLING', 'coupling', 'Spojka', 'ks', 4),
    ('REDUCER', 'reducer', 'Redukce', 'ks', 5),
    ('ADAPTER', 'adapter', 'Přechodka', 'ks', 6)
)
INSERT INTO "material_catalog_items" (
  "id",
  "key",
  "categoryKey",
  "categoryLabel",
  "diameter",
  "type",
  "name",
  "unit",
  "sortOrder",
  "isActive",
  "updatedAt"
)
SELECT
  'cu-' || d."size" || '-' || t."idSuffix",
  'CU_' || d."size" || '_' || t."keySuffix",
  'CU',
  'Cu',
  d."diameter",
  t."type",
  'Cu ' || d."diameter" || ' — ' || t."type",
  t."unit",
  10 + d."position" * 10 + t."position",
  true,
  CURRENT_TIMESTAMP
FROM diameters d
CROSS JOIN types t
ON CONFLICT ("key") DO UPDATE SET
  "categoryKey" = EXCLUDED."categoryKey",
  "categoryLabel" = EXCLUDED."categoryLabel",
  "diameter" = EXCLUDED."diameter",
  "type" = EXCLUDED."type",
  "name" = EXCLUDED."name",
  "unit" = EXCLUDED."unit",
  "sortOrder" = EXCLUDED."sortOrder",
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "material_catalog_items" (
  "id",
  "key",
  "categoryKey",
  "categoryLabel",
  "diameter",
  "type",
  "name",
  "unit",
  "sortOrder",
  "isActive",
  "updatedAt"
)
VALUES (
  'other-generic',
  'OTHER_GENERIC',
  'OTHER',
  'Інше',
  '—',
  'Інше',
  'Інше',
  'ks',
  200,
  true,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO UPDATE SET
  "categoryKey" = EXCLUDED."categoryKey",
  "categoryLabel" = EXCLUDED."categoryLabel",
  "diameter" = EXCLUDED."diameter",
  "type" = EXCLUDED."type",
  "name" = EXCLUDED."name",
  "unit" = EXCLUDED."unit",
  "sortOrder" = EXCLUDED."sortOrder",
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP;
