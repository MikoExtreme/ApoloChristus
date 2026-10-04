"""
Adiciona traduções portuguesas genuínas para obras patrísticas específicas
onde existem fontes PT fiáveis e gratuitas online.

Obras cobertas:
  - Atanásio: Vida de Santo Antão → cristianismo.org.br (HTML multi-página)
  - Hermas:   O Pastor de Hermas  → monergismo.com (PDF)
  - Justino:  I Apologia          → monergismo.com (PDF)

As PT works são criadas como linhas separadas em patristic_works com
language='pt' e translated_from_work_id a apontar para a obra EN original.
O frontend já suporta este padrão via getPtTranslationForWork().

Pré-requisitos (venv do pipeline):
  pip install requests beautifulsoup4 pdfplumber python-dotenv supabase
"""

import logging
import os
import re
import time
from io import BytesIO

import pdfplumber
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; ApoloChristus/1.0)"}
MIN_LEN = 40
BATCH_SIZE = 500

# ---------------------------------------------------------------------------
# EN work IDs (gerados por load_to_supabase.py: "{author_id}__{title_slug}")
# ---------------------------------------------------------------------------
EN_IDS = {
    "vida_antao":   "athanasius__vita_s._antoni_(life_of_st._anthony)",
    "pastor_hermas":"hermas__the_pastor_(or_the_shepherd)",
    "i_apologia":   "justin_martyr__first_apology",
}

# PT work IDs — sufixo "_pt" para não colidir com EN
PT_IDS = {
    "vida_antao":   "athanasius__vida_de_santo_antao_pt",
    "pastor_hermas":"hermas__o_pastor_de_hermas_pt",
    "i_apologia":   "justin_martyr__i_apologia_de_justino_pt",
}

CATALOG = [
    {
        "key":        "vida_antao",
        "title":      "Vida de Santo Antão",
        "author_id":  "athanasius",
        "kind":       "html_paginated",
        "base_url":   "https://www.cristianismo.org.br/vida-antao-{n}.htm",
        "max_pages":  20,
        "source_url": "https://www.cristianismo.org.br/vida-antao-1.htm",
        "license":    "check_rights",
    },
    {
        "key":        "pastor_hermas",
        "title":      "O Pastor de Hermas",
        "author_id":  "hermas",
        "kind":       "pdf",
        "url":        "https://www.monergismo.com/textos/livros/Pastor_de_Hermas.pdf",
        "source_url": "https://www.monergismo.com/textos/livros/Pastor_de_Hermas.pdf",
        "license":    "check_rights",
    },
    {
        "key":        "i_apologia",
        "title":      "I Apologia de Justino de Roma",
        "author_id":  "justin_martyr",
        "kind":       "pdf",
        "url":        "https://www.monergismo.com/textos/apologetica/Justino_de_Roma_IApologia.pdf",
        "source_url": "https://www.monergismo.com/textos/apologetica/Justino_de_Roma_IApologia.pdf",
        "license":    "check_rights",
    },
]


# ---------------------------------------------------------------------------
# Extração de texto
# ---------------------------------------------------------------------------

def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _split_long(text: str, max_len: int = 2000) -> list[str]:
    if len(text) <= max_len:
        return [text]
    sentences = re.split(r"(?<=[.!?;])\s+", text)
    chunks, cur = [], ""
    for s in sentences:
        if cur and len(cur) + len(s) + 1 > max_len:
            chunks.append(cur.strip())
            cur = s
        else:
            cur = f"{cur} {s}".strip()
    if cur:
        chunks.append(cur.strip())
    return chunks


def extract_html(url: str) -> list[str]:
    r = requests.get(url, timeout=30, headers=HEADERS)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")
    for tag in soup.find_all(["script", "style", "nav", "header", "footer"]):
        tag.decompose()
    paragraphs = []
    for elem in soup.find_all(["p", "td"]):
        text = _clean(elem.get_text(separator=" "))
        if len(text) >= MIN_LEN:
            paragraphs.append(text)
    return paragraphs


def extract_html_paginated(base_url: str, max_pages: int) -> list[str]:
    paragraphs = []
    for n in range(1, max_pages + 1):
        url = base_url.format(n=n)
        try:
            page_paras = extract_html(url)
            if not page_paras:
                break
            log.info(f"    página {n}: {len(page_paras)} parágrafos")
            paragraphs.extend(page_paras)
            time.sleep(0.5)
        except requests.HTTPError as e:
            if e.response.status_code == 404:
                break
            raise
    return paragraphs


def extract_pdf(url: str) -> list[str]:
    r = requests.get(url, timeout=60, headers=HEADERS)
    r.raise_for_status()
    paragraphs = []
    with pdfplumber.open(BytesIO(r.content)) as pdf:
        for page in pdf.pages:
            raw = page.extract_text() or ""
            text = _clean(raw)
            if len(text) >= MIN_LEN:
                for chunk in _split_long(text):
                    paragraphs.append(chunk)
    return paragraphs


def fetch_work(entry: dict) -> list[str]:
    kind = entry["kind"]
    if kind == "html_paginated":
        return extract_html_paginated(entry["base_url"], entry["max_pages"])
    if kind == "html":
        return extract_html(entry["url"])
    if kind == "pdf":
        return extract_pdf(entry["url"])
    raise ValueError(f"kind desconhecido: {kind}")


# ---------------------------------------------------------------------------
# Supabase
# ---------------------------------------------------------------------------

def get_client() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    if not url or not key:
        raise ValueError("SUPABASE_URL e SUPABASE_SERVICE_KEY em falta no .env")
    return create_client(url, key)


def load_pt_work(client: Client, entry: dict, paragraphs: list[str]):
    key = entry["key"]
    pt_id = PT_IDS[key]
    en_id = EN_IDS[key]

    # Criar/actualizar a obra PT em patristic_works
    client.table("patristic_works").upsert({
        "id":                       pt_id,
        "author_id":                entry["author_id"],
        "title":                    entry["title"],
        "source_url":               entry["source_url"],
        "language":                 "pt",
        "license":                  entry["license"],
        "translated_from_work_id":  en_id,
    }).execute()

    # Inserir secções
    sections = [
        {"work_id": pt_id, "section_num": i + 1, "text": p[:4000]}
        for i, p in enumerate(paragraphs)
    ]
    for i in range(0, len(sections), BATCH_SIZE):
        client.table("patristic_sections").upsert(
            sections[i:i + BATCH_SIZE], on_conflict="work_id,section_num"
        ).execute()

    log.info(f"  ✓ {pt_id}: {len(sections)} secções carregadas")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    client = get_client()
    log.info("Ligado ao Supabase.\n")

    for entry in CATALOG:
        log.info(f"=== {entry['title']} ({entry['kind']}) ===")
        try:
            paragraphs = fetch_work(entry)
            log.info(f"  {len(paragraphs)} parágrafos extraídos")
            if paragraphs:
                load_pt_work(client, entry, paragraphs)
            else:
                log.warning(f"  Sem conteúdo — a saltar.")
        except Exception as e:
            log.error(f"  Erro: {e}")
        time.sleep(1)

    log.info("\nConcluído.")
