# Christianity Data Pipeline

Pipeline de ingestão de dados do ApoloChristus: recolhe textos de fontes
públicas, normaliza-os em JSON e carrega-os no Supabase (PostgreSQL).

Cada fetcher foi validado contra a fonte real. A licença de cada obra fica
registada na coluna `license` (ver "Licenciamento" no fim).

## Estrutura

```
christianity-data-pipeline/
├── fetchers/        # Um script por fonte; escrevem JSON em output/
├── scripts/         # Carregador para o Supabase e utilitários de auditoria
├── models/
│   ├── schema.sql   # DDL completo (tabelas, índices, funções de pesquisa, RLS)
│   └── migrations/  # Alterações ao esquema, por data (aplicar por ordem)
├── migrations/      # SQL de conteúdo (apologética)
├── requirements.txt
└── output/          # JSON gerado (não versionado, recriável)
```

## Setup

```bash
python -m venv .venv
.venv/Scripts/activate        # Windows  (Linux/Mac: source .venv/bin/activate)
pip install -r requirements.txt
```

Cria `christianity-data-pipeline/.env`:

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=...      # chave service_role (Project Settings → API)
```

A chave **`service_role`** ignora o Row Level Security, por isso o carregador
precisa dela para escrever. Usa-a **só aqui**: nunca no frontend (o Vite
embute as variáveis `VITE_*` no site) e nunca no Git. O frontend usa a chave
`anon`, que só consegue ler.

Depois, no SQL Editor do Supabase, corre `models/schema.sql` e as migrações de
`models/migrations/` por ordem de data. As migrações `2026-10-04_*` fecham a
escrita às chaves públicas e acertam a licença da versão `pt-arc`.

## Fetchers

| Script | Conteúdo | Fonte |
|--------|----------|-------|
| `bible_fetcher.py` | Bíblia: KJV (com deuterocanónicos), ASV, Textus Receptus, Westminster Leningrad Codex, Almeida 1911 | wldeh/bible-api, BibliaJFAAL/JFAAL |
| `bible_pt_arc_fetcher.py` | Almeida Revista e Corrigida (licença **a confirmar**) | christos-c/bible-corpus |
| `crossrefs_fetcher.py` | Referências cruzadas (votos ≥ 3) | OpenBible.info |
| `strongs_fetcher.py` | Léxico de Strong (hebraico, aramaico, grego) | STEPBible-Data |
| `interlinear_fetcher.py` | Interlinear palavra a palavra, AT e NT | STEPBible-Data |
| `patristics_fetcher.py` | 65 autores, 341 obras (ANF/NPNF) | New Advent |
| `patristics_pt_genuine_fetcher.py` | 3 obras patrísticas em português (Atanásio, Hermas, Justino) | cristianismo.org.br, monergismo.com |
| `citations_fetcher.py` | Citações bíblicas nos Pais (extrai do texto já carregado, não é fetch externo) | — |
| `apocrypha_fetcher.py` | 39 apócrifos e textos gnósticos | Early Christian Writings |
| `apocrypha_pt_fetcher.py` | Evangelho de Tomé em PT (**não apresentado no site**, ver Licenciamento) | saindodamatrix.com.br |
| `creeds_fetcher.py` | 19 credos e confissões (EN) | CCEL, *Creeds of Christendom* |
| `creeds_pt_fetcher.py`, `creeds_mt_replacements_fetcher.py` | Credos em português | Vários sites denominacionais |
| `councils_fetcher.py`, `more_councils_fetcher.py`, `westminster_vatican_fetcher.py` | Concílios e cânones | New Advent, Fordham Sourcebook, outros |
| `glossary_fetcher.py` | ~20 800 termos de 5 dicionários bíblicos | neuu-org/bible-dictionary-dataset |
| `geography_fetcher.py`, `geography_confidence_fetcher.py` | 1 232 lugares bíblicos com coordenadas e confiança | OpenBible.info |

`patristic_catalog.json` é o catálogo gerado a partir do índice real do New Advent.

## Fluxo típico

```bash
python fetchers/bible_fetcher.py           # escreve JSON em output/bible/
python fetchers/patristics_fetcher.py      # ~35-50 min (obras grandes expandem em centenas de páginas)
python fetchers/apocrypha_fetcher.py
python scripts/load_to_supabase.py         # carrega tudo para o Supabase
```

O carregador é **idempotente**: usa `upsert` com `on_conflict` nas chaves
naturais de cada tabela, por isso podes repetir fetchers e carga sem duplicar
dados — e é assim que se repõe o conteúdo se for preciso.

O conteúdo de apologética não vem de nenhuma fonte externa: é texto original,
em `migrations/apologetics.sql` e `migrations/apologetics_additions.sql`.

## Scripts utilitários

| Script | Função |
|--------|--------|
| `audit_db.py` | Contagens e verificações gerais da base de dados |
| `verify_pt_content.py`, `verify_citations_fn.py` | Verificam conteúdo PT e a função de citações |
| `fix_councils.py`, `discover_*.py`, `probe_council_urls.py` | Apoio à construção do catálogo de concílios e de fontes PT |
| `load_two_fathers.py`, `translate_*.py`, `investigate_kjv.py` | Scripts pontuais de sessões anteriores |

## Armadilhas já encontradas

- **`upsert` sem `on_conflict`** usa a chave primária (sequencial, nunca em conflito) e duplica linhas em silêncio. Indica sempre a chave natural.
- **`upsert` parcial** falha em tabelas com colunas `NOT NULL` sem valor por omissão, mesmo para linhas existentes. Usa `UPDATE` ou uma função RPC.
- **Windows:** `Path.write_text()` precisa de `encoding="utf-8"`, senão corrompe os acentos.
- A API de conteúdos do GitHub duplica entradas pasta+ficheiro; filtra por extensão ao contar.
- O PostgREST limita a 1000 linhas por pedido: pagina sempre que a tabela for maior.

## Licenciamento

O campo `license` de cada obra regista o que foi possível confirmar, **não** uma
garantia legal:

| Valor | Significado |
|-------|-------------|
| `public_domain` | Domínio público confirmado (traduções do séc. XIX, Almeida 1911, KJV, ASV…) |
| `licensed` | Licença aberta com atribuição (CC BY 4.0: OpenBible, STEPBible, NEUU) |
| `original` | Conteúdo escrito para o projeto (apologética) |
| `check_rights` | Sem licença declarada ou tradução moderna — a confirmar |

Obras com tradução moderna e direitos de autor (Evangelho de Tomé em EN e PT,
Evangelho da Verdade) estão na base de dados mas **escondidas pela aplicação**
(`frontend/src/lib/content/restrictedWorks.ts`). 1 Enoque e o Livro dos Jubileus
não estão incluídos: nenhuma das fontes usadas os tem.

## Limitações conhecidas

- Sem Vulgata nem Septuaginta como textos completos, e sem o comentário de Matthew Henry.
- Só 3 obras patrísticas e o Evangelho de Tomé têm tradução portuguesa genuína; nos restantes casos o site mostra o inglês (as traduções automáticas foram removidas por falta de qualidade).
- 182 lugares bíblicos não têm pontuação de confiança (o nome não coincidiu entre os dois conjuntos de dados).
