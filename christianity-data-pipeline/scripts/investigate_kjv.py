"""Investiga a diferença de versículos entre KJV e ASV."""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
client = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

# Contar versículos por is_deuterocanonical
kjv_canon = client.table("verses").select("id", count="exact").eq("version_id", "en-kjv").eq("is_deuterocanonical", False).execute().count
kjv_deutero = client.table("verses").select("id", count="exact").eq("version_id", "en-kjv").eq("is_deuterocanonical", True).execute().count
asv_canon = client.table("verses").select("id", count="exact").eq("version_id", "en-asv").eq("is_deuterocanonical", False).execute().count
asv_deutero = client.table("verses").select("id", count="exact").eq("version_id", "en-asv").eq("is_deuterocanonical", True).execute().count

print(f"KJV:  canónico={kjv_canon:,}  deuterocanónico={kjv_deutero:,}  total={kjv_canon+kjv_deutero:,}")
print(f"ASV:  canónico={asv_canon:,}  deuterocanónico={asv_deutero:,}  total={asv_canon+asv_deutero:,}")
print(f"PT:   canónico={client.table('verses').select('id', count='exact').eq('version_id', 'pt-jfaal').eq('is_deuterocanonical', False).execute().count:,}")

# Versículos duplicados no KJV?
# Verificar se há (book, chapter, verse) repetidos
print("\nA verificar duplicados no KJV (pode demorar)...")
sample = client.table("verses").select("book,chapter,verse").eq("version_id", "en-kjv").limit(5).execute().data
print(f"  Amostra: {sample}")
