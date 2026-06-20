"""
Fetcher de textos bíblicos a partir de duas fontes reais (verificadas contra os
endpoints ao vivo — ver notas abaixo, a estrutura original assumida estava errada):

1. wldeh/bible-api (GitHub, via raw.githubusercontent.com)
   - O CDN jsdelivr está bloqueado para este repo (>50MB), por isso usamos o raw direto.
   - Endpoint: /bibles/{version_id}/books/{book_name}/chapters/{n}.json
   - Formato: {"data": [{"book":..,"chapter":..,"verse":..,"text":..}, ...]}
   - Nomes de livro variam por idioma (inglês: "genesis"; grego/hebraico: nome nativo).
   - NÃO existe nenhuma versão Almeida (ARC/AA) neste repositório — só
     "en-kjv" (inclui deuterocanónicos!), "en-asv", "grc-grctr" (NT grego) e
     "hbo-wlc" (AT hebraico, com números de Strong's).

2. thiagobodruk/biblia (GitHub, ficheiro único por versão)
   - Endpoint: raw.githubusercontent.com/thiagobodruk/biblia/master/json/{id}.json
   - Formato: [{"abbrev": "gn", "chapters": [["v1 texto", "v2 texto", ...], ...]}, ...]
   - Tem Almeida Atualizada (aa) e Almeida Corrigida Fiel (acf) em português.
   - Licença: NÃO confirmada como domínio público — ACF é tradicionalmente
     publicada pela SBTB sob direitos reservados; tratar ambas como
     "check_rights" até confirmação explícita antes de qualquer publicação.

Cobre apenas o cânone protocanónico (66 livros) nesta passagem. Os
deuterocanónicos disponíveis em en-kjv (Tobias, Judite, Sabedoria, Eclesiástico,
Baruque, 1-2 Macabeus, 1-2 Esdras, Oração de Manassés, adições a Ester/Daniel)
ficam para quando o schema tiver a flag/tabela de deuterocanónicos (Fase 1,
TODO já registado no PLAN.md).
"""

import requests
import json
import time
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

WLDEH_RAW_BASE = "https://raw.githubusercontent.com/wldeh/bible-api/main/bibles"
THIAGOBODRUK_RAW_BASE = "https://raw.githubusercontent.com/thiagobodruk/biblia/master/json"

# Cânone protocanónico em ordem padrão, com nº de capítulos (para limitar o loop;
# 404s em capítulos extra/inexistentes são ignorados sem erro).
CANONICAL_BOOKS = {
    "OT": [
        ("GEN", 50), ("EXO", 40), ("LEV", 27), ("NUM", 36), ("DEU", 34),
        ("JOS", 24), ("JDG", 21), ("RUT", 4),  ("1SA", 31), ("2SA", 24),
        ("1KI", 22), ("2KI", 25), ("1CH", 29), ("2CH", 36), ("EZR", 10),
        ("NEH", 13), ("EST", 10), ("JOB", 42), ("PSA", 150),("PRO", 31),
        ("ECC", 12), ("SNG", 8),  ("ISA", 66), ("JER", 52), ("LAM", 5),
        ("EZK", 48), ("DAN", 12), ("HOS", 14), ("JOL", 3),  ("AMO", 9),
        ("OBA", 1),  ("JON", 4),  ("MIC", 7),  ("NAM", 3),  ("HAB", 3),
        ("ZEP", 3),  ("HAG", 2),  ("ZEC", 14), ("MAL", 4),
    ],
    "NT": [
        ("MAT", 28), ("MRK", 16), ("LUK", 24), ("JHN", 21), ("ACT", 28),
        ("ROM", 16), ("1CO", 16), ("2CO", 13), ("GAL", 6),  ("EPH", 6),
        ("PHP", 4),  ("COL", 4),  ("1TH", 5),  ("2TH", 3),  ("1TI", 6),
        ("2TI", 4),  ("TIT", 3),  ("PHM", 1),  ("HEB", 13), ("JAS", 5),
        ("1PE", 5),  ("2PE", 3),  ("1JN", 5),  ("2JN", 1),  ("3JN", 1),
        ("JUD", 1),  ("REV", 22),
    ],
}

