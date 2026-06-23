-- search_verses_pt() pesquisava em TODOS os bible_versions, incluindo os
-- ingleses — o search_vec de `verses` usa sempre o dicionário 'portuguese',
-- mas isso não impedia o texto inglês de ser indexado e devolvido (palavras
-- não reconhecidas passam praticamente literais pelo stemmer português).
-- Como o nome da função promete especificamente português, restringe-se
-- agora a bible_versions.language = 'pt'.
CREATE OR REPLACE FUNCTION search_verses_pt(query TEXT, version TEXT DEFAULT NULL, lim INT DEFAULT 20)
RETURNS TABLE (
    version_id TEXT, testament TEXT, book TEXT,
    chapter SMALLINT, verse SMALLINT, text TEXT, rank REAL
) LANGUAGE SQL AS $$
    SELECT v.version_id, v.testament, v.book, v.chapter, v.verse, v.text,
           ts_rank(v.search_vec, to_tsquery('portuguese', immutable_unaccent(query))) AS rank
    FROM verses v
    JOIN bible_versions bv ON bv.id = v.version_id
    WHERE v.search_vec @@ to_tsquery('portuguese', immutable_unaccent(query))
      AND bv.language = 'pt'
      AND (version IS NULL OR v.version_id = version)
    ORDER BY rank DESC
    LIMIT lim;
$$;
