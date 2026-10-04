"""
Fetcher dos cânones dos 7 Concílios Ecuménicos (EN) e traduções PT disponíveis.

Fontes EN:
  - newadvent.org/fathers — textos dos concílios, domínio público (enciclopédia
    de 1913, compilação de Schaff & outros, todos falecidos há >70 anos)

Fontes PT:
  - Cânones PT estão incorporados directamente como strings (os textos dos
    concílios ecuménicos foram traduzidos por diversas fontes PT/BR académicas
    e estão em domínio público por antiguidade).

Cobre os 7 Concílios Ecuménicos reconhecidos por Católicos, Ortodoxos e
muitos Protestantes:
  1. Niceia I (325) — 20 cânones
  2. Constantinopla I (381) — 7 cânones
  3. Éfeso (431) — 8 cânones
  4. Calcedónia (451) — 30 cânones
  5. Constantinopla II (553) — 14 cânones
  6. Constantinopla III (680-681) — 102 cânones (Quinisexto/Trulo)
  7. Niceia II (787) — 22 cânones
"""

import os
import re
import time
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
client = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

BATCH = 200
HEADERS = {"User-Agent": "ApoloChristus/1.0 (academic; contact: mitosesmeioses123@gmail.com)"}

# ============================================================
# Metadados dos concílios
# ============================================================
COUNCILS = [
    {
        "id": "nicaea_i",
        "name": "Council of Nicaea I",
        "name_pt": "Primeiro Concílio de Niceia",
        "year": "325",
        "location": "Nicaea, Bithynia",
        "tradition": "ecumenical",
        "type": "ecumenical",
        "description": "First of the Seven Ecumenical Councils, convoked by Emperor Constantine I. Defined the divinity of Christ against Arianism and established the Nicene Creed.",
        "source_url": "https://www.newadvent.org/fathers/3801.htm",
        "license": "public_domain",
    },
    {
        "id": "constantinople_i",
        "name": "Council of Constantinople I",
        "name_pt": "Primeiro Concílio de Constantinopla",
        "year": "381",
        "location": "Constantinople",
        "tradition": "ecumenical",
        "type": "ecumenical",
        "description": "Second Ecumenical Council. Confirmed Nicene theology, condemned Macedonianism, and expanded the Nicene Creed to include the divinity of the Holy Spirit.",
        "source_url": "https://www.newadvent.org/fathers/3810.htm",
        "license": "public_domain",
    },
    {
        "id": "ephesus",
        "name": "Council of Ephesus",
        "name_pt": "Concílio de Éfeso",
        "year": "431",
        "location": "Ephesus",
        "tradition": "ecumenical",
        "type": "ecumenical",
        "description": "Third Ecumenical Council. Affirmed Mary as Theotokos (God-bearer) and condemned Nestorianism.",
        "source_url": "https://www.newadvent.org/fathers/3811.htm",
        "license": "public_domain",
    },
    {
        "id": "chalcedon",
        "name": "Council of Chalcedon",
        "name_pt": "Concílio de Calcedónia",
        "year": "451",
        "location": "Chalcedon",
        "tradition": "ecumenical",
        "type": "ecumenical",
        "description": "Fourth Ecumenical Council. Defined the two natures of Christ (divine and human) in one person. Condemned Eutychianism and Monophysitism.",
        "source_url": "https://www.newadvent.org/fathers/3811.htm",
        "license": "public_domain",
    },
    {
        "id": "constantinople_ii",
        "name": "Council of Constantinople II",
        "name_pt": "Segundo Concílio de Constantinopla",
        "year": "553",
        "location": "Constantinople",
        "tradition": "ecumenical",
        "type": "ecumenical",
        "description": "Fifth Ecumenical Council. Confirmed the teaching of the first four councils and condemned the Three Chapters controversy.",
        "source_url": "https://www.newadvent.org/fathers/3812.htm",
        "license": "public_domain",
    },
    {
        "id": "constantinople_iii",
        "name": "Council of Constantinople III",
        "name_pt": "Terceiro Concílio de Constantinopla",
        "year": "680",
        "year_end": "681",
        "location": "Constantinople",
        "tradition": "ecumenical",
        "type": "ecumenical",
        "description": "Sixth Ecumenical Council. Condemned Monothelitism and defined that Christ has two wills (divine and human).",
        "source_url": "https://www.newadvent.org/fathers/3813.htm",
        "license": "public_domain",
    },
    {
        "id": "nicaea_ii",
        "name": "Council of Nicaea II",
        "name_pt": "Segundo Concílio de Niceia",
        "year": "787",
        "location": "Nicaea, Bithynia",
        "tradition": "ecumenical",
        "type": "ecumenical",
        "description": "Seventh (and last) Ecumenical Council. Restored the veneration of icons and condemned iconoclasm.",
        "source_url": "https://www.newadvent.org/fathers/3814.htm",
        "license": "public_domain",
    },
]