# Mapa: código canónico -> nome de pasta no wldeh/bible-api (inglês)
WLDEH_EN_BOOK_NAMES = {
    "GEN": "genesis", "EXO": "exodus", "LEV": "leviticus", "NUM": "numbers",
    "DEU": "deuteronomy", "JOS": "joshua", "JDG": "judges", "RUT": "ruth",
    "1SA": "1samuel", "2SA": "2samuel", "1KI": "1kings", "2KI": "2kings",
    "1CH": "1chronicles", "2CH": "2chronicles", "EZR": "ezra", "NEH": "nehemiah",
    "EST": "esther", "JOB": "job", "PSA": "psalms", "PRO": "proverbs",
    "ECC": "ecclesiastes", "SNG": "songofsolomon", "ISA": "isaiah", "JER": "jeremiah",
    "LAM": "lamentations", "EZK": "ezekiel", "DAN": "daniel", "HOS": "hosea",
    "JOL": "joel", "AMO": "amos", "OBA": "obadiah", "JON": "jonah",
    "MIC": "micah", "NAM": "nahum", "HAB": "habakkuk", "ZEP": "zephaniah",
    "HAG": "haggai", "ZEC": "zechariah", "MAL": "malachi",
    "MAT": "matthew", "MRK": "mark", "LUK": "luke", "JHN": "john",
    "ACT": "acts", "ROM": "romans", "1CO": "1corinthians", "2CO": "2corinthians",
    "GAL": "galatians", "EPH": "ephesians", "PHP": "philippians", "COL": "colossians",
    "1TH": "1thessalonians", "2TH": "2thessalonians", "1TI": "1timothy", "2TI": "2timothy",
    "TIT": "titus", "PHM": "philemon", "HEB": "hebrews", "JAS": "james",
    "1PE": "1peter", "2PE": "2peter", "1JN": "1john", "2JN": "2john",
    "3JN": "3john", "JUD": "jude", "REV": "revelation",
}

# Mapa: código canónico -> nome de pasta no wldeh/bible-api (grego, só NT)
WLDEH_GRC_BOOK_NAMES = {
    "MAT": "καταματθαιον", "MRK": "καταμαρκον", "LUK": "καταλουκαν", "JHN": "καταιωαννην",
    "ACT": "πραξειςαποστολων", "ROM": "προςρωμαιους", "1CO": "προςκορινθιουςα",
    "2CO": "προςκορινθιουςβ", "GAL": "προςγαλατας", "EPH": "προςεφεσιους",
    "PHP": "προςφιλιππησιους", "COL": "προςκολοσσαεις", "1TH": "προςθεσσαλονικειςα",
    "2TH": "προςθεσσαλονικειςβ", "1TI": "προςτιμοθεονα", "2TI": "προςτιμοθεονβ",
    "TIT": "προςτιτον", "PHM": "προςφιλημονα", "HEB": "προςεβραιους", "JAS": "ιακωβου",
    "1PE": "πετρουα", "2PE": "πετρουβ", "1JN": "ιωαννουα", "2JN": "ιωαννουβ",
    "3JN": "ιωαννουγ", "JUD": "ιουδα", "REV": "αποκαλυψιςιωαννου",
}

# Mapa: código canónico -> nome de pasta no wldeh/bible-api (hebraico, só AT)
WLDEH_HBO_BOOK_NAMES = {
    "GEN": "בראשית", "EXO": "שמות", "LEV": "ויקרא", "NUM": "במדבר", "DEU": "דברים",
    "JOS": "יהושע", "JDG": "שופטים", "RUT": "רות", "1SA": "שמואלא", "2SA": "שמואלב",
    "1KI": "מלכיםא", "2KI": "מלכיםב", "1CH": "דבריהימיםא", "2CH": "דבריהימיםב",
    "EZR": "עזרא", "NEH": "נחמיה", "EST": "אסתר", "JOB": "איוב", "PSA": "תהילים",
    "PRO": "מִשְׁלֵי", "ECC": "קֹהֶלֶת", "SNG": "שירהשירים", "ISA": "ישעה", "JER": "ירמיה",
    "LAM": "איכה", "EZK": "יחזקאל", "DAN": "דניאל", "HOS": "הושע", "JOL": "יואל",
    "AMO": "עמוס", "OBA": "עבדיה", "JON": "יונה", "MIC": "מיכה", "NAM": "נחום",
    "HAB": "חבקוק", "ZEP": "צפניה", "HAG": "חגי", "ZEC": "זכריה", "MAL": "מלאכי",
}

