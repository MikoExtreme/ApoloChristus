"""
Carrega o Evangelho de Tomé em português (tradução de Huberto Rohden)
a partir de saindodamatrix.com.br.

Pré-requisitos:
  1. Correr PRIMEIRO o SQL de migração no Supabase SQL Editor:
       christianity-data-pipeline/models/migrations/2026-06-25_apocryphal_works_pt_translations.sql
  2. Ter o venv activo com: pip install requests beautifulsoup4 python-dotenv supabase

Correr a partir de christianity-data-pipeline/:
  .venv/Scripts/python.exe fetchers/apocrypha_pt_fetcher.py
"""

import logging
import os
import re
import time

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; ApoloChristus/1.0)"}
MIN_LEN = 20
BATCH_SIZE = 500

# ID da obra EN na BD (carregada pelo pipeline apocrypha)
EN_WORK_ID = "gospel_thomas"

# ID da obra PT a criar
PT_WORK_ID = "gospel_thomas_pt"

# URL da tradução Rohden
SOURCE_URL = "https://saindodamatrix.com.br/evangelho-de-tome/"


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def fetch_gospel_of_thomas() -> list[str]:
    log.info(f"A fazer fetch: {SOURCE_URL}")
    r = requests.get(SOURCE_URL, timeout=30, headers=HEADERS)
    r.raise_for_status()

    soup = BeautifulSoup(r.text, "html.parser")
    for tag in soup.find_all(["script", "style", "nav", "header", "footer"]):
        tag.decompose()

    paragraphs = []
    for elem in soup.find_all(["p", "blockquote", "div"]):
        text = _clean(elem.get_text(separator=" "))
        # Filtra parágrafos curtos ou que sejam apenas nav/meta
        if len(text) >= MIN_LEN and not text.startswith("©"):
            paragraphs.append(text)

    # Deduplicar (alguns elementos aninhados podem repetir texto)
    seen: set[str] = set()
    unique = []
    for p in paragraphs:
        if p not in seen:
            seen.add(p)
            unique.append(p)

    log.info(f"  {len(unique)} parágrafos extraídos")
    return unique


def load_to_supabase(client: Client, paragraphs: list[str]):
    # Criar/actualizar obra PT em apocryphal_works
    client.table("apocryphal_works").upsert({
        "id":                       PT_WORK_ID,
        "title_pt":                 "Evangelho de Tomé",
        "title_en":                 "Gospel of Thomas",
        "category":                 "gospels",
        "tradition":                "gnostic",
        "date_estimate":            "c. 50–140 CE",
        "source_url":               SOURCE_URL,
        "language":                 "pt",
        "license":                  "check_rights",
        "translated_from_work_id":  EN_WORK_ID,
    }).execute()

    sections = [
        {"work_id": PT_WORK_ID, "section_num": i + 1, "text": p[:4000]}
        for i, p in enumerate(paragraphs)
    ]
    for i in range(0, len(sections), BATCH_SIZE):
        client.table("apocryphal_sections").upsert(
            sections[i:i + BATCH_SIZE], on_conflict="work_id,section_num"
        ).execute()

    log.info(f"  ✓ {PT_WORK_ID}: {len(sections)} secções carregadas")


if __name__ == "__main__":
    url_env = os.getenv("SUPABASE_URL")
    key_env = os.getenv("SUPABASE_SERVICE_KEY")
    if not url_env or not key_env:
        raise ValueError("SUPABASE_URL e SUPABASE_SERVICE_KEY em falta no .env")

    client = create_client(url_env, key_env)
    log.info("Ligado ao Supabase.\n")

    try:
        paragraphs = fetch_gospel_of_thomas()
        if paragraphs:
            load_to_supabase(client, paragraphs)
        else:
            log.warning("Sem conteúdo extraído — verifica o URL ou a estrutura da página.")
    except requests.HTTPError as e:
        log.error(f"HTTP {e.response.status_code} ao aceder {SOURCE_URL}")
        log.error("Verifica se o URL ainda está activo ou ajusta SOURCE_URL no script.")
    except Exception as e:
        log.error(f"Erro: {e}")

    log.info("\nConcluído.")
