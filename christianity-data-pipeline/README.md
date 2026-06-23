# Christianity Data Pipeline

Pipeline de ingestão de dados para a aplicação de Cristianismo (ApoloChristus).
Busca textos de 3 fontes distintas e carrega-os no Supabase.

Todos os fetchers foram validados contra as fontes reais (não é código
gerado nunca testado) — ver notas técnicas e de licenciamento abaixo, que
documentam exatamente o que foi corrigido e porquê.

## Estrutura

```
christianity-data-pipeline/
├── fetchers/
│   ├── bible_fetcher.py          # Bíblia: wldeh/bible-api + thiagobodruk/biblia
│   ├── patristics_fetcher.py     # Pais da Igreja: New Advent
│   ├── apocrypha_fetcher.py      # Apócrifos: Early Christian Writings
│   └── patristic_catalog.json    # Catálogo completo de 65 autores / 341 obras
├── scripts/
│   └── load_to_supabase.py       # Carrega os JSON normalizados para o Supabase
├── models/
│   └── schema.sql                # DDL completo (tabelas, índices, funções de pesquisa)
├── requirements.txt
└── output/                       # Dados fetched (criado automaticamente, não versionado)
    ├── bible/
    ├── patristics/
    └── apocrypha/
```

## Setup

```bash
# 1. Criar e ativar um venv dedicado (recomendado — evita conflitos com outros projetos)
python -m venv .venv
.venv/Scripts/activate        # Windows
# source .venv/bin/activate   # Linux/Mac

# 2. Instalar dependências
pip install -r requirements.txt

# 3. Criar .env
echo "SUPABASE_URL=https://xxxx.supabase.co" > .env
echo "SUPABASE_SERVICE_KEY=eyJ..." >> .env
# SUPABASE_SERVICE_KEY é a chave "service_role" (Project Settings → API →
# Legacy anon, service_role API keys), NÃO a anon/publishable key — esta
# precisa de bypassar RLS para o loader funcionar. Nunca a exponhas no
# frontend nem a commites.

# 4. Criar as tabelas no Supabase
# Cola o conteúdo de models/schema.sql no SQL Editor do Supabase e corre.
```

## Uso

### Passo 1 — Bíblia

```bash
python fetchers/bible_fetcher.py
```

Por omissão corre só `pt-jfaal` (rápido, ficheiro único) para teste. Edita o
`if __name__ == "__main__":` no fim do ficheiro e chama `run()` sem
argumentos para todas as 5 versões.

| ID | Nome | Língua | Licença | Fonte |
|----|------|--------|---------|-------|
| en-kjv | King James Version (inclui deuterocanónicos) | EN | Domínio público | wldeh/bible-api |
| en-asv | American Standard Version | EN | Domínio público | wldeh/bible-api |
| grc-grctr | Textus Receptus (NT) | Grego | Domínio público | wldeh/bible-api |
| hbo-wlc | Westminster Leningrad Codex (AT) | Hebraico | Domínio público | wldeh/bible-api |
| pt-jfaal | Almeida 1911 (João Ferreira de Almeida) | PT | Domínio público | BibliaJFAAL/JFAAL |

**Nota importante**: não existe nenhuma versão Almeida no `wldeh/bible-api`
— só inglês, grego e hebraico. O português vem de uma fonte diferente
(`BibliaJFAAL/JFAAL`, ficheiro `original/1911-JFAAtualizada.json`,
digitalização da edição de 1911 da tradução de João Ferreira de Almeida).

**Histórico**: as versões `pt-aa` e `pt-acf` (de `thiagobodruk/biblia`)
foram removidas em 2026-06-22 após investigação confirmar que nenhuma das
duas é domínio público — a ACF é propriedade reservada da Sociedade
Bíblica Trinitariana do Brasil, e a AA desse repositório é atribuída à
Imprensa Bíblica Brasileira pelo próprio README da fonte (a licença
CC BY-NC do repo cobre só a compilação, não as traduções em si).

### Passo 2 — Pais da Igreja

```bash
python fetchers/patristics_fetcher.py
```

**65 autores, 341 obras** (catálogo completo gerado a partir do índice real
em `newadvent.org/fathers/`, guardado em `fetchers/patristic_catalog.json`).
Cobre apostólicos, ante-nicenos, nicenos e pós-nicenos — essencialmente
toda a coleção ANF/NPNF disponível no New Advent.

Demora ~35-50 minutos a correr por completo (muitas obras grandes como
"A Cidade de Deus" ou as Homilias de Crisóstomo expandem em centenas de
subpáginas, seguidas recursivamente).

### Passo 3 — Apócrifos

```bash
python fetchers/apocrypha_fetcher.py
```

**39 obras** de Early Christian Writings: evangelhos apócrifos, actos
apócrifos, epístolas, apocalipses, fragmentos gnósticos, e o Testamento
dos Doze Patriarcas. Não inclui 1 Enoque nem o Livro dos Jubileus — não
estão disponíveis nesta fonte (ver Notas legais).

### Passo 4 — Carregar para o Supabase

```bash
python scripts/load_to_supabase.py
```

Idempotente — usa `upsert` com `on_conflict` nas chaves naturais de cada
tabela, por isso podes correr os fetchers e o loader várias vezes sem criar
duplicados.

## Fontes de dados

| Fonte | URL | Chave? | Conteúdo |
|-------|-----|--------|---------|
| wldeh/bible-api | github.com/wldeh/bible-api | Não | Bíblia: inglês, grego, hebraico (usa `raw.githubusercontent.com`, o CDN jsdelivr está bloqueado por tamanho do repo) |
| BibliaJFAAL/JFAAL | github.com/BibliaJFAAL/JFAAL | Não | Bíblia: português (Almeida 1911, domínio público confirmado) |
| New Advent | newadvent.org/fathers | Não | Pais da Igreja (ANF/NPNF) |
| Early Christian Writings | earlychristianwritings.com | Não | Apócrifos e textos gnósticos |

## Notas legais — licenciamento

A coluna `license` em cada tabela (`public_domain` \| `check_rights`)
reflete o que foi possível confirmar durante o desenvolvimento, **não**
uma garantia legal formal. Antes de publicar a app publicamente, confirma:

- **en-kjv, en-asv, grc-grctr, hbo-wlc, pt-jfaal**: domínio público, sem dúvida.
- **Pais da Igreja (New Advent)**: as traduções ANF/NPNF usadas são do
  séc. XIX, genuinamente em domínio público.
- **Apócrifos**: varia por obra. As traduções **Roberts-Donaldson**
  (séc. XIX, Ante-Nicene Christian Library) são domínio público
  confirmado. Muitos textos gnósticos/Nag Hammadi (descobertos em 1945,
  ex: Evangelho de Tomé, Evangelho da Verdade) só têm traduções
  académicas modernas (M.R. James 1924, Patterson/Meyer, Robert Grant) —
  estas ficam marcadas `check_rights` e precisam de confirmação/licença
  antes de publicação pública. Uma delas (`gospel_thomas`) tem inclusive
  um aviso de copyright explícito no próprio texto fonte.

## Limitações conhecidas / por fazer

- Sem morfologia/interlinear hebraico-grego (Fase 1 do `PLAN.md`).
- Sem deuterocanónicos marcados como tal (o `en-kjv` já os tem como
  livros — Tobias, Judite, Sabedoria, etc. — só falta a flag no schema).
- 1 Enoque e Livro dos Jubileus precisam de outra fonte.
- Sem cross-references entre versículos, nem citações patrísticas
  ligadas a versículos (Fase 1/2 do `PLAN.md`).
