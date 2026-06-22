"""
Loader: carrega todos os dados normalizados para o Supabase (Postgres).

Pré-requisitos:
  pip install supabase psycopg2-binary python-dotenv

.env necessário:
  SUPABASE_URL=https://xxxx.supabase.co
  SUPABASE_SERVICE_KEY=eyJ...   (service_role key — NÃO a anon key)

Tabelas esperadas (ver schema.sql):
  - bible_versions     (metadados de cada tradução)
  - verses             (todos os versículos)
  - cross_references   (referências cruzadas entre versículos)
  - patristic_authors  (metadados dos Pais da Igreja)
  - patristic_works    (obras por autor)
  - patristic_sections (parágrafos/secções de cada obra)
  - apocryphal_works   (textos apócrifos)
  - apocryphal_sections
"""

import json
import logging
import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

BATCH_SIZE = 500  # versículos por batch de insert


def get_client() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("SUPABASE_URL e SUPABASE_SERVICE_KEY têm de estar no .env")
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def load_bible_versions(client: Client, bible_dir: Path):
    """Carrega metadados das versões bíblicas."""
    for version_dir in bible_dir.iterdir():
        meta_file = version_dir / "meta.json"
        if not meta_file.exists():
            continue

        meta = json.loads(meta_file.read_text(encoding="utf-8"))
        log.info(f"A carregar versão: {meta['id']}")

        client.table("bible_versions").upsert({
            "id":          meta["id"],
            "name":        meta["name"],
            "language":    meta["lang"],
            "license":     meta["license"],
            "source_url":  meta.get("source_url"),
        }).execute()


def load_verses(client: Client, bible_dir: Path):
    """Carrega todos os versículos em batches."""
    for version_dir in bible_dir.iterdir():
        if not version_dir.is_dir():
            continue
        version_id = version_dir.name

        book_files = [f for f in version_dir.glob("*.json") if f.name != "meta.json"]
        for book_file in sorted(book_files):
            verses = json.loads(book_file.read_text(encoding="utf-8"))
            if not verses:
                continue

            # Insert em batches para não exceder limites
            for i in range(0, len(verses), BATCH_SIZE):
                batch = verses[i:i + BATCH_SIZE]
                client.table("verses").upsert(batch, on_conflict="version_id,book,chapter,verse").execute()
                log.info(f"  [{version_id}/{book_file.stem}] {i+len(batch)}/{len(verses)} versículos")


def load_crossrefs(client: Client, crossrefs_dir: Path):
    """Carrega as referências cruzadas em batches."""
    refs_file = crossrefs_dir / "cross_references.json"
    if not refs_file.exists():
        return

    refs = json.loads(refs_file.read_text(encoding="utf-8"))
    on_conflict = "source_book,source_ch,source_v,target_book,target_ch,target_v"
    for i in range(0, len(refs), BATCH_SIZE):
        batch = refs[i:i + BATCH_SIZE]
        client.table("cross_references").upsert(batch, on_conflict=on_conflict).execute()
        log.info(f"  [cross_references] {i+len(batch)}/{len(refs)} referências")


def load_patristics(client: Client, patristics_dir: Path):
    """Carrega autores e obras patrísticas."""
    for father_dir in patristics_dir.iterdir():
        if not father_dir.is_dir():
            continue

        meta_file = father_dir / "meta.json"
        if not meta_file.exists():
            continue

        meta = json.loads(meta_file.read_text(encoding="utf-8"))
        father_id = meta["id"]

        # Inserir autor
        client.table("patristic_authors").upsert({
            "id":        father_id,
            "name_pt":   meta["name"],
            "name_en":   meta["name_en"],
            "period":    meta["period"],
            "dates":     meta["dates"],
            "tradition": meta["tradition"],
        }).execute()

        # Inserir obras e secções
        for work_file in father_dir.glob("*.json"):
            if work_file.name == "meta.json":
                continue

            work = json.loads(work_file.read_text(encoding="utf-8"))
            work_id = f"{father_id}__{work_file.stem}"

            client.table("patristic_works").upsert({
                "id":         work_id,
                "author_id":  father_id,
                "title":      work["work_title"],
                "source_url": work["source_url"],
                "language":   work["language"],
                "license":    work["license"],
            }).execute()

            # Secções em batch
            sections = [
                {
                    "work_id":     work_id,
                    "section_num": s["section"],
                    "text":        s["text"],
                }
                for s in work.get("sections", [])
            ]
            for i in range(0, len(sections), BATCH_SIZE):
                client.table("patristic_sections").upsert(sections[i:i+BATCH_SIZE], on_conflict="work_id,section_num").execute()

            log.info(f"  [{father_id}] {work['work_title']}: {len(sections)} secções carregadas")


