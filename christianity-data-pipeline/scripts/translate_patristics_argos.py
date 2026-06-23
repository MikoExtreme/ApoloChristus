"""
Traduz para portugues, via Argos Translate (offline, gratuito), todas as
obras patristicas em ingles que ainda nao tem uma versao PT em
patristic_works (language='pt', translated_from_work_id=<id original>).

Cada obra traduzida fica numa nova linha em patristic_works com id
"<id_original>__pt", ligada ao original por translated_from_work_id —
o frontend ja sabe mostrar essa traducao quando existir (ver
getPtTranslationForWork em lib/supabase/queries/patristics.ts) e recuar
para ingles quando nao existir.

Resumivel: re-correr o script salta automaticamente as obras que ja tem
uma linha PT correspondente.

Uso:
    python scripts/translate_patristics_argos.py [--workers N] [--limit N]
"""
import argparse
import os
import sys
import time
from multiprocessing import Pool

os.environ.setdefault("PYTHONUTF8", "1")
os.environ.setdefault("PYTHONIOENCODING", "utf-8")

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BATCH = 500


def get_client():
    from scripts.load_to_supabase import get_client as _get_client
    return _get_client()


def fetch_all_rows(client, table, select, filters=None, order=None):
    rows = []
    page = 0
    while True:
        q = client.table(table).select(select)
        if filters:
            for col, op, val in filters:
                q = getattr(q, op)(col, val)
        if order:
            q = q.order(order)
        r = q.range(page * 1000, page * 1000 + 999).execute()
        if not r.data:
            break
        rows.extend(r.data)
        if len(r.data) < 1000:
            break
        page += 1
    return rows


def works_to_translate(client):
    en_works = fetch_all_rows(
        client, "patristic_works", "id,author_id,title,source_url",
        filters=[("language", "eq", "en")],
    )
    pt_works = fetch_all_rows(
        client, "patristic_works", "translated_from_work_id",
        filters=[("language", "eq", "pt")],
    )
    already_done = {w["translated_from_work_id"] for w in pt_works if w["translated_from_work_id"]}
    return [w for w in en_works if w["id"] not in already_done]


def translate_one_work(work):
    import argostranslate.translate

    work_id = work["id"]
    pt_id = f"{work_id}__pt"
    client = get_client()

    t0 = time.time()
    try:
        sections = fetch_all_rows(
            client, "patristic_sections", "section_num,text",
            filters=[("work_id", "eq", work_id)], order="section_num",
        )
        if not sections:
            return (work_id, "skipped (no sections)", 0, 0)

        title_pt = argostranslate.translate.translate(work["title"], "en", "pt")

        client.table("patristic_works").upsert({
            "id": pt_id,
            "author_id": work["author_id"],
            "title": title_pt,
            "source_url": work.get("source_url"),
            "language": "pt",
            "license": "machine_translated",
            "translated_from_work_id": work_id,
        }, on_conflict="id").execute()

        translated_rows = []
        total_chars = 0
        for s in sections:
            text_en = s["text"]
            total_chars += len(text_en)
            text_pt = argostranslate.translate.translate(text_en, "en", "pt") if text_en.strip() else ""
            translated_rows.append({
                "work_id": pt_id,
                "section_num": s["section_num"],
                "text": text_pt,
            })

        for i in range(0, len(translated_rows), BATCH):
            client.table("patristic_sections").upsert(
                translated_rows[i:i + BATCH], on_conflict="work_id,section_num"
            ).execute()

        elapsed = time.time() - t0
        return (work_id, "ok", len(sections), total_chars, elapsed)
    except Exception as exc:  # noqa: BLE001 — log and continue, don't abort the whole run
        return (work_id, f"error: {exc}", 0, 0, time.time() - t0)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--intra-threads", type=int, default=3)
    args = parser.parse_args()

    os.environ["ARGOS_INTRA_THREADS"] = str(args.intra_threads)
    os.environ["ARGOS_INTER_THREADS"] = "1"

    client = get_client()
    pending = works_to_translate(client)
    if args.limit:
        pending = pending[: args.limit]

    print(f"[{time.strftime('%H:%M:%S')}] {len(pending)} obras por traduzir", flush=True)

    done = 0
    total_chars_done = 0
    t_start = time.time()

    with Pool(processes=args.workers) as pool:
        for result in pool.imap_unordered(translate_one_work, pending):
            done += 1
            work_id, status, n_sections, n_chars = result[0], result[1], result[2], result[3]
            elapsed = result[4] if len(result) > 4 else 0
            total_chars_done += n_chars
            rate = total_chars_done / max(time.time() - t_start, 1)
            remaining_works = len(pending) - done
            print(
                f"[{time.strftime('%H:%M:%S')}] ({done}/{len(pending)}) {work_id}: {status} "
                f"({n_sections} seccoes, {n_chars:,} carateres, {elapsed:.1f}s) "
                f"| taxa media: {rate:.0f} c/s | obras restantes: {remaining_works}",
                flush=True,
            )

    print(f"[{time.strftime('%H:%M:%S')}] concluido. {done} obras processadas.", flush=True)


if __name__ == "__main__":
    main()
