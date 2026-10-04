#!/usr/bin/env python3
"""
Machine-translate all EN council canons → PT.
Inserts rows with language='pt' and license='machine_translated'.
Skips councils that already have PT canons.

Run: python scripts/translate_council_canons.py [council_id ...]
  council_id  (optional) translate only these councils; default = all
"""
import os, sys, time
import httpx
from dotenv import load_dotenv
import argostranslate.translate

load_dotenv()
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

SB_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates",
}

# ── Supabase helpers ──────────────────────────────────────────────────────────

def sb_get(path: str) -> list[dict]:
    r = httpx.get(f"{SUPABASE_URL}/rest/v1/{path}", headers=SB_HEADERS, timeout=30)
    r.raise_for_status()
    return r.json()

def sb_upsert(table: str, rows: list[dict]) -> None:
    if not rows:
        return
    r = httpx.post(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers=SB_HEADERS,
        json=rows,
        timeout=60,
    )
    if r.status_code not in (200, 201):
        print(f"  ERROR upsert {table}: {r.status_code} {r.text[:200]}")
        sys.exit(1)

def sb_delete_pt(council_id: str) -> None:
    r = httpx.delete(
        f"{SUPABASE_URL}/rest/v1/council_canons"
        f"?council_id=eq.{council_id}&language=eq.pt",
        headers=SB_HEADERS, timeout=30,
    )
    if r.status_code not in (200, 204):
        print(f"  WARN delete PT for {council_id}: {r.status_code}")

# ── Argos translator ──────────────────────────────────────────────────────────

def get_translator():
    langs = argostranslate.translate.get_installed_languages()
    en = next(l for l in langs if l.code == "en")
    pt = next(l for l in langs if l.code == "pt")
    tr = en.get_translation(pt)
    if not tr:
        raise RuntimeError("EN→PT Argos translation not installed")
    return tr

def translate(tr, text: str | None) -> str | None:
    if not text:
        return None
    return tr.translate(text)

# ── Main ─────────────────────────────────────────────────────────────────────

def main(target_councils: list[str] | None = None):
    print("Loading EN->PT Argos translator...")
    tr = get_translator()
    print("Translator ready.")

    # Fetch all councils
    councils = sb_get("councils?select=id,name&order=year")
    if target_councils:
        councils = [c for c in councils if c["id"] in target_councils]

    for council in councils:
        cid = council["id"]
        cname = council["name"]

        # Check if PT canons already exist
        existing_pt = sb_get(
            f"council_canons?council_id=eq.{cid}&language=eq.pt&select=count"
        )
        # PostgREST count trick: use Prefer: count=exact header — easier to just check len
        existing_pt_rows = sb_get(
            f"council_canons?council_id=eq.{cid}&language=eq.pt&select=id"
        )
        if existing_pt_rows:
            print(f"\n[{cid}] Already has {len(existing_pt_rows)} PT canons — skipping.")
            continue

        # Fetch EN canons
        en_canons = sb_get(
            f"council_canons?council_id=eq.{cid}&language=eq.en"
            f"&order=canon_num&select=id,canon_num,title,text,notes"
        )
        if not en_canons:
            print(f"\n[{cid}] No EN canons found — skipping.")
            continue

        print(f"\n[{cid}] {cname} — translating {len(en_canons)} canons…")

        pt_rows: list[dict] = []
        for i, canon in enumerate(en_canons):
            title_pt = translate(tr, canon.get("title"))
            text_pt  = translate(tr, canon.get("text"))
            notes_pt = translate(tr, canon.get("notes"))

            pt_rows.append({
                "council_id": cid,
                "canon_num":  canon["canon_num"],
                "language":   "pt",
                "title":      title_pt,
                "text":       text_pt,
                "notes":      notes_pt,
            })

            if (i + 1) % 10 == 0 or (i + 1) == len(en_canons):
                print(f"  {i+1}/{len(en_canons)}", end="\r", flush=True)

        print()

        # Batch insert in chunks of 100
        sb_delete_pt(cid)
        for start in range(0, len(pt_rows), 100):
            sb_upsert("council_canons", pt_rows[start:start+100])
            time.sleep(0.05)

        print(f"  Inserted {len(pt_rows)} PT canons for [{cid}]")

    print("\nDone.")


if __name__ == "__main__":
    args = sys.argv[1:]
    main(args if args else None)
