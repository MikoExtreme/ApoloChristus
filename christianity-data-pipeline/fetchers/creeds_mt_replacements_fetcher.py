"""
Substitui as traduções automáticas (machine_translated) dos credos por fontes
genuínas em português. Corre DEPOIS de apagar as secções MT no Supabase
(ver SQL abaixo).

SQL a correr PRIMEIRO no Supabase SQL Editor:
  DELETE FROM creeds_confessions_sections
  WHERE work_id IN (
    'nicene_creed_325', 'chalcedonian_definition',
    'baptist_confession_1688', 'longer_catechism_orthodox'
  ) AND language = 'pt';

  UPDATE creeds_confessions
  SET source_url_pt = NULL, license_pt = NULL
  WHERE id IN (
    'nicene_creed_325', 'chalcedonian_definition',
    'baptist_confession_1688', 'longer_catechism_orthodox'
  );

Cobertura:
  - nicene_creed_325:        hardcoded (2 secções) — viacrucis.pt
  - chalcedonian_definition: hardcoded (1 secção) — fonte patrística clássica PT
  - baptist_confession_1688: scraping (reformedreader.org) — texto completo 32 caps.
  - longer_catechism_orthodox: sem fonte PT fiável — fica sem tradução (EN por omissão)

Output: output/creeds_pt_replacements/*.json
  (mesmo formato que creeds_pt_fetcher.py — compatível com load_to_supabase.py)

Para carregar no Supabase após gerar os JSONs:
  python scripts/load_to_supabase.py --creeds-pt output/creeds_pt_replacements/
"""

import json
import logging
import os
import re
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; ApoloChristus/1.0)"}
MIN_LEN = 40
OUT_DIR = Path("output/creeds_pt_replacements")

# ---------------------------------------------------------------------------
# Textos hardcoded — curtos o suficiente para não precisar de scraping
# ---------------------------------------------------------------------------

# Credo de Niceia (325 d.C.) — texto original sem as adições de 381.
# Fonte: viacrucis.pt; texto padrão da tradição patrística em português.
NICENE_325_SECTIONS = [
    (
        "Cremos em um só Deus, Pai todo-poderoso, criador de todas as coisas visíveis e "
        "invisíveis. E em um só Senhor, Jesus Cristo, o Filho de Deus, gerado do Pai, "
        "unigénito, isto é, da substância do Pai, Deus de Deus, luz da luz, Deus verdadeiro "
        "de Deus verdadeiro, gerado, não criado, consubstancial ao Pai; por quem todas as "
        "coisas foram feitas, tanto as do céu como as da terra; que por nós, homens, e pela "
        "nossa salvação, desceu e se encarnou, e padeceu, e ressuscitou ao terceiro dia, e "
        "subiu aos céus, e virá julgar os vivos e os mortos. E no Espírito Santo."
    ),
    (
        "E os que dizem que houve um tempo em que Ele não existia, e que antes de ser gerado "
        "não existia, e que foi feito do nada, ou que é de outra substância ou essência, ou "
        "que o Filho de Deus é criado, mutável ou transformável — a estes anatematiza a Igreja "
        "Católica e Apostólica."
    ),
]

# Definição de Calcedónia (451 d.C.) — um único parágrafo, como na fonte histórica.
# Fonte: tradução padrão portuguesa do Concílio de Calcedónia, domínio público.
CHALCEDONIAN_SECTIONS = [
    (
        "Seguindo, pois, os santos Padres e ensinando todos a confessar um só e o mesmo Filho, "
        "nosso Senhor Jesus Cristo, perfeito na sua divindade e perfeito na sua humanidade, "
        "verdadeiramente Deus e verdadeiramente homem, de alma racional e corpo, consubstancial "
        "ao Pai segundo a divindade e consubstancial a nós segundo a humanidade, em tudo "
        "semelhante a nós excepto no pecado; gerado antes dos séculos segundo a divindade, e "
        "nos últimos dias, por nós e para a nossa salvação, nascido da Virgem Maria, Mãe de "
        "Deus, segundo a humanidade; um só e o mesmo Cristo, Filho, Senhor, Unigénito, "
        "reconhecido em duas naturezas, sem confusão, sem mudança, sem divisão, sem separação, "
        "não sendo suprimida de modo algum a diferença das naturezas pela união, antes sendo "
        "salvaguardadas as propriedades de cada uma das naturezas e concorrendo numa só pessoa "
        "e numa só hipóstase; não dividido nem separado em duas pessoas, mas um só e o mesmo "
        "Filho, Unigénito, Deus Verbo, o Senhor Jesus Cristo; como antes anunciaram os "
        "profetas a seu respeito, e o próprio Senhor Jesus Cristo nos ensinou, e o símbolo "
        "dos santos Padres nos transmitiu."
    ),
]

