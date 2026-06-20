-- ============================================================
-- Schema: Christianity App — Supabase/Postgres
-- Cria todas as tabelas, índices e pesquisa full-text
-- ============================================================

-- Extensão para pesquisa full-text multilíngue
CREATE EXTENSION IF NOT EXISTS unaccent;

-- unaccent() é STABLE, não IMMUTABLE — colunas geradas (GENERATED ALWAYS ... STORED)
-- exigem expressões IMMUTABLE. Este wrapper fixa o dicionário 'unaccent' e força
-- a marcação IMMUTABLE (seguro aqui porque não dependemos de search_path nem de
-- dicionários alterados em runtime).
CREATE OR REPLACE FUNCTION immutable_unaccent(text)
RETURNS text AS $$
    SELECT unaccent('unaccent', $1)
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;

-- ============================================================
-- 1. BÍBLIA
-- ============================================================

CREATE TABLE IF NOT EXISTS bible_versions (
    id          TEXT PRIMARY KEY,           -- ex: "por-ARC", "eng-KJV"
    name        TEXT NOT NULL,              -- ex: "Almeida Revista e Corrigida"
    language    TEXT NOT NULL,              -- ex: "pt", "en", "he", "el"
    license     TEXT NOT NULL,              -- "public_domain" | "check_rights" | "licensed"
    source_url  TEXT,                       -- de onde o texto foi obtido (transparência)
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verses (
    id          BIGSERIAL PRIMARY KEY,
    version_id  TEXT NOT NULL REFERENCES bible_versions(id) ON DELETE CASCADE,
    testament   TEXT NOT NULL CHECK (testament IN ('OT', 'NT')),
    book        TEXT NOT NULL,              -- ex: "GEN", "MAT", "TOB" (deuterocanónico)
    chapter     SMALLINT NOT NULL,
    verse       SMALLINT NOT NULL,
    text        TEXT NOT NULL,
    is_deuterocanonical BOOLEAN NOT NULL DEFAULT FALSE,  -- Tobias, Judite, Sabedoria, etc.
    -- índice para pesquisa full-text (por língua)
    search_vec  TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('portuguese', immutable_unaccent(text))
    ) STORED,
    UNIQUE (version_id, book, chapter, verse)
);

-- Índice de pesquisa full-text nos versículos
CREATE INDEX IF NOT EXISTS verses_search_idx ON verses USING GIN (search_vec);
-- Índice de navegação rápida
CREATE INDEX IF NOT EXISTS verses_ref_idx ON verses (version_id, book, chapter, verse);
CREATE INDEX IF NOT EXISTS verses_book_idx ON verses (book, chapter);
CREATE INDEX IF NOT EXISTS verses_deutero_idx ON verses (is_deuterocanonical) WHERE is_deuterocanonical;

-- Referências cruzadas entre versículos (OpenBible.info, ~340k entradas,
-- cada uma com um "voto" de qualidade da comunidade — usamos só votes >= 3).
-- Independente de versão/tradução: referencia-se por (livro, capítulo, versículo).
CREATE TABLE IF NOT EXISTS cross_references (
    id          BIGSERIAL PRIMARY KEY,
    source_book TEXT NOT NULL,
    source_ch   SMALLINT NOT NULL,
    source_v    SMALLINT NOT NULL,
    target_book TEXT NOT NULL,
    target_ch   SMALLINT NOT NULL,
    target_v    SMALLINT NOT NULL,
    votes       INT NOT NULL DEFAULT 0,
    UNIQUE (source_book, source_ch, source_v, target_book, target_ch, target_v)
);

CREATE INDEX IF NOT EXISTS cross_references_source_idx
    ON cross_references (source_book, source_ch, source_v);

-- ============================================================
-- 2. PATRÍSTICA
-- ============================================================

