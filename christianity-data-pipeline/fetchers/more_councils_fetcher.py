#!/usr/bin/env python3
"""
Load additional councils with public-domain canon texts:
  - Lateran I  (1123) from sourcebooks.fordham.edu  [Schroeder 1937 / public domain]
  - Lateran II (1139) from sourcebooks.fordham.edu
  - Lateran IV (1215) from sourcebooks.fordham.edu
  - Council of Trent (1545-63) from history.hanover.edu [Waterworth 1848, PD]
  - Synod of Dort (1618-19) from threeforms.org        [URCNA, public domain]

Run: python fetchers/more_councils_fetcher.py
Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
"""
import os, re, sys, time
import httpx
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv()
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

HEADERS_HTTP = {
    "User-Agent": "ApoloChristus-research/1.0 (academic; contact mitosesmeioses123@gmail.com)"
}

# ─── Supabase helpers ───────────────────────────────────────────────────────

def sb_upsert(table: str, rows: list[dict]) -> None:
    if not rows:
        return
    r = httpx.post(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates",
        },
        json=rows,
        timeout=30,
    )
    if r.status_code not in (200, 201):
        print(f"  ERROR {table}: {r.status_code} {r.text[:300]}")
        sys.exit(1)


def sb_delete_canons(council_id: str) -> None:
    r = httpx.delete(
        f"{SUPABASE_URL}/rest/v1/council_canons?council_id=eq.{council_id}",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
        },
        timeout=30,
    )
    if r.status_code not in (200, 204):
        print(f"  WARN delete canons {council_id}: {r.status_code}")


# ─── Council metadata ────────────────────────────────────────────────────────

COUNCILS_META = [
    {
        "id": "lateran_i",
        "name": "First Lateran Council",
        "name_pt": "Primeiro Concílio de Latrão",
        "year": 1123,
        "year_end": None,
        "location": "Rome",
        "tradition": "catholic",
        "type": "ecumenical",
        "description": (
            "First council held in the Lateran Palace, called by Calixtus II. "
            "Confirmed the Concordat of Worms (1122), ending the Investiture Controversy "
            "between popes and Holy Roman Emperors."
        ),
        "source_url": "https://sourcebooks.fordham.edu/basis/lateran1.asp",
        "license": "public_domain",
    },
    {
        "id": "lateran_ii",
        "name": "Second Lateran Council",
        "name_pt": "Segundo Concílio de Latrão",
        "year": 1139,
        "year_end": None,
        "location": "Rome",
        "tradition": "catholic",
        "type": "ecumenical",
        "description": (
            "Called by Innocent II, it ended the schism caused by Antipope Anacletus II, "
            "declared his ordinations invalid, and issued 30 disciplinary canons."
        ),
        "source_url": "https://sourcebooks.fordham.edu/basis/lateran2.asp",
        "license": "public_domain",
    },
    {
        "id": "lateran_iv",
        "name": "Fourth Lateran Council",
        "name_pt": "Quarto Concílio de Latrão",
        "year": 1215,
        "year_end": None,
        "location": "Rome",
        "tradition": "catholic",
        "type": "ecumenical",
        "description": (
            "Called by Innocent III, the most important medieval church council. "
            "Defined transubstantiation, mandated annual confession and communion, "
            "regulated Jewish and Muslim life in Christendom, and organized the Fifth Crusade."
        ),
        "source_url": "https://sourcebooks.fordham.edu/basis/lateran4.asp",
        "license": "public_domain",
    },
    {
        "id": "trent",
        "name": "Council of Trent",
        "name_pt": "Concílio de Trento",
        "year": 1545,
        "year_end": 1563,
        "location": "Trent (Trento), Italy",
        "tradition": "catholic",
        "type": "ecumenical",
        "description": (
            "The 19th ecumenical council, a central event of the Counter-Reformation. "
            "Over 25 sessions it defined Catholic doctrine on Scripture, original sin, "
            "justification, the sacraments, and issued comprehensive disciplinary reforms."
        ),
        "source_url": "https://history.hanover.edu/texts/trent.html",
        "license": "public_domain",
    },
    {
        "id": "dort",
        "name": "Synod of Dort",
        "name_pt": "Sínodo de Dort",
        "year": 1618,
        "year_end": 1619,
        "location": "Dordrecht, Netherlands",
        "tradition": "reformed",
        "type": "synod",
        "description": (
            "International Reformed synod that condemned Arminianism and produced the "
            "Canons of Dort, summarising Calvinist soteriology in five points: "
            "Total depravity, Unconditional election, Limited atonement, Irresistible grace, "
            "and Perseverance of the saints (TULIP)."
        ),
        "source_url": "https://threeforms.org/canons-of-dort/",
        "license": "public_domain",
    },
]


