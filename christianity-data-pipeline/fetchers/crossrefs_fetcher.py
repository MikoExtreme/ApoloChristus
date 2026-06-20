"""
Fetcher de referências cruzadas via OpenBible.info (CC-BY).

Fonte: https://a.openbible.info/data/cross-references.zip — um único
ficheiro TSV com ~345 mil linhas (From Verse, To Verse, Votes), votado
pela comunidade. Filtramos por votes >= 3 para qualidade (~212 mil
entradas), conforme já estava decidido no PLAN.md.

Notas de formato (verificadas contra o ficheiro real):
  - Livros usam abreviaturas tipo OSIS (ex: "Gen", "1Cor", "Song") — mapa
    de tradução para os nossos códigos USFM em BOOK_CODE_MAP.
  - "From Verse" é sempre uma referência única (nunca um intervalo).
  - "To Verse" pode ser um intervalo (ex: "John.1.1-John.1.3", ~26% das
    linhas) — usamos sempre o primeiro versículo do intervalo como alvo,
    para manter o schema simples (target_book/target_ch/target_v únicos).
  - Só cobre o cânone protocanónico (66 livros) — sem deuterocanónicos.
"""

import io
import json
import logging
import zipfile
from pathlib import Path

import requests

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

ZIP_URL = "https://a.openbible.info/data/cross-references.zip"
MIN_VOTES = 3

# Mapa: abreviatura OpenBible (estilo OSIS) -> código canónico USFM usado
# nas tabelas verses/cross_references deste projeto.
BOOK_CODE_MAP = {
    "Gen": "GEN", "Exod": "EXO", "Lev": "LEV", "Num": "NUM", "Deut": "DEU",
    "Josh": "JOS", "Judg": "JDG", "Ruth": "RUT", "1Sam": "1SA", "2Sam": "2SA",
    "1Kgs": "1KI", "2Kgs": "2KI", "1Chr": "1CH", "2Chr": "2CH", "Ezra": "EZR",
    "Neh": "NEH", "Esth": "EST", "Job": "JOB", "Ps": "PSA", "Prov": "PRO",
    "Eccl": "ECC", "Song": "SNG", "Isa": "ISA", "Jer": "JER", "Lam": "LAM",
    "Ezek": "EZK", "Dan": "DAN", "Hos": "HOS", "Joel": "JOL", "Amos": "AMO",
    "Obad": "OBA", "Jonah": "JON", "Mic": "MIC", "Nah": "NAM", "Hab": "HAB",
    "Zeph": "ZEP", "Hag": "HAG", "Zech": "ZEC", "Mal": "MAL",
    "Matt": "MAT", "Mark": "MRK", "Luke": "LUK", "John": "JHN", "Acts": "ACT",
    "Rom": "ROM", "1Cor": "1CO", "2Cor": "2CO", "Gal": "GAL", "Eph": "EPH",
    "Phil": "PHP", "Col": "COL", "1Thess": "1TH", "2Thess": "2TH",
    "1Tim": "1TI", "2Tim": "2TI", "Titus": "TIT", "Phlm": "PHM", "Heb": "HEB",
    "Jas": "JAS", "1Pet": "1PE", "2Pet": "2PE", "1John": "1JN", "2John": "2JN",
    "3John": "3JN", "Jude": "JUD", "Rev": "REV",
}


def parse_ref(ref: str) -> tuple[str, int, int] | None:
    """'Gen.1.1' -> ('GEN', 1, 1). Para intervalos, usa o primeiro extremo."""
    first = ref.split("-")[0]
    parts = first.rsplit(".", 2)
    if len(parts) != 3:
        return None
    book_raw, ch, v = parts
    book = BOOK_CODE_MAP.get(book_raw)
    if not book:
        return None
    try:
        return book, int(ch), int(v)
    except ValueError:
        return None


def download_and_parse(min_votes: int = MIN_VOTES) -> list[dict]:
    log.info(f"A descarregar {ZIP_URL} ...")
    r = requests.get(ZIP_URL, timeout=60)
    r.raise_for_status()

    with zipfile.ZipFile(io.BytesIO(r.content)) as zf:
        name = next(n for n in zf.namelist() if n.endswith(".txt"))
        raw = zf.read(name).decode("utf-8")

    lines = raw.splitlines()
    log.info(f"Ficheiro tem {len(lines) - 1} linhas (sem cabeçalho).")

    refs = []
    skipped_unparseable = 0
    skipped_low_votes = 0
    for line in lines[1:]:
        parts = line.split("\t")
        if len(parts) < 3:
            continue
        from_raw, to_raw, votes_raw = parts[0], parts[1], parts[2]
        try:
            votes = int(votes_raw)
        except ValueError:
            continue
        if votes < min_votes:
            skipped_low_votes += 1
            continue

        src = parse_ref(from_raw)
        tgt = parse_ref(to_raw)
        if not src or not tgt:
            skipped_unparseable += 1
            continue

        refs.append({
            "source_book": src[0], "source_ch": src[1], "source_v": src[2],
            "target_book": tgt[0], "target_ch": tgt[1], "target_v": tgt[2],
            "votes": votes,
        })

    log.info(f"Filtradas: {skipped_low_votes} com votes<{min_votes}, "
              f"{skipped_unparseable} não interpretáveis.")
    log.info(f"Resultado: {len(refs)} referências cruzadas.")
    return refs


def fetch_all_crossrefs(output_dir: str = "output/crossrefs", min_votes: int = MIN_VOTES):
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    refs = download_and_parse(min_votes)

    out_file = out / "cross_references.json"
    out_file.write_text(json.dumps(refs, ensure_ascii=False), encoding="utf-8")
    log.info(f"Guardado em {out_file} ({len(refs)} referências).")
    return refs


if __name__ == "__main__":
    fetch_all_crossrefs()
