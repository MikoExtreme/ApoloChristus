"""
Fetcher de glossário/dicionário bíblico via neuu-org/bible-dictionary-dataset
(GitHub) — já estruturado em JSON a partir de 4 dicionários clássicos de
domínio público, extraídos do XML ThML do CCEL:

  - Easton's Bible Dictionary (Matthew George Easton, 1897) — 3 962 termos
  - Smith's Bible Dictionary (William Smith, 1863) — 4 561 termos
  - Hastings' Dictionary of the Bible (James Hastings, c.1900) — 5 033 termos
  - Hitchcock's Bible Names Dictionary (Roswell D. Hitchcock, c.1869) — 2 619 termos
  - Schaff's Bible Dictionary (Philip Schaff) — 4 725 termos

Licença: os dicionários originais são domínio público (publicados antes de
1929). O ESTRUTURAR deste JSON a partir do XML é trabalho do NEUU, sob
licença CC-BY 4.0 — por isso a atribuição "Dados estruturados por NEUU
(github.com/neuu-org/bible-dictionary-dataset), CC-BY 4.0, a partir de
fontes em domínio público" deve aparecer onde estes dados forem usados.

Estrutura (verificada): um ficheiro JSON por letra por dicionário em
data/02_sources/{fonte}/{letra}.json — dict de termo -> {name, slug,
definitions: [{source, text}], scripture_refs: [{reference, original}]}.
Nenhum scraping necessário, só download direto via raw.githubusercontent.com
(123 pedidos no total: ~25 letras × 5 dicionários).
"""

import json
import logging
import re
import time
from pathlib import Path

import requests

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

RAW_BASE = "https://raw.githubusercontent.com/neuu-org/bible-dictionary-dataset/main/data/02_sources"
GITHUB_REPO = "https://github.com/neuu-org/bible-dictionary-dataset"

SOURCES = {
    "easton":    {"name": "Easton's Bible Dictionary", "year": "1897"},
    "smith":     {"name": "Smith's Bible Dictionary", "year": "1863"},
    "hastings":  {"name": "Hastings' Dictionary of the Bible", "year": "c.1900"},
    "hitchcock": {"name": "Hitchcock's Bible Names Dictionary", "year": "c.1869"},
    "schaff":    {"name": "Schaff's Bible Dictionary", "year": "c.1880"},
}

LETTERS = "abcdefghijklmnopqrstuvwxyz"


def fetch_letter_file(source: str, letter: str) -> dict | None:
    url = f"{RAW_BASE}/{source}/{letter}.json"
    try:
        r = requests.get(url, timeout=30)
        if r.status_code == 404:
            return None
        r.raise_for_status()
        return r.json()
    except requests.RequestException as e:
        log.error(f"  Erro a obter {url}: {e}")
        return None


def normalize_entry(term_key: str, entry: dict, source: str) -> dict:
    definitions = entry.get("definitions", [])
    text = "\n\n".join(d["text"] for d in definitions if d.get("text"))
    text = re.sub(r"\s+", " ", text).strip()

    refs = [r["reference"] for r in entry.get("scripture_refs", []) if r.get("reference")]

    return {
        "term": entry.get("name", term_key),
        "source": source,
        "definition": text,
        "scripture_refs": refs,
    }


def fetch_all_glossary(output_dir: str = "output/glossary", delay: float = 0.3):
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    all_entries = []
    summary = {}

    for source, meta in SOURCES.items():
        log.info(f"\n{'='*50}\n{meta['name']} ({source})\n{'='*50}")
        source_count = 0
        for letter in LETTERS:
            data = fetch_letter_file(source, letter)
            if not data:
                continue
            for term_key, entry in data.items():
                normalized = normalize_entry(term_key, entry, source)
                if normalized["definition"]:
                    all_entries.append(normalized)
                    source_count += 1
            time.sleep(delay)
        log.info(f"  {source}: {source_count} termos")
        summary[source] = source_count

    out_file = out / "glossary_terms.json"
    out_file.write_text(json.dumps(all_entries, ensure_ascii=False), encoding="utf-8")
    log.info(f"\nGuardado {len(all_entries)} entradas em {out_file}")

    (out / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    return all_entries


if __name__ == "__main__":
    fetch_all_glossary()