# ─── Fordham Lateran parser ──────────────────────────────────────────────────

def parse_lateran(url: str) -> list[tuple[int, str | None, str]]:
    """Return list of (canon_num, title, text)."""
    r = httpx.get(url, headers=HEADERS_HTTP, timeout=20, follow_redirects=True)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")

    canons: list[tuple[int, str | None, str]] = []
    current_num: int | None = None
    summary_parts: list[str] = []
    text_parts: list[str] = []
    in_text = False

    def flush():
        if current_num is None:
            return
        title = " ".join(summary_parts).strip() or None
        body = " ".join(text_parts).strip()
        if body:
            canons.append((current_num, title, body))

    def try_canon_header(el) -> bool:
        """Return True if el is a canon header and sets current_num."""
        nonlocal current_num, summary_parts, text_parts, in_text
        text_raw = el.get_text(strip=True)
        m = re.match(r"^CANON\s+(\d+|[IVX]+)\s*$", text_raw, re.I)
        if not m:
            return False
        flush()
        raw = m.group(1)
        current_num = _roman_to_int(raw) if re.match(r"^[IVX]+$", raw) else int(raw)
        summary_parts = []
        text_parts = []
        in_text = False
        return True

    # Walk all block-level elements in document order: <p> and <span class="H_Subitle">
    for el in soup.find_all(["p", "span"]):
        cls = el.get("class", [])
        is_subitle = "H_Subitle" in cls or "H_subitle" in cls or "h_subitle" in cls

        if is_subitle:
            if try_canon_header(el):
                continue

        if current_num is None or is_subitle:
            continue

        # Only process <p> tags for body content
        if el.name != "p":
            continue

        raw_text = el.get_text(" ", strip=True)
        raw_text = re.sub(r"\s+", " ", raw_text).strip()
        if not raw_text:
            continue

        # Summary line (Lateran I/II format)
        if re.match(r"(Summary|Summ\.)[.\s]", raw_text, re.I):
            cleaned = re.sub(r"^(Summary|Summ\.)[.\s]*", "", raw_text, flags=re.I).strip()
            summary_parts.append(cleaned)
            in_text = False
            continue

        # Text. or Text: prefix starts the body (Lateran I/II use "Text.", Lateran IV uses "Text:")
        if re.match(r"^Text[.:]\s*", raw_text, re.I):
            cleaned = re.sub(r"^Text[.:]\s*", "", raw_text, flags=re.I).strip()
            text_parts.append(cleaned)
            in_text = True
            continue

        if in_text:
            text_parts.append(raw_text)

    flush()
    return canons


def _roman_to_int(s: str) -> int:
    vals = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}
    s = s.upper()
    total = 0
    for i, c in enumerate(s):
        v = vals.get(c, 0)
        nxt = vals.get(s[i + 1], 0) if i + 1 < len(s) else 0
        total += v if v >= nxt else -v
    return total


# ─── Trent parser (Waterworth 1848) ─────────────────────────────────────────