def load_apocrypha(client: Client, apocrypha_dir: Path):
    """Carrega textos apócrifos."""
    for cat_dir in apocrypha_dir.iterdir():
        if not cat_dir.is_dir():
            continue

        for work_file in cat_dir.glob("*.json"):
            work = json.loads(work_file.read_text(encoding="utf-8"))

            client.table("apocryphal_works").upsert({
                "id":            work["id"],
                "title_pt":      work["title"],
                "title_en":      work["title_en"],
                "category":      work["category"],
                "tradition":     work["tradition"],
                "date_estimate": work["date_estimate"],
                "source_url":    work["source_url"],
                "language":      work["language"],
                "license":       work["license"],
            }).execute()

            sections = [
                {
                    "work_id":     work["id"],
                    "section_num": s["section"],
                    "text":        s["text"],
                }
                for s in work.get("sections", [])
            ]
            for i in range(0, len(sections), BATCH_SIZE):
                client.table("apocryphal_sections").upsert(sections[i:i+BATCH_SIZE], on_conflict="work_id,section_num").execute()

            log.info(f"  [{work['id']}] {len(sections)} secções carregadas")


def load_creeds(client: Client, creeds_dir: Path):
    """Carrega credos e confissões."""
    for work_file in creeds_dir.glob("*.json"):
        if work_file.name == "summary.json":
            continue
        work = json.loads(work_file.read_text(encoding="utf-8"))

        client.table("creeds_confessions").upsert({
            "id":         work["id"],
            "title":      work["title"],
            "title_pt":   work["title_pt"],
            "type":       work["type"],
            "tradition":  work["tradition"],
            "year":       work["year"],
            "source_url": work["source_url"],
            "language":   work["language"],
            "license":    work["license"],
        }).execute()

        sections = [
            {
                "work_id":     work["id"],
                "section_num": s["section"],
                "text":        s["text"],
            }
            for s in work.get("sections", [])
        ]
        for i in range(0, len(sections), BATCH_SIZE):
            client.table("creeds_confessions_sections").upsert(
                sections[i:i+BATCH_SIZE], on_conflict="work_id,section_num,language"
            ).execute()

        log.info(f"  [{work['id']}] {len(sections)} secções carregadas")


def load_creeds_pt(client: Client, creeds_pt_dir: Path):
    """
    Carrega traduções portuguesas reais dos credos/confissões (ver
    fetchers/creeds_pt_fetcher.py). Atualiza source_url_pt/license_pt na
    linha já existente em creeds_confessions (não faz upsert completo —
    o credo já foi carregado por load_creeds antes desta função correr)
    e insere as secções PT com language='pt' (numeração independente das
    secções em inglês, que não correspondem 1-para-1 entre traduções).
    """
    for work_file in creeds_pt_dir.glob("*.json"):
        if work_file.name == "summary.json":
            continue
        work = json.loads(work_file.read_text(encoding="utf-8"))

        client.table("creeds_confessions").update({
            "source_url_pt": work["source_url_pt"],
            "license_pt":    work["license_pt"],
        }).eq("id", work["id"]).execute()

        sections = [
            {
                "work_id":     work["id"],
                "section_num": s["section"],
                "text":        s["text"],
                "language":    "pt",
            }
            for s in work.get("sections", [])
        ]
        for i in range(0, len(sections), BATCH_SIZE):
            client.table("creeds_confessions_sections").upsert(
                sections[i:i+BATCH_SIZE], on_conflict="work_id,section_num,language"
            ).execute()

        log.info(f"  [{work['id']}] {len(sections)} secções PT carregadas")


