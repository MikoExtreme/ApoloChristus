#!/usr/bin/env python3
"""
Fetch and load into Supabase:
  - Westminster Confession of Faith (1647) from opc.org  → council 'westminster'
  - Vatican I (1869-70) canons from papalencyclicals.net → council 'vatican_i'

Run:
  python fetchers/westminster_vatican_fetcher.py
"""
import os, re, sys, time
import httpx
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv()
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
HEADERS_SB = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates",
}
HEADERS_HTTP = {
    "User-Agent": "ApoloChristus-research/1.0 (academic; contact mitosesmeioses123@gmail.com)"
}


# ── Supabase helpers ────────────────────────────────────────────────────────

def sb_upsert(table: str, rows: list[dict]) -> None:
    if not rows:
        return
    r = httpx.post(f"{SUPABASE_URL}/rest/v1/{table}", headers=HEADERS_SB, json=rows, timeout=60)
    if r.status_code not in (200, 201):
        print(f"  ERROR upsert {table}: {r.status_code} {r.text[:300]}")
        sys.exit(1)

def sb_delete_canons(council_id: str) -> None:
    r = httpx.delete(
        f"{SUPABASE_URL}/rest/v1/council_canons?council_id=eq.{council_id}&language=eq.en",
        headers=HEADERS_SB, timeout=30,
    )
    if r.status_code not in (200, 204):
        print(f"  WARN delete {council_id}: {r.status_code}")


# ── Westminster Confession (opc.org) ────────────────────────────────────────

WCF_URL = "https://opc.org/wcf.html"

def parse_westminster() -> list[dict]:
    print("  Fetching Westminster Confession from opc.org...")
    r = httpx.get(WCF_URL, headers=HEADERS_HTTP, timeout=20, follow_redirects=True)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")

    canons: list[dict] = []
    canon_num = 0
    chapters = soup.find_all("h3")

    for ch_idx, ch_tag in enumerate(chapters, start=1):
        raw = ch_tag.get_text(strip=True)
        # e.g. "CHAPTER 1Of the Holy Scripture" → "Of the Holy Scripture"
        ch_title = re.sub(r"^CHAPTER\s+\d+\s*", "", raw, flags=re.I).strip()

        # Gather numbered sections from siblings until next h3
        for sib in ch_tag.next_siblings:
            if hasattr(sib, "name") and sib.name == "h3":
                break
            if not hasattr(sib, "get_text"):
                continue
            text = sib.get_text(strip=True)
            m = re.match(r"^(\d+)\.\s+(.+)", text, re.S)
            if not m:
                continue
            sec_num = int(m.group(1))
            sec_text = m.group(2).strip()
            canon_num += 1
            canons.append({
                "canon_num": canon_num,
                "title": f"Chapter {ch_idx}: {ch_title} (Section {sec_num})",
                "text": sec_text,
                "notes": None,
            })

    print(f"  Parsed {len(canons)} sections from 33 chapters")
    return canons


# ── Vatican I (papalencyclicals.net) ───────────────────────────────────────

VATICAN_URL = "https://www.papalencyclicals.net/councils/ecum20.htm"

