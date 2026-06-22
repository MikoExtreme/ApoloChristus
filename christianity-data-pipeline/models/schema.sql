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
    -- Tradução PT real (não automática) quando existe uma fonte credível —
    -- ver migrations/2026-06-21_creeds_pt_translations.sql. Maioria das
    -- fontes encontradas não declara licença formalmente, por isso
    -- license_pt fica tipicamente "check_rights" (mesmo tratamento que
    -- pt-aa/pt-acf na Bíblia).
    source_url_pt TEXT,
    license_pt    TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creeds_confessions_sections (
    id          BIGSERIAL PRIMARY KEY,
    work_id     TEXT NOT NULL REFERENCES creeds_confessions(id) ON DELETE CASCADE,
    section_num INT NOT NULL,
    text        TEXT NOT NULL,
    -- 'en' (Schaff/CCEL, default) ou 'pt' (tradução real encontrada online).
    -- A numeração de secções PT é independente da inglesa (parágrafos não
    -- correspondem 1-para-1 entre traduções diferentes).
    language    TEXT NOT NULL DEFAULT 'en',
    search_vec  TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', text)
    ) STORED,
    UNIQUE (work_id, section_num, language)
);

CREATE INDEX IF NOT EXISTS creeds_confessions_sections_search_idx
    ON creeds_confessions_sections USING GIN (search_vec);

-- ============================================================
-- 3c. GLOSSÁRIO / DICIONÁRIO BÍBLICO
-- ============================================================

-- Dados estruturados por NEUU (github.com/neuu-org/bible-dictionary-dataset),
-- CC-BY 4.0, a partir de 5 dicionários bíblicos clássicos em domínio público
-- (Easton 1897, Smith 1863, Hastings c.1900, Hitchcock c.1869, Schaff c.1880).
CREATE TABLE IF NOT EXISTS glossary_terms (
    id              BIGSERIAL PRIMARY KEY,
    term            TEXT NOT NULL,
    source          TEXT NOT NULL,        -- "easton" | "smith" | "hastings" | "hitchcock" | "schaff"
    definition      TEXT NOT NULL,
    scripture_refs  TEXT[],                -- ex: {"Genesis 1:1", "John 3:16"}
    license         TEXT NOT NULL DEFAULT 'public_domain',
    search_vec      TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', immutable_unaccent(term) || ' ' || immutable_unaccent(definition))
    ) STORED,
    UNIQUE (term, source)
);

CREATE INDEX IF NOT EXISTS glossary_terms_search_idx ON glossary_terms USING GIN (search_vec);
CREATE INDEX IF NOT EXISTS glossary_terms_term_idx ON glossary_terms (term);

-- ============================================================
-- 3d. GEOGRAFIA BÍBLICA
-- ============================================================

-- Fonte: OpenBible.info (CC-BY 4.0 — requer atribuição a OpenBible.info,
-- não é domínio público puro).
CREATE TABLE IF NOT EXISTS biblical_places (
    id              BIGSERIAL PRIMARY KEY,
    name            TEXT NOT NULL UNIQUE,
    root_name       TEXT,                 -- localização-base usada para resolver coordenadas indiretas
    lat             DOUBLE PRECISION NOT NULL,
    lon             DOUBLE PRECISION NOT NULL,
    is_approximate  BOOLEAN NOT NULL DEFAULT FALSE,
    verses          TEXT[],               -- referências bíblicas em texto livre, ex: {"Gen 35:8"}
    comment         TEXT,
    license         TEXT NOT NULL DEFAULT 'licensed',  -- CC-BY, não domínio público
    source_url      TEXT,
    confidence_pct  SMALLINT,             -- 0-100, confiança da identificação (openbibleinfo/Bible-Geocoding-Data)
    sources         TEXT[]                -- fontes académicas citadas para esta identificação
);

CREATE INDEX IF NOT EXISTS biblical_places_name_idx ON biblical_places (name);