def parse_trent() -> list[tuple[int, str | None, str]]:
    """Return list of (global_canon_num, title, text)."""
    r = httpx.get(
        "https://history.hanover.edu/texts/trent/trentall.html",
        headers=HEADERS_HTTP,
        timeout=60,
        follow_redirects=True,
    )
    r.raise_for_status()
    # Page is old-school HTML with <BR>, <P>, <CENTER> etc.
    soup = BeautifulSoup(r.text, "html.parser")
    # Get clean text with paragraph breaks
    text = soup.get_text("\n", strip=True)

    canons: list[tuple[int, str | None, str]] = []
    global_num = 0
    current_session = ""
    current_topic = ""

    lines = [l.strip() for l in text.split("\n") if l.strip()]

    # Detect session and topic context
    i = 0
    while i < len(lines):
        ln = lines[i]

        # Strip page markers like [Page 45]
        ln = re.sub(r"\[Page\s*\d+\]", "", ln).strip()
        if not ln:
            i += 1
            continue

        # Session header: "SESSION THE SIXTH" or "THE SIXTH SESSION"
        if re.match(r"SESSION\s+THE\s+", ln, re.I) or re.match(r"THE\s+\w+\s+SESSION", ln, re.I):
            current_session = ln
            i += 1
            continue

        # Topic header (all-caps, short line, e.g. "ON JUSTIFICATION")
        if (
            re.match(r"^ON\s+[A-Z\s]+$", ln)
            and len(ln) < 60
            and not re.match(r"CANON", ln, re.I)
        ):
            current_topic = ln.title()
            i += 1
            continue

        # Canon line: "CANON I.-text..." or "CANON I. text..."
        m = re.match(r"^CANON\s+([IVX]+)\s*[.\-]+\s*(.*)", ln, re.I)
        if m:
            global_num += 1
            body_parts = [m.group(2).strip()]
            # Collect continuation lines until next CANON or section header
            j = i + 1
            while j < len(lines):
                nx = re.sub(r"\[Page\s*\d+\]", "", lines[j]).strip()
                if not nx:
                    j += 1
                    continue
                if re.match(r"^CANON\s+[IVX]+", nx, re.I):
                    break
                if re.match(r"SESSION\s+THE\s+", nx, re.I):
                    break
                if re.match(r"^DECREE\b", nx, re.I):
                    break
                body_parts.append(nx)
                j += 1
            i = j

            body = " ".join(body_parts).strip()
            body = re.sub(r"\s{2,}", " ", body)

            # Build title from session/topic context
            parts = []
            if current_session:
                parts.append(current_session.title())
            if current_topic:
                parts.append(current_topic)
            title = " — ".join(parts) if parts else None

            canons.append((global_num, title, body))
            continue

        i += 1

    return canons


# ─── Dort parser (threeforms.org/URCNA) ─────────────────────────────────────