def load_glossary(client: Client, glossary_dir: Path):
    """Carrega o glossário/dicionário bíblico em batches."""
    terms_file = glossary_dir / "glossary_terms.json"
    if not terms_file.exists():
        return

    terms = json.loads(terms_file.read_text(encoding="utf-8"))
    for i in range(0, len(terms), BATCH_SIZE):
        batch = terms[i:i + BATCH_SIZE]
        client.table("glossary_terms").upsert(batch, on_conflict="term,source").execute()
        log.info(f"  [glossary_terms] {i+len(batch)}/{len(terms)} termos")


def load_geography(client: Client, geography_dir: Path):
    """Carrega os locais bíblicos em batches."""
    places_file = geography_dir / "biblical_places.json"
    if not places_file.exists():
        return

    places = json.loads(places_file.read_text(encoding="utf-8"))
    for p in places:
        p["source_url"] = "https://www.openbible.info/geo/data/merged.txt"

    for i in range(0, len(places), BATCH_SIZE):
        batch = places[i:i + BATCH_SIZE]
        client.table("biblical_places").upsert(batch, on_conflict="name").execute()
        log.info(f"  [biblical_places] {i+len(batch)}/{len(places)} locais")


def load_geography_confidence(client: Client, geography_dir: Path):
    """
    Atualiza confidence_pct/sources nos locais já existentes em
    biblical_places. Só processa nomes que já existem (filtrados primeiro)
    — evita criar linhas novas incompletas (sem lat/lon, que são
    NOT NULL) para nomes do dataset mais recente que não batem certo
    com os do merged.txt mais antigo (ver geography_confidence_fetcher.py).
    """
    conf_file = geography_dir / "geography_confidence.json"
    if not conf_file.exists():
        return

    enrichments = json.loads(conf_file.read_text(encoding="utf-8"))

    existing_names = set()
    offset = 0
    while True:
        r = client.table("biblical_places").select("name").range(offset, offset + 999).execute()
        if not r.data:
            break
        existing_names.update(row["name"] for row in r.data)
        offset += 1000

    matched = [e for e in enrichments if e["name"] in existing_names]
    log.info(f"  {len(matched)}/{len(enrichments)} nomes correspondem a locais já carregados")

    # Usa uma função RPC (UPDATE puro) em vez de upsert: um upsert parcial
    # falharia com NOT NULL em lat/lon (ver nota em schema.sql).
    for i in range(0, len(matched), BATCH_SIZE):
        batch = matched[i:i + BATCH_SIZE]
        client.rpc("bulk_update_place_confidence", {"updates": batch}).execute()
        log.info(f"  [biblical_places confidence] {i+len(batch)}/{len(matched)} atualizados")


def load_lexicon(client: Client, lexicon_dir: Path):
    """Carrega o léxico de Strong's em batches."""
    entries_file = lexicon_dir / "lexicon_entries.json"
    if not entries_file.exists():
        return

    entries = json.loads(entries_file.read_text(encoding="utf-8"))
    source_url = "https://github.com/STEPBible/STEPBible-Data/tree/master/Lexicons"
    for e in entries:
        e["source_url"] = source_url

    for i in range(0, len(entries), BATCH_SIZE):
        batch = entries[i:i + BATCH_SIZE]
        client.table("lexicon_entries").upsert(batch, on_conflict="d_strong").execute()
        log.info(f"  [lexicon_entries] {i+len(batch)}/{len(entries)} entradas")