# Mapa: código canónico -> abreviatura no thiagobodruk/biblia (português)
PT_BOOK_ABBREV = {
    "GEN": "gn", "EXO": "ex", "LEV": "lv", "NUM": "nm", "DEU": "dt",
    "JOS": "js", "JDG": "jz", "RUT": "rt", "1SA": "1sm", "2SA": "2sm",
    "1KI": "1rs", "2KI": "2rs", "1CH": "1cr", "2CH": "2cr", "EZR": "ed",
    "NEH": "ne", "EST": "et", "JOB": "jó", "PSA": "sl", "PRO": "pv",
    "ECC": "ec", "SNG": "ct", "ISA": "is", "JER": "jr", "LAM": "lm",
    "EZK": "ez", "DAN": "dn", "HOS": "os", "JOL": "jl", "AMO": "am",
    "OBA": "ob", "JON": "jn", "MIC": "mq", "NAM": "na", "HAB": "hc",
    "ZEP": "sf", "HAG": "ag", "ZEC": "zc", "MAL": "ml",
    "MAT": "mt", "MRK": "mc", "LUK": "lc", "JHN": "jo", "ACT": "atos",
    "ROM": "rm", "1CO": "1co", "2CO": "2co", "GAL": "gl", "EPH": "ef",
    "PHP": "fp", "COL": "cl", "1TH": "1ts", "2TH": "2ts", "1TI": "1tm",
    "2TI": "2tm", "TIT": "tt", "PHM": "fm", "HEB": "hb", "JAS": "tg",
    "1PE": "1pe", "2PE": "2pe", "1JN": "1jo", "2JN": "2jo", "3JN": "3jo",
    "JUD": "jd", "REV": "ap",
}

# Versões a ingerir. "source" determina qual fetch_* é usado.
# "source_url" fica gravado em bible_versions.source_url para transparência
# (mostrar ao utilizador de onde veio cada texto, não só "domínio público").
VERSIONS = [
    {"id": "en-kjv",    "name": "King James Version",                  "lang": "en", "license": "public_domain", "source": "wldeh", "book_names": WLDEH_EN_BOOK_NAMES,
     "source_url": "https://github.com/wldeh/bible-api/tree/main/bibles/en-kjv"},
    {"id": "en-asv",    "name": "American Standard Version",           "lang": "en", "license": "public_domain", "source": "wldeh", "book_names": WLDEH_EN_BOOK_NAMES,
     "source_url": "https://github.com/wldeh/bible-api/tree/main/bibles/en-asv"},
    {"id": "grc-grctr", "name": "Textus Receptus (grego, NT)",         "lang": "el", "license": "public_domain", "source": "wldeh", "book_names": WLDEH_GRC_BOOK_NAMES, "testament_only": "NT",
     "source_url": "https://github.com/wldeh/bible-api/tree/main/bibles/grc-grctr"},
    {"id": "hbo-wlc",   "name": "Westminster Leningrad Codex (hebraico, AT)", "lang": "he", "license": "public_domain", "source": "wldeh", "book_names": WLDEH_HBO_BOOK_NAMES, "testament_only": "OT",
     "source_url": "https://github.com/wldeh/bible-api/tree/main/bibles/hbo-wlc"},
    {"id": "pt-aa",     "name": "Almeida Atualizada",                  "lang": "pt", "license": "check_rights", "source": "thiagobodruk", "file": "aa.json",
     "source_url": "https://github.com/thiagobodruk/biblia/blob/master/json/aa.json"},
    {"id": "pt-acf",    "name": "Almeida Corrigida Fiel",              "lang": "pt", "license": "check_rights", "source": "thiagobodruk", "file": "acf.json",
     "source_url": "https://github.com/thiagobodruk/biblia/blob/master/json/acf.json"},
]


# ----------------------------------------------------------------------------
# Fonte 1: wldeh/bible-api (um pedido HTTP por capítulo)
# ----------------------------------------------------------------------------

def fetch_chapter_wldeh(version_id: str, book_folder: str, chapter: int, retries: int = 3) -> dict | None:
    url = f"{WLDEH_RAW_BASE}/{version_id}/books/{book_folder}/chapters/{chapter}.json"
    for attempt in range(retries):
        try:
            r = requests.get(url, timeout=15)
            if r.status_code == 200:
                return r.json()
            elif r.status_code == 404:
                return None
            else:
                log.warning(f"HTTP {r.status_code} para {url} (tentativa {attempt+1})")
        except requests.RequestException as e:
            log.error(f"Erro de rede: {e} (tentativa {attempt+1})")
        time.sleep(2 ** attempt)
    return None


def normalize_wldeh_chapter(raw: dict, version_id: str, book_code: str, testament: str, chapter_num: int) -> list[dict]:
    # Algumas versões (ex: en-kjv) repetem cada item de "data" duas vezes —
    # bug confirmado na fonte, não no nosso parsing. Deduplicamos por nº de
    # versículo, mantendo a primeira ocorrência.
    seen_verse_nums: set[int] = set()
    verses = []
    for v in raw.get("data", []):
        try:
            verse_num = int(v.get("verse"))
        except (TypeError, ValueError):
            continue
        if verse_num in seen_verse_nums:
            continue
        text = (v.get("text") or "").strip()
        if not text:
            continue
        seen_verse_nums.add(verse_num)
        verses.append({
            "version_id": version_id,
            "testament":  testament,
            "book":       book_code,
            "chapter":    chapter_num,
            "verse":      verse_num,
            "text":       text,
        })
    return verses