# ---------------------------------------------------------------------------
# Scraping — Confissão Batista de 1689 (reformedreader.org)
# ---------------------------------------------------------------------------

def fetch_baptist_confession() -> list[str]:
    """
    Extrai parágrafos da Confissão Batista de 1689 do reformedreader.org.
    A página usa <br> em vez de <p>, por isso o texto é extraído linha a linha.
    """
    url = "https://www.reformedreader.org/ccc/1689lbc/portuguese/1689LBC.htm"
    log.info(f"  A fazer fetch: {url}")
    r = requests.get(url, timeout=30, headers=HEADERS)
    r.raise_for_status()

    soup = BeautifulSoup(r.text, "html.parser")
    for tag in soup.find_all(["script", "style", "nav", "header", "footer"]):
        tag.decompose()

    raw = soup.get_text(separator="\n")
    paragraphs = []
    for line in raw.splitlines():
        line = re.sub(r"\s+", " ", line).strip()
        if len(line) >= MIN_LEN:
            paragraphs.append(line)

    log.info(f"  {len(paragraphs)} parágrafos extraídos")
    return paragraphs


# ---------------------------------------------------------------------------
# Utilitários
# ---------------------------------------------------------------------------

def save_work(work_id: str, sections: list[str], source_url: str, license_pt: str) -> dict:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    data = {
        "id": work_id,
        "source_url_pt": source_url,
        "license_pt": license_pt,
        "sections": [{"section": i + 1, "text": s[:4000]} for i, s in enumerate(sections)],
        "section_count": len(sections),
    }
    out_file = OUT_DIR / f"{work_id}.json"
    out_file.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    log.info(f"  ✓ {work_id}: {len(sections)} secções → {out_file.name}")
    return data


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

BATCH_SIZE = 500


def load_to_supabase(works: list[dict]):
    """Carrega os JSONs gerados directamente no Supabase."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    if not url or not key:
        log.error("SUPABASE_URL e SUPABASE_SERVICE_KEY em falta no .env — a saltar carga.")
        return

    client: Client = create_client(url, key)
    for work in works:
        client.table("creeds_confessions").update({
            "source_url_pt": work["source_url_pt"],
            "license_pt":    work["license_pt"],
        }).eq("id", work["id"]).execute()

        sections = [
            {"work_id": work["id"], "section_num": s["section"], "text": s["text"], "language": "pt"}
            for s in work["sections"]
        ]
        for i in range(0, len(sections), BATCH_SIZE):
            client.table("creeds_confessions_sections").upsert(
                sections[i:i + BATCH_SIZE], on_conflict="work_id,section_num,language"
            ).execute()

        log.info(f"  ✓ {work['id']}: {len(sections)} secções carregadas no Supabase")


if __name__ == "__main__":
    loaded_works = []

    log.info("=== Credo de Niceia 325 (hardcoded) ===")
    data = save_work(
        "nicene_creed_325",
        NICENE_325_SECTIONS,
        "https://viacrucis.pt/neste-dia-em-325-o-credo-niceno-original-era-adotado-pela-primeira-vez-no-primeiro-concilio-de-niceia/",
        "check_rights",
    )
    loaded_works.append(data)

    log.info("=== Definição de Calcedónia (hardcoded) ===")
    data = save_work(
        "chalcedonian_definition",
        CHALCEDONIAN_SECTIONS,
        "https://pt.wikipedia.org/wiki/Conc%C3%ADlio_de_Calced%C3%B3nia",
        "public_domain",
    )
    loaded_works.append(data)

    log.info("=== Confissão Batista de 1689 (scraping) ===")
    time.sleep(1)
    try:
        baptist = fetch_baptist_confession()
        if baptist:
            data = save_work(
                "baptist_confession_1688",
                baptist,
                "https://www.reformedreader.org/ccc/1689lbc/portuguese/1689LBC.htm",
                "check_rights",
            )
            loaded_works.append(data)
        else:
            log.warning("Sem conteúdo para baptist_confession_1688 — verificar URL.")
    except Exception as e:
        log.error(f"Erro ao fazer fetch da Confissão Batista: {e}")

    log.info("\n=== A carregar no Supabase ===")
    load_to_supabase(loaded_works)
    log.info("\nConcluído.")
