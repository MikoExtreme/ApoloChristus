# Christianity App — Plano de desenvolvimento

## Visão geral
Aplicação web abrangente sobre Cristianismo agregando textos bíblicos, apócrifos, Pais da Igreja, teólogos medievais, reformadores, modernos, credos e confissões históricas — tudo pesquisável numa única interface.

**Stack**: React + Vite (frontend) · Supabase/Postgres (BD) · Python (pipeline de ingestão) · Node.js / Supabase Edge Functions (API)

**GitHub**: MikoExtreme

---

## Fontes de dados

### Textos bíblicos
| Fonte | URL | Chave? | Conteúdo |
|-------|-----|--------|---------|
| wldeh/bible-api | `cdn.jsdelivr.net/gh/wldeh/bible-api` | Não | 200+ traduções em JSON |
| API.Bible | `scripture.api.bible` | Sim (grátis) | 5000 req/dia, inclui traduções modernas |
| STEPBible (Tyndale) | `github.com/tyndale/STEPBible-Data` | Não | Morfologia grega/hebraica, Strong's, interlinear |
| OpenBible | `openbible.info/labs/cross-references` | Não | 340 000 cross-references |

### Pais da Igreja
| Fonte | URL | Conteúdo |
|-------|-----|---------|
| New Advent | `newadvent.org/fathers` | 38 volumes ANF/NPNF, domínio público |
| CCEL | `ccel.org` | XML estruturado, domínio público |

### Teólogos medievais, reforma e modernos
Todos disponíveis no CCEL (`ccel.org`) em domínio público:
- Medievais: Anselmo, Tomás de Aquino (Suma Teológica), Bernardo de Claraval, Boaventura
- Reforma: Lutero (95 Teses, catecismos), Calvino (Institutos), Zuínglio, Melâncton
- Modernos: Wesley, Jonathan Edwards, Spurgeon, C.S. Lewis, Chesterton, Warfield, Machen

### Credos e confissões
Todos domínio público, disponíveis no CCEL e reformedconfessions.com:
- Credos: Apostólico, Niceno (381), Calcedónia (451), Atanasiano
- Confissões reformadas: Westminster, Heidelberg, Belga, Cânones de Dort
- Católicas: Trento, Vaticano I e II
- Ortodoxas: confissões de Dositeu, etc.

### Apócrifos e pseudepígrafos
| Fonte | Conteúdo |
|-------|---------|
| Early Christian Writings (`earlychristianwritings.com`) | Evangelhos apócrifos, Actos apócrifos, Nag Hammadi |
| CCEL + Internet Sacred Text Archive | 1 Enoque, Jubileus, Testamentos XII Patriarcas |
| LXX (Septuaginta) | Deuterocanónicos (Tobias, Judite, 1-2 Mac, Sirácide, Sabedoria, Baruque) |

### Concílios, catecismos e documentos magisteriais
| Fonte | URL | Conteúdo |
|-------|-----|---------|
| Papal Encyclicals Online | `papalencyclicals.net` | Encíclicas papais completas, domínio público/livre acesso |
| Vatican.va | `vatican.va/archive/ENG0015` | Catecismo da Igreja Católica (1992), texto integral |
| Documenta Catholica Omnia | `documentacatholicaomnia.eu` | Atas e cânones dos Concílios Ecuménicos (Niceia I a Vaticano II), grego/latim/inglês |
| CCEL | `ccel.org` | Catecismos protestantes (Westminster Shorter/Larger, Baltimore), 39 Artigos anglicanos |
| Reformed Confessions | `reformedconfessions.com` | Confissão Batista de Londres (1689), Cânones de Dort |

### Místicos, devocionais e martirológios
| Fonte | Conteúdo |
|-------|---------|
| CCEL | Imitação de Cristo (Kempis), O Peregrino (Bunyan), Prática da Presença de Deus (Irmão Lourenço) |
| CCEL / Internet Sacred Text Archive | Teresa de Ávila, João da Cruz, Catarina de Siena, Juliana de Norwich, Hildegarda de Bingen |
| Foxe's Book of Martyrs (CCEL) | Martirológio protestante clássico, domínio público |

### Aparato de estudo adicional
| Fonte | URL | Conteúdo |
|-------|-----|---------|
| Strong's Concordance / BDAG (parcial aberto) | via STEPBible/OpenBible | Definições lexicais hebraico/grego por entrada Strong's |
| Easton's Bible Dictionary / ISBE | `ccel.org`, domínio público | Glossário de termos, lugares, pessoas bíblicas |
| OpenBible Geography | `openbible.info/geo` | Coordenadas de locais bíblicos para mapas interativos |
| Wikidata / Pleiades | `wikidata.org` | IDs geográficos e cronológicos para concílios, autores, locais |

