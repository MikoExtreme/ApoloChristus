"""
Fetcher de credos e confissões via CCEL — "Creeds of Christendom" de
Philip Schaff (3 volumes, séc. XIX, domínio público — "Rights: Public
Domain" confirmado diretamente nos metadados do CCEL).

Estrutura real (verificada contra páginas ao vivo):
  - Cada documento tem a sua própria página em ccel.org/ccel/schaff/
    creeds{2,3}/creeds{2,3}.{capítulo}.html — encontrados a partir do
    índice real (creeds{2,3}.toc.html), não adivinhados.
  - O texto está em `<div class="book-content">`.
  - Muitos documentos apresentam o texto original (latim/grego) e a
    tradução inglesa lado a lado, marcados com `lang="LA"`/`lang="EL"`
    nos `<span>`. Mantemos só o inglês (o latim/grego paralelo não
    ajuda a pesquisa nem a maioria dos leitores).
  - Notas de rodapé aparecem duplicadas inline (`<sup class="Note">` +
    `<span class="mnote">`) — removidas antes de extrair o texto.
  - Cada documento cabe numa única página (sem paginação/TOC aninhado
    como no New Advent) — confirmado até para obras longas como a
    Confissão de Augsburgo (~170k caracteres numa só página).

Catálogo: subconjunto curado dos ~90 documentos disponíveis — os credos
ecuménicos clássicos e as confissões mais conhecidas de cada tradição
(católica, ortodoxa, luterana, reformada, anglicana, Westminster). Não
é o catálogo completo do Schaff (que inclui dezenas de declarações
denominacionais menores do séc. XIX) nem inclui Vaticano I/II (são do
séc. XX, fora do âmbito desta obra de 1877/1889).
"""

import json
import logging
import re
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

CCEL_BASE = "https://ccel.org/ccel/schaff"

