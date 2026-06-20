"""
Extrator de citações bíblicas dentro do texto patrístico já carregado no
Supabase (não é um fetch externo — lê `patristic_sections`, deteta
referências bíblicas por regex, valida contra `verses` e grava
`patristic_citations`).

Padrão de citação (verificado contra o texto real, não assumido): o
scraping do New Advent (`patristics_fetcher.py`) transforma os links de
versículo do HTML original em texto simples colado, ficando algo como
"...all in all. 1\xa0Corinthians\xa015:24-28 If the So..." — nome do
livro em inglês (por vezes com dígito ordinal antes, separado por
espaço/nbsp) seguido de capítulo:versículo, opcionalmente um intervalo
("15:24-28", do qual só guardamos o primeiro versículo).

Livros como "Corinthians", "Timothy", "Peter", "Thessalonians", "Kings",
"Samuel", "Chronicles", "Maccabees" exigem o dígito ordinal (1/2/3) para
saber a que livro pertencem — se o dígito não for capturado, a citação é
**ignorada** em vez de adivinhada (mais vale não ligar do que ligar
errado). "John" sem dígito refere-se ao Evangelho (não é ambíguo).

Cada candidato é validado contra a tabela `verses` (versão en-kjv, que
cobre proto+deuterocanónicos) antes de ser guardado — descarta falsos
positivos (números que coincidem com o padrão mas não correspondem a
nenhum versículo real).
"""

import json
import logging
import re
from pathlib import Path

from dotenv import load_dotenv
import os

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

load_dotenv()

BOOK_NAME_MAP = {
    # Protocanónico AT
    "Genesis": "GEN", "Exodus": "EXO", "Leviticus": "LEV", "Numbers": "NUM",
    "Deuteronomy": "DEU", "Joshua": "JOS", "Judges": "JDG", "Ruth": "RUT",
    "1Samuel": "1SA", "2Samuel": "2SA", "1Kings": "1KI", "2Kings": "2KI",
    "1Chronicles": "1CH", "2Chronicles": "2CH", "Ezra": "EZR", "Nehemiah": "NEH",
    "Esther": "EST", "Job": "JOB", "Psalm": "PSA", "Psalms": "PSA",
    "Proverbs": "PRO", "Ecclesiastes": "ECC", "Songs": "SNG", "Canticles": "SNG",
    "Isaiah": "ISA", "Jeremiah": "JER", "Lamentations": "LAM", "Ezekiel": "EZK",
    "Daniel": "DAN", "Hosea": "HOS", "Joel": "JOL", "Amos": "AMO",
    "Obadiah": "OBA", "Jonah": "JON", "Micah": "MIC", "Nahum": "NAM",
    "Habakkuk": "HAB", "Zephaniah": "ZEP", "Haggai": "HAG", "Zechariah": "ZEC",
    "Malachi": "MAL",
    # Protocanónico NT
    "Matthew": "MAT", "Matt": "MAT", "Mark": "MRK", "Luke": "LUK", "John": "JHN",
    "Acts": "ACT", "Romans": "ROM", "1Corinthians": "1CO", "2Corinthians": "2CO",
    "Galatians": "GAL", "Ephesians": "EPH", "Philippians": "PHP", "Colossians": "COL",
    "1Thessalonians": "1TH", "2Thessalonians": "2TH", "1Timothy": "1TI", "2Timothy": "2TI",
    "Titus": "TIT", "Philemon": "PHM", "Hebrews": "HEB", "James": "JAS",
    "1Peter": "1PE", "2Peter": "2PE", "1John": "1JN", "2John": "2JN", "3John": "3JN",
    "Jude": "JUD", "Revelation": "REV", "Apocalypse": "REV",
    # Deuterocanónico (já carregado em en-kjv)
    "Tobit": "TOB", "Judith": "JDT", "Wisdom": "WIS", "Sirach": "SIR",
    "Ecclesiasticus": "SIR", "Baruch": "BAR", "1Maccabees": "1MA", "1Maccabbees": "1MA",
    "2Maccabees": "2MA", "2Maccabbees": "2MA", "1Esdras": "1ES", "2Esdras": "2ES",
    "Susanna": "SUS",
}

# Livros que exigem dígito ordinal para desambiguar — sem ele, a citação
# é ignorada (não adivinhamos 1 vs 2).
REQUIRES_DIGIT = {
    "Corinthians", "Timothy", "Peter", "Thessalonians", "Kings", "Samuel",
    "Chronicles", "Maccabees", "Maccabbees", "Esdras",
}

CITATION_RE = re.compile(
    r"(?:([123])\s*)?([A-Z][a-zA-Z]+)\.?\s*(\d{1,3})[:.](\d{1,3})(?:-\d{1,3})?"
)


def extract_citations_from_text(text: str) -> list[tuple[str, int, int]]:
    text = text.replace("\xa0", " ")
    results = []
    for m in CITATION_RE.finditer(text):
        digit, book_name, ch, v = m.groups()
        if book_name in REQUIRES_DIGIT and not digit:
            continue
        key = (digit or "") + book_name
        code = BOOK_NAME_MAP.get(key)
        if not code:
            continue
        try:
            chapter, verse = int(ch), int(v)
        except ValueError:
            continue
        if chapter < 1 or verse < 1:
            continue
        results.append((code, chapter, verse))
    return results


def load_valid_verses(client) -> set[tuple[str, int, int]]:
    """Carrega (book, chapter, verse) válidos a partir de en-kjv (cobre
    proto + deuterocanónicos) para validar candidatos a citação."""
    valid = set()
    offset = 0
    page = 1000
    while True:
        r = (client.table("verses")
             .select("book,chapter,verse")
             .eq("version_id", "en-kjv")
             .range(offset, offset + page - 1)
             .execute())
        if not r.data:
            break
        for row in r.data:
            valid.add((row["book"], row["chapter"], row["verse"]))
        offset += page
        if len(r.data) < page:
            break
    return valid


def fetch_all_citations(output_dir: str = "output/citations"):
    from supabase import create_client

    client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))

    log.info("A carregar versículos válidos (en-kjv) para validação...")
    valid_verses = load_valid_verses(client)
    log.info(f"  {len(valid_verses)} versículos válidos carregados.")

    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    citations = []
    seen_pairs = set()
    offset = 0
    page = 1000
    total_sections = 0
    invalid_count = 0

    while True:
        r = (client.table("patristic_sections")
             .select("id,text")
             .range(offset, offset + page - 1)
             .execute())
        if not r.data:
            break
        for row in r.data:
            total_sections += 1
            candidates = extract_citations_from_text(row["text"])
            for code, chapter, verse in candidates:
                if (code, chapter, verse) not in valid_verses:
                    invalid_count += 1
                    continue
                key = (row["id"], code, chapter, verse)
                if key in seen_pairs:
                    continue
                seen_pairs.add(key)
                citations.append({
                    "section_id": row["id"], "book": code,
                    "chapter": chapter, "verse": verse,
                })
        offset += page
        if total_sections % 10000 < page:
            log.info(f"  ... {total_sections} secções processadas, {len(citations)} citações até agora")
        if len(r.data) < page:
            break

    log.info(f"Concluído: {total_sections} secções, {len(citations)} citações válidas "
              f"({invalid_count} candidatos descartados por não corresponderem a versículos reais).")

    out_file = out / "patristic_citations.json"
    out_file.write_text(json.dumps(citations, ensure_ascii=False), encoding="utf-8")
    log.info(f"Guardado em {out_file}")
    return citations


if __name__ == "__main__":
    fetch_all_citations()
