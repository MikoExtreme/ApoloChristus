-- Adiciona suporte a traduções portuguesas em apocryphal_works.
-- Mesmo padrão que patristic_works: obra PT separada com FK para obra EN original.
-- A correr no Supabase SQL Editor.

ALTER TABLE apocryphal_works
    ADD COLUMN IF NOT EXISTS translated_from_work_id TEXT
        REFERENCES apocryphal_works(id) ON DELETE SET NULL;

-- Índice para acelerar o lookup PT→EN que o frontend vai fazer
CREATE INDEX IF NOT EXISTS idx_apocryphal_works_translated_from
    ON apocryphal_works(translated_from_work_id)
    WHERE translated_from_work_id IS NOT NULL;
