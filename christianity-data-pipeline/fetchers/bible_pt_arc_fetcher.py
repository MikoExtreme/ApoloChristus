"""
Carrega a Bíblia em português do corpus christos-c/bible-corpus.

Fonte: https://github.com/christos-c/bible-corpus
  - Ficheiro: bibles/Portuguese.xml
  - Distribuidor: Bible Database (bibledatabase.com)
  - Disponibilidade declarada: "free"
  - Texto: Almeida Revista e Corrigida (ARC) — edição de domínio público

O XML usa o formato CES/CESAC com IDs "b.GEN.1.1" (livro.capítulo.versículo).
Alguns códigos de livro diferem dos nossos — ver BOOK_CODE_MAP abaixo.
"""

import os
import xml.etree.ElementTree as ET
import requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
client = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

VERSION_ID   = "pt-arc"
VERSION_NAME = "Almeida Revista e Corrigida"
SOURCE_URL   = "https://github.com/christos-c/bible-corpus"
XML_URL      = "https://raw.githubusercontent.com/christos-c/bible-corpus/master/bibles/Portuguese.xml"

OT_BOOKS = {
    "GEN","EXO","LEV","NUM","DEU","JOS","JDG","RUT","1SA","2SA",
    "1KI","2KI","1CH","2CH","EZR","NEH","EST","JOB","PSA","PRO",
    "ECC","SNG","ISA","JER","LAM","EZK","DAN","HOS","JOL","AMO",
    "OBA","JON","MIC","NAM","HAB","ZEP","HAG","ZEC","MAL",
}

# Corpus usa códigos ligeiramente diferentes dos nossos
BOOK_CODE_MAP = {
    "SON": "SNG",  # Song of Solomon → Song of Songs
    "EZE": "EZK",  # Ezekiel
    "JOE": "JOL",  # Joel
    "NAH": "NAM",  # Nahum
    "MAR": "MRK",  # Mark
    "JOH": "JHN",  # John
    "PHI": "PHP",  # Philippians
    "JAM": "JAS",  # James
    "1JO": "1JN",  # 1 John
    "2JO": "2JN",  # 2 John
    "3JO": "3JN",  # 3 John
}

BATCH = 500


def run():
    # 1. Registar versão
    print(f"A registar versão {VERSION_ID}...")
    client.table("bible_versions").upsert({
        "id":         VERSION_ID,
        "name":       VERSION_NAME,
        "language":   "pt",
        "license":    "public_domain",
        "source_url": SOURCE_URL,
    }).execute()

    # 2. Descarregar XML
    print("A descarregar Portuguese.xml (~1.4MB)...")
    r = requests.get(XML_URL, timeout=120)
    r.raise_for_status()
    root = ET.fromstring(r.text)

    # 3. Parsear versículos
    verses = []
    skipped_books = set()

    for book_div in root.iter("div"):
        if book_div.get("type") != "book":
            continue
        raw_code = book_div.get("id", "").replace("b.", "")
        our_code = BOOK_CODE_MAP.get(raw_code, raw_code)
        testament = "OT" if our_code in OT_BOOKS else "NT"

        for ch_div in book_div:
            if ch_div.get("type") != "chapter":
                continue
            ch_id = ch_div.get("id", "")
            try:
                ch_num = int(ch_id.split(".")[-1])
            except ValueError:
                continue

            for seg in ch_div:
                if seg.get("type") != "verse":
                    continue
                seg_id = seg.get("id", "")
                try:
                    v_num = int(seg_id.split(".")[-1])
                except ValueError:
                    continue
                text = (seg.text or "").strip()
                if not text:
                    continue

                verses.append({
                    "version_id":          VERSION_ID,
                    "testament":           testament,
                    "book":                our_code,
                    "chapter":             ch_num,
                    "verse":               v_num,
                    "text":                text,
                    "is_deuterocanonical": False,
                })

    print(f"Total versículos parseados: {len(verses):,}")

    # 4. Carregar em batches
    print("A carregar para Supabase...")
    loaded = 0
    for i in range(0, len(verses), BATCH):
        batch = verses[i:i + BATCH]
        client.table("verses").upsert(batch, on_conflict="version_id,book,chapter,verse").execute()
        loaded += len(batch)
        if loaded % 5000 == 0 or loaded == len(verses):
            print(f"  {loaded:,}/{len(verses):,} versículos carregados")

    print(f"\nConcluído: {VERSION_ID} ({VERSION_NAME}) — {loaded:,} versículos")


if __name__ == "__main__":
    run()
