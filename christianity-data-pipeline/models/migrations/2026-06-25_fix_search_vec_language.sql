-- Corrige os search_vec de tabelas que têm conteúdo em PT e EN.
-- O problema: patristic_sections, apocryphal_sections e
-- creeds_confessions_sections usavam 'english' como configuração de
-- tokenização, o que indexa mal o conteúdo em português.
-- Solução: usar 'simple' (tokenização sem stemming, funciona para qualquer língua).
-- As funções de pesquisa correspondentes são igualmente actualizadas para
-- usar 'simple', garantindo consistência stored-vec ↔ tsquery.
--
-- Nota: 'simple' não faz stemming ("criou" não encontra "criar"), mas para
-- uma app de pesquisa de escritura em que os utilizadores pesquisam termos
-- exactos, é o compromisso correcto entre qualidade e simplicidade.
--
-- A correr no Supabase SQL Editor.

-- ----------------------------------------------------------------
-- 1. patristic_sections
-- ----------------------------------------------------------------
DROP INDEX IF EXISTS patristic_sections_search_idx;
ALTER TABLE patristic_sections DROP COLUMN IF EXISTS search_vec;
ALTER TABLE patristic_sections
    ADD COLUMN search_vec TSVECTOR
    GENERATED ALWAYS AS (to_tsvector('simple', text)) STORED;
CREATE INDEX patristic_sections_search_idx
    ON patristic_sections USING GIN (search_vec);

-- ----------------------------------------------------------------
-- 2. apocryphal_sections
-- ----------------------------------------------------------------
DROP INDEX IF EXISTS apocryphal_sections_search_idx;
ALTER TABLE apocryphal_sections DROP COLUMN IF EXISTS search_vec;
ALTER TABLE apocryphal_sections
    ADD COLUMN search_vec TSVECTOR
    GENERATED ALWAYS AS (to_tsvector('simple', text)) STORED;
CREATE INDEX apocryphal_sections_search_idx
    ON apocryphal_sections USING GIN (search_vec);

-- ----------------------------------------------------------------
-- 3. creeds_confessions_sections
-- ----------------------------------------------------------------
DROP INDEX IF EXISTS creeds_confessions_sections_search_idx;
ALTER TABLE creeds_confessions_sections DROP COLUMN IF EXISTS search_vec;
ALTER TABLE creeds_confessions_sections
    ADD COLUMN search_vec TSVECTOR
    GENERATED ALWAYS AS (to_tsvector('simple', text)) STORED;
CREATE INDEX creeds_confessions_sections_search_idx
    ON creeds_confessions_sections USING GIN (search_vec);

-- ----------------------------------------------------------------
-- 4. Funções de pesquisa — actualizar para usar 'simple'
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION search_patristics(query TEXT, lim INT DEFAULT 20)
RETURNS TABLE (
    work_id TEXT, section_num INT, text TEXT,
    author_name TEXT, work_title TEXT, rank REAL
) LANGUAGE SQL AS $$
    SELECT
        ps.work_id, ps.section_num, ps.text,
        pa.name_en AS author_name,
        pw.title   AS work_title,
        ts_rank(ps.search_vec, to_tsquery('simple', query)) AS rank
    FROM patristic_sections ps
    JOIN patristic_works    pw ON pw.id = ps.work_id
    JOIN patristic_authors  pa ON pa.id = pw.author_id
    WHERE ps.search_vec @@ to_tsquery('simple', query)
    ORDER BY rank DESC
    LIMIT lim;
$$;

CREATE OR REPLACE FUNCTION search_apocrypha(query TEXT, lim INT DEFAULT 20)
RETURNS TABLE (
    work_id TEXT, section_num INT, text TEXT,
    work_title_pt TEXT, work_title_en TEXT, category TEXT, rank REAL
) LANGUAGE SQL AS $$
    SELECT
        aps.work_id, aps.section_num, aps.text,
        aw.title_pt AS work_title_pt,
        aw.title_en AS work_title_en,
        aw.category,
        ts_rank(aps.search_vec, to_tsquery('simple', query)) AS rank
    FROM apocryphal_sections aps
    JOIN apocryphal_works    aw  ON aw.id = aps.work_id
    WHERE aps.search_vec @@ to_tsquery('simple', query)
    ORDER BY rank DESC
    LIMIT lim;
$$;

CREATE OR REPLACE FUNCTION search_creeds(query TEXT, lim INT DEFAULT 20)
RETURNS TABLE (
    work_id TEXT, section_num INT, text TEXT, language TEXT,
    work_title TEXT, work_title_pt TEXT, rank REAL
) LANGUAGE SQL AS $$
    SELECT
        ccs.work_id, ccs.section_num, ccs.text, ccs.language,
        cc.title    AS work_title,
        cc.title_pt AS work_title_pt,
        ts_rank(ccs.search_vec, to_tsquery('simple', query)) AS rank
    FROM creeds_confessions_sections ccs
    JOIN creeds_confessions          cc  ON cc.id = ccs.work_id
    WHERE ccs.search_vec @@ to_tsquery('simple', query)
    ORDER BY rank DESC
    LIMIT lim;
$$;