---

## Ficheiros existentes

Estado real em 2026-06-20 (todos os 3 fetchers já validados contra as fontes
ao vivo e carregados no Supabase — ver `christianity-data-pipeline/README.md`
para detalhes técnicos e notas de licenciamento):

```
christianity-data-pipeline/
├── fetchers/
│   ├── bible_fetcher.py          # wldeh/bible-api + thiagobodruk/biblia — 6 versões, 155 563 versículos
│   ├── patristics_fetcher.py     # New Advent — 65 autores, 341 obras, 67 604 secções
│   ├── patristic_catalog.json    # catálogo completo dos 65 autores (gerado do índice real)
│   └── apocrypha_fetcher.py      # Early Christian Writings — 39 obras, 2895 secções
├── scripts/
│   └── load_to_supabase.py       # Loader idempotente (upsert com on_conflict nas chaves naturais)
├── models/
│   └── schema.sql                # Schema completo (inclui source_url e immutable_unaccent)
├── requirements.txt
└── README.md
```

---

## Roadmap por fases

### Fase 1 — Fundação bíblica (começar aqui)
**Objetivo**: BD com textos bíblicos completos, cross-references e pesquisa full-text a funcionar.

- [x] **`bible_fetcher.py` corrigido e validado contra as fontes reais** (2026-06-20) —
  o código original nunca tinha sido testado e tinha vários bugs (endpoints
  errados, IDs de versão inexistentes, formato de JSON errado, sem Almeida
  nenhuma no `wldeh/bible-api` — teve de se usar `thiagobodruk/biblia` para
  português). Ver `christianity-data-pipeline/README.md` para detalhes.
- [x] Correr tudo e popular o Supabase — **155 563 versículos**, 6 versões
  (en-kjv, en-asv, grc-grctr, hbo-wlc, pt-aa, pt-acf)