-- Atualização em lote de confidence_pct/sources (geography_confidence_fetcher.py).
-- Necessário porque um upsert parcial (só name+confidence_pct+sources) falha
-- com NOT NULL em lat/lon: o Postgres valida as colunas NOT NULL do "candidate
-- row" de um INSERT...ON CONFLICT ANTES de decidir se há conflito, mesmo
-- quando a linha já existe e a operação resultante seria só um UPDATE.
CREATE OR REPLACE FUNCTION bulk_update_place_confidence(updates JSONB)
RETURNS void LANGUAGE SQL AS $$
    UPDATE biblical_places AS bp
    SET confidence_pct = u.confidence_pct, sources = u.sources
    FROM jsonb_to_recordset(updates) AS u(name TEXT, confidence_pct SMALLINT, sources TEXT[])
    WHERE bp.name = u.name;
$$;

-- ============================================================
-- 3e. LÉXICO STRONG'S (hebraico/aramaico/grego)
-- ============================================================

-- Fonte: STEPBible-Data / Tyndale House Cambridge (CC BY 4.0 — requer
-- atribuição, não é domínio público puro).
CREATE TABLE IF NOT EXISTS lexicon_entries (
    id              BIGSERIAL PRIMARY KEY,
    e_strong        TEXT NOT NULL,        -- Extended Strong (compatível com Strong's original), ex: "H0001"
    d_strong        TEXT NOT NULL UNIQUE, -- Disambiguated Strong (sub-sentido específico), ex: "H0001G"
    u_strong        TEXT,                 -- Unified Strong (agrupa variantes/grafias do mesmo termo)
    language        TEXT NOT NULL,        -- "hebrew" | "aramaic" | "greek" | "name"
    word            TEXT NOT NULL,        -- palavra original (hebraico/grego)
    transliteration TEXT,
    morph           TEXT,                 -- código morfológico (ex: "H:N-M")
    gloss           TEXT,                 -- tradução curta
    definition      TEXT,                 -- definição completa
    license         TEXT NOT NULL DEFAULT 'licensed',
    source_url      TEXT,
    search_vec      TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english',
            coalesce(transliteration, '') || ' ' || coalesce(gloss, '') || ' ' || coalesce(definition, '')
        )
    ) STORED
);

CREATE INDEX IF NOT EXISTS lexicon_entries_estrong_idx ON lexicon_entries (e_strong);
CREATE INDEX IF NOT EXISTS lexicon_entries_search_idx ON lexicon_entries USING GIN (search_vec);

