-- Adiciona author_id, period e work_id ao retorno de verses_cited_by_fathers,
-- para o frontend poder ligar diretamente à obra/autor citado (em vez de só
-- mostrar o nome em texto). Substitui a função anterior (CREATE OR REPLACE).
CREATE OR REPLACE FUNCTION verses_cited_by_fathers(p_book TEXT, p_chapter SMALLINT, p_verse SMALLINT)
RETURNS TABLE (
    author_id TEXT, author_name TEXT, period TEXT,
    work_id TEXT, work_title TEXT, section_num INT, section_text TEXT
) LANGUAGE SQL AS $$
    SELECT pa.id, pa.name_en, pa.period, pw.id, pw.title, ps.section_num, ps.text
    FROM patristic_citations pc
    JOIN patristic_sections ps ON ps.id = pc.section_id
    JOIN patristic_works pw ON pw.id = ps.work_id
    JOIN patristic_authors pa ON pa.id = pw.author_id
    WHERE pc.book = p_book AND pc.chapter = p_chapter AND pc.verse = p_verse
    ORDER BY pa.name_en, pw.title, ps.section_num;
$$;