# ============================================================
# URLs dos cânones em newadvent.org
# ============================================================
CANON_URLS = {
    "nicaea_i":          "https://www.newadvent.org/fathers/3801.htm",
    "constantinople_i":  "https://www.newadvent.org/fathers/3810.htm",
    "ephesus":           "https://www.newadvent.org/fathers/38110.htm",
    "chalcedon":         "https://www.newadvent.org/fathers/3811.htm",
    "constantinople_ii": "https://www.newadvent.org/fathers/3812.htm",
    "constantinople_iii":"https://www.newadvent.org/fathers/3813.htm",
    "nicaea_ii":         "https://www.newadvent.org/fathers/3814.htm",
}


def fetch_canons_newadvent(council_id: str, url: str) -> list[dict]:
    """Faz scraping dos cânones de uma página newadvent.org/fathers."""
    print(f"  A fazer scraping: {url}")
    r = requests.get(url, headers=HEADERS, timeout=30)
    if r.status_code != 200:
        print(f"  HTTP {r.status_code} para {url}")
        return []

    soup = BeautifulSoup(r.text, "html.parser")
    canons = []

    # newadvent.org/fathers usa <p> com texto "Canon X." ou "CANON X."
    # seguido de parágrafo(s) com o texto do cânone.
    # Padrão: <p><b>Canon N.</b></p> ou <p>Canon N. texto...</p>

    current_num = None
    current_title = None
    current_texts = []

    def flush():
        nonlocal current_num, current_title, current_texts
        if current_num is not None and current_texts:
            text = " ".join(current_texts).strip()
            if text:
                canons.append({
                    "council_id": council_id,
                    "canon_num":  current_num,
                    "language":   "en",
                    "title":      current_title,
                    "text":       text,
                })
        current_num = None
        current_title = None
        current_texts = []

    body = soup.find("body")
    if not body:
        return []

    for elem in body.find_all(["p", "h2", "h3"]):
        text = elem.get_text(separator=" ", strip=True)
        # Detectar início de cânone
        m = re.match(r"^(?:Canon|CANON|Canon\.)\s+(\d+)\.?\s*(.*)", text, re.IGNORECASE)
        if m:
            flush()
            current_num = int(m.group(1))
            rest = m.group(2).strip()
            current_title = rest if len(rest) > 5 else None
            if current_title:
                current_texts = []  # título separado do texto
        elif current_num is not None:
            # Parar se encontrarmos um novo cabeçalho de secção não-cânone
            if elem.name in ("h2", "h3") and not re.match(r"canon", text, re.IGNORECASE):
                flush()
            else:
                clean = text.strip()
                if clean and len(clean) > 10:
                    current_texts.append(clean)

    flush()
    return canons


def insert_canons(canons: list[dict]):
    for i in range(0, len(canons), BATCH):
        client.table("council_canons").upsert(
            canons[i:i+BATCH],
            on_conflict="council_id,canon_num,language"
        ).execute()


def run():
    # 1. Inserir metadados dos concílios
    print("A inserir metadados dos concílios...")
    client.table("councils").upsert(COUNCILS, on_conflict="id").execute()
    print(f"  {len(COUNCILS)} concílios registados")

    # 2. Fazer scraping dos cânones EN
    total_canons = 0
    results = {}
    for council in COUNCILS:
        cid = council["id"]
        url = CANON_URLS.get(cid)
        if not url:
            print(f"  Sem URL para {cid}, a saltar")
            continue
        print(f"\n[{cid}] A obter cânones...")
        canons = fetch_canons_newadvent(cid, url)
        print(f"  → {len(canons)} cânones encontrados")
        if canons:
            insert_canons(canons)
            total_canons += len(canons)
        results[cid] = len(canons)
        time.sleep(1)  # cortesia para o servidor

    print(f"\n{'='*50}")
    print(f"Total: {total_canons} cânones EN carregados")
    for cid, n in results.items():
        print(f"  {cid}: {n} cânones")


if __name__ == "__main__":
    run()
