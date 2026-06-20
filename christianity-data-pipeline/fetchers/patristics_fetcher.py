"""
Fetcher dos Pais da Igreja via New Advent (newadvent.org/fathers).
Domínio público — coleções Ante-Nicene/Nicene/Post-Nicene Fathers.

A estrutura real do site (verificada contra páginas ao vivo — a versão
anterior deste fetcher nunca tinha sido testada e tinha vários problemas):

1. O conteúdo está em `<div id="springfield2">`, não `<div class="text">`.
2. Números de secção não usam `<a name="N">` — usam cabeçalhos
   `<h2>Chapter N. Título</h2>` (ou "BOOK N", "Preface").
3. Muitas "obras" não têm o texto numa única página: a URL principal é uma
   página de índice que liga a subpáginas (por livro e/ou capítulo). Ex:
   - Confissões de Agostinho (1101.htm) → 13 subpáginas (110101–110113.htm),
     cada uma com um livro completo.
   - Contra as Heresias de Ireneu (0103.htm) → ~150 subpáginas, uma por
     capítulo, organizadas em 5 livros (010310X.htm onde X = nº do livro).
   Este fetcher segue essas páginas de índice recursivamente (até
   MAX_DEPTH níveis) e agrega o texto de todas as subpáginas na mesma obra.
4. Vários URLs do catálogo original estavam mesmo errados (apontavam para
   obras diferentes das que o título dizia) — foram corrigidos consultando
   o índice real em newadvent.org/fathers/.
"""

import re
import time
import logging
from pathlib import Path
import json

import requests
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

NEW_ADVENT_BASE = "https://www.newadvent.org/fathers"
MAX_DEPTH = 3          # work -> book -> chapter, no nível mais costuma chegar
MIN_PARAGRAPH_LEN = 40  # ignora parágrafos curtos (cabeçalhos, ruído)

# Catálogo de Pais da Igreja — carregado de patristic_catalog.json (65 autores,
# 341 obras de topo). Esse ficheiro foi gerado automaticamente a partir do
# índice real em newadvent.org/fathers/ (estrutura: um <p> por autor, com
# <strong> + obras em <a href="../fathers/..."> dentro do mesmo <p> —
# muito mais fiável do que tentar inferir o autor por proximidade entre
# tags soltas). Os 21 autores já trabalhados manualmente mantêm os nomes em
# português, período e tradição; os restantes usam o nome em inglês tal
# como aparece no site (tradução posterior é trabalho futuro).
CATALOG_PATH = Path(__file__).parent / "patristic_catalog.json"
FATHERS = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))

SUBPAGE_LINK_TEXT_RE = re.compile(
    r"^(chapters?|books?|prefaces?|discourses?|homil(y|ies)|letters?|"
    r"orations?|divisions?|lectures?|sermons?|prologue|parts?|psalms?|dialogues?)\b",
    re.IGNORECASE,
)
# Caso especial (ex: O Pastor de Hermas): rótulos com ordinal por extenso
# ("FIRST VISION", "SECOND COMMANDMENT"...) em vez de número.
ORDINAL_SUBPAGE_RE = re.compile(
    r"^(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|"
    r"eleventh|twelfth)\s+(vision|commandment|similitude|parable)\b",
    re.IGNORECASE,
)
CHAPTER_NUM_RE = re.compile(r"chapter\s+(\d+)", re.IGNORECASE)


def fetch_page(url: str, retries: int = 3) -> BeautifulSoup | None:
    for attempt in range(retries):
        try:
            r = requests.get(url, timeout=20, headers={"User-Agent": "Mozilla/5.0"})
            if r.status_code == 200:
                return BeautifulSoup(r.text, "html.parser")
            log.warning(f"HTTP {r.status_code}: {url}")
        except requests.RequestException as e:
            log.error(f"Erro: {e} (tentativa {attempt+1})")
        time.sleep(2 ** attempt)
    return None


def get_content_div(soup: BeautifulSoup):
    div = soup.find("div", id="springfield2")
    if not div:
        return None
    # Remove anúncios (banners e o parágrafo "Please help support...")
    for ad in div.find_all("div", class_=lambda c: c and "CMtag" in c):
        ad.decompose()
    for p in div.find_all("p"):
        if p.find("a", href=lambda h: h and "gumroad" in h):
            p.decompose()
    return div


def page_id(url: str) -> str:
    """Identificador do URL (ex: '0103' de '.../fathers/0103.htm')."""
    name = url.rstrip("/").split("/")[-1]
    return re.sub(r"\.html?$", "", name, flags=re.IGNORECASE)


def find_subpage_links(div, current_url: str) -> list[tuple[str, str]]:
    """
    Liga de navegação para sub-obras (capítulo/livro/prefácio), em ordem.

    Critério principal: o URL da subpágina começa pelo identificador da
    página atual (ex: '0103.htm' -> '0103101.htm', '0103a.htm'). Isto cobre
    genericamente QUALQUER esquema de rótulos que o New Advent use (já
    encontrámos "Chapter N", "Book N", "Discourse N", "Homily N", "LETTER
    N", "Oration N", "Psalm N", "FIRST VISION/COMMANDMENT/SIMILITUDE", e
    até títulos descritivos sem padrão nenhum como "THE SIEGE OF NISIBIS
    (I-III)") sem ter de manter uma lista interminável de palavras-chave.
    Mantemos também o critério por texto como rede de segurança adicional.

    Deduplicado por URL — algumas obras (ex: O Pastor de Hermas) têm vários
    rótulos de secção a apontar para a MESMA página (porque essa página já
    contém todas essas secções juntas); sem deduplicar, acabaríamos por
    descarregar e concatenar a mesma página várias vezes, duplicando texto.
    """
    pid = page_id(current_url)
    links = []
    seen_urls = set()
    for a in div.find_all("a", href=True):
        href = a["href"]
        text = a.get_text(strip=True)
        if not href.startswith("../fathers/"):
            continue
        target_id = page_id(href)
        by_prefix = (
            target_id != pid and target_id.startswith(pid) and len(target_id) > len(pid)
        )
        by_label = bool(SUBPAGE_LINK_TEXT_RE.match(text) or ORDINAL_SUBPAGE_RE.match(text))
        if not (by_prefix or by_label):
            continue
        url = requests.compat.urljoin(NEW_ADVENT_BASE + "/", href)
        if url in seen_urls:
            continue
        seen_urls.add(url)
        links.append((text, url))
    return links


