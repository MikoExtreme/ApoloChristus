"""
Fetcher de traduções portuguesas reais (não automáticas) dos credos e
confissões já carregados em inglês — ver creeds_fetcher.py.

Ao contrário da fonte inglesa (CCEL/Schaff, um único site/template), as
fontes portuguesas vêm de ~16 sites/editoras diferentes, cada uma com a
sua própria estrutura — não há um padrão único de extração. A maioria
não declara licença formalmente (textos confessionais partilhados
livremente por igrejas, ou traduções modernas de editoras sem nota de
licença explícita) — por isso license_pt fica "check_rights" em quase
todos os casos, mesmo tratamento que pt-aa/pt-acf na Bíblia.

3 documentos do catálogo inglês ficam de fora por não termos encontrado
fonte PT fiável e independente do Credo Niceno-Constantinopolitano:
  - nicene_creed_325: as fontes PT encontradas fundem sempre com o texto
    de 381 (não há tradução PT autónoma do texto curto de 325).
  - chalcedonian_definition: só encontrámos discussão sobre o credo, não
    o texto integral traduzido.
  - longer_catechism_orthodox: a única fonte encontrada pode ser um
    catecismo ortodoxo diferente (Pedro Mogila em vez de Filaret, 1839)
    — autoria não confirmada.
"""

import json
import logging
import re
import time
from io import BytesIO
from pathlib import Path

import pdfplumber
import requests
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

HEADERS = {"User-Agent": "Mozilla/5.0"}

# Catálogo PT — um item por documento já existente em creeds_fetcher.py.
# "kind" indica o tipo de extração: "html" (BeautifulSoup genérico) ou
# "pdf" (pdfplumber). "license_pt" é "check_rights" por omissão; só fica
# "public_domain" quando a fonte é claramente antiga/atribuída e livre
# (ex: tradução jesuíta clássica de domínio público).
CATALOG_PT = [
    {"id": "apostles_creed", "kind": "html",
     "url": "https://www.vaticannews.va/pt/oracoes/simbolo-dos-apostolos.html",
     "license_pt": "check_rights"},
    {"id": "niceno_constantinopolitan_creed", "kind": "pdf",
     "url": "https://www.annusfidei.va/content/novaevangelizatio/pt/annus-fidei/professione-di-fede.pdf",
     "license_pt": "check_rights"},
    {"id": "athanasian_creed", "kind": "pdf",
     "url": "https://www.teologia.org.br/estudos/credo_atanasio.pdf",
     "license_pt": "check_rights"},
    {"id": "tridentine_profession", "kind": "html",
     "url": "https://ipco.org.br/profissao-de-fe-tridentina/",
     "license_pt": "check_rights",
     # corta metadados de blog ("Autor do post:...") no início e o
     # aviso de cookies + assinatura do autor no fim
     # nota: "I" inicial é um drop-cap em <span> separado, fica isolado
     # por um espaço no texto extraído ("I nspirado") — âncora sem o "I"
     "start_after": "nspirado, o Apóstolo São Paulo advertiu",
     "stop_before": "Autor Agência Boa Imprensa"},
    {"id": "augsburg_confession", "kind": "html",
     "url": "https://www.luterano.org.br/confissao-de-augsburgo/",
     "license_pt": "check_rights",
     # corta os blurbs de navegação do portal IECLB no início
     "start_after": "Apresentada originalmente em latim"},
    {"id": "luther_small_catechism", "kind": "html",
     "url": "https://catechism.cph.org/pt/",
     "license_pt": "check_rights"},
    {"id": "second_helvetic_confession", "kind": "html",
     "url": "https://monergismo.com/textos/credos/confissao_helvetica.htm",
     "license_pt": "check_rights",
     # corta a lista de links recomendados no rodapé do Monergismo
     "stop_before": "Este site da web é uma realização"},
    {"id": "heidelberg_catechism", "kind": "pdf",
     "url": "https://www.heidelberg-catechism.com/pdf/lords-days/O%20CATECISMO%20DE%20HEIDELBERG%20(Portuguese).pdf",
     "license_pt": "check_rights"},
    {"id": "belgic_confession", "kind": "pdf",
     "url": "https://ipsemear.org/wp-content/uploads/Confissao_belga.pdf",
     "license_pt": "check_rights"},
    {"id": "canons_of_dort", "kind": "html",
     "url": "https://monergismo.com/textos/credos/dort.htm",
     "license_pt": "check_rights",
     "stop_before": "Este site da web é uma realização"},
    {"id": "westminster_confession", "kind": "pdf",
     "url": "https://www.ibel.org.br/download/confissao-de-fe-de-westminster.pdf",
     "license_pt": "check_rights"},
    {"id": "westminster_shorter_catechism", "kind": "pdf",
     "url": "https://rtf-usa.com/wp-content/uploads/2024/02/WSC_PORTUGUESE-FINAL-PDF-DIGITAL.pdf",
     "license_pt": "check_rights"},
    {"id": "scotch_confession", "kind": "pdf",
     "url": "https://ipbvit.org.br/files/2018/01/A-Confissa%CC%83o-de-Fe%CC%81-Escocesa.pdf",
     "license_pt": "check_rights"},
    {"id": "thirty_nine_articles", "kind": "pdf",
     "url": "https://www.teologia.org.br/estudos/39_artigos_da_religiao.pdf",
     "license_pt": "check_rights"},
    # baptist_confession_1688: deixado de fora — a única fonte PDF encontrada
    # (institutopoimenica) é um ensaio histórico sobre a confissão (por
    # Gilson Santos, revista "Ex Corde"), não o texto da confissão em si;
    # as alternativas (oestandartedecristo.com, Ligonier PT) não devolveram
    # texto utilizável (página de loja vazia / bloqueada por Cloudflare).
    {"id": "savoy_declaration", "kind": "html",
     "url": "http://historiacongregacional.blogspot.com/2009/08/declaracao-de-savoy-de-fe-e-ordem.html",
     "license_pt": "check_rights",
     # corta o blurb de promoção de livro + comentário de leitor no início,
     # e a lista de links de seminários no fim
     "start_after": "Congregacionalismo é a forma de governo",
     "stop_before": "GRANDES NOMES CONGREGACIONAIS"},
]

