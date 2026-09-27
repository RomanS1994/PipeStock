-- Refine production catalog positions after catalog QA:
-- 1) Keep carbon steel first and PPR second in API ordering.
-- 2) Remove the useless generic "Jiné" row from the active catalog.
-- 3) Add practical positions that plumbers usually record in real orders.

UPDATE "material_catalog_items"
SET
  "sortOrder" = CASE "categoryKey"
    WHEN 'STEEL' THEN 1000 + ("sortOrder" % 1000)
    WHEN 'PPR' THEN 2000 + ("sortOrder" % 1000)
    WHEN 'CU' THEN 3000 + ("sortOrder" % 1000)
    WHEN 'MLCP' THEN 4000 + ("sortOrder" % 1000)
    WHEN 'PEX' THEN 5000 + ("sortOrder" % 1000)
    WHEN 'HT' THEN 6000 + ("sortOrder" % 1000)
    WHEN 'KG' THEN 7000 + ("sortOrder" % 1000)
    WHEN 'BRASS' THEN 8000 + ("sortOrder" % 1000)
    WHEN 'VALVES' THEN 9000 + ("sortOrder" % 1000)
    WHEN 'GEBERIT' THEN 10000 + ("sortOrder" % 1000)
    WHEN 'SANITA' THEN 11000 + ("sortOrder" % 1000)
    WHEN 'OTHER' THEN 12000 + ("sortOrder" % 1000)
    ELSE "sortOrder"
  END,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "isActive" = true;

UPDATE "material_catalog_items"
SET "isActive" = false, "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'OTHER_GENERIC_CZ';

WITH new_items("id","key","categoryKey","categoryLabel","diameter","type","name","unit","sortOrder") AS (
  VALUES
    ('valve-angle-dn10','VALVES_DN10_ANGLE','VALVES','Ventily','DN 10 (3/8″)','Rohový ventil','Ventil DN 10 (3/8″) — Rohový ventil','ks',9021),
    ('valve-angle-dn20','VALVES_DN20_ANGLE','VALVES','Ventily','DN 20 (3/4″)','Rohový ventil','Ventil DN 20 (3/4″) — Rohový ventil','ks',9023),
    ('valve-radiator-straight-dn15','VALVES_DN15_RADIATOR_STRAIGHT','VALVES','Ventily','DN 15 (1/2″)','Radiátorový ventil přímý','Ventil DN 15 (1/2″) — Radiátorový ventil přímý','ks',9093),
    ('valve-radiator-angle-dn15','VALVES_DN15_RADIATOR_ANGLE','VALVES','Ventily','DN 15 (1/2″)','Radiátorový ventil rohový','Ventil DN 15 (1/2″) — Radiátorový ventil rohový','ks',9094),
    ('valve-thermostatic-head','VALVES_THERMOSTATIC_HEAD','VALVES','Ventily','—','Termostatická hlavice','Termostatická hlavice','ks',9095),

    ('sanita-kitchen-sink','SANITA_KITCHEN_SINK','SANITA','Sanita','—','Dřez','Sanita — Dřez','ks',11012),
    ('sanita-bath','SANITA_BATH','SANITA','Sanita','—','Vana','Sanita — Vana','ks',11013),
    ('sanita-shower-tray','SANITA_SHOWER_TRAY','SANITA','Sanita','—','Sprchová vanička','Sanita — Sprchová vanička','ks',11014),
    ('sanita-toilet-seat','SANITA_TOILET_SEAT','SANITA','Sanita','—','WC sedátko','Sanita — WC sedátko','ks',11015),
    ('sanita-basin-faucet','SANITA_BASIN_FAUCET','SANITA','Sanita','—','Umyvadlová baterie','Sanita — Umyvadlová baterie','ks',11016),
    ('sanita-sink-faucet','SANITA_SINK_FAUCET','SANITA','Sanita','—','Dřezová baterie','Sanita — Dřezová baterie','ks',11017),
    ('sanita-shower-faucet','SANITA_SHOWER_FAUCET','SANITA','Sanita','—','Sprchová baterie','Sanita — Sprchová baterie','ks',11018),
    ('sanita-bath-faucet','SANITA_BATH_FAUCET','SANITA','Sanita','—','Vanová baterie','Sanita — Vanová baterie','ks',11019),
    ('sanita-shower-set','SANITA_SHOWER_SET','SANITA','Sanita','—','Sprchová souprava','Sanita — Sprchová souprava','ks',11020),

    ('other-ptfe-tape','OTHER_PTFE_TAPE','OTHER','Montážní materiál','—','PTFE páska','Montážní materiál — PTFE páska','ks',12001),
    ('other-hemp','OTHER_HEMP','OTHER','Montážní materiál','—','Konopí','Montážní materiál — Konopí','ks',12002),
    ('other-sealing-paste','OTHER_SEALING_PASTE','OTHER','Montážní materiál','—','Těsnicí pasta','Montážní materiál — Těsnicí pasta','ks',12003),
    ('other-sanitary-silicone','OTHER_SANITARY_SILICONE','OTHER','Montážní materiál','—','Sanitární silikon','Montážní materiál — Sanitární silikon','ks',12004),
    ('other-pipe-clamp','OTHER_PIPE_CLAMP','OTHER','Montážní materiál','—','Objímka potrubí','Montážní materiál — Objímka potrubí','ks',12005),
    ('other-pipe-insulation','OTHER_PIPE_INSULATION','OTHER','Montážní materiál','—','Izolace potrubí','Montážní materiál — Izolace potrubí','m',12006),
    ('other-fire-collar','OTHER_FIRE_COLLAR','OTHER','Montážní materiál','—','Požární manžeta','Montážní materiál — Požární manžeta','ks',12007),
    ('other-mounting-rail','OTHER_MOUNTING_RAIL','OTHER','Montážní materiál','—','Montážní lišta','Montážní materiál — Montážní lišta','m',12008)
)
INSERT INTO "material_catalog_items" (
  "id","key","categoryKey","categoryLabel","diameter","type","name","unit","sortOrder","isActive","updatedAt"
)
SELECT
  "id","key","categoryKey","categoryLabel","diameter","type","name","unit","sortOrder",true,CURRENT_TIMESTAMP
FROM new_items
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