def parse_vatican_i() -> list[dict]:
    print("  Fetching Vatican I from papalencyclicals.net...")
    r = httpx.get(VATICAN_URL, headers=HEADERS_HTTP, timeout=20, follow_redirects=True)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")

    canons: list[dict] = []
    canon_num = 0

    # ---- Session 3 canons (Dei Filius) — stored in <li> tags ---------------
    # The 18 canons are split into 4 topic groups (sizes: 5, 4, 6, 3).
    DEI_FILIUS_TOPICS = [
        ("On God the creator of all things", 5),
        ("On revelation", 4),
        ("On faith", 6),
        ("On faith and reason", 3),
    ]
    dei_canons_raw: list[str] = []

    for el in soup.find_all("li"):
        text = el.get_text(strip=True)
        if not re.match(r"^\d+\.\s+If anyone", text, re.I):
            continue
        # Append sibling 'let him be anathema' if separate
        if "anathema" not in text.lower():
            nxt = el.find_next_sibling("p")
            if nxt and "anathema" in nxt.get_text().lower():
                text += " " + nxt.get_text(strip=True)
        text = re.sub(r"([a-z])([A-Z])", r"\1 \2", text)
        text = re.sub(r"\s+", " ", text).strip()
        dei_canons_raw.append(text)

    pos = 0
    for topic_label, count in DEI_FILIUS_TOPICS:
        for _ in range(count):
            if pos >= len(dei_canons_raw):
                break
            canon_num += 1
            canons.append({
                "canon_num": canon_num,
                "title": f"Session III (Dei Filius) – {topic_label}",
                "text": dei_canons_raw[pos],
                "notes": None,
            })
            pos += 1

    # ---- Session 4 canons (Pastor Aeternus) — hardcoded ----------------------
    # Each chapter ends with one canon. These are hardcoded to avoid HTML
    # parsing ambiguity; the text is taken verbatim from the source.
    pa_canons = [
        (
            "Session IV (Pastor Aeternus) – Chapter 1: On the institution of the apostolic primacy in blessed Peter",
            "If anyone says that blessed Peter the apostle was not appointed by Christ the Lord as prince of all the apostles and visible head of the whole church militant; or that it was a primacy of honour only and not one of true and proper jurisdiction that he directly and immediately received from our Lord Jesus Christ himself: let him be anathema.",
        ),
        (
            "Session IV (Pastor Aeternus) – Chapter 2: On the permanence of the primacy of blessed Peter in the Roman pontiffs",
            "If anyone says that it is not by the institution of Christ the Lord himself (that is to say, by divine law) that blessed Peter should have perpetual successors in the primacy over the whole church; or that the Roman pontiff is not the successor of blessed Peter in this primacy: let him be anathema.",
        ),
        (
            "Session IV (Pastor Aeternus) – Chapter 3: On the power and character of the primacy of the Roman pontiff",
            "If anyone says that the Roman pontiff has merely an office of supervision and guidance, and not the full and supreme power of jurisdiction over the whole church, and this not only in matters of faith and morals, but also in those which concern the discipline and government of the church dispersed throughout the whole world; or that he has only the principal part, but not the absolute fullness, of this supreme power; or that this power of his is not ordinary and immediate both over all and each of the churches and over all and each of the pastors and faithful: let him be anathema.",
        ),
        (
            "Session IV (Pastor Aeternus) – Chapter 4: On the infallible teaching authority of the Roman pontiff",
            "Should anyone, which God forbid, have the temerity to reject this definition of ours: let him be anathema.",
        ),
    ]
    for title_str, canon_text in pa_canons:
        canon_num += 1
        canons.append({"canon_num": canon_num, "title": title_str, "text": canon_text, "notes": None})

    print(f"  Parsed {len(canons)} canons from Vatican I")
    return canons


# ── Council metadata ────────────────────────────────────────────────────────

COUNCIL_ROWS = [
    {
        "id": "westminster",
        "name": "Westminster Assembly",
        "name_pt": "Assembleia de Westminster",
        "year": "1643",
        "year_end": "1649",
        "location": "Westminster, London",
        "tradition": "reformed",
        "type": "synod",
        "source_url": WCF_URL,
        "license": "public_domain",
        "description": (
            "The Westminster Assembly (1643–1649) was a synod of theologians "
            "that produced the Westminster Standards — the Westminster Confession "
            "of Faith and the Shorter and Larger Catechisms — which became the "
            "doctrinal standards of many Reformed and Presbyterian churches."
        ),
    },
    {
        "id": "vatican_i",
        "name": "First Vatican Council",
        "name_pt": "Primeiro Concílio do Vaticano",
        "year": "1869",
        "year_end": "1870",
        "location": "Vatican City",
        "tradition": "catholic",
        "type": "ecumenical",
        "source_url": VATICAN_URL,
        "license": "public_domain",
        "description": (
            "Vatican I (1869–1870) defined the dogma of papal infallibility "
            "(Pastor Aeternus) and promulgated the constitution Dei Filius "
            "on faith and reason. It was suspended due to the fall of Rome "
            "to Italian forces and was never formally closed."
        ),
    },
]


# ── Main ────────────────────────────────────────────────────────────────────

def load_council(council_id: str, meta: dict, canons: list[dict]) -> None:
    print(f"\n--- Loading [{council_id}] ---")
    if not canons:
        print("  No canons parsed — skipping insert.")
        return

    # Upsert council metadata
    sb_upsert("councils", [meta])
    print(f"  Council metadata upserted.")

    # Replace EN canons
    sb_delete_canons(council_id)

    rows = [
        {
            "council_id": council_id,
            "canon_num": c["canon_num"],
            "language": "en",
            "title": c["title"],
            "text": c["text"],
            "notes": c.get("notes"),
        }
        for c in canons
    ]
    for start in range(0, len(rows), 100):
        sb_upsert("council_canons", rows[start:start+100])
        time.sleep(0.05)

    print(f"  Inserted {len(rows)} EN canons.")


def main() -> None:
    # Westminster
    wcf_canons = parse_westminster()
    load_council("westminster", COUNCIL_ROWS[0], wcf_canons)

    # Vatican I
    vat_canons = parse_vatican_i()
    load_council("vatican_i", COUNCIL_ROWS[1], vat_canons)

    print("\nDone.")


if __name__ == "__main__":
    main()
