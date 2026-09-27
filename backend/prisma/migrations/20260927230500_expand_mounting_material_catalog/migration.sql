-- Expand "Montážní materiál" with practical items used on plumbing jobs.
-- Keep these items in OTHER so main pipe/fitting categories stay clean.

WITH new_items("id","key","categoryKey","categoryLabel","diameter","type","name","unit","sortOrder") AS (
  VALUES
    -- Sealing and thread work
    ('other-teflon-thread','OTHER_TEFLON_THREAD','OTHER','Montážní materiál','—','Teflonová nit','Montážní materiál — Teflonová nit','ks',12009),
    ('other-sealing-cord','OTHER_SEALING_CORD','OTHER','Montážní materiál','—','Těsnicí šňůra','Montážní materiál — Těsnicí šňůra','ks',12010),
    ('other-anaerobic-sealant','OTHER_ANAEROBIC_SEALANT','OTHER','Montážní materiál','—','Anaerobní těsnění závitů','Montážní materiál — Anaerobní těsnění závitů','ks',12011),
    ('other-thread-locker','OTHER_THREAD_LOCKER','OTHER','Montážní materiál','—','Zajišťovač závitů','Montážní materiál — Zajišťovač závitů','ks',12012),
    ('other-flat-gasket-dn15','OTHER_DN15_FLAT_GASKET','OTHER','Montážní materiál','DN 15 (1/2″)','Ploché těsnění','Montážní materiál DN 15 (1/2″) — Ploché těsnění','ks',12013),
    ('other-flat-gasket-dn20','OTHER_DN20_FLAT_GASKET','OTHER','Montážní materiál','DN 20 (3/4″)','Ploché těsnění','Montážní materiál DN 20 (3/4″) — Ploché těsnění','ks',12014),
    ('other-flat-gasket-dn25','OTHER_DN25_FLAT_GASKET','OTHER','Montážní materiál','DN 25 (1″)','Ploché těsnění','Montážní materiál DN 25 (1″) — Ploché těsnění','ks',12015),
    ('other-o-ring-set','OTHER_O_RING_SET','OTHER','Montážní materiál','—','Sada O-kroužků','Montážní materiál — Sada O-kroužků','sada',12016),

    -- Fixing material
    ('other-dowel-6','OTHER_DOWEL_6','OTHER','Montážní materiál','6 mm','Hmoždinka','Montážní materiál 6 mm — Hmoždinka','ks',12017),
    ('other-dowel-8','OTHER_DOWEL_8','OTHER','Montážní materiál','8 mm','Hmoždinka','Montážní materiál 8 mm — Hmoždinka','ks',12018),
    ('other-dowel-10','OTHER_DOWEL_10','OTHER','Montážní materiál','10 mm','Hmoždinka','Montážní materiál 10 mm — Hmoždinka','ks',12019),
    ('other-screw-5x50','OTHER_SCREW_5X50','OTHER','Montážní materiál','5×50 mm','Vrut','Montážní materiál 5×50 mm — Vrut','ks',12020),
    ('other-screw-6x60','OTHER_SCREW_6X60','OTHER','Montážní materiál','6×60 mm','Vrut','Montážní materiál 6×60 mm — Vrut','ks',12021),
    ('other-threaded-rod-m8','OTHER_M8_THREADED_ROD','OTHER','Montážní materiál','M8','Závitová tyč','Montážní materiál M8 — Závitová tyč','m',12022),
    ('other-threaded-rod-m10','OTHER_M10_THREADED_ROD','OTHER','Montážní materiál','M10','Závitová tyč','Montážní materiál M10 — Závitová tyč','m',12023),
    ('other-nut-m8','OTHER_M8_NUT','OTHER','Montážní materiál','M8','Matice','Montážní materiál M8 — Matice','ks',12024),
    ('other-nut-m10','OTHER_M10_NUT','OTHER','Montážní materiál','M10','Matice','Montážní materiál M10 — Matice','ks',12025),
    ('other-washer-m8','OTHER_M8_WASHER','OTHER','Montážní materiál','M8','Podložka','Montážní materiál M8 — Podložka','ks',12026),
    ('other-washer-m10','OTHER_M10_WASHER','OTHER','Montážní materiál','M10','Podložka','Montážní materiál M10 — Podložka','ks',12027),
    ('other-mounting-bracket','OTHER_MOUNTING_BRACKET','OTHER','Montážní materiál','—','Montážní konzole','Montážní materiál — Montážní konzole','ks',12028),

    -- Pipe clamps and rails
    ('other-pipe-clamp-15','OTHER_15_PIPE_CLAMP','OTHER','Montážní materiál','15 mm','Objímka potrubí','Montážní materiál 15 mm — Objímka potrubí','ks',12029),
    ('other-pipe-clamp-18','OTHER_18_PIPE_CLAMP','OTHER','Montážní materiál','18 mm','Objímka potrubí','Montážní materiál 18 mm — Objímka potrubí','ks',12030),
    ('other-pipe-clamp-22','OTHER_22_PIPE_CLAMP','OTHER','Montážní materiál','22 mm','Objímka potrubí','Montážní materiál 22 mm — Objímka potrubí','ks',12031),
    ('other-pipe-clamp-28','OTHER_28_PIPE_CLAMP','OTHER','Montážní materiál','28 mm','Objímka potrubí','Montážní materiál 28 mm — Objímka potrubí','ks',12032),
    ('other-pipe-clamp-32','OTHER_32_PIPE_CLAMP','OTHER','Montážní materiál','32 mm','Objímka potrubí','Montážní materiál 32 mm — Objímka potrubí','ks',12033),
    ('other-pipe-clamp-50','OTHER_50_PIPE_CLAMP','OTHER','Montážní materiál','50 mm','Objímka potrubí','Montážní materiál 50 mm — Objímka potrubí','ks',12034),
    ('other-pipe-clamp-75','OTHER_75_PIPE_CLAMP','OTHER','Montážní materiál','75 mm','Objímka potrubí','Montážní materiál 75 mm — Objímka potrubí','ks',12035),
    ('other-pipe-clamp-110','OTHER_110_PIPE_CLAMP','OTHER','Montážní materiál','110 mm','Objímka potrubí','Montážní materiál 110 mm — Objímka potrubí','ks',12036),
    ('other-rail-nut-m8','OTHER_M8_RAIL_NUT','OTHER','Montážní materiál','M8','Matice do montážní lišty','Montážní materiál M8 — Matice do montážní lišty','ks',12037),
    ('other-rail-connector','OTHER_RAIL_CONNECTOR','OTHER','Montážní materiál','—','Spojka montážní lišty','Montážní materiál — Spojka montážní lišty','ks',12038),

    -- Pipe insulation
    ('other-pipe-insulation-15','OTHER_15_PIPE_INSULATION','OTHER','Montážní materiál','15 mm','Izolace potrubí','Montážní materiál 15 mm — Izolace potrubí','m',12039),
    ('other-pipe-insulation-18','OTHER_18_PIPE_INSULATION','OTHER','Montážní materiál','18 mm','Izolace potrubí','Montážní materiál 18 mm — Izolace potrubí','m',12040),
    ('other-pipe-insulation-22','OTHER_22_PIPE_INSULATION','OTHER','Montážní materiál','22 mm','Izolace potrubí','Montážní materiál 22 mm — Izolace potrubí','m',12041),
    ('other-pipe-insulation-28','OTHER_28_PIPE_INSULATION','OTHER','Montážní materiál','28 mm','Izolace potrubí','Montážní materiál 28 mm — Izolace potrubí','m',12042),
    ('other-pipe-insulation-32','OTHER_32_PIPE_INSULATION','OTHER','Montážní materiál','32 mm','Izolace potrubí','Montážní materiál 32 mm — Izolace potrubí','m',12043),
    ('other-rubber-insulation-22','OTHER_22_RUBBER_INSULATION','OTHER','Montážní materiál','22 mm','Kaučuková izolace','Montážní materiál 22 mm — Kaučuková izolace','m',12044),
    ('other-rubber-insulation-28','OTHER_28_RUBBER_INSULATION','OTHER','Montážní materiál','28 mm','Kaučuková izolace','Montážní materiál 28 mm — Kaučuková izolace','m',12045),
    ('other-insulation-tape','OTHER_INSULATION_TAPE','OTHER','Montážní materiál','—','Izolační páska','Montážní materiál — Izolační páska','ks',12046),

    -- Drainage assembly helpers
    ('other-ht-kg-lubricant','OTHER_HT_KG_LUBRICANT','OTHER','Montážní materiál','—','Mazivo na HT/KG těsnění','Montážní materiál — Mazivo na HT/KG těsnění','ks',12047),
    ('other-ht-gasket-50','OTHER_HT_50_GASKET','OTHER','Montážní materiál','50 mm','HT těsnění','Montážní materiál 50 mm — HT těsnění','ks',12048),
    ('other-ht-gasket-75','OTHER_HT_75_GASKET','OTHER','Montážní materiál','75 mm','HT těsnění','Montážní materiál 75 mm — HT těsnění','ks',12049),
    ('other-ht-gasket-110','OTHER_HT_110_GASKET','OTHER','Montážní materiál','110 mm','HT těsnění','Montážní materiál 110 mm — HT těsnění','ks',12050),
    ('other-kg-gasket-110','OTHER_KG_110_GASKET','OTHER','Montážní materiál','110 mm','KG těsnění','Montážní materiál 110 mm — KG těsnění','ks',12051),
    ('other-transition-cuff-50-40','OTHER_50_40_TRANSITION_CUFF','OTHER','Montážní materiál','50×40 mm','Přechodová manžeta','Montážní materiál 50×40 mm — Přechodová manžeta','ks',12052),
    ('other-transition-cuff-110-50','OTHER_110_50_TRANSITION_CUFF','OTHER','Montážní materiál','110×50 mm','Přechodová manžeta','Montážní materiál 110×50 mm — Přechodová manžeta','ks',12053),

    -- Consumables
    ('other-cutting-disc-metal','OTHER_CUTTING_DISC_METAL','OTHER','Montážní materiál','—','Řezný kotouč kov','Montážní materiál — Řezný kotouč kov','ks',12054),
    ('other-cutting-disc-plastic','OTHER_CUTTING_DISC_PLASTIC','OTHER','Montážní materiál','—','Řezný kotouč plast','Montážní materiál — Řezný kotouč plast','ks',12055),
    ('other-drill-bit-6','OTHER_6_DRILL_BIT','OTHER','Montážní materiál','6 mm','Vrták','Montážní materiál 6 mm — Vrták','ks',12056),
    ('other-drill-bit-8','OTHER_8_DRILL_BIT','OTHER','Montážní materiál','8 mm','Vrták','Montážní materiál 8 mm — Vrták','ks',12057),
    ('other-sandpaper','OTHER_SANDPAPER','OTHER','Montážní materiál','—','Brusný papír','Montážní materiál — Brusný papír','ks',12058),
    ('other-cleaning-cloth','OTHER_CLEANING_CLOTH','OTHER','Montážní materiál','—','Čisticí hadřík','Montážní materiál — Čisticí hadřík','ks',12059),
    ('other-degreaser','OTHER_DEGREASER','OTHER','Montážní materiál','—','Odmašťovač','Montážní materiál — Odmašťovač','ks',12060),

    -- Marking and finishing
    ('other-pipe-marker','OTHER_PIPE_MARKER','OTHER','Montážní materiál','—','Popisovač potrubí','Montážní materiál — Popisovač potrubí','ks',12061),
    ('other-pipe-label','OTHER_PIPE_LABEL','OTHER','Montážní materiál','—','Štítek na potrubí','Montážní materiál — Štítek na potrubí','ks',12062),
    ('other-cover-rosette-dn15','OTHER_DN15_COVER_ROSETTE','OTHER','Montážní materiál','DN 15 (1/2″)','Krycí rozeta','Montážní materiál DN 15 (1/2″) — Krycí rozeta','ks',12063),
    ('other-cover-rosette-dn20','OTHER_DN20_COVER_ROSETTE','OTHER','Montážní materiál','DN 20 (3/4″)','Krycí rozeta','Montážní materiál DN 20 (3/4″) — Krycí rozeta','ks',12064),

    -- Small sanitary accessories
    ('other-aerator','OTHER_AERATOR','OTHER','Montážní materiál','—','Perlátor','Montážní materiál — Perlátor','ks',12065),
    ('other-flexi-hose-38','OTHER_38_FLEXI_HOSE','OTHER','Montážní materiál','3/8″','Flexi hadička','Montážní materiál 3/8″ — Flexi hadička','ks',12066),
    ('other-flexi-hose-12','OTHER_12_FLEXI_HOSE','OTHER','Montážní materiál','1/2″','Flexi hadička','Montážní materiál 1/2″ — Flexi hadička','ks',12067)
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