def extract_leaf_sections(div) -> list[dict]:
    """
    Extrai secções de uma página de texto real (não-índice).

    section_num é sempre um contador sequencial por parágrafo (1, 2, 3...),
    nunca o número do capítulo — um capítulo com vários parágrafos não pode
    partilhar o mesmo section_num, porque a tabela tem UNIQUE(work_id,
    section_num) e um upsert silenciosamente substituiria/perderia os
    parágrafos anteriores desse capítulo. O título do capítulo (quando
    existe) é antes prefixado ao primeiro parágrafo seguinte, para não se
    perder essa informação.
    """
    sections = []
    pending_heading = None

    for elem in div.find_all(["h2", "p"]):
        if elem.name == "h2":
            heading = elem.get_text(strip=True)
            # Rodapé de boilerplate presente em todas as páginas do site —
            # marca o fim do conteúdo real da obra.
            if heading.lower().startswith("about this page"):
                break
            if CHAPTER_NUM_RE.search(heading):
                pending_heading = heading
            continue
        text = elem.get_text(separator=" ", strip=True)
        if len(text) < MIN_PARAGRAPH_LEN:
            continue
        if pending_heading:
            text = f"{pending_heading} — {text}"
            pending_heading = None
        sections.append({"section": len(sections) + 1, "text": text})

    return sections


def fetch_work_recursive(url: str, depth: int = 0) -> list[dict]:
    """
    Devolve a lista de secções (texto) de uma obra, seguindo páginas de
    índice (TOC) recursivamente até MAX_DEPTH níveis.
    """
    soup = fetch_page(url)
    if not soup:
        return []
    div = get_content_div(soup)
    if not div:
        return []

    subpages = find_subpage_links(div, url) if depth < MAX_DEPTH else []

    if subpages:
        log.info(f"{'  ' * depth}[TOC] {url} -> {len(subpages)} subpáginas")
        all_texts = []
        for label, sub_url in subpages:
            time.sleep(0.3)
            sub_sections = fetch_work_recursive(sub_url, depth + 1)
            all_texts.extend(s["text"] for s in sub_sections)
        # Renumera 1..N na ordem de leitura global da obra (não reseta por
        # subpágina/capítulo — mantém a sequência simples exigida pelo schema).
        return [{"section": i + 1, "text": text} for i, text in enumerate(all_texts)]

    return extract_leaf_sections(div)


def fetch_father_work(father: dict, work: dict) -> dict | None:
    log.info(f"  A fazer fetch: {work['title']} ({work['url']})")
    sections = fetch_work_recursive(work["url"])
    if not sections:
        log.warning(f"  Sem conteúdo extraído para {work['title']}")
        return None

    return {
        "father_id":   father["id"],
        "father_name": father["name_en"],
        "period":      father["period"],
        "tradition":   father["tradition"],
        "dates":       father["dates"],
        "work_title":  work["title"],
        "source_url":  work["url"],
        "language":    "en",
        "license":     "public_domain",
        "sections":    sections,
        "section_count": len(sections),
    }


_INVALID_FILENAME_CHARS_RE = re.compile(r'[\\/:*?"<>|]')


def slugify_filename(title: str) -> str:
    """Nome de ficheiro seguro em Windows/Unix a partir de um título de obra."""
    slug = title.lower().replace(" ", "_")
    slug = _INVALID_FILENAME_CHARS_RE.sub("", slug)
    slug = re.sub(r"_+", "_", slug).strip("_")
    return slug[:60] or "obra"


def fetch_all_fathers(output_dir: str = "output/patristics", delay: float = 0.5,
                       fathers: list[dict] = None):
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    summary = []

    for father in (fathers or FATHERS):
        father_dir = out / father["id"]
        father_dir.mkdir(exist_ok=True, parents=True)

        log.info(f"\n{'='*50}\n{father['name_en']} ({father['dates']})\n{'='*50}")

        (father_dir / "meta.json").write_text(
            json.dumps({k: v for k, v in father.items() if k != "works"},
                       ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

        used_slugs: set[str] = set()
        for work in father["works"]:
            data = fetch_father_work(father, work)
            if data:
                slug = slugify_filename(work["title"])
                if slug in used_slugs:
                    n = 2
                    while f"{slug}_{n}" in used_slugs:
                        n += 1
                    slug = f"{slug}_{n}"
                used_slugs.add(slug)
                out_file = father_dir / f"{slug}.json"
                out_file.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
                log.info(f"  ✓ {data['section_count']} secções → {out_file.name}")
                summary.append({
                    "father": father["name_en"],
                    "work": work["title"],
                    "sections": data["section_count"],
                    "file": str(out_file),
                })
            else:
                summary.append({
                    "father": father["name_en"],
                    "work": work["title"],
                    "sections": 0,
                    "file": None,
                })
            time.sleep(delay)

    (out / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    log.info(f"\nConcluído: {len(summary)} obras processadas.")
    return summary


if __name__ == "__main__":
    fetch_all_fathers()
