-- Liga uma obra patrística traduzida (language='pt') à sua obra original (EN),
-- para o frontend poder mostrar a tradução quando existir e recuar para o
-- inglês quando não existir — mesmo padrão de fallback já usado em creeds_confessions.
ALTER TABLE patristic_works
    ADD COLUMN IF NOT EXISTS translated_from_work_id TEXT REFERENCES patristic_works(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS patristic_works_translated_from_idx
    ON patristic_works (translated_from_work_id);
