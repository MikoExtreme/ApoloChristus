-- A versão pt-arc ("Almeida Revista e Corrigida") vem do corpus
-- christos-c/bible-corpus, cuja fonte só declara "free" — não identifica a
-- edição exata. Só as edições antigas de Almeida (até 1911) são domínio
-- público; as revisões modernas da Sociedade Bíblica têm direitos reservados.
-- Enquanto a edição não for confirmada, o site não deve afirmar "domínio
-- público": passa a mostrar "Direitos a confirmar".
--
-- Para reverter, depois de confirmar a edição:
--   UPDATE bible_versions SET license = 'public_domain' WHERE id = 'pt-arc';

UPDATE bible_versions SET license = 'check_rights' WHERE id = 'pt-arc';
