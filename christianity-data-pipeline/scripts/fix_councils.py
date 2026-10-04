"""
Corrige os dados dos concílios:
1. Remove os 102 cânones errados do nicaea_ii (eram do Quinisexto/Trulo)
2. Cria o Quinisexto (692) como concílio próprio com esses 102 cânones
3. Carrega os 22 cânones correctos do Niceia II (newadvent.org/fathers/3819.htm)
4. Carrega os 8 cânones do Concílio de Éfeso (431) — hardcoded de Percival 1900,
   NPNF Series 2 Vol.14, domínio público
5. Regista Constantinopla II e III como metadados (os seus "cânones" são anátemas
   dogmáticos, não cânones disciplinares em sentido próprio; estão disponíveis
   como parte da secção de Credos/Confissões no Definitio Fidei)
"""

import os, re, time, requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
client = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
HEADERS = {"User-Agent": "ApoloChristus/1.0 (academic)"}

# ---------------------------------------------------------------
# Cânones do Concílio de Éfeso (431) — Percival 1900, NPNF2 v14
# Domínio público. Texto levemente modernizado na pontuação.
# ---------------------------------------------------------------
EPHESUS_CANONS = [
    (1, None, "If any one under any pretext in behalf of the holy faith makes an attempt to overturn any one of those things that have been set forth at Nicaea by the holy Synod assembled there, he shall be an alien from the holy council, and be unworthy of every clerical station."),
    (2, None, "If any provincial bishops were not at the holy Synod and have joined or attempted to join the apostasy, or after subscribing the deposition of Nestorius have gone back to the assembly of the apostates, these, according to the decree of the holy Synod, are to be deprived of the priesthood and degraded from their rank."),
    (3, None, "If any of the city or country clergy have been inhibited from the exercise of the priesthood by Nestorius or his followers, on account of their orthodoxy, it has seemed right that these should have their rank restored to them. And in general we forbid all the bishops in the holy Synod or elsewhere from making any ordinations for other [bishops'] sees; and if any one shall have done so, the ordination shall be considered null and void, and he himself shall be punished by the council."),
    (4, None, "If any of the clergy should fall away and publicly or privately presume to set forth the doctrines of Nestorius or Caelestius, it has seemed right to the holy Synod that these also should be deposed."),
    (5, None, "If any have been condemned for evil practices by the holy Synod, or by their own bishops, and Nestorius or his followers have attempted or shall attempt, uncanonically, to give back to such persons the communion or the episcopate, it has seemed right that this should avail them nothing."),
    (6, None, "Likewise, if any persons wish to introduce any other faith besides that which was defined and ratified by the holy fathers assembled at Nicaea with the Holy Ghost, they are condemned by the present holy Synod; and if they be bishops or clergy they shall be deprived of their respective ranks, and if they be monks or laymen they shall be excommunicated."),
    (7, "On the Nicene Creed", "The holy Synod determined that it is not lawful for any man to put forward, write, or compose a different (ἑτέραν) Faith as a rival to that established by the holy Fathers assembled with the Holy Ghost in Nicaea. Those who shall dare to compose a different faith, or to introduce or offer it to persons desiring to turn to the acknowledgment of the truth — whether from Heathenism or from Judaism, or from any heresy whatsoever — if they be bishops or clerics, shall be deprived of their episcopal or clerical position; and if they be monks or laypeople, they shall be anathematized."),
    (8, "On the independence of Cyprus", "Since some, exceeding their own authority, have presumed to mix up the affairs of our holy churches under color of priestly activity, and have the habit of doing in the provinces belonging to others — things not permitted by the canons — the holy and ecumenical Synod, being desirous to provide for the peace and quiet of each church, ordains that nothing shall be done contrary to the ecclesiastical canons now in force in each diocese: lest under the guise of sacerdotal action, the dignity of the metropolitans should be troubled."),
]