CREATE TABLE IF NOT EXISTS patristic_authors (
    id          TEXT PRIMARY KEY,           -- ex: "augustine_hippo"
    name_pt     TEXT NOT NULL,              -- "Agostinho de Hipona"
    name_en     TEXT NOT NULL,              -- "Augustine of Hippo"
    period      TEXT NOT NULL,              -- "apostolic" | "ante_nicene" | "nicene" | "post_nicene" | "medieval"
    dates       TEXT,                       -- "354–430"
    tradition   TEXT,                       -- "western" | "eastern_orthodox" | "catholic_orthodox"
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patristic_works (
    id          TEXT PRIMARY KEY,           -- ex: "augustine_hippo__confissoes"
    author_id   TEXT NOT NULL REFERENCES patristic_authors(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    source_url  TEXT,
    language    TEXT NOT NULL DEFAULT 'en',
    license     TEXT NOT NULL DEFAULT 'public_domain',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patristic_sections (
    id          BIGSERIAL PRIMARY KEY,
    work_id     TEXT NOT NULL REFERENCES patristic_works(id) ON DELETE CASCADE,
    section_num INT NOT NULL,
    text        TEXT NOT NULL,
    search_vec  TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', text)
    ) STORED,
    UNIQUE (work_id, section_num)
);

CREATE INDEX IF NOT EXISTS patristic_sections_search_idx
    ON patristic_sections USING GIN (search_vec);
CREATE INDEX IF NOT EXISTS patristic_sections_work_idx
    ON patristic_sections (work_id, section_num);

-- ============================================================
-- 3. APÓCRIFOS
-- ============================================================

CREATE TABLE IF NOT EXISTS apocryphal_works (
    id             TEXT PRIMARY KEY,        -- ex: "gospel_thomas"
    title_pt       TEXT NOT NULL,
    title_en       TEXT NOT NULL,
    category       TEXT NOT NULL,           -- "apocryphal_gospel" | "apocryphal_acts" | ...
    tradition      TEXT,
    date_estimate  TEXT,
    source_url     TEXT,
    language       TEXT NOT NULL DEFAULT 'en',
    license        TEXT NOT NULL DEFAULT 'public_domain',
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS apocryphal_sections (
    id          BIGSERIAL PRIMARY KEY,
    work_id     TEXT NOT NULL REFERENCES apocryphal_works(id) ON DELETE CASCADE,
    section_num INT NOT NULL,
    text        TEXT NOT NULL,
    search_vec  TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', text)
    ) STORED,
    UNIQUE (work_id, section_num)
);

CREATE INDEX IF NOT EXISTS apocryphal_sections_search_idx
    ON apocryphal_sections USING GIN (search_vec);

-- ============================================================
-- 3b. CREDOS E CONFISSÕES
-- ============================================================

CREATE TABLE IF NOT EXISTS creeds_confessions (
    id          TEXT PRIMARY KEY,        -- ex: "apostles_creed"
    title       TEXT NOT NULL,
    title_pt    TEXT,
    type        TEXT NOT NULL,           -- "creed" | "confession" | "catechism"
    tradition   TEXT,                    -- "ecumenical" | "catholic" | "orthodox" | "lutheran" | "reformed" | "anglican" | "baptist" | "congregational"
    year        TEXT,
    source_url  TEXT,
    language    TEXT NOT NULL DEFAULT 'en',
    license     TEXT NOT NULL DEFAULT 'public_domain',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creeds_confessions_sections (
    id          BIGSERIAL PRIMARY KEY,
    work_id     TEXT NOT NULL REFERENCES creeds_confessions(id) ON DELETE CASCADE,
    section_num INT NOT NULL,
    text        TEXT NOT NULL,
    search_vec  TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', text)
    ) STORED,
    UNIQUE (work_id, section_num)
);

CREATE INDEX IF NOT EXISTS creeds_confessions_sections_search_idx
    ON creeds_confessions_sections USING GIN (search_vec);

-- ============================================================
-- 4. FUNÇÕES DE PESQUISA
-- ============================================================

-- Pesquisa versículos em português
CREATE OR REPLACE FUNCTION search_verses_pt(query TEXT, version TEXT DEFAULT NULL, lim INT DEFAULT 20)
RETURNS TABLE (
    version_id TEXT, testament TEXT, book TEXT,
    chapter SMALLINT, verse SMALLINT, text TEXT, rank REAL
) LANGUAGE SQL AS $$
    SELECT version_id, testament, book, chapter, verse, text,
           ts_rank(search_vec, to_tsquery('portuguese', immutable_unaccent(query))) AS rank
    FROM verses
    WHERE search_vec @@ to_tsquery('portuguese', immutable_unaccent(query))
      AND (version IS NULL OR version_id = version)
    ORDER BY rank DESC
    LIMIT lim;
$$;

-- Pesquisa nos Pais da Igreja
CREATE OR REPLACE FUNCTION search_patristics(query TEXT, lim INT DEFAULT 20)
RETURNS TABLE (
    work_id TEXT, section_num INT, text TEXT,
    author_name TEXT, work_title TEXT, rank REAL
) LANGUAGE SQL AS $$
    SELECT
        ps.work_id, ps.section_num, ps.text,
        pa.name_en AS author_name,
        pw.title AS work_title,
        ts_rank(ps.search_vec, to_tsquery('english', query)) AS rank
    FROM patristic_sections ps
    JOIN patristic_works pw ON pw.id = ps.work_id
    JOIN patristic_authors pa ON pa.id = pw.author_id
    WHERE ps.search_vec @@ to_tsquery('english', query)
    ORDER BY rank DESC
    LIMIT lim;
$$;

-- ============================================================
-- 5. ROW LEVEL SECURITY (básico — ajustar conforme auth)
-- ============================================================

ALTER TABLE bible_versions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE verses               ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_references      ENABLE ROW LEVEL SECURITY;
ALTER TABLE patristic_authors    ENABLE ROW LEVEL SECURITY;
ALTER TABLE patristic_works      ENABLE ROW LEVEL SECURITY;
ALTER TABLE patristic_sections   ENABLE ROW LEVEL SECURITY;
ALTER TABLE apocryphal_works     ENABLE ROW LEVEL SECURITY;
ALTER TABLE apocryphal_sections  ENABLE ROW LEVEL SECURITY;
ALTER TABLE creeds_confessions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE creeds_confessions_sections ENABLE ROW LEVEL SECURITY;

-- Leitura pública para todos os textos (são domínio público)
CREATE POLICY "public_read_verses"     ON verses              FOR SELECT USING (true);
CREATE POLICY "public_read_crossrefs"  ON cross_references    FOR SELECT USING (true);
CREATE POLICY "public_read_patristics" ON patristic_sections  FOR SELECT USING (true);
CREATE POLICY "public_read_apocrypha"  ON apocryphal_sections FOR SELECT USING (true);
CREATE POLICY "public_read_meta"       ON bible_versions      FOR SELECT USING (true);
CREATE POLICY "public_read_authors"    ON patristic_authors   FOR SELECT USING (true);
CREATE POLICY "public_read_works_p"    ON patristic_works     FOR SELECT USING (true);
CREATE POLICY "public_read_works_a"    ON apocryphal_works    FOR SELECT USING (true);
CREATE POLICY "public_read_creeds"     ON creeds_confessions          FOR SELECT USING (true);
CREATE POLICY "public_read_creeds_sec" ON creeds_confessions_sections FOR SELECT USING (true);