CATALOG = [
    # === Credos ecuménicos (Volume II) ===
    {"id": "apostles_creed", "title": "Apostles' Creed", "title_pt": "Credo Apostólico",
     "type": "creed", "tradition": "ecumenical", "year": "c.150-700",
     "url": f"{CCEL_BASE}/creeds2/creeds2.iv.i.i.i.html"},
    {"id": "nicene_creed_325", "title": "Nicene Creed (A.D. 325)", "title_pt": "Credo Niceno (325)",
     "type": "creed", "tradition": "ecumenical", "year": "325",
     # A página óbvia (creeds2.iv.i.ii.iii.html, Volume II) só tem o texto
     # grego/latim original, com uma nota a remeter para "Vol. I. pp. 28, 29"
     # para a tradução inglesa — confirmado ao inspecionar o HTML ao vivo
     # (sem isto, extrai-se só comentário editorial, não o credo em si).
     # A tradução real está em creeds1.iv.iii.html (Volume I, §8 "The Nicene
     # Creed"), mas essa página começa com várias páginas de bibliografia
     # académica antes de citar o texto do credo — "start_after" salta tudo
     # isso, começando só na tabela comparativa Credo Apostólico/Niceno.
     "url": f"{CCEL_BASE}/creeds1/creeds1.iv.iii.html",
     "start_after": "The relation of the Nicene Creed to the Apostles' Creed"},
    {"id": "niceno_constantinopolitan_creed", "title": "Nicene-Constantinopolitan Creed (A.D. 381, Western form with filioque)",
     "title_pt": "Credo Niceno-Constantinopolitano (381, forma ocidental com filioque)",
     "type": "creed", "tradition": "ecumenical", "year": "381",
     "url": f"{CCEL_BASE}/creeds2/creeds2.iv.i.ii.ii.html"},
    {"id": "chalcedonian_definition", "title": "Chalcedonian Definition", "title_pt": "Definição de Calcedónia",
     "type": "creed", "tradition": "ecumenical", "year": "451",
     "url": f"{CCEL_BASE}/creeds2/creeds2.iv.i.iii.html"},
    {"id": "athanasian_creed", "title": "Athanasian Creed", "title_pt": "Credo Atanasiano",
     "type": "creed", "tradition": "ecumenical", "year": "c.500",
     "url": f"{CCEL_BASE}/creeds2/creeds2.iv.i.iv.html"},
    # === Católica (Volume II) ===
    {"id": "tridentine_profession", "title": "Profession of the Tridentine Faith",
     "title_pt": "Profissão de Fé Tridentina",
     "type": "confession", "tradition": "catholic", "year": "1564",
     "url": f"{CCEL_BASE}/creeds2/creeds2.v.i.ii.html"},
    # === Ortodoxa (Volume II) ===
    # Nota: "Orthodox Confession of the Eastern Church" (creeds2.vi.i.html) e
    # "Confession of Dositheus" (creeds2.vi.ii.html) só têm texto em grego e
    # latim nestas páginas — sem tradução inglesa disponível nesta fonte.
    # Ficam de fora; precisariam de outra fonte para tradução em inglês/PT.
    {"id": "longer_catechism_orthodox", "title": "The Longer Catechism of the Orthodox Catholic Eastern Church",
     "title_pt": "Catecismo Maior da Igreja Ortodoxa Oriental",
     "type": "catechism", "tradition": "orthodox", "year": "1839",
     "url": f"{CCEL_BASE}/creeds2/creeds2.vi.iii.ii.html"},
    # === Luterana (Volume III) ===
    {"id": "augsburg_confession", "title": "The Augsburg Confession",
     "title_pt": "Confissão de Augsburgo",
     "type": "confession", "tradition": "lutheran", "year": "1530",
     "url": f"{CCEL_BASE}/creeds3/creeds3.iii.ii.html"},
    {"id": "luther_small_catechism", "title": "Luther's Small Catechism",
     "title_pt": "Pequeno Catecismo de Lutero",
     "type": "catechism", "tradition": "lutheran", "year": "1529",
     "url": f"{CCEL_BASE}/creeds3/creeds3.iii.iii.html"},
    # === Reformada (Volume III) ===
    {"id": "second_helvetic_confession", "title": "The Second Helvetic Confession",
     "title_pt": "Segunda Confissão Helvética",
     "type": "confession", "tradition": "reformed", "year": "1566",
     "url": f"{CCEL_BASE}/creeds3/creeds3.v.ix.html"},  # versão em inglês; creeds3.iv.v.html só tem o latim original
    {"id": "heidelberg_catechism", "title": "The Heidelberg Catechism",
     "title_pt": "Catecismo de Heidelberg",
     "type": "catechism", "tradition": "reformed", "year": "1563",
     "url": f"{CCEL_BASE}/creeds3/creeds3.iv.vi.html"},
    {"id": "belgic_confession", "title": "The Belgic Confession",
     "title_pt": "Confissão Belga",
     "type": "confession", "tradition": "reformed", "year": "1561",
     "url": f"{CCEL_BASE}/creeds3/creeds3.iv.viii.html"},
    {"id": "canons_of_dort", "title": "The Canons of the Synod of Dort",
     "title_pt": "Cânones de Dort",
     "type": "confession", "tradition": "reformed", "year": "1619",
     "url": f"{CCEL_BASE}/creeds3/creeds3.iv.xvi.html"},
    {"id": "westminster_confession", "title": "The Westminster Confession of Faith",
     "title_pt": "Confissão de Fé de Westminster",
     "type": "confession", "tradition": "reformed", "year": "1647",
     "url": f"{CCEL_BASE}/creeds3/creeds3.iv.xvii.ii.html"},
    {"id": "westminster_shorter_catechism", "title": "The Westminster Shorter Catechism",
     "title_pt": "Breve Catecismo de Westminster",
     "type": "catechism", "tradition": "reformed", "year": "1647",
     "url": f"{CCEL_BASE}/creeds3/creeds3.iv.xviii.html"},
    {"id": "scotch_confession", "title": "The Scotch Confession of Faith",
     "title_pt": "Confissão Escocesa de Fé",
     "type": "confession", "tradition": "reformed", "year": "1560",
     "url": f"{CCEL_BASE}/creeds3/creeds3.iv.ix.html"},
    # === Anglicana (Volume III) ===
    {"id": "thirty_nine_articles", "title": "The Thirty-Nine Articles of Religion",
     "title_pt": "Os Trinta e Nove Artigos de Religião",
     "type": "confession", "tradition": "anglican", "year": "1571",
     "url": f"{CCEL_BASE}/creeds3/creeds3.iv.xi.html"},
    # === Outras (Volume III) ===
    {"id": "baptist_confession_1688", "title": "The Baptist Confession of 1688 (Philadelphia Confession)",
     "title_pt": "Confissão Batista de 1688 (Confissão da Filadélfia)",
     "type": "confession", "tradition": "baptist", "year": "1688",
     "url": f"{CCEL_BASE}/creeds3/creeds3.v.ii.i.html"},
    {"id": "savoy_declaration", "title": "Savoy Declaration of the Congregational Churches",
     "title_pt": "Declaração de Saboia",
     "type": "confession", "tradition": "congregational", "year": "1658",
     "url": f"{CCEL_BASE}/creeds3/creeds3.v.i.i.html"},
]

