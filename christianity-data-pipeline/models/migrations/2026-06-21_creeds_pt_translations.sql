-- Suporte para traduções portuguesas reais dos credos/confissões (além do
-- título já existente em title_pt). Como as traduções PT têm uma divisão
-- em parágrafos diferente do inglês (não é 1-para-1), guarda-se como
-- secções PT independentes na mesma tabela, distinguidas por `language`,
-- em vez de uma coluna text_pt ao lado de text (que pressuporia o mesmo
-- número de secções).

ALTER TABLE creeds_confessions
    ADD COLUMN IF NOT EXISTS source_url_pt TEXT,
    ADD COLUMN IF NOT EXISTS license_pt TEXT;

ALTER TABLE creeds_confessions_sections
    ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en';

ALTER TABLE creeds_confessions_sections
    DROP CONSTRAINT IF EXISTS creeds_confessions_sections_work_id_section_num_key;

ALTER TABLE creeds_confessions_sections
    ADD CONSTRAINT creeds_confessions_sections_work_id_section_num_language_key
    UNIQUE (work_id, section_num, language);
