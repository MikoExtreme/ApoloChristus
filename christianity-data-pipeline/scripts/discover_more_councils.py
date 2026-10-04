#!/usr/bin/env python3
"""
Probe public-domain sources for additional council canon texts.
Run: python scripts/discover_more_councils.py
Reports which URLs return 200 and whether they contain "Canon" markers.
"""
import httpx
from bs4 import BeautifulSoup

CANDIDATES = [
    # ---- Lateran Councils (Catholic, NPNF-style on newadvent?) ----
    ("Lateran I (1123)",  "lateran_i_1123", [
        "https://www.newadvent.org/fathers/3821.htm",
        "https://sourcebooks.fordham.edu/basis/lateran1.asp",
    ]),
    ("Lateran II (1139)", "lateran_ii", [
        "https://www.newadvent.org/fathers/3822.htm",
        "https://sourcebooks.fordham.edu/basis/lateran2.asp",
    ]),
    ("Lateran III (1179)","lateran_iii", [
        "https://www.newadvent.org/fathers/3823.htm",
        "https://sourcebooks.fordham.edu/basis/lateran3.asp",
    ]),
    ("Lateran IV (1215)", "lateran_iv", [
        "https://www.newadvent.org/fathers/3824.htm",
        "https://sourcebooks.fordham.edu/basis/lateran4.asp",
        "https://www.papalencyclicals.net/councils/ecum12.htm",
    ]),
    # ---- Later Medieval ----
    ("Lyon I (1245)",     "lyon_i", [
        "https://www.newadvent.org/fathers/3825.htm",
        "https://sourcebooks.fordham.edu/basis/lyon1245.asp",
    ]),
    ("Lyon II (1274)",    "lyon_ii", [
        "https://www.newadvent.org/fathers/3826.htm",
        "https://sourcebooks.fordham.edu/basis/lyon1274.asp",
    ]),
    ("Vienne (1311)",     "vienne", [
        "https://www.newadvent.org/fathers/3827.htm",
        "https://sourcebooks.fordham.edu/basis/vienne.asp",
    ]),
    ("Constance (1414)",  "constance", [
        "https://www.newadvent.org/fathers/3828.htm",
        "https://sourcebooks.fordham.edu/basis/constance.asp",
    ]),
    ("Florence (1438)",   "florence", [
        "https://www.newadvent.org/fathers/3829.htm",
        "https://sourcebooks.fordham.edu/basis/florence-select.asp",
    ]),
    # ---- Council of Trent ----
    ("Trent (1545–63)",  "trent", [
        "https://history.hanover.edu/texts/trent.html",
        "https://history.hanover.edu/texts/trent/trent1.html",
        "https://www.newadvent.org/fathers/3830.htm",
    ]),
    # ---- Vatican I ----
    ("Vatican I (1869)", "vatican_i", [
        "https://www.newadvent.org/fathers/3831.htm",
        "https://www.papalencyclicals.net/councils/ecum20.htm",
        "https://sourcebooks.fordham.edu/mod/1870vatican1.asp",
    ]),
    # ---- Reformed / Protestant ----
    ("Synod of Dort (1618)","dort", [
        "https://www.ccel.org/ccel/dort/canons.html",
        "https://reformed.org/documents/canons_of_dort.html",
    ]),
    ("Westminster (1647)", "westminster", [
        "https://www.reformed.org/documents/wcf_with_proofs/index.html",
        "https://www.ccel.org/ccel/anonymous/westminster_confession.html",
    ]),
]

HEADERS = {"User-Agent": "ApoloChristus-research/1.0 (academic; contact mitosesmeioses123@gmail.com)"}

def probe(council_name: str, council_id: str, urls: list[str]) -> None:
    print(f"\n{'='*60}")
    print(f"  {council_name}  [{council_id}]")
    print(f"{'='*60}")
    for url in urls:
        try:
            r = httpx.get(url, headers=HEADERS, timeout=15, follow_redirects=True)
            if r.status_code != 200:
                print(f"  [{r.status_code}] {url}")
                continue
            soup = BeautifulSoup(r.text, "html.parser")
            text = soup.get_text(" ", strip=True)
            # Count "Canon" occurrences
            import re
            canon_hits = len(re.findall(r'\bCanon\b', text, re.IGNORECASE))
            snippet = text[:300].replace("\n", " ")
            print(f"  [200 OK] {url}")
            print(f"          'Canon' hits: {canon_hits}")
            print(f"          Snippet: {snippet[:200]}")
        except Exception as e:
            print(f"  [ERR]  {url}  -- {e}")

if __name__ == "__main__":
    for name, cid, urls in CANDIDATES:
        probe(name, cid, urls)
    print("\nDone.")
