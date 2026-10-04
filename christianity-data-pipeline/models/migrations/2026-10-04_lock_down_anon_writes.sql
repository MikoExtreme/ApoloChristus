-- Corrige uma falha de segurança: com a chave "anon" (pública, embutida no
-- site) era possível INSERIR/ALTERAR/APAGAR linhas em 17 das 18 tabelas.
--
-- Efeito desta migração, para cada tabela de conteúdo:
--   1. liga o Row Level Security;
--   2. apaga qualquer política que não seja de leitura (SELECT);
--   3. garante uma política pública de leitura;
--   4. retira INSERT/UPDATE/DELETE/TRUNCATE aos papéis anon e authenticated.
--
-- O pipeline Python usa a chave service_role, que ignora o RLS — continua a
-- poder escrever. O frontend só lê (SELECT e funções de pesquisa), por isso
-- nada deixa de funcionar.
--
-- Como correr: Supabase → SQL Editor → colar tudo → Run. É seguro repetir.

DO $$
DECLARE
  t text;
  p record;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'apocryphal_sections', 'apocryphal_works', 'apologetics_arguments',
    'bible_versions', 'biblical_places', 'council_canons', 'councils',
    'creeds_confessions', 'creeds_confessions_sections', 'cross_references',
    'glossary_terms', 'interlinear_words', 'lexicon_entries',
    'patristic_authors', 'patristic_citations', 'patristic_sections',
    'patristic_works', 'verses'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    FOR p IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t AND cmd <> 'SELECT'
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, t);
    END LOOP;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t AND cmd = 'SELECT'
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (true)',
        'public_read_' || t, t
      );
    END IF;

    EXECUTE format(
      'REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.%I FROM anon, authenticated', t
    );
  END LOOP;
END $$;
