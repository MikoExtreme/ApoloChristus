import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
client = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

# Usar um versículo que sabemos ter citações
result = client.rpc("verses_cited_by_fathers", {"p_book": "1CO", "p_chapter": 10, "p_verse": 32}).execute()
print(f"Citações para 1Cor 10:32: {len(result.data)}")
if result.data:
    c = result.data[0]
    print(f"  Campos devolvidos: {list(c.keys())}")
    print(f"  author_id={c.get('author_id')} | period={c.get('period')} | work_id={c.get('work_id')}")
    print(f"  author_name={c.get('author_name')}")
    print(f"  Trecho: {str(c.get('section_text',''))[:120]}...")
else:
    print("  Sem dados — função pode não ter sido actualizada.")
