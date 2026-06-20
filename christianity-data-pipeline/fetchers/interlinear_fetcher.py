"""
Fetcher do texto interlinear (hebraico/grego original, palavra a palavra,
ligado a Strong's) via STEPBible-Data "Translators Amalgamated" files
(Tyndale House Cambridge, CC BY 4.0).

Fontes:
  - TAGNT (2 ficheiros): Novo Testamento grego, Mat-Jhn e Act-Rev
  - TAHOT (4 ficheiros): Antigo Testamento hebraico, Gen-Deu, Jos-Est,
    Job-Sng, Isa-Mal

Estes ficheiros são desenhados para crítica textual (incluem TODAS as
variantes de manuscritos), não só para um interlinear simples — por
isso cada posição de palavra pode ter VÁRIAS linhas (uma por variante
de edição/manuscrito). Mantemos só a leitura mais bem atestada por
posição (a com a flag de edição mais "completa", ex: "NKO" em grego ou
sem marca de variante em hebraico) — suficiente para um interlinear de
leitura, não para um aparato crítico completo.

Formato verificado (cabeçalhos reais encontrados nos ficheiros, não
assumidos):

  Grego (13 colunas nomeadas):
    Word & Type | Greek | English translation | dStrongs = Grammar |
    Dictionary form = Gloss | editions | ...
    ex: "Mat.1.1#01=NKO" | "Βίβλος (Biblos)" | "[The] book" |
        "G0976=N-NSF" | "βίβλος=book" | "NA28+NA27+..."

  Hebraico (11 colunas nomeadas, palavras podem ser compostas
  prefixo+raiz separadas por "/", com múltiplos Strong's):
    Eng (Heb) Ref & Type | Hebrew | Transliteration | Translation |
    dStrongs | Grammar | ...
    ex: "Gen.1.1#01=L" | "בְּ/רֵאשִׁ֖ית" | "be./re.Shit" |
        "in/ beginning" | "H9003/{H7225G}" | "HR/Ncfsa"

Os códigos de livro (Mat, Gen, ...) já coincidem com os códigos USFM
usados no resto do projeto (só é preciso maiusculizar).
"""

import json
import logging
import re
from pathlib import Path

import requests

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

RAW_BASE = "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Translators%20Amalgamated%20OT%2BNT"

GREEK_FILES = [
    "TAGNT%20Mat-Jhn%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20STEPBible.org%20CC-BY.txt",
    "TAGNT%20Act-Rev%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20STEPBible.org%20CC-BY.txt",
]
HEBREW_FILES = [
    "TAHOT%20Gen-Deu%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20STEPBible.org%20CC%20BY.txt",
    "TAHOT%20Jos-Est%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20STEPBible.org%20CC%20BY.txt",
    "TAHOT%20Job-Sng%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20STEPBible.org%20CC%20BY.txt",
    "TAHOT%20Isa-Mal%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20STEPBible.org%20CC%20BY.txt",
]

REF_RE = re.compile(r"^([1-3]?[A-Za-z]+)\.(\d+)\.(\d+)#(\d+)=?(.*)$")


def parse_ref(ref_field: str) -> tuple[str, int, int, int, str] | None:
    """'Mat.1.1#01=NKO' -> (book, chapter, verse, position, variant_flag)."""
    m = REF_RE.match(ref_field.strip())
    if not m:
        return None
    book, ch, v, pos, flag = m.groups()
    return book.upper(), int(ch), int(v), int(pos), flag


def parse_file(text: str, language: str) -> list[dict]:
    lines = text.splitlines()

    # encontra a linha de cabeçalho real (a documentação antes dela tem
    # tamanho variável consoante o ficheiro)
    header_idx = None
    for i, line in enumerate(lines):
        if line.startswith("Word & Type") or line.startswith("Eng (Heb) Ref & Type"):
            header_idx = i
            break
    if header_idx is None:
        log.error("Cabeçalho não encontrado neste ficheiro!")
        return []

    raw_rows = []
    for line in lines[header_idx + 1:]:
        if not line.strip() or line.startswith("#"):
            continue
        cols = line.split("\t")
        if len(cols) < 6:
            continue
        parsed_ref = parse_ref(cols[0])
        if not parsed_ref:
            continue
        book, chapter, verse, position, flag = parsed_ref

        if language == "greek":
            # "dStrongs = Grammar" vem combinado numa só coluna, separado por "="
            word_field, gloss_field, strong_grammar = cols[1], cols[2], cols[3]
            if "=" in strong_grammar:
                strong_part, grammar = strong_grammar.split("=", 1)
            else:
                strong_part, grammar = strong_grammar, ""
        else:
            # hebraico: "dStrongs" e "Grammar" são colunas separadas (4 e 5)
            word_field, translit_field, gloss_field = cols[1], cols[2], cols[3]
            strong_part = cols[4] if len(cols) > 4 else ""
            grammar = cols[5] if len(cols) > 5 else ""

        strong_numbers = [s.strip("{}") for s in re.split(r"[/]", strong_part) if s.strip("{}")]

        if language == "greek":
            gm = re.match(r"^(.*?)\s*\(([^)]*)\)\s*$", word_field)
            original_word = gm.group(1).strip() if gm else word_field.strip()
            transliteration = gm.group(2).strip() if gm else ""
        else:
            original_word = word_field.strip()
            transliteration = translit_field.strip()

        raw_rows.append({
            "book": book, "chapter": chapter, "verse": verse, "position": position,
            "flag": flag, "language": language,
            "original_word": original_word, "transliteration": transliteration,
            "gloss": gloss_field.strip(), "strong_numbers": strong_numbers, "grammar": grammar.strip(),
        })

    # mantém só a leitura mais bem atestada por posição (flag mais longa
    # = mais edições/manuscritos concordam; entre empates, a primeira)
    best_by_key: dict[tuple, dict] = {}
    for row in raw_rows:
        key = (row["book"], row["chapter"], row["verse"], row["position"])
        existing = best_by_key.get(key)
        if existing is None or len(row["flag"]) > len(existing["flag"]):
            best_by_key[key] = row

    return list(best_by_key.values())


def fetch_all_interlinear(output_dir: str = "output/interlinear"):
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    all_words = []
    for filename in GREEK_FILES:
        url = f"{RAW_BASE}/{filename}"
        log.info(f"A descarregar: {url}")
        r = requests.get(url, timeout=120)
        r.raise_for_status()
        words = parse_file(r.text, "greek")
        log.info(f"  {len(words)} palavras")
        all_words.extend(words)

    for filename in HEBREW_FILES:
        url = f"{RAW_BASE}/{filename}"
        log.info(f"A descarregar: {url}")
        r = requests.get(url, timeout=120)
        r.raise_for_status()
        words = parse_file(r.text, "hebrew")
        log.info(f"  {len(words)} palavras")
        all_words.extend(words)

    out_file = out / "interlinear_words.json"
    out_file.write_text(json.dumps(all_words, ensure_ascii=False), encoding="utf-8")
    log.info(f"\nGuardado {len(all_words)} palavras em {out_file}")
    return all_words


if __name__ == "__main__":
    fetch_all_interlinear()