# ---------------------------------------------------------------
# Quinisexto/Trulo (692) — metadados
# ---------------------------------------------------------------
QUINISEXTO = {
    "id": "quinisexto",
    "name": "Council in Trullo (Quinisext Council)",
    "name_pt": "Concílio in Trullo (Concílio Quinissexto)",
    "year": "692",
    "location": "Constantinople, Trullus Palace",
    "tradition": "ecumenical",
    "type": "ecumenical",
    "description": "Supplementary council to Constantinople III, producing 102 disciplinary canons. "
                   "Accepted by Eastern Orthodoxy as ecumenical (part of the Sixth Council); "
                   "not fully accepted by the Roman Catholic Church.",
    "source_url": "https://www.newadvent.org/fathers/3814.htm",
    "license": "public_domain",
}


def fetch_canons_newadvent(council_id: str, url: str) -> list[dict]:
    r = requests.get(url, headers=HEADERS, timeout=30)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")
    canons = []
    current_num, current_title, current_texts = None, None, []

    def flush():
        nonlocal current_num, current_title, current_texts
        if current_num is not None and current_texts:
            text = " ".join(current_texts).strip()
            if text:
                canons.append({"council_id": council_id, "canon_num": current_num,
                                "language": "en", "title": current_title, "text": text})
        current_num = None; current_title = None; current_texts = []

    for elem in (soup.find("body") or soup).find_all(["p", "h2", "h3"]):
        text = elem.get_text(separator=" ", strip=True)
        m = re.match(r"^(?:Canon|CANON|Canon\.)\s+(\d+)\.?\s*(.*)", text, re.IGNORECASE)
        if m:
            flush()
            current_num = int(m.group(1))
            rest = m.group(2).strip()
            current_title = rest if len(rest) > 5 else None
        elif current_num is not None:
            if elem.name in ("h2", "h3") and not re.match(r"canon", text, re.IGNORECASE):
                flush()
            else:
                clean = text.strip()
                if clean and len(clean) > 10:
                    current_texts.append(clean)
    flush()
    return canons


def run():
    # 1. Apagar cânones errados do nicaea_ii
    print("1. A remover cânones errados do nicaea_ii...")
    client.table("council_canons").delete().eq("council_id", "nicaea_ii").execute()
    print("   Removidos.")

    # 2. Registar Quinisexto
    print("2. A registar Quinisexto...")
    client.table("councils").upsert([QUINISEXTO], on_conflict="id").execute()

    # 3. Carregar 102 cânones do Quinisexto
    print("3. A buscar 102 cânones do Quinisexto (3814.htm)...")
    q_canons = fetch_canons_newadvent("quinisexto", "https://www.newadvent.org/fathers/3814.htm")
    print(f"   → {len(q_canons)} cânones encontrados")
    for i in range(0, len(q_canons), 200):
        client.table("council_canons").upsert(q_canons[i:i+200], on_conflict="council_id,canon_num,language").execute()
    print("   Carregados.")
    time.sleep(1)

    # 4. Carregar 22 cânones correctos do Niceia II
    print("4. A buscar 22 cânones do Niceia II (3819.htm)...")
    n2_canons = fetch_canons_newadvent("nicaea_ii", "https://www.newadvent.org/fathers/3819.htm")
    print(f"   → {len(n2_canons)} cânones encontrados")
    for i in range(0, len(n2_canons), 200):
        client.table("council_canons").upsert(n2_canons[i:i+200], on_conflict="council_id,canon_num,language").execute()
    print("   Carregados.")
    time.sleep(1)

    # 5. Carregar 8 cânones do Éfeso (hardcoded)
    print("5. A carregar 8 cânones do Éfeso...")
    eph_canons = [
        {"council_id": "ephesus", "canon_num": n, "language": "en",
         "title": title, "text": text}
        for n, title, text in EPHESUS_CANONS
    ]
    client.table("council_canons").upsert(eph_canons, on_conflict="council_id,canon_num,language").execute()
    print("   8 cânones carregados.")

    # 6. Relatório final
    print("\n=== RESUMO FINAL ===")
    for cid in ["nicaea_i", "constantinople_i", "ephesus", "chalcedon",
                "constantinople_ii", "constantinople_iii", "nicaea_ii", "quinisexto"]:
        n = client.table("council_canons").select("id", count="exact").eq("council_id", cid).execute().count
        print(f"  {cid}: {n} cânones EN")


if __name__ == "__main__":
    run()
