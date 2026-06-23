-- Funções de pesquisa full-text para Apócrifos, Credos & Confissões e
-- Glossário — mesmo padrão de search_patristics()/search_lexicon() já
-- existentes. Os índices search_vec já existem nas 3 tabelas (ver
-- schema.sql), só faltavam estas funções para o frontend as poder chamar.

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
        ts_rank(aps.search_vec, to_tsquery('english', query)) AS rank
    FROM apocryphal_sections aps
    JOIN apocryphal_works aw ON aw.id = aps.work_id
    WHERE aps.search_vec @@ to_tsquery('english', query)
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
        cc.title AS work_title,
        cc.title_pt AS work_title_pt,
        ts_rank(ccs.search_vec, to_tsquery('english', query)) AS rank
    FROM creeds_confessions_sections ccs
    JOIN creeds_confessions cc ON cc.id = ccs.work_id
    WHERE ccs.search_vec @@ to_tsquery('english', query)
    ORDER BY rank DESC
    LIMIT lim;
$$;

CREATE OR REPLACE FUNCTION search_glossary(query TEXT, lim INT DEFAULT 20)
RETURNS TABLE (
    term TEXT, source TEXT, definition TEXT, rank REAL
) LANGUAGE SQL AS $$
    SELECT
        gt.term, gt.source, gt.definition,
        ts_rank(gt.search_vec, to_tsquery('english', immutable_unaccent(query))) AS rank
    FROM glossary_terms gt
    WHERE gt.search_vec @@ to_tsquery('english', immutable_unaccent(query))
    ORDER BY rank DESC
    LIMIT lim;
$$;