def load_interlinear(client: Client, interlinear_dir: Path):
    """Carrega o texto interlinear em batches."""
    words_file = interlinear_dir / "interlinear_words.json"
    if not words_file.exists():
        return

    words = json.loads(words_file.read_text(encoding="utf-8"))
    source_url = "https://github.com/STEPBible/STEPBible-Data/tree/master/Translators%20Amalgamated%20OT%2BNT"
    rows = [
        {
            "book":            w["book"],
            "chapter":         w["chapter"],
            "verse":           w["verse"],
            "word_position":   w["position"],
            "language":        w["language"],
            "original_word":   w["original_word"],
            "transliteration": w["transliteration"],
            "gloss":           w["gloss"],
            "strong_numbers":  w["strong_numbers"],
            "grammar":         w["grammar"],
            "source_url":      source_url,
        }
        for w in words
    ]

    on_conflict = "book,chapter,verse,word_position,language"
    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i:i + BATCH_SIZE]
        client.table("interlinear_words").upsert(batch, on_conflict=on_conflict).execute()
        log.info(f"  [interlinear_words] {i+len(batch)}/{len(rows)} palavras")


def load_citations(client: Client, citations_dir: Path):
    """Carrega as citações bíblicas patrísticas em batches."""
    citations_file = citations_dir / "patristic_citations.json"
    if not citations_file.exists():
        return

    citations = json.loads(citations_file.read_text(encoding="utf-8"))
    on_conflict = "section_id,book,chapter,verse"
    for i in range(0, len(citations), BATCH_SIZE):
        batch = citations[i:i + BATCH_SIZE]
        client.table("patristic_citations").upsert(batch, on_conflict=on_conflict).execute()
        log.info(f"  [patristic_citations] {i+len(batch)}/{len(citations)} citações")


def run(
    bible_dir:      str = "output/bible",
    crossrefs_dir:  str = "output/crossrefs",
    patristics_dir: str = "output/patristics",
    apocrypha_dir:  str = "output/apocrypha",
    creeds_dir:     str = "output/creeds",
    creeds_pt_dir:  str = "output/creeds_pt",
    glossary_dir:   str = "output/glossary",
    geography_dir:  str = "output/geography",
    lexicon_dir:    str = "output/lexicon",
    interlinear_dir: str = "output/interlinear",
    citations_dir:  str = "output/citations",
):
    client = get_client()
    log.info("Ligado ao Supabase.")

    if Path(bible_dir).exists():
        log.info("\n--- Versões bíblicas ---")
        load_bible_versions(client, Path(bible_dir))
        log.info("\n--- Versículos ---")
        load_verses(client, Path(bible_dir))

    if Path(crossrefs_dir).exists():
        log.info("\n--- Referências cruzadas ---")
        load_crossrefs(client, Path(crossrefs_dir))

    if Path(patristics_dir).exists():
        log.info("\n--- Patrística ---")
        load_patristics(client, Path(patristics_dir))

    if Path(apocrypha_dir).exists():
        log.info("\n--- Apócrifos ---")
        load_apocrypha(client, Path(apocrypha_dir))

    if Path(creeds_dir).exists():
        log.info("\n--- Credos e confissões ---")
        load_creeds(client, Path(creeds_dir))

    if Path(creeds_pt_dir).exists():
        log.info("\n--- Credos e confissões (PT) ---")
        load_creeds_pt(client, Path(creeds_pt_dir))

    if Path(glossary_dir).exists():
        log.info("\n--- Glossário ---")
        load_glossary(client, Path(glossary_dir))

    if Path(geography_dir).exists():
        log.info("\n--- Geografia ---")
        load_geography(client, Path(geography_dir))
        log.info("\n--- Geografia (confiança/fontes) ---")
        load_geography_confidence(client, Path(geography_dir))

    if Path(lexicon_dir).exists():
        log.info("\n--- Léxico Strong's ---")
        load_lexicon(client, Path(lexicon_dir))

    if Path(interlinear_dir).exists():
        log.info("\n--- Interlinear ---")
        load_interlinear(client, Path(interlinear_dir))

    if Path(citations_dir).exists():
        log.info("\n--- Citações patrísticas ---")
        load_citations(client, Path(citations_dir))

    log.info("\nCarga concluída!")


if __name__ == "__main__":
    run()
