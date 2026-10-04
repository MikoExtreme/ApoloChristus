import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
client = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

# Evangelho de Tomé PT
work = client.table("apocryphal_works").select("id,title_pt,language,translated_from_work_id").eq("id", "gospel_thomas_pt").execute()
print("Obra apócrifa PT:", work.data)
secs = client.table("apocryphal_sections").select("section_num", count="exact").eq("work_id", "gospel_thomas_pt").execute()
print("Secções Evangelho de Tomé PT:", secs.count)

# Patrísticos PT
pat = client.table("patristic_works").select("id,title,language").eq("language", "pt").execute()
print("\nParísticos PT na BD:")
for w in pat.data:
    s = client.table("patristic_sections").select("section_num", count="exact").eq("work_id", w["id"]).execute()
    print(f"  {w['id']}: {s.count} secções")