-- ============================================================
-- 3f. INTERLINEAR (texto original palavra-a-palavra ligado a Strong's)
-- ============================================================

-- Fonte: STEPBible-Data "Translators Amalgamated" (Tyndale House Cambridge,
-- CC BY 4.0). Cobre as 425 437 palavras do hebraico (AT) e grego (NT)
-- originais, uma linha por posição de palavra em cada versículo — a leitura
-- mais bem atestada quando há variantes de manuscrito (não é um aparato
-- crítico completo).
CREATE TABLE IF NOT EXISTS interlinear_words (
    id              BIGSERIAL PRIMARY KEY,
    book            TEXT NOT NULL,
    chapter         SMALLINT NOT NULL,
    verse           SMALLINT NOT NULL,
    word_position   SMALLINT NOT NULL,
    language        TEXT NOT NULL,        -- "hebrew" | "greek"
    original_word   TEXT NOT NULL,        -- pode ter "/" a separar prefixo+raiz (hebraico)
    transliteration TEXT,
    gloss           TEXT,                 -- tradução contextual desta palavra/instância
    strong_numbers  TEXT[],               -- um ou mais (hebraico composto pode ter vários)
    grammar         TEXT,                 -- código morfológico
    license         TEXT NOT NULL DEFAULT 'licensed',
    source_url      TEXT,
    UNIQUE (book, chapter, verse, word_position, language)
);

CREATE INDEX IF NOT EXISTS interlinear_words_ref_idx ON interlinear_words (book, chapter, verse);

-- ============================================================
-- 3g. CITAÇÕES PATRÍSTICAS (Pai da Igreja → versículo citado)
-- ============================================================

-- Gerado por extração (regex + validação contra `verses`) do texto já
-- carregado em patristic_sections — não é uma fonte externa. Ver
-- fetchers/citations_fetcher.py para a metodologia e as suas limitações
-- (livros ambíguos sem dígito ordinal são ignorados, não adivinhados).
CREATE TABLE IF NOT EXISTS patristic_citations (
    id          BIGSERIAL PRIMARY KEY,
    section_id  BIGINT NOT NULL REFERENCES patristic_sections(id) ON DELETE CASCADE,
    book        TEXT NOT NULL,
    chapter     SMALLINT NOT NULL,
    verse       SMALLINT NOT NULL,
    UNIQUE (section_id, book, chapter, verse)
);

CREATE INDEX IF NOT EXISTS patristic_citations_verse_idx ON patristic_citations (book, chapter, verse);
CREATE INDEX IF NOT EXISTS patristic_citations_section_idx ON patristic_citations (section_id);

-- Que Pais da Igreja citaram um determinado versículo
CREATE OR REPLACE FUNCTION verses_cited_by_fathers(p_book TEXT, p_chapter SMALLINT, p_verse SMALLINT)
RETURNS TABLE (
    author_name TEXT, work_title TEXT, section_num INT, section_text TEXT
) LANGUAGE SQL AS $$
    SELECT pa.name_en, pw.title, ps.section_num, ps.text
    FROM patristic_citations pc
    JOIN patristic_sections ps ON ps.id = pc.section_id
    JOIN patristic_works pw ON pw.id = ps.work_id
    JOIN patristic_authors pa ON pa.id = pw.author_id
    WHERE pc.book = p_book AND pc.chapter = p_chapter AND pc.verse = p_verse
    ORDER BY pa.name_en, pw.title, ps.section_num;
$$;

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

-- Concordância: TODAS as ocorrências de uma palavra, em ordem canónica
-- (livro/capítulo/versículo) — ao contrário de search_verses_pt(), que
-- limita e ordena por relevância. É a diferença entre "pesquisar" e
-- "ver todas as ocorrências de uma palavra", o uso clássico de uma
-- concordância bíblica.
CREATE OR REPLACE FUNCTION concordance(word TEXT, version TEXT DEFAULT NULL)
RETURNS TABLE (
    version_id TEXT, testament TEXT, book TEXT,
    chapter SMALLINT, verse SMALLINT, text TEXT
) LANGUAGE SQL AS $$
    SELECT version_id, testament, book, chapter, verse, text
    FROM verses
    WHERE search_vec @@ to_tsquery('portuguese', immutable_unaccent(word))
      AND (version IS NULL OR version_id = version)
    ORDER BY version_id, book, chapter, verse;
$$;

-- Pesquisa no léxico Strong's (hebraico/aramaico/grego)
CREATE OR REPLACE FUNCTION search_lexicon(query TEXT, lim INT DEFAULT 20)
RETURNS TABLE (
    e_strong TEXT, d_strong TEXT, language TEXT, word TEXT,
    transliteration TEXT, gloss TEXT, definition TEXT, rank REAL
) LANGUAGE SQL AS $$
    SELECT e_strong, d_strong, language, word, transliteration, gloss, definition,
           ts_rank(search_vec, to_tsquery('english', query)) AS rank
    FROM lexicon_entries
    WHERE search_vec @@ to_tsquery('english', query)
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
ALTER TABLE glossary_terms              ENABLE ROW LEVEL SECURITY;
ALTER TABLE biblical_places              ENABLE ROW LEVEL SECURITY;
ALTER TABLE lexicon_entries              ENABLE ROW LEVEL SECURITY;
ALTER TABLE interlinear_words            ENABLE ROW LEVEL SECURITY;
ALTER TABLE patristic_citations          ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY "public_read_glossary"   ON glossary_terms              FOR SELECT USING (true);
CREATE POLICY "public_read_places"     ON biblical_places              FOR SELECT USING (true);
CREATE POLICY "public_read_lexicon"    ON lexicon_entries              FOR SELECT USING (true);
CREATE POLICY "public_read_interlinear" ON interlinear_words            FOR SELECT USING (true);
CREATE POLICY "public_read_citations"   ON patristic_citations           FOR SELECT USING (true);