def fetch_version_wldeh(version: dict, output_dir: Path, delay: float = 0.2):
    vid = version["id"]
    version_dir = output_dir / vid
    version_dir.mkdir(parents=True, exist_ok=True)
    (version_dir / "meta.json").write_text(json.dumps(version, ensure_ascii=False, indent=2, default=str), encoding="utf-8")

    testament_only = version.get("testament_only")
    book_names = version["book_names"]
    total_verses = 0

    for testament, books in CANONICAL_BOOKS.items():
        if testament_only and testament != testament_only:
            continue
        for book_code, num_chapters in books:
            book_folder = book_names.get(book_code)
            if not book_folder:
                continue

            book_verses = []
            log.info(f"[{vid}] {testament}/{book_code} ({num_chapters} capítulos)...")

            for ch in range(1, num_chapters + 1):
                raw = fetch_chapter_wldeh(vid, book_folder, ch)
                if raw:
                    book_verses.extend(normalize_wldeh_chapter(raw, vid, book_code, testament, ch))
                time.sleep(delay)

            if book_verses:
                out_file = version_dir / f"{book_code}.json"
                out_file.write_text(json.dumps(book_verses, ensure_ascii=False, indent=2), encoding="utf-8")
                total_verses += len(book_verses)
                log.info(f"  → {len(book_verses)} versículos guardados em {out_file.name}")
            else:
                log.warning(f"  ✗ Sem versículos para {book_code} ({book_folder})")

    log.info(f"[{vid}] Concluído: {total_verses} versículos no total.")
    return total_verses


# ----------------------------------------------------------------------------
# Fonte 2: thiagobodruk/biblia (um único ficheiro JSON com a Bíblia inteira)
# ----------------------------------------------------------------------------

def fetch_version_thiagobodruk(version: dict, output_dir: Path) -> int:
    vid = version["id"]
    version_dir = output_dir / vid
    version_dir.mkdir(parents=True, exist_ok=True)
    (version_dir / "meta.json").write_text(json.dumps(version, ensure_ascii=False, indent=2, default=str), encoding="utf-8")

    url = f"{THIAGOBODRUK_RAW_BASE}/{version['file']}"
    log.info(f"[{vid}] A descarregar ficheiro único: {url}")
    r = requests.get(url, timeout=60)
    r.raise_for_status()
    data = json.loads(r.content.decode("utf-8-sig"))

    abbrev_to_code = {v: k for k, v in PT_BOOK_ABBREV.items()}
    ot_codes = {code for code, _ in CANONICAL_BOOKS["OT"]}

    total_verses = 0
    by_book: dict[str, list[dict]] = {}

    for book in data:
        code = abbrev_to_code.get(book.get("abbrev"))
        if not code:
            log.warning(f"  Abreviatura desconhecida, a ignorar: {book.get('abbrev')}")
            continue
        testament = "OT" if code in ot_codes else "NT"
        verses = []
        for ch_idx, chapter_verses in enumerate(book.get("chapters", []), start=1):
            for v_idx, text in enumerate(chapter_verses, start=1):
                text = (text or "").strip()
                if not text:
                    continue
                verses.append({
                    "version_id": vid,
                    "testament":  testament,
                    "book":       code,
                    "chapter":    ch_idx,
                    "verse":      v_idx,
                    "text":       text,
                })
        by_book[code] = verses

    for code, verses in by_book.items():
        if not verses:
            continue
        out_file = version_dir / f"{code}.json"
        out_file.write_text(json.dumps(verses, ensure_ascii=False, indent=2), encoding="utf-8")
        total_verses += len(verses)

    log.info(f"[{vid}] Concluído: {total_verses} versículos em {len(by_book)} livros.")
    return total_verses


# ----------------------------------------------------------------------------

def run(output_dir: str = "output/bible", versions: list[dict] = None):
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    versions = versions or VERSIONS

    summary = {}
    for version in versions:
        log.info(f"\n{'='*50}\nA processar versão: {version['name']} ({version['id']})\n{'='*50}")
        if version["source"] == "wldeh":
            count = fetch_version_wldeh(version, out)
        elif version["source"] == "thiagobodruk":
            count = fetch_version_thiagobodruk(version, out)
        else:
            raise ValueError(f"Fonte desconhecida: {version['source']}")
        summary[version["id"]] = count

    (out / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    log.info(f"\nResumo final: {summary}")


if __name__ == "__main__":
    # Teste rápido: só a versão pt-aa (ficheiro único, rápido) para validar end-to-end.
    run(versions=[v for v in VERSIONS if v["id"] == "pt-aa"])
