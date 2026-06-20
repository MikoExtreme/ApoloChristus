"""
Fetcher do léxico de Strong's (hebraico e grego) via STEPBible-Data
(Tyndale House Cambridge, CC BY 4.0 — requer atribuição, não é domínio
público puro).

Fonte: github.com/STEPBible/STEPBible-Data (o repositório moveu-se de
tyndale/STEPBible-Data para STEPBible/STEPBible-Data — o antigo URL dá
301, foi preciso seguir o redirecionamento para encontrar o novo dono).

Ficheiros usados (pasta Lexicons/):
  - TBESH: Translators Brief lexicon of Extended Strongs for Hebrew
  - TBESG: Translators Brief lexicon of Extended Strongs for Greek

Formato (verificado): TSV com cabeçalho real na linha ~53 (antes disso é
só documentação/notas de licença). Colunas:
  eStrong#  dStrong  uStrong  Word  Transliteration  Morph  Gloss  Meaning

O campo "dStrong" não é só o código — vem com uma descrição textual da
relação (ex: "H0001G =" ou "H0001H = a Part of"), por isso extraímos só
o código com regex em vez de usar a célula inteira.

"Meaning" tem HTML inline (<br>, <i>, <ref='...'>) — limpo para texto
simples antes de guardar.

A língua de cada entrada é derivada do prefixo do campo Morph
(H=hebraico, A=aramaico, G=grego), mais fiável do que assumir pelo
ficheiro de origem (o ficheiro hebraico também contém entradas aramaicas).
"""

import json
import logging
import re
from pathlib import Path

import requests

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

RAW_BASE = "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Lexicons"
FILES = {
    "hebrew": "TBESH%20-%20Translators%20Brief%20lexicon%20of%20Extended%20Strongs%20for%20Hebrew%20-%20STEPBible.org%20CC%20BY.txt",
    "greek":  "TBESG%20-%20Translators%20Brief%20lexicon%20of%20Extended%20Strongs%20for%20Greek%20-%20STEPBible.org%20CC%20BY.txt",
}

STRONG_CODE_RE = re.compile(r"^[HGA]\d+[A-Z]?")
MORPH_LANG_MAP = {"H": "hebrew", "A": "aramaic", "G": "greek", "N": "name", "n": "name"}

HTML_TAG_RE = re.compile(r"<[^>]+>")
BR_RE = re.compile(r"<\s*br\s*/?\s*>", re.IGNORECASE)


def clean_meaning(raw: str) -> str:
    text = BR_RE.sub(" | ", raw)
    text = HTML_TAG_RE.sub("", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:4000]


def parse_lexicon_file(text: str) -> list[dict]:
    lines = text.splitlines()
    entries = []
    for line in lines:
        if not re.match(r"^[HG]\d", line):
            continue
        cols = line.split("\t")
        if len(cols) < 8:
            continue

        e_strong, d_strong_raw, u_strong, word, translit, morph, gloss, meaning = cols[:8]

        d_match = STRONG_CODE_RE.match(d_strong_raw.strip())
        d_strong = d_match.group(0) if d_match else d_strong_raw.strip()

        lang_prefix = morph.split(":")[0].strip() if ":" in morph else morph[:1]
        language = MORPH_LANG_MAP.get(lang_prefix)
        if not language:
            # Sem idioma no Morph (vazio, ou "Prefix"/"Suffix" gramatical
            # sem marca de língua) — usa o prefixo do código Strong como
            # alternativa fiável (H=hebraico, G=grego).
            language = {"H": "hebrew", "G": "greek"}.get(e_strong[:1], "unknown")

        entries.append({
            "e_strong": e_strong.strip(),
            "d_strong": d_strong,
            "u_strong": u_strong.strip(),
            "language": language,
            "word": word.strip(),
            "transliteration": translit.strip(),
            "morph": morph.strip(),
            "gloss": gloss.strip(),
            "definition": clean_meaning(meaning),
        })
    return entries


def fetch_all_lexicon(output_dir: str = "output/lexicon"):
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    all_entries = []
    for lang, filename in FILES.items():
        url = f"{RAW_BASE}/{filename}"
        log.info(f"A descarregar léxico {lang}: {url}")
        r = requests.get(url, timeout=60)
        r.raise_for_status()
        entries = parse_lexicon_file(r.text)
        log.info(f"  {lang}: {len(entries)} entradas")
        all_entries.extend(entries)

    # remove duplicados de d_strong (mantém a primeira ocorrência) —
    # garante UNIQUE(d_strong) no schema sem perder dados (não deviam
    # existir, mas é uma rede de segurança barata)
    seen = set()
    deduped = []
    for e in all_entries:
        if e["d_strong"] in seen:
            continue
        seen.add(e["d_strong"])
        deduped.append(e)

    out_file = out / "lexicon_entries.json"
    out_file.write_text(json.dumps(deduped, ensure_ascii=False), encoding="utf-8")
    log.info(f"Guardado {len(deduped)} entradas (de {len(all_entries)} brutas) em {out_file}")
    return deduped


if __name__ == "__main__":
    fetch_all_lexicon()