def parse_dort() -> list[tuple[int, str | None, str]]:
    """Return list of (global_num, title, text)."""
    r = httpx.get(
        "https://threeforms.org/canons-of-dort/",
        headers=HEADERS_HTTP,
        timeout=20,
        follow_redirects=True,
    )
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")
    text = soup.get_text("\n", strip=True)

    lines = [l.strip() for l in text.split("\n") if l.strip()]

    JUNK = {"Canons of Dort", "URCNA", "Toggle navigation", "Search",
            "Apostles’ Creed", "Nicene Creed", "Athanasian Creed",
            "Belgic Confession", "Heidelberg Catechism"}

    canons: list[tuple[int, str | None, str]] = []
    global_num = 0
    current_head = ""
    current_section = "Articles"

    def is_next_marker(ln: str) -> bool:
        if re.match(r"^Article\s+\d+:?\s*$", ln, re.I):
            return True
        if re.match(r"^[IVX]+$", ln) and len(ln) <= 7:
            return True
        if re.match(r"Rejection\s+of\s+(the\s+)?Errors", ln, re.I):
            return True
        if re.match(r"The\s+(First|Second|Third|Fourth|Fifth)\s+Main", ln, re.I):
            return True
        return False

    def build_title(section_label: str | None = None) -> str | None:
        parts = []
        if current_head:
            parts.append(current_head)
        parts.append(current_section)
        if section_label:
            parts.append(section_label)
        return " — ".join(parts) if parts else None

    i = 0
    while i < len(lines):
        ln = lines[i]
        if ln in JUNK:
            i += 1
            continue

        # Head of doctrine
        if re.match(r"The\s+(First|Second|Third|Fourth|Fifth)\s+Main\s+Point\s+of\s+Doctrine", ln, re.I):
            current_head = ln
            current_section = "Articles"
            i += 1
            continue

        # Rejection of Errors block start
        if re.match(r"Rejection\s+of\s+(the\s+)?Errors", ln, re.I):
            current_section = "Rejection of Errors"
            i += 1
            continue

        # Article N: (regular articles)
        m_art = re.match(r"^Article\s+(\d+):?\s*$", ln, re.I)
        if m_art:
            title_parts: list[str] = []
            body_parts: list[str] = []
            j = i + 1
            # Optional short title (next line, < 80 chars, not a marker)
            if j < len(lines) and len(lines[j]) < 80 and not is_next_marker(lines[j]) and lines[j] not in JUNK:
                title_parts.append(lines[j])
                j += 1
            # Body until next marker
            while j < len(lines):
                nx = lines[j]
                if nx in JUNK or is_next_marker(nx):
                    break
                body_parts.append(nx)
                j += 1
            i = j

            body = " ".join(body_parts).strip()
            body = re.sub(r"\s{2,}", " ", body)
            if body:
                global_num += 1
                canons.append((global_num, build_title(title_parts[0] if title_parts else None), body))
            continue

        # Roman numeral marker (Rejection of Errors articles: I, II, III...)
        if current_section == "Rejection of Errors" and re.match(r"^[IVX]+$", ln) and len(ln) <= 7:
            body_parts = []
            j = i + 1
            while j < len(lines):
                nx = lines[j]
                if nx in JUNK or is_next_marker(nx):
                    break
                body_parts.append(nx)
                j += 1
            i = j

            body = " ".join(body_parts).strip()
            body = re.sub(r"\s{2,}", " ", body)
            # Strip "Who teach that..." intro if present — keep raw text
            if body:
                global_num += 1
                canons.append((global_num, build_title(f"Error {ln}"), body))
            continue

        i += 1

    return canons


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    print("=== Inserting council metadata ===")
    sb_upsert("councils", COUNCILS_META)
    print(f"  {len(COUNCILS_META)} councils upserted")

    tasks = [
        ("lateran_i",  "Lateran I",  lambda: parse_lateran("https://sourcebooks.fordham.edu/basis/lateran1.asp")),
        ("lateran_ii", "Lateran II", lambda: parse_lateran("https://sourcebooks.fordham.edu/basis/lateran2.asp")),
        ("lateran_iv", "Lateran IV", lambda: parse_lateran("https://sourcebooks.fordham.edu/basis/lateran4.asp")),
        ("trent",      "Trent",      parse_trent),
        ("dort",       "Dort",       parse_dort),
    ]

    for council_id, label, parser_fn in tasks:
        print(f"\n=== {label} ===")
        try:
            canons = parser_fn()
            print(f"  Parsed {len(canons)} canons")
            if not canons:
                print("  WARNING: 0 canons parsed — skipping insert")
                continue

            sb_delete_canons(council_id)

            rows = [
                {
                    "council_id": council_id,
                    "canon_num": num,
                    "language": "en",
                    "title": title,
                    "text": text,
                }
                for num, title, text in canons
            ]
            # Batch insert in chunks of 200
            for start in range(0, len(rows), 200):
                sb_upsert("council_canons", rows[start : start + 200])
                time.sleep(0.1)

            print(f"  Inserted {len(rows)} rows for {council_id}")

            # Preview first 2
            for num, title, text in canons[:2]:
                print(f"  [{num}] {title or '(no title)'}")
                print(f"       {text[:120]}")

        except Exception as e:
            print(f"  ERROR: {e}")
            import traceback; traceback.print_exc()

    print("\nDone.")


if __name__ == "__main__":
    main()