- [x] Testar pesquisa full-text em português — `search_verses_pt()` confirmado a funcionar
- [ ] Expandir `schema.sql`:
  - Tabela `deuterocanonical_verses` (ou flag na tabela `verses`) — **nota:
    o `en-kjv` já inclui os deuterocanónicos como livros próprios
    (Tobias, Judite, Sabedoria, etc.), só falta esta flag para os carregar**
  - Tabela `cross_references` (source_book, source_ch, source_v → target_*)
  - Tabela `word_morphology` (versículo → palavra → Strong's → parsing)
  - Tabela `bible_comments` (para Matthew Henry versículo a versículo)
- [ ] Expandir `bible_fetcher.py`:
  - Adicionar Vulgata Latina e Septuaginta via SWORD/CCEL
  - Carregar os deuterocanónicos já disponíveis em `en-kjv` (depende da flag acima)
- [ ] Novo fetcher: `crossrefs_fetcher.py` — download do TSV do OpenBible (340k refs)
- [ ] Novo fetcher: `morphology_fetcher.py` — STEPBible TIPNR/TOTHT para grego e hebraico
- [ ] Novo fetcher: `matthew_henry_fetcher.py` — comentário completo via CCEL

**Volume estimado**: ~200 000 versículos + ~340 000 cross-refs + morfologia (~800k palavras)

---

### Fase 2 — Patrística completa
**Objetivo**: Todos os Pais da Igreja de forma estruturada, com citações bíblicas mapeadas.

- [x] **`patristics_fetcher.py` corrigido e expandido (2026-06-20)** — catálogo
  completo gerado a partir do índice real em `newadvent.org/fathers/`:
  **65 autores, 341 obras, 67 604 secções**. Cobre apostólicos, ante-nicenos,
  nicenos e pós-nicenos — essencialmente toda a coleção ANF/NPNF disponível
  nessa fonte. Catálogo em `fetchers/patristic_catalog.json`.
  - Autores planeados incluídos: Policarpo, Clemente de Roma, Orígenes,
    Clemente de Alex., Basílio, Gregório Nazianzeno, Gregório de Nissa,
    Leão Magno, Gregório Magno, João Damasceno, Ambrósio ✓
  - **Nota**: "Cirilo de Alex." não está disponível no New Advent — só
    Cirilo de **Jerusalém** (incluído em alternativa)
- [ ] Novo fetcher: `patristic_citations_fetcher.py` — mapear citações bíblicas nos textos patrísticos (regex + NLP simples)
- [ ] Adicionar ao schema: `patristic_citations` (section_id → verse_id)
- [ ] Feature no frontend: ao clicar num versículo, ver quais Pais o citaram

**Volume real obtido**: 341 obras, 67 604 secções (acima do estimado)

---

### Fase 3 — História completa e credos
**Objetivo**: Cobrir todos os períodos históricos + credos + apócrifos completos.

- [x] **`apocrypha_fetcher.py` corrigido e expandido (2026-06-20)** —
  catálogo completo do Early Christian Writings: **39 obras, 2895 secções**
  (evangelhos apócrifos, actos apócrifos, epístolas, apocalipses,
  fragmentos gnósticos, Testamento dos Doze Patriarcas). O catálogo
  original tinha vários URLs 404 e licenças mal atribuídas — corrigido.
  - **1 Enoque e Livro dos Jubileus NÃO estão disponíveis nesta fonte** —
    continuam por fazer, precisam de outra fonte (CCEL ou Internet Sacred
    Text Archive, como já estava previsto)
  - Deuterocanónicos da LXX: ainda não carregados como apócrifos — já
    estão disponíveis como livros da Bíblia em `en-kjv` (ver Fase 1)
- [ ] Novo fetcher: `medieval_fetcher.py` — Anselmo, Aquino (Suma), Bernardo, Boaventura via CCEL
- [ ] Novo fetcher: `reformation_fetcher.py` — Lutero, Calvino (Institutos), Zuínglio via CCEL
- [ ] Novo fetcher: `modern_fetcher.py` — Wesley, Edwards, Spurgeon, Warfield, Machen via CCEL
- [ ] Novo fetcher: `creeds_fetcher.py` — todos os credos e confissões históricas
- [ ] Adicionar ao schema: tabelas `creeds`, `confessions`, `medieval_works`, `reformation_works`

---

### Fase 4 — Features avançadas da app
**Objetivo**: Experiência de utilizador diferenciadora.

- [ ] Linha do tempo interativa (2000 anos de história cristã)
- [ ] Leitor interlinear (palavra grega/hebraica + tradução PT ao lado)
- [ ] Planos de leitura (cronológico, canónico, temático) com tracking de progresso
- [ ] Secção de apologética — argumentos estruturados (Kalam, ressurreição, etc.) ligados a fontes
- [ ] Árvore de tradições (católica, ortodoxa, protestante, evangélica) com autores por ramo
- [ ] Mapas históricos (onde viveu cada Pai da Igreja, onde foram os concílios)
- [ ] Partilha de versículos com imagem gerada

---

### Fase 5 — Tradições, documentos e teólogos em falta
**Objetivo**: Preencher lacunas de cobertura denominacional e de tipos de documento identificadas após revisão do escopo inicial.

- [ ] **Tradições adicionais** (decidir âmbito antes de avançar — ver nota abaixo):
  - Ortodoxia Oriental não-calcedónia (Copta, Etíope, Síria, Arménia) — Pais e liturgias próprias
  - Anabaptismo (Reforma Radical) — Menno Simons, confissões anabatistas
  - Pentecostalismo/Carismático — maior ramo cristão em crescimento global, atualmente ausente
  - Catolicismo pós-Trento — encíclicas papais, Catecismo de 1992, místicos como doutores da Igreja
- [ ] Novo fetcher: `councils_fetcher.py` — atas e cânones dos Concílios Ecuménicos (Niceia I a Vaticano II) via Documenta Catholica Omnia
- [ ] Novo fetcher: `catechisms_fetcher.py` — Catecismo da Igreja Católica, Westminster Shorter/Larger, Baltimore, 39 Artigos
- [ ] Novo fetcher: `mystics_fetcher.py` — Imitação de Cristo, O Peregrino, Teresa de Ávila, João da Cruz, Hildegarda de Bingen
- [ ] Novo fetcher: `martyrology_fetcher.py` — Foxe's Book of Martyrs
- [ ] Novo fetcher: `modern_theologians_fetcher.py` — Barth, Bonhoeffer, N.T. Wright (domínio público apenas onde aplicável; muitos modernos ainda têm direitos de autor — verificar antes de cada autor)
- [ ] Novo fetcher: `lexicon_fetcher.py` — entradas Strong's + Easton's/ISBE para glossário de termos
- [ ] Novo fetcher: `geography_fetcher.py` — coordenadas de locais bíblicos (OpenBible Geography) para mapas interativos
- [ ] Adicionar ao schema: `papal_documents`, `council_canons`, `catechisms`, `mystic_works`, `martyrology_entries`, `lexicon_entries`, `glossary_terms`, `biblical_places`

**Nota de âmbito**: nem tudo aqui precisa de entrar no MVP. Pentecostalismo e Ortodoxia Oriental são tradições vivas com volume de conteúdo próprio considerável — vale a pena decidir entre (a) tratá-las como categoria de primeira classe equivalente às já existentes, ou (b) deixá-las para uma fase de expansão pós-lançamento. Documentos conciliares e catecismos têm prioridade mais alta por serem fontes primárias compactas e de alto valor de pesquisa.

---

## Schema da BD (resumo)

```sql
-- Bíblia
bible_versions (id, name, language, license)
verses (id, version_id, testament, book, chapter, verse, text, search_vec)
cross_references (id, source_book, source_ch, source_v, target_book, target_ch, target_v, votes)
word_morphology (id, verse_id, word_pos, word_text, strongs, parsing, lemma)
bible_comments (id, verse_id, author, text)          -- Matthew Henry, etc.

-- Patrística
patristic_authors (id, name_pt, name_en, period, dates, tradition)
patristic_works (id, author_id, title, source_url, language, license)
patristic_sections (id, work_id, section_num, text, search_vec)
patristic_citations (id, section_id, verse_id)       -- Pai → versículo citado

-- História
medieval_works (id, author, title, period, text, search_vec)
reformation_works (id, author, title, tradition, text, search_vec)
modern_works (id, author, title, year, text, search_vec)

-- Credos
creeds (id, name, year, council, tradition, text)
confessions (id, name, year, tradition, text)

-- Apócrifos
apocryphal_works (id, title_pt, title_en, category, tradition, date_estimate, license)
apocryphal_sections (id, work_id, section_num, text, search_vec)

-- Concílios, catecismos e documentos magisteriais (Fase 5)
council_canons (id, council_name, year, canon_num, text, tradition)
catechisms (id, name, tradition, year, question_num, question, answer)
papal_documents (id, title, pope, year, type, text, search_vec)   -- encíclica, bula, etc.

-- Místicos, devocionais e martirológios (Fase 5)
mystic_works (id, author, title, tradition, period, text, search_vec)
martyrology_entries (id, name, period, region, account, source_url)

-- Aparato de estudo (Fase 5)
lexicon_entries (id, strongs_number, lemma, language, definition, transliteration)
glossary_terms (id, term_pt, term_en, definition, related_verses)
biblical_places (id, name, lat, lon, period, description)

-- Utilizador (Supabase Auth)
user_notes (id, user_id, ref_type, ref_id, text, created_at)
user_highlights (id, user_id, verse_id, color, created_at)
user_reading_plans (id, user_id, plan_type, progress_json, created_at)
```

---

## Notas técnicas

- **Pesquisa full-text**: usar `tsvector` do Postgres com `unaccent` para PT, `english` para EN. Criar índices GIN em todas as tabelas de texto.
- **Batches**: inserir sempre em lotes de 500 registos no Supabase para não exceder limites.
- **Licenças**: ARC (1911) = domínio público ✓ · AA = verificar com SBB · KJV/ASV = domínio público ✓ · New Advent/CCEL = domínio público ✓
- **Rate limiting**: delays de 0.3–1.5s entre requests conforme a fonte; backoff exponencial em erros.
- **Morfologia**: STEPBible disponibiliza ficheiros TSV no GitHub — não precisa de scraping, só download e parse.
- **Cross-references**: OpenBible disponibiliza TSV com 340k refs com votos de qualidade — filtrar por `votes >= 3` para qualidade.

## Pendente (fazer antes do frontend)

- [ ] **Geografia bíblica — confiança e fontes por local**: o `merged.txt` do OpenBible.info que usámos só tem nome/coordenadas/versículos. Cada local tem uma página individual (`/geo/ancient/{hash}/{nome}`) com percentagem de confiança da identificação e lista de fontes académicas (Anchor Yale Bible Dictionary, ESV Bible Atlas, etc.) — implica scraping de ~1232 páginas individuais em vez do ficheiro único. Adicionar `confidence_pct` e `sources TEXT[]` à tabela `biblical_places`.