MIN_PARAGRAPH_LEN = 25


def _trim_by_markers(paragraphs: list[str], start_after: str | None, stop_before: str | None) -> list[str]:
    """Sites diferentes intercalam ruído de navegação/rodapé (menus,
    'Autor do post:', listas de links recomendados, widgets de cookies)
    antes/depois do conteúdo real — sem um seletor CSS único válido para
    todos os sites, corta-se por texto-âncora reconhecível em cada um."""
    if start_after:
        for i, p in enumerate(paragraphs):
            if start_after in p:
                paragraphs = paragraphs[i:]
                break
    if stop_before:
        for i, p in enumerate(paragraphs):
            if stop_before in p:
                paragraphs = paragraphs[:i]
                break
    return paragraphs


def extract_html_paragraphs(html: str, selector: str | None = None) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup.find_all(["script", "style", "nav", "header", "footer"]):
        tag.decompose()

    root = soup.select_one(selector) if selector else soup

    paragraphs = []
    for elem in (root.find_all(["p", "li"]) if root else []):
        text = re.sub(r"\s+", " ", elem.get_text(separator=" ", strip=True))
        if len(text) >= MIN_PARAGRAPH_LEN:
            paragraphs.append(text)
    return paragraphs


MAX_CHUNK_LEN = 2000


def _split_long_text(text: str, max_len: int = MAX_CHUNK_LEN) -> list[str]:
    """Parte texto longo em blocos por frase, sem cortar a meio (ao
    contrário de truncar com text[:4000], que perdia conteúdo)."""
    if len(text) <= max_len:
        return [text]
    sentences = re.split(r"(?<=[.!?;])\s+", text)
    chunks, current = [], ""
    for sentence in sentences:
        if current and len(current) + len(sentence) + 1 > max_len:
            chunks.append(current.strip())
            current = sentence
        else:
            current = f"{current} {sentence}".strip()
    if current:
        chunks.append(current.strip())
    return chunks


def extract_pdf_paragraphs(pdf_bytes: bytes) -> list[str]:
    # Divide por PÁGINA, não por linha em branco: muitos destes PDFs não
    # preservam linhas em branco entre parágrafos no texto extraído (todo
    # o texto sai como um único bloco contínuo), o que colapsava o
    # documento inteiro numa só "secção" truncada. Cada página vira pelo
    # menos uma secção; páginas muito densas são ainda divididas por
    # frase via _split_long_text (evita truncar/perder conteúdo).
    paragraphs = []
    with pdfplumber.open(BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            text = re.sub(r"\s+", " ", page_text.strip())
            if len(text) < MIN_PARAGRAPH_LEN:
                continue
            paragraphs.extend(_split_long_text(text))
    return paragraphs


def fetch_pt_work(work: dict) -> dict | None:
    log.info(f"  A fazer fetch PT: {work['id']} ({work['url']})")
    try:
        r = requests.get(work["url"], timeout=30, headers=HEADERS)
        r.raise_for_status()
    except requests.RequestException as e:
        log.error(f"  Erro: {e}")
        return None

    if work["kind"] == "pdf":
        paragraphs = extract_pdf_paragraphs(r.content)
    else:
        paragraphs = extract_html_paragraphs(r.text, selector=work.get("selector"))

    paragraphs = _trim_by_markers(paragraphs, work.get("start_after"), work.get("stop_before"))

    if not paragraphs:
        log.warning("  Sem conteúdo extraído!")
        return None

    sections = [{"section": i + 1, "text": p[:4000]} for i, p in enumerate(paragraphs)]
    return {
        "id": work["id"],
        "source_url_pt": work["url"],
        "license_pt": work["license_pt"],
        "sections": sections,
        "section_count": len(sections),
    }


def fetch_all_creeds_pt(output_dir: str = "output/creeds_pt", delay: float = 1.0):
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    summary = []
    for work in CATALOG_PT:
        data = fetch_pt_work(work)
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
    log.info(f"\nConcluído: {ok}/{len(CATALOG_PT)} documentos PT obtidos.")
    return summary


if __name__ == "__main__":
    fetch_all_creeds_pt()