FOOTER_NOISE_PREFIXES = ("__________",)


def is_foreign(elem) -> bool:
    """
    True se o elemento for maioritariamente latim/grego (lang='LA'/'EL').
    Alguns documentos (ex: catecismos em formato pergunta/resposta) usam
    tabelas com colunas paralelas inglês/latim — nesse caso a célula
    latina tem o atributo lang diretamente nela, não num <span> interno.
    """
    if elem.name == "td" and elem.get("lang"):
        return True
    spans = elem.find_all("span", lang=True)
    if not spans:
        return False
    total = len(elem.get_text(strip=True))
    foreign = sum(len(s.get_text(strip=True)) for s in spans)
    return total > 0 and (foreign / total) > 0.5


def extract_sections(soup: BeautifulSoup, start_after: str | None = None) -> list[dict]:
    content = soup.find("div", class_="book-content")
    if not content:
        return []

    for tag in content.find_all("sup", class_="Note"):
        tag.decompose()
    for tag in content.find_all("span", class_="mnote"):
        tag.decompose()
    for tag in content.find_all(["script", "style"]):
        tag.decompose()

    started = start_after is None
    sections = []
    for elem in content.find_all(["p", "td"]):
        # Quando um <td> contém <p>'s, extrai-se granularmente por cada <p>
        # (bug anterior: saltava o <td> E os seus <p> filhos, perdendo o
        # conteúdo todo — confirmado em creeds2.iv.i.ii.ii.html, onde o
        # texto do credo está inteiro dentro de <td><p>...</p></td>).
        # Só se salta o <td> quando ele tem <p> filhos (evita duplicar);
        # <td> sem <p> (tabelas simples tipo pergunta/resposta) extrai-se
        # diretamente.
        if elem.name == "td" and elem.find("p"):
            continue
        if is_foreign(elem):
            continue
        text = re.sub(r"\s+", " ", elem.get_text(separator=" ", strip=True))

        if not started:
            if start_after in text:
                started = True
            continue

        if len(text) < 20 or text.startswith(FOOTER_NOISE_PREFIXES):
            continue
        sections.append({"section": len(sections) + 1, "text": text[:4000]})

    return sections


def fetch_work(work: dict) -> dict | None:
    log.info(f"  A fazer fetch: {work['title']} ({work['url']})")
    try:
        r = requests.get(work["url"], timeout=30, headers={"User-Agent": "Mozilla/5.0"})
        r.raise_for_status()
    except requests.RequestException as e:
        log.error(f"  Erro: {e}")
        return None

    soup = BeautifulSoup(r.text, "html.parser")
    sections = extract_sections(soup, start_after=work.get("start_after"))
    if not sections:
        log.warning("  Sem conteúdo extraído!")
        return None

    return {
        "id": work["id"],
        "title": work["title"],
        "title_pt": work["title_pt"],
        "type": work["type"],
        "tradition": work["tradition"],
        "year": work["year"],
        "source_url": work["url"],
        "language": "en",
        "license": "public_domain",
        "sections": sections,
        "section_count": len(sections),
    }


def fetch_all_creeds(output_dir: str = "output/creeds", delay: float = 1.0):
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    summary = []
    for work in CATALOG:
        data = fetch_work(work)
        if data:
            out_file = out / f"{work['id']}.json"
            out_file.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
            log.info(f"  ✓ {data['section_count']} secções → {out_file.name}")
            summary.append({"id": work["id"], "sections": data["section_count"]})
        else:
            summary.append({"id": work["id"], "sections": 0})
        time.sleep(delay)

    (out / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    ok = sum(1 for s in summary if s["sections"] > 0)
    log.info(f"\nConcluído: {ok}/{len(CATALOG)} documentos obtidos.")
    return summary


if __name__ == "__main__":
    fetch_all_creeds()
