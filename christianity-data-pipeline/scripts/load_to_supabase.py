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


def run(
    bible_dir:      str = "output/bible",
    patristics_dir: str = "output/patristics",
    apocrypha_dir:  str = "output/apocrypha",
):
    client = get_client()
    log.info("Ligado ao Supabase.")

    if Path(bible_dir).exists():
        log.info("\n--- Versões bíblicas ---")
        load_bible_versions(client, Path(bible_dir))
        log.info("\n--- Versículos ---")
        load_verses(client, Path(bible_dir))

    if Path(patristics_dir).exists():
        log.info("\n--- Patrística ---")
        load_patristics(client, Path(patristics_dir))

    if Path(apocrypha_dir).exists():
        log.info("\n--- Apócrifos ---")
        load_apocrypha(client, Path(apocrypha_dir))

    log.info("\nCarga concluída!")


if __name__ == "__main__":
    run()
