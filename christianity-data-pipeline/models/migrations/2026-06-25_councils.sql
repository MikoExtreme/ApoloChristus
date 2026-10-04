-- Concílios da Igreja e respectivos cânones (PT e EN)
-- Corre no Supabase SQL Editor.

-- ============================================================
-- 1. TABELA DE CONCÍLIOS
-- ============================================================

CREATE TABLE IF NOT EXISTS councils (
    id          TEXT PRIMARY KEY,        -- 'nicaea_i', 'chalcedon', 'trent'
    name        TEXT NOT NULL,           -- 'Council of Nicaea I'
    name_pt     TEXT,                    -- 'Primeiro Concílio de Niceia'
    year        TEXT,                    -- '325' ou '325 AD'
    year_end    TEXT,                    -- para concílios plurianuais (ex: Trento '1545'→'1563')
    location    TEXT,                    -- 'Nicaea, Bithynia'
    tradition   TEXT NOT NULL,           -- 'ecumenical' | 'catholic' | 'orthodox' | 'protestant' | 'reformed'
    type        TEXT NOT NULL,           -- 'ecumenical' | 'regional' | 'synod'
    description TEXT,
    source_url  TEXT,
    license     TEXT NOT NULL DEFAULT 'public_domain',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. TABELA DE CÂNONES
-- ============================================================

CREATE TABLE IF NOT EXISTS council_canons (
    id          BIGSERIAL PRIMARY KEY,
    council_id  TEXT NOT NULL REFERENCES councils(id) ON DELETE CASCADE,
    canon_num   INT NOT NULL,
    language    TEXT NOT NULL DEFAULT 'en',  -- 'en' | 'pt'
    title       TEXT,                         -- título/epígrafe do cânone (quando existe)
    text        TEXT NOT NULL,
    notes       TEXT,
    search_vec  TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('simple', coalesce(title, '') || ' ' || text)
    ) STORED,
    UNIQUE (council_id, canon_num, language)
);

CREATE INDEX IF NOT EXISTS council_canons_council_idx
    ON council_canons (council_id, language, canon_num);
CREATE INDEX IF NOT EXISTS council_canons_search_idx
    ON council_canons USING GIN (search_vec);

-- ============================================================
-- 3. RLS — leitura pública
-- ============================================================

ALTER TABLE councils       ENABLE ROW LEVEL SECURITY;
ALTER TABLE council_canons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_councils"
    ON councils       FOR SELECT USING (true);
CREATE POLICY "public_read_council_canons"
    ON council_canons FOR SELECT USING (true);

-- ============================================================
-- 4. FUNÇÃO DE PESQUISA
-- ============================================================

CREATE OR REPLACE FUNCTION search_councils(query TEXT, lim INT DEFAULT 20)
RETURNS TABLE (
    council_id TEXT, canon_num INT, language TEXT,
    title TEXT, text TEXT, council_name TEXT, year TEXT, rank REAL
) LANGUAGE SQL AS $$
    SELECT
        cc.council_id, cc.canon_num, cc.language,
        cc.title, cc.text,
        c.name  AS council_name,
        c.year,
        ts_rank(cc.search_vec, to_tsquery('simple', query)) AS rank
    FROM council_canons cc
    JOIN councils c ON c.id = cc.council_id
    WHERE cc.search_vec @@ to_tsquery('simple', query)
    ORDER BY rank DESC
    LIMIT lim;
$$;
