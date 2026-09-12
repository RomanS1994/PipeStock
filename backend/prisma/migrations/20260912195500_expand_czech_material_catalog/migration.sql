-- Expand PipeStock's built-in catalog for common Czech plumbing/heating work.
-- Generic entries intentionally avoid manufacturer SKUs so one catalog remains usable
-- across the Czech market and does not duplicate the same fitting by supplier.
-- Historical order items keep snapshots of their material fields, so legacy catalog
-- rows can be deactivated without changing submitted/completed orders.

UPDATE "material_catalog_items"
SET "isActive" = false, "updatedAt" = CURRENT_TIMESTAMP
WHERE "categoryKey" = 'PEX_MLCP'
   OR "key" LIKE 'WAVIN_PPR_%'
   OR "key" LIKE 'GEBERIT_MAPRESS_CU_%'
   OR "key" IN ('VALVE_HALF_BALL', 'VALVE_34_BALL')
   OR "key" = 'OTHER_GENERIC';

WITH
cu_sizes("diameter","slug","position") AS (
  VALUES
    ('8 mm','8',0),('10 mm','10',1),('12 mm','12',2),('14 mm','14',3),
    ('15 mm','15',4),('16 mm','16',5),('18 mm','18',6),('22 mm','22',7),
    ('28 mm','28',8),('35 mm','35',9),('42 mm','42',10),('54 mm','54',11),
    ('64 mm','64',12),('76.1 mm','76p1',13),('88.9 mm','88p9',14),('108 mm','108',15)
),
cu_types("suffix","slug","type","unit","position") AS (
  VALUES
    ('PIPE','pipe','Trubka','m',0),
    ('ELBOW90','elbow90','Koleno 90°','ks',1),
    ('ELBOW45','elbow45','Koleno 45°','ks',2),
    ('BEND90','bend90','Oblouk 90°','ks',3),
    ('TEE','tee','T-kus','ks',4),
    ('COUPLING','coupling','Spojka','ks',5),
    ('SLIP_COUPLING','slip-coupling','Přesuvná spojka','ks',6),
    ('REDUCER','reducer','Redukce','ks',7),
    ('MALE_ADAPTER','male-adapter','Přechodka M','ks',8),
    ('FEMALE_ADAPTER','female-adapter','Přechodka F','ks',9),
    ('UNION','union','Šroubení','ks',10),
    ('CAP','cap','Zátka','ks',11)
),
ppr_sizes("diameter","slug","position") AS (
  VALUES
    ('16 mm','16',0),('20 mm','20',1),('25 mm','25',2),('32 mm','32',3),
    ('40 mm','40',4),('50 mm','50',5),('63 mm','63',6),('75 mm','75',7),
    ('90 mm','90',8),('110 mm','110',9),('125 mm','125',10),('160 mm','160',11),
    ('200 mm','200',12),('250 mm','250',13)
),
ppr_common_types("suffix","slug","type","unit","position") AS (
  VALUES
    ('PIPE','pipe','Trubka','m',0),
    ('ELBOW90','elbow90','Koleno 90°','ks',1),
    ('ELBOW45','elbow45','Koleno 45°','ks',2),
    ('TEE','tee','T-kus','ks',3),
    ('COUPLING','coupling','Spojka','ks',4),
    ('REDUCER','reducer','Redukce','ks',5),
    ('FLANGE','flange','Příruba','ks',6),
    ('CAP','cap','Zátka','ks',7)
),
ppr_small_types("suffix","slug","type","unit","position") AS (
  VALUES
    ('MALE_ADAPTER','male-adapter','Přechodka M','ks',8),
    ('FEMALE_ADAPTER','female-adapter','Přechodka F','ks',9),
    ('WALL_ELBOW','wall-elbow','Nástěnné koleno','ks',10),
    ('UNION','union','Šroubení','ks',11),
    ('CROSSOVER','crossover','Křížení','ks',12),
    ('EXPANSION_LOOP','expansion-loop','Kompenzační smyčka','ks',13)
),
mlcp_sizes("diameter","slug","position") AS (
  VALUES
    ('14 mm','14',0),('16 mm','16',1),('18 mm','18',2),('20 mm','20',3),
    ('25 mm','25',4),('26 mm','26',5),('32 mm','32',6),('40 mm','40',7),
    ('50 mm','50',8),('63 mm','63',9),('75 mm','75',10),('90 mm','90',11),('110 mm','110',12)
),
mlcp_common_types("suffix","slug","type","unit","position") AS (
  VALUES
    ('PIPE','pipe','Trubka','m',0),
    ('ELBOW90','elbow90','Koleno 90°','ks',1),
    ('TEE','tee','T-kus','ks',2),
    ('COUPLING','coupling','Spojka','ks',3),
    ('REDUCER','reducer','Redukce','ks',4),
    ('MALE_ADAPTER','male-adapter','Přechodka M','ks',5),
    ('FEMALE_ADAPTER','female-adapter','Přechodka F','ks',6),
    ('UNION','union','Šroubení','ks',7),
    ('CAP','cap','Zátka','ks',8)
),
mlcp_small_types("suffix","slug","type","unit","position") AS (
  VALUES ('WALL_ELBOW','wall-elbow','Nástěnné koleno','ks',9)
),
pex_sizes("diameter","slug","position") AS (
  VALUES
    ('16 mm','16',0),('20 mm','20',1),('25 mm','25',2),('32 mm','32',3),
    ('40 mm','40',4),('50 mm','50',5),('63 mm','63',6)
),
pex_common_types("suffix","slug","type","unit","position") AS (
  VALUES
    ('PIPE','pipe','Trubka','m',0),
    ('ELBOW90','elbow90','Koleno 90°','ks',1),
    ('TEE','tee','T-kus','ks',2),
    ('COUPLING','coupling','Spojka','ks',3),
    ('REDUCER','reducer','Redukce','ks',4),
    ('MALE_ADAPTER','male-adapter','Přechodka M','ks',5),
    ('FEMALE_ADAPTER','female-adapter','Přechodka F','ks',6),
    ('UNION','union','Šroubení','ks',7),
    ('CAP','cap','Zátka','ks',8)
),
pex_small_types("suffix","slug","type","unit","position") AS (
  VALUES ('WALL_ELBOW','wall-elbow','Nástěnné koleno','ks',9)
),
ht_sizes("diameter","slug","position") AS (
  VALUES ('32 mm','32',0),('40 mm','40',1),('50 mm','50',2),('75 mm','75',3),
         ('110 mm','110',4),('125 mm','125',5),('160 mm','160',6)
),
ht_types("suffix","slug","type","unit","position") AS (
  VALUES
    ('PIPE','pipe','Trubka','m',0),
    ('ELBOW15','elbow15','Koleno 15°','ks',1),
    ('ELBOW30','elbow30','Koleno 30°','ks',2),
    ('ELBOW45','elbow45','Koleno 45°','ks',3),
    ('ELBOW67','elbow67','Koleno 67°','ks',4),
    ('ELBOW87','elbow87','Koleno 87°','ks',5),
    ('BRANCH45','branch45','Odbočka 45°','ks',6),
    ('BRANCH67','branch67','Odbočka 67°','ks',7),
    ('BRANCH87','branch87','Odbočka 87°','ks',8),
    ('DOUBLE_BRANCH','double-branch','Dvojitá odbočka','ks',9),
    ('COUPLING','coupling','Spojka','ks',10),
    ('SLIP_SOCKET','slip-socket','Přesuvné hrdlo','ks',11),
    ('REDUCER','reducer','Redukce','ks',12),
    ('CAP','cap','Zátka','ks',13),
    ('CLEANOUT','cleanout','Revizní kus','ks',14)
),
kg_sizes("diameter","slug","position") AS (
  VALUES ('110 mm','110',0),('125 mm','125',1),('160 mm','160',2),('200 mm','200',3),
         ('250 mm','250',4),('315 mm','315',5),('400 mm','400',6),('500 mm','500',7)
),
kg_types("suffix","slug","type","unit","position") AS (
  VALUES
    ('PIPE','pipe','Trubka','m',0),
    ('ELBOW15','elbow15','Koleno 15°','ks',1),
    ('ELBOW30','elbow30','Koleno 30°','ks',2),
    ('ELBOW45','elbow45','Koleno 45°','ks',3),
    ('ELBOW67','elbow67','Koleno 67°','ks',4),
    ('ELBOW87','elbow87','Koleno 87°','ks',5),
    ('BRANCH45','branch45','Odbočka 45°','ks',6),
    ('BRANCH87','branch87','Odbočka 87°','ks',7),
    ('COUPLING','coupling','Spojka','ks',8),
    ('SLIP_COUPLING','slip-coupling','Přesuvná spojka','ks',9),
    ('REDUCER','reducer','Redukce','ks',10),
    ('CAP','cap','Zátka','ks',11),
    ('CLEANOUT','cleanout','Revizní kus','ks',12),
    ('HT_TRANSITION','ht-transition','Přechod HT/KG','ks',13)
),
steel_sizes("diameter","slug","position") AS (
  VALUES ('15 mm','15',0),('18 mm','18',1),('22 mm','22',2),('28 mm','28',3),
         ('35 mm','35',4),('42 mm','42',5),('54 mm','54',6),('76.1 mm','76p1',7),
         ('88.9 mm','88p9',8),('108 mm','108',9)
),
steel_types("suffix","slug","type","unit","position") AS (
  VALUES
    ('PIPE','pipe','Trubka','m',0),
    ('ELBOW90','elbow90','Koleno 90°','ks',1),
    ('ELBOW45','elbow45','Koleno 45°','ks',2),
    ('TEE','tee','T-kus','ks',3),
    ('COUPLING','coupling','Spojka','ks',4),
    ('REDUCER','reducer','Redukce','ks',5),
    ('MALE_ADAPTER','male-adapter','Přechodka M','ks',6),
    ('FEMALE_ADAPTER','female-adapter','Přechodka F','ks',7),
    ('UNION','union','Šroubení','ks',8),
    ('CAP','cap','Zátka','ks',9)
),
thread_sizes("diameter","slug","position") AS (
  VALUES
    ('DN 8 (1/4″)','dn8',0),('DN 10 (3/8″)','dn10',1),('DN 15 (1/2″)','dn15',2),
    ('DN 20 (3/4″)','dn20',3),('DN 25 (1″)','dn25',4),('DN 32 (1¼″)','dn32',5),
    ('DN 40 (1½″)','dn40',6),('DN 50 (2″)','dn50',7),('DN 65 (2½″)','dn65',8),
    ('DN 80 (3″)','dn80',9),('DN 100 (4″)','dn100',10)
),
brass_types("suffix","slug","type","unit","position") AS (
  VALUES
    ('NIPPLE','nipple','Vsuvka','ks',0),
    ('SOCKET','socket','Mufna','ks',1),
    ('ELBOW90','elbow90','Koleno 90°','ks',2),
    ('TEE','tee','T-kus','ks',3),
    ('REDUCER','reducer','Redukce','ks',4),
    ('EXTENSION','extension','Prodloužení','ks',5),
    ('UNION','union','Šroubení','ks',6),
    ('PLUG','plug','Zátka','ks',7)
),
valve_types("suffix","slug","type","unit","position") AS (
  VALUES
    ('BALL','ball','Kulový ventil','ks',0),
    ('CHECK','check','Zpětná klapka','ks',1),
    ('FILTER','filter','Filtr','ks',2),
    ('SAFETY','safety','Pojistný ventil','ks',3),
    ('DRAIN','drain','Vypouštěcí ventil','ks',4),
    ('PRESSURE_REDUCER','pressure-reducer','Redukční ventil','ks',5)
),
special_items("id","key","categoryKey","categoryLabel","diameter","type","name","unit","sortOrder") AS (
  VALUES
    ('valve-angle-dn15','VALVES_DN15_ANGLE','VALVES','Ventily','DN 15 (1/2″)','Rohový ventil','Ventil DN 15 (1/2″) — Rohový ventil','ks',9010),
    ('valve-airvent-generic','VALVES_GENERIC_AIRVENT','VALVES','Ventily','—','Automatický odvzdušňovací ventil','Automatický odvzdušňovací ventil','ks',9090),
    ('valve-manometer-generic','VALVES_GENERIC_MANOMETER','VALVES','Ventily','—','Manometr','Manometr','ks',9091),
    ('valve-expansion-generic','VALVES_GENERIC_EXPANSION','VALVES','Ventily','—','Expanzní nádoba','Expanzní nádoba','ks',9092),

    ('geberit-frame-wc','GEBERIT_FRAME_WC','GEBERIT','Geberit','—','Instalační rám WC','Geberit — Instalační rám WC','ks',10000),
    ('geberit-frame-basin','GEBERIT_FRAME_BASIN','GEBERIT','Geberit','—','Instalační rám umyvadlo','Geberit — Instalační rám umyvadlo','ks',10001),
    ('geberit-frame-urinal','GEBERIT_FRAME_URINAL','GEBERIT','Geberit','—','Instalační rám pisoár','Geberit — Instalační rám pisoár','ks',10002),
    ('geberit-frame-bidet','GEBERIT_FRAME_BIDET','GEBERIT','Geberit','—','Instalační rám bidet','Geberit — Instalační rám bidet','ks',10003),
    ('geberit-flush-plate','GEBERIT_FLUSH_PLATE','GEBERIT','Geberit','—','Ovládací tlačítko','Geberit — Ovládací tlačítko','ks',10004),
    ('geberit-fill-valve','GEBERIT_FILL_VALVE','GEBERIT','Geberit','—','Napouštěcí ventil','Geberit — Napouštěcí ventil','ks',10005),
    ('geberit-flush-valve','GEBERIT_FLUSH_VALVE','GEBERIT','Geberit','—','Vypouštěcí ventil','Geberit — Vypouštěcí ventil','ks',10006),
    ('geberit-wc-connection','GEBERIT_WC_CONNECTION','GEBERIT','Geberit','—','Připojovací souprava WC','Geberit — Připojovací souprava WC','ks',10007),
    ('geberit-frame-anchor','GEBERIT_FRAME_ANCHOR','GEBERIT','Geberit','—','Kotvení rámu','Geberit — Kotvení rámu','sada',10008),
    ('geberit-sound-insulation','GEBERIT_SOUND_INSULATION','GEBERIT','Geberit','—','Zvuková izolace WC','Geberit — Zvuková izolace WC','ks',10009),

    ('sanita-wall-wc','SANITA_WALL_WC','SANITA','Sanita','—','Závěsné WC','Sanita — Závěsné WC','ks',11000),
    ('sanita-floor-wc','SANITA_FLOOR_WC','SANITA','Sanita','—','Stojící WC','Sanita — Stojící WC','ks',11001),
    ('sanita-basin','SANITA_BASIN','SANITA','Sanita','—','Umyvadlo','Sanita — Umyvadlo','ks',11002),
    ('sanita-bidet','SANITA_BIDET','SANITA','Sanita','—','Bidet','Sanita — Bidet','ks',11003),
    ('sanita-urinal','SANITA_URINAL','SANITA','Sanita','—','Pisoár','Sanita — Pisoár','ks',11004),
    ('sanita-basin-siphon','SANITA_BASIN_SIPHON','SANITA','Sanita','—','Sifon umyvadlový','Sanita — Sifon umyvadlový','ks',11005),
    ('sanita-sink-siphon','SANITA_SINK_SIPHON','SANITA','Sanita','—','Sifon dřezový','Sanita — Sifon dřezový','ks',11006),
    ('sanita-bath-siphon','SANITA_BATH_SIPHON','SANITA','Sanita','—','Sifon vanový','Sanita — Sifon vanový','ks',11007),
    ('sanita-shower-siphon','SANITA_SHOWER_SIPHON','SANITA','Sanita','—','Sifon sprchový','Sanita — Sifon sprchový','ks',11008),
    ('sanita-shower-drain','SANITA_SHOWER_DRAIN','SANITA','Sanita','—','Sprchový žlab','Sanita — Sprchový žlab','ks',11009),
    ('sanita-floor-drain','SANITA_FLOOR_DRAIN','SANITA','Sanita','—','Podlahová vpusť','Sanita — Podlahová vpusť','ks',11010),
    ('sanita-wc-connector','SANITA_WC_CONNECTOR','SANITA','Sanita','—','WC manžeta','Sanita — WC manžeta','ks',11011),

    ('other-generic-cz','OTHER_GENERIC_CZ','OTHER','Jiné','—','Jiné','Jiné','ks',12000)
),
catalog("id","key","categoryKey","categoryLabel","diameter","type","name","unit","sortOrder") AS (
  SELECT 'cu-'||s."slug"||'-'||t."slug", 'CU_'||replace(upper(s."slug"),'P','_')||'_'||t."suffix",
         'CU','Cu',s."diameter",t."type",'Cu '||s."diameter"||' — '||t."type",t."unit",
         1000 + s."position"*20 + t."position"
  FROM cu_sizes s CROSS JOIN cu_types t

  UNION ALL
  SELECT 'ppr-'||s."slug"||'-'||t."slug", 'PPR_'||s."slug"||'_'||t."suffix",
         'PPR','PPR',s."diameter",t."type",'PPR '||s."diameter"||' — '||t."type",t."unit",
         2000 + s."position"*20 + t."position"
  FROM ppr_sizes s CROSS JOIN ppr_common_types t

  UNION ALL
  SELECT 'ppr-'||s."slug"||'-'||t."slug", 'PPR_'||s."slug"||'_'||t."suffix",
         'PPR','PPR',s."diameter",t."type",'PPR '||s."diameter"||' — '||t."type",t."unit",
         2000 + s."position"*20 + t."position"
  FROM ppr_sizes s CROSS JOIN ppr_small_types t
  WHERE s."position" <= 6

  UNION ALL
  SELECT 'mlcp-'||s."slug"||'-'||t."slug", 'MLCP_'||s."slug"||'_'||t."suffix",
         'MLCP','MLCP',s."diameter",t."type",'MLCP '||s."diameter"||' — '||t."type",t."unit",
         3000 + s."position"*20 + t."position"
  FROM mlcp_sizes s CROSS JOIN mlcp_common_types t

  UNION ALL
  SELECT 'mlcp-'||s."slug"||'-'||t."slug", 'MLCP_'||s."slug"||'_'||t."suffix",
         'MLCP','MLCP',s."diameter",t."type",'MLCP '||s."diameter"||' — '||t."type",t."unit",
         3000 + s."position"*20 + t."position"
  FROM mlcp_sizes s CROSS JOIN mlcp_small_types t
  WHERE s."diameter" IN ('14 mm','16 mm','18 mm','20 mm','25 mm','26 mm','32 mm')

  UNION ALL
  SELECT 'pex-'||s."slug"||'-'||t."slug", 'PEX_'||s."slug"||'_'||t."suffix",
         'PEX','PEX',s."diameter",t."type",'PEX '||s."diameter"||' — '||t."type",t."unit",
         4000 + s."position"*20 + t."position"
  FROM pex_sizes s CROSS JOIN pex_common_types t

  UNION ALL
  SELECT 'pex-'||s."slug"||'-'||t."slug", 'PEX_'||s."slug"||'_'||t."suffix",
         'PEX','PEX',s."diameter",t."type",'PEX '||s."diameter"||' — '||t."type",t."unit",
         4000 + s."position"*20 + t."position"
  FROM pex_sizes s CROSS JOIN pex_small_types t
  WHERE s."diameter" IN ('16 mm','20 mm','25 mm','32 mm')

  UNION ALL
  SELECT 'ht-'||s."slug"||'-'||t."slug", 'HT_'||s."slug"||'_'||t."suffix",
         'HT','HT',s."diameter",t."type",'HT '||s."diameter"||' — '||t."type",t."unit",
         5000 + s."position"*20 + t."position"
  FROM ht_sizes s CROSS JOIN ht_types t

  UNION ALL
  SELECT 'kg-'||s."slug"||'-'||t."slug", 'KG_'||s."slug"||'_'||t."suffix",
         'KG','KG',s."diameter",t."type",'KG '||s."diameter"||' — '||t."type",t."unit",
         6000 + s."position"*20 + t."position"
  FROM kg_sizes s CROSS JOIN kg_types t

  UNION ALL
  SELECT 'steel-'||s."slug"||'-'||t."slug", 'STEEL_'||replace(upper(s."slug"),'P','_')||'_'||t."suffix",
         'STEEL','Ocel',s."diameter",t."type",'Ocel '||s."diameter"||' — '||t."type",t."unit",
         7000 + s."position"*20 + t."position"
  FROM steel_sizes s CROSS JOIN steel_types t

  UNION ALL
  SELECT 'brass-'||s."slug"||'-'||t."slug", 'BRASS_'||upper(s."slug")||'_'||t."suffix",
         'BRASS','Mosaz',s."diameter",t."type",'Mosaz '||s."diameter"||' — '||t."type",t."unit",
         8000 + s."position"*20 + t."position"
  FROM thread_sizes s CROSS JOIN brass_types t

  UNION ALL
  SELECT 'valve-'||s."slug"||'-'||t."slug", 'VALVES_'||upper(s."slug")||'_'||t."suffix",
         'VALVES','Ventily',s."diameter",t."type",'Ventil '||s."diameter"||' — '||t."type",t."unit",
         9000 + s."position"*20 + t."position"
  FROM thread_sizes s CROSS JOIN valve_types t

  UNION ALL
  SELECT "id","key","categoryKey","categoryLabel","diameter","type","name","unit","sortOrder"
  FROM special_items
)
INSERT INTO "material_catalog_items" (
  "id","key","categoryKey","categoryLabel","diameter","type","name","unit","sortOrder","isActive","updatedAt"
)
SELECT
  c."id",c."key",c."categoryKey",c."categoryLabel",c."diameter",c."type",c."name",c."unit",c."sortOrder",true,CURRENT_TIMESTAMP
FROM catalog c
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
