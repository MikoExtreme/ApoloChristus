"""Carrega obras EN de Athanasius e Hermas para o Supabase."""
import json, os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
client = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

BATCH = 500
fathers = ["athanasius", "hermas"]
base = Path("output/patristics")

for father_id in fathers:
    father_dir = base / father_id
    for work_file in father_dir.glob("*.json"):
        if work_file.name == "meta.json":
            continue
        work = json.loads(work_file.read_text(encoding="utf-8"))
        work_id = f"{father_id}__{work_file.stem}"

        client.table("patristic_works").upsert({
            "id": work_id,
            "author_id": father_id,
            "title": work["work_title"],
            "source_url": work["source_url"],
            "language": work.get("language", "en"),
            "license": work["license"],
        }).execute()

        sections = [
            {"work_id": work_id, "section_num": s["section"], "text": s["text"]}
            for s in work.get("sections", [])
        ]
        for i in range(0, len(sections), BATCH):
            client.table("patristic_sections").upsert(
                sections[i:i+BATCH], on_conflict="work_id,section_num"
            ).execute()

        print(f"  {work_id}: {len(sections)} secções")

print("Concluído")
