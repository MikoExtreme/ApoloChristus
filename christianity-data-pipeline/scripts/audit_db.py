"""Auditoria completa da base de dados ApoloChristus."""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
client = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

def count(table, filters=None):
    q = client.table(table).select("id", count="exact")
    if filters:
        for col, val in filters.items():
            q = q.eq(col, val)
    return q.execute().count

def sample(table, filters=None, limit=3):
    q = client.table(table).select("*")
    if filters:
        for col, val in filters.items():
            q = q.eq(col, val)
    return q.limit(limit).execute().data

print("=" * 60)
print("AUDITORIA DA BASE DE DADOS — ApoloChristus")
print("=" * 60)

# --- BÍBLIA ---
print("\n📖 BÍBLIA")
versions = client.table("bible_versions").select("id,name,language,license").execute().data
for v in versions:
    n = client.table("verses").select("id", count="exact").eq("version_id", v["id"]).execute().count
    print(f"  {v['id']:20s} | {v['language']:3s} | {n:6d} versículos | {v['license']}")

xrefs = count("cross_references")
print(f"  Referências cruzadas: {xrefs:,}")

# --- PATRÍSTICOS ---
print("\n✝ PATRÍSTICOS")
total_authors = count("patristic_authors")
total_works_en = count("patristic_works", {"language": "en"})
total_works_pt = count("patristic_works", {"language": "pt"})
total_sections = count("patristic_sections")
total_citations = count("patristic_citations")
print(f"  Autores: {total_authors}")
print(f"  Obras EN: {total_works_en} | PT: {total_works_pt}")
print(f"  Secções totais: {total_sections:,}")
print(f"  Citações bíblicas indexadas: {total_citations:,}")

# Autores sem obras
authors = client.table("patristic_authors").select("id,name_en").execute().data
authors_without_works = []
for a in authors:
    n = count("patristic_works", {"author_id": a["id"]})
    if n == 0:
        authors_without_works.append(a["name_en"])
if authors_without_works:
    print(f"  ⚠ Autores sem obras na BD ({len(authors_without_works)}): {', '.join(authors_without_works[:5])}{'...' if len(authors_without_works) > 5 else ''}")

# Obras PT sem translated_from_work_id
pt_works = client.table("patristic_works").select("id,translated_from_work_id").eq("language", "pt").execute().data
orphan_pt = [w["id"] for w in pt_works if not w.get("translated_from_work_id")]
if orphan_pt:
    print(f"  ⚠ Obras PT sem ligação EN: {orphan_pt}")

# --- APÓCRIFOS ---
print("\n📜 APÓCRIFOS")
apo_en = count("apocryphal_works", {"language": "en"})
apo_pt = count("apocryphal_works", {"language": "pt"})
apo_sections = count("apocryphal_sections")
print(f"  Obras EN: {apo_en} | PT: {apo_pt}")
print(f"  Secções totais: {apo_sections:,}")

# Obras sem secções
apo_works = client.table("apocryphal_works").select("id,title_en,language").execute().data
no_sections = []
for w in apo_works:
    n = count("apocryphal_sections", {"work_id": w["id"]})
    if n == 0:
        no_sections.append(f"{w['id']} ({w['language']})")
if no_sections:
    print(f"  ⚠ Obras sem secções: {no_sections}")

# --- CREDOS ---
print("\n📋 CREDOS & CONFISSÕES")
creeds = client.table("creeds_confessions").select("id,title,language").execute().data
en_secs = count("creeds_confessions_sections", {"language": "en"})
pt_secs = count("creeds_confessions_sections", {"language": "pt"})
print(f"  Obras: {len(creeds)}")
print(f"  Secções EN: {en_secs:,} | PT: {pt_secs:,}")
no_pt = [c["title"] for c in creeds if not client.table("creeds_confessions_sections").select("id", count="exact").eq("work_id", c["id"]).eq("language", "pt").execute().count]
print(f"  Sem tradução PT ({len(no_pt)}): {', '.join(no_pt)}")

# --- GLOSSÁRIO ---
print("\n📚 GLOSSÁRIO")
gloss = count("glossary_terms")
print(f"  Termos: {gloss:,}")

# --- LÉXICO ---
print("\n🔤 LÉXICO STRONG'S")
lex = count("lexicon_entries")
heb = count("lexicon_entries", {"language": "hebrew"})
grk = count("lexicon_entries", {"language": "greek"})
print(f"  Entradas totais: {lex:,} (hebraico: {heb:,} | grego: {grk:,})")

# --- INTERLINEAR ---
print("\n🔡 INTERLINEAR")
inter = count("interlinear_words")
print(f"  Palavras: {inter:,}")

# --- GEOGRAFIA ---
print("\n🗺 GEOGRAFIA")
places = count("biblical_places")
print(f"  Lugares: {places:,}")

print("\n" + "=" * 60)
print("FIM DA AUDITORIA")
print("=" * 60)
