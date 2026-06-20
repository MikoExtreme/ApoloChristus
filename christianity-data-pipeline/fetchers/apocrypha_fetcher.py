"""
Fetcher de textos apócrifos via Early Christian Writings (earlychristianwritings.com).

Estrutura real do site (verificada contra páginas ao vivo — o catálogo e a
extração originais nunca tinham sido testados e tinham vários problemas):

1. Cada obra tem uma página "raiz" (ex: /barnabas.html) com discussão
   académica de datação/autoria e LIGAÇÕES para uma ou mais traduções em
   /text/{obra}-{tradutor}.html — não existe um /text/{obra}.html genérico
   para todas as obras. Vários URLs do catálogo original eram inválidos
   (404) por assumirem esse padrão sem verificar.
2. O texto real está em `<div id="textboundingbox">` (dentro de
   `<div id="infolayer">`) — não em `<div class="text">`/`id="text"`/
   `class="content">` como o código original assumia.
3. O HTML é antigo e mal formado (tags `<p>` sem fecho), por isso a
   extração usa o texto plano renderizado (separado por blocos vazios)
   em vez de tentar percorrer a árvore DOM de parágrafos.
4. Licença: preferimos sempre a tradução Roberts-Donaldson (Ante-Nicene
   Christian Library, séc. XIX, claramente domínio público) quando
   disponível. Para obras gnósticas/Nag Hammadi descobertas em 1945
   (Evangelho de Tomé, Evangelho da Verdade) não existe tradução do
   séc. XIX — as únicas disponíveis são académicas modernas, por isso
   ficam marcadas "check_rights", não "public_domain".
5. 1 Enoque e o Livro dos Jubileus NÃO existem neste site (focado em
   literatura cristã do séc. I-III, não pseudepígrafos veterotestamentários
   mais amplos) — ficam de fora deste fetcher; precisam de outra fonte
   (ver nota em PLAN.md, Fase 3).
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import logging
from pathlib import Path
import re

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

ECW_BASE = "https://www.earlychristianwritings.com"

# Catálogo de apócrifos — URLs verificados contra o site real (cada um
# resolvido a partir da página raiz da obra, escolhendo a tradução PD
# quando existe).
APOCRYPHA = [
    # === Apócrifos do Novo Testamento ===
    {
        "id": "gospel_thomas",
        "title": "Evangelho de Tomé",
        "title_en": "Gospel of Thomas",
        "category": "apocryphal_gospel",
        "url": f"{ECW_BASE}/text/thomas-scholars.html",
        "tradition": "gnostic",
        "date_estimate": "c.50–140",
        "license": "check_rights",  # tradução moderna (Patterson/Meyer); descoberto em 1945, sem opção do séc. XIX
    },
    {
        "id": "gospel_peter",
        "title": "Evangelho de Pedro",
        "title_en": "Gospel of Peter",
        "category": "apocryphal_gospel",
        "url": f"{ECW_BASE}/text/gospelpeter.html",
        "tradition": "jewish_christian",
        "date_estimate": "c.150–200",
        "license": "public_domain",  # Roberts-Donaldson
    },
    {
        "id": "protoevangelium_james",
        "title": "Protoevangelho de Tiago",
        "title_en": "Infancy Gospel of James (Protevangelium)",
        "category": "apocryphal_gospel",
        "url": f"{ECW_BASE}/text/infancyjames-roberts.html",
        "tradition": "catholic_orthodox",
        "date_estimate": "c.145–200",
        "license": "public_domain",  # Roberts-Donaldson
    },
    {
        "id": "infancy_gospel_thomas",
        "title": "Evangelho da Infância de Tomé",
        "title_en": "Infancy Gospel of Thomas",
        "category": "apocryphal_gospel",
        "url": f"{ECW_BASE}/text/infancythomas-a-roberts.html",
        "tradition": "various",
        "date_estimate": "c.150–200",
        "license": "public_domain",  # Roberts-Donaldson, forma grega A
    },
    {
        "id": "acts_peter",
        "title": "Actos de Pedro",
        "title_en": "Acts of Peter",
        "category": "apocryphal_acts",
        "url": f"{ECW_BASE}/text/actspeter.html",
        "tradition": "various",
        "date_estimate": "c.150–200",
        "license": "check_rights",  # única tradução disponível é de M.R. James (1924)
    },
    {
        "id": "acts_paul_thecla",
        "title": "Actos de Paulo e Tecla",
        "title_en": "Acts of Paul (incl. Thecla)",
        "category": "apocryphal_acts",
        "url": f"{ECW_BASE}/text/actspaul.html",
        "tradition": "various",
        "date_estimate": "c.160–190",
        "license": "check_rights",  # única tradução disponível é de M.R. James (1924)
    },
    {
        "id": "epistle_barnabas",
        "title": "Epístola de Barnabé",
        "title_en": "Epistle of Barnabas",
        "category": "apocryphal_epistle",
        "url": f"{ECW_BASE}/text/barnabas-roberts.html",
        "tradition": "alexandrian",
        "date_estimate": "c.70–132",
        "license": "public_domain",  # Roberts-Donaldson
    },
    {
        "id": "didache",
        "title": "Didaqué",
        "title_en": "Didache",
        "category": "church_order",
        "url": f"{ECW_BASE}/text/didache-roberts.html",
        "tradition": "jewish_christian",
        "date_estimate": "c.50–120",
        "license": "public_domain",  # Roberts-Donaldson
    },
    {
        "id": "shepherd_hermas",
        "title": "Pastor de Hermas",
        "title_en": "Shepherd of Hermas",
        "category": "apocalypse",
        "url": f"{ECW_BASE}/text/shepherd.html",
        "tradition": "roman",
        "date_estimate": "c.100–160",
        "license": "public_domain",  # Roberts-Donaldson
    },
    {
        "id": "apocalypse_peter",
        "title": "Apocalipse de Pedro",
        "title_en": "Apocalypse of Peter",
        "category": "apocalypse",
        "url": f"{ECW_BASE}/text/apocalypsepeter-roberts.html",
        "tradition": "various",
        "date_estimate": "c.100–150",
        "license": "public_domain",  # Roberts-Donaldson
    },
    # === Antigo Testamento extra-canónico ===
    {
        "id": "testament_twelve_patriarchs",
        "title": "Testamento dos Doze Patriarcas",
        "title_en": "Testament of the Twelve Patriarchs",
        "category": "ot_pseudepigrapha",
        "url": f"{ECW_BASE}/text/patriarchs.html",
        "tradition": "jewish_christian",
        "date_estimate": "c.200 aC–200 dC",
        "license": "public_domain",  # Roberts-Donaldson
    },
    # === Textos de Nag Hammadi ===
    {
        "id": "gospel_truth",
        "title": "Evangelho da Verdade",
        "title_en": "Gospel of Truth",
        "category": "nag_hammadi",
        "url": f"{ECW_BASE}/text/gospeltruth.html",
        "tradition": "gnostic_valentinian",
        "date_estimate": "c.140–180",
        "license": "check_rights",  # tradução moderna (Robert M. Grant); descoberto em 1945
    },
    # === Expansão completa do catálogo ECW (Fase 3, resolvido a partir
    # de apocrypha.html e gnostics.html — títulos em português ainda
    # por traduzir, usa-se o inglês como placeholder) ===
    {
        "id": 'oxyrhynchus_1224_gospel',
        "title": 'Oxyrhynchus 1224 Gospel',
        "title_en": 'Oxyrhynchus 1224 Gospel',
        "category": 'apocryphal_gospel',
        "url": 'https://www.earlychristianwritings.com/text/oxyrhynchus1224.html',
        "tradition": "various",
        "date_estimate": "",
        "license": 'check_rights',
    },
    {
        "id": 'egerton_gospel',
        "title": 'Egerton Gospel',
        "title_en": 'Egerton Gospel',
        "category": 'apocryphal_gospel',
        "url": 'https://www.earlychristianwritings.com/text/egerton.html',
        "tradition": "various",
        "date_estimate": "",
        "license": 'check_rights',
    },
    {
        "id": 'secret_gospel_of_mark',
        "title": 'Secret Gospel of Mark',
        "title_en": 'Secret Gospel of Mark',
        "category": 'apocryphal_gospel',
        "url": 'https://www.earlychristianwritings.com/text/secretmark.html',
        "tradition": "various",
        "date_estimate": "",
        "license": 'check_rights',
    },
    {
        "id": 'gospel_of_the_egyptians',
        "title": 'Gospel of the Egyptians',
        "title_en": 'Gospel of the Egyptians',
        "category": 'apocryphal_gospel',
        "url": 'https://www.earlychristianwritings.com/text/gospelegyptians.html',
        "tradition": "various",
        "date_estimate": "",
        "license": 'check_rights',
    },
    {
        "id": 'gospel_of_the_hebrews',
        "title": 'Gospel of the Hebrews',
        "title_en": 'Gospel of the Hebrews',
        "category": 'apocryphal_gospel',
        "url": 'https://www.earlychristianwritings.com/text/gospelhebrews-mrjames.html',
        "tradition": "various",
        "date_estimate": "",
        "license": 'check_rights',
    },
    {
        "id": 'secret_book_of_james_apocryphon_of_james',
        "title": 'Secret Book of James (Apocryphon of James)',
        "title_en": 'Secret Book of James (Apocryphon of James)',
        "category": 'apocryphal_other',
        "url": 'https://www.earlychristianwritings.com/text/secretjames.html',
        "tradition": "various",
        "date_estimate": "",
        "license": 'check_rights',
    },
    {
        "id": 'preaching_of_peter',
        "title": 'Preaching of Peter',
        "title_en": 'Preaching of Peter',
        "category": 'apocryphal_other',
        "url": 'https://www.earlychristianwritings.com/text/preachingpeter.html',
        "tradition": "various",
        "date_estimate": "",
        "license": 'check_rights',
    },
    {
        "id": 'gospel_of_the_ebionites',
        "title": 'Gospel of the Ebionites',
        "title_en": 'Gospel of the Ebionites',
        "category": 'apocryphal_gospel',
        "url": 'https://www.earlychristianwritings.com/text/gospelebionites.html',
        "tradition": "various",
        "date_estimate": "",
        "license": 'check_rights',
    },
    {
        "id": 'gospel_of_the_nazoreans',
        "title": 'Gospel of the Nazoreans',
        "title_en": 'Gospel of the Nazoreans',
        "category": 'apocryphal_gospel',
        "url": 'https://www.earlychristianwritings.com/text/nazoreans-ogg.html',
        "tradition": "various",
        "date_estimate": "",
        "license": 'check_rights',
    },
    {
        "id": 'oxyrhynchus_840_gospel',
        "title": 'Oxyrhynchus 840 Gospel',
        "title_en": 'Oxyrhynchus 840 Gospel',
        "category": 'apocryphal_gospel',
        "url": 'https://www.earlychristianwritings.com/text/poxy840.html',
        "tradition": "various",
        "date_estimate": "",
        "license": 'check_rights',
    },
    {
        "id": 'traditions_of_matthias',
        "title": 'Traditions of Matthias',
        "title_en": 'Traditions of Matthias',
        "category": 'apocryphal_acts',
        "url": 'https://www.earlychristianwritings.com/text/traditionsmatthias.html',
        "tradition": "various",
        "date_estimate": "",
        "license": 'check_rights',
    },
    {
        "id": 'gospel_of_mary',
        "title": 'Gospel of Mary',
        "title_en": 'Gospel of Mary',
        "category": 'apocryphal_gospel',
        "url": 'https://www.earlychristianwritings.com/text/gospelmary.html',
        "tradition": "various",
        "date_estimate": "",
        "license": 'check_rights',
    },
    {
        "id": 'dialogue_of_the_savior',
        "title": 'Dialogue of the Savior',
        "title_en": 'Dialogue of the Savior',
        "category": 'nag_hammadi',
        "url": 'https://www.earlychristianwritings.com/text/dialoguesavior.html',
        "tradition": "various",
        "date_estimate": "",
        "license": 'check_rights',
    },
    {
        "id": 'epistula_apostolorum',
        "title": 'Epistula Apostolorum',
        "title_en": 'Epistula Apostolorum',
        "category": 'apocryphal_epistle',
        "url": 'https://www.earlychristianwritings.com/text/apostolorum.html',
        "tradition": "various",
        "date_estimate": "",
        "license": 'check_rights',
    },
    {
        "id": 'acts_of_john',
        "title": 'Acts of John',
        "title_en": 'Acts of John',
        "category": 'apocryphal_acts',
        "url": 'https://www.earlychristianwritings.com/text/actsjohn.html',
        "tradition": "various",
        "date_estimate": "",
        "license": 'check_rights',
    },
    {
        "id": 'acts_of_andrew',
        "title": 'Acts of Andrew',
        "title_en": 'Acts of Andrew',
        "category": 'apocryphal_acts',
        "url": 'https://www.earlychristianwritings.com/text/actsandrew.html',
        "tradition": "various",
        "date_estimate": "",
        "license": 'check_rights',
    },
    {
        "id": 'acts_of_peter_and_the_twelve',
        "title": 'Acts of Peter and the Twelve',
        "title_en": 'Acts of Peter and the Twelve',
        "category": 'apocryphal_acts',
        "url": 'https://www.earlychristianwritings.com/text/actspetertwelve.html',
        "tradition": "various",
        "date_estimate": "",
        "license": 'check_rights',
    },
    {
        "id": 'book_of_thomas_the_contender',
        "title": 'Book of Thomas the Contender',
        "title_en": 'Book of Thomas the Contender',
        "category": 'nag_hammadi',
        "url": 'https://www.earlychristianwritings.com/text/thomascontender.html',
        "tradition": "various",
        "date_estimate": "",
        "license": 'check_rights',
    },
    {
        "id": 'acts_of_thomas',
        "title": 'Acts of Thomas',
        "title_en": 'Acts of Thomas',
        "category": 'apocryphal_acts',
        "url": 'https://www.earlychristianwritings.com/text/actsthomas.html',
        "tradition": "various",
        "date_estimate": "",
        "license": 'check_rights',
    },
    {
        "id": 'fragments_of_basilides',
        "title": 'Fragments of Basilides',
        "title_en": 'Fragments of Basilides',
        "category": 'gnostic_fragment',
        "url": 'https://www.earlychristianwritings.com/text/basilides.html',
        "tradition": "various",
        "date_estimate": "",
        "license": 'check_rights',
    },
    {
        "id": 'naassene_fragment',
        "title": 'Naassene Fragment',
        "title_en": 'Naassene Fragment',
        "category": 'gnostic_fragment',
        "url": 'https://www.earlychristianwritings.com/text/naassene.html',
        "tradition": "various",
        "date_estimate": "",
        "license": 'check_rights',
    },
    {
        "id": 'fragments_of_marcion',
        "title": 'Fragments of Marcion',
        "title_en": 'Fragments of Marcion',
        "category": 'gnostic_fragment',
        "url": 'https://www.earlychristianwritings.com/text/gospellord.html',
        "tradition": "various",
        "date_estimate": "",
        "license": 'check_rights',
    },
    {
        "id": 'fragment_of_epiphanes',
        "title": 'Fragment of Epiphanes',
        "title_en": 'Fragment of Epiphanes',
        "category": 'gnostic_fragment',
        "url": 'https://www.earlychristianwritings.com/text/epiphanes.html',
        "tradition": "various",
        "date_estimate": "",
        "license": 'check_rights',
    },
    {
        "id": 'ophite_diagrams',
        "title": 'Ophite Diagrams',
        "title_en": 'Ophite Diagrams',
        "category": 'gnostic_fragment',
        "url": 'https://www.earlychristianwritings.com/text/ophite.html',
        "tradition": "various",
        "date_estimate": "",
        "license": 'check_rights',
    },
    {
        "id": 'letter_of_ptolemy_to_flora',
        "title": 'Letter of Ptolemy to Flora',
        "title_en": 'Letter of Ptolemy to Flora',
        "category": 'apocryphal_epistle',
        "url": 'https://www.earlychristianwritings.com/text/ptolemy.html',
        "tradition": "various",
        "date_estimate": "",
        "license": 'check_rights',
    },
    {
        "id": 'excerpts_of_theodotus',
        "title": 'Excerpts of Theodotus',
        "title_en": 'Excerpts of Theodotus',
        "category": 'gnostic_fragment',
        "url": 'https://www.earlychristianwritings.com/text/theodotus.html',
        "tradition": "various",
        "date_estimate": "",
        "license": 'check_rights',
    },
    {
        "id": 'fragments_of_heracleon',
        "title": 'Fragments of Heracleon',
        "title_en": 'Fragments of Heracleon',
        "category": 'gnostic_fragment',
        "url": 'https://www.earlychristianwritings.com/text/heracleon.html',
        "tradition": "various",
        "date_estimate": "",
        "license": 'check_rights',
    },
]

# Notas: 1 Enoque e o Livro dos Jubileus não estão disponíveis neste site —
# precisam de outra fonte (ver PLAN.md, Fase 3).


def extract_main_text(soup: BeautifulSoup) -> list[dict]:
    """
    Extrai o texto principal de uma página de tradução do ECW.

    O HTML é antigo e usa tags <p> sem fecho, o que produz uma árvore DOM
    pouco fiável de percorrer diretamente. Em vez disso, usamos o texto
    plano renderizado do contentor principal e dividimos em blocos por
    linhas em branco — funciona de forma consistente em todas as obras
    testadas (Tomé, Pedro, Barnabé, Didaqué, Pastor de Hermas, etc.),
    independentemente de cada uma ter o seu próprio esquema de numeração
    (ou nenhum).
    """
    container = (
        soup.find("div", id="textboundingbox")
        or soup.find("div", id="infolayer")
        or soup.find("body")
    )
    if not container:
        return []

    for tag in container.find_all(["script", "style", "ins", "iframe"]):
        tag.decompose()
    for tag in container.find_all(["div"], id=lambda i: i and "ad" in i.lower()):
        tag.decompose()

    text = container.get_text(separator="\n")
    lines = [ln.strip() for ln in text.split("\n")]

    blocks = []
    current: list[str] = []
    for line in lines:
        if line:
            current.append(line)
        elif current:
            blocks.append(" ".join(current))
            current = []
    if current:
        blocks.append(" ".join(current))

    skip_markers = ("please buy the cd", "mla style", "kirby, peter", "go to the")
    sections = []
    for block in blocks:
        if len(block) < 30:
            continue
        if any(block.lower().startswith(m) for m in skip_markers):
            continue
        sections.append({"section": len(sections) + 1, "text": block[:4000]})

    return sections


def fetch_apocryphal_text(work: dict) -> dict | None:
    """Fetch e extracção de um texto apócrifo."""
    log.info(f"  A fazer fetch: {work['title_en']} ({work['url']})")

    r = None
    for attempt in range(3):
        try:
            r = requests.get(work["url"], timeout=20, headers={"User-Agent": "Mozilla/5.0"})
            if r.status_code == 200:
                break
            log.warning(f"  HTTP {r.status_code}")
        except requests.RequestException as e:
            log.error(f"  Erro: {e}")
        time.sleep(2 ** attempt)

    if not r or r.status_code != 200:
        return None

    soup = BeautifulSoup(r.text, "html.parser")
    sections = extract_main_text(soup)

    if not sections:
        log.warning(f"  Sem conteúdo extraído!")
        return None

    return {
        **{k: v for k, v in work.items() if k not in ("url", "license")},
        "source_url":    work["url"],
        "language":      "en",
        "license":       work["license"],
        "sections":      sections,
        "section_count": len(sections),
    }


def fetch_all_apocrypha(output_dir: str = "output/apocrypha", delay: float = 1.0):
    """
    Faz fetch de todos os textos apócrifos do catálogo.
    Guarda cada obra em output_dir/{category}/{id}.json
    """
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    summary = []

    for work in APOCRYPHA:
        category_dir = out / work["category"]
        category_dir.mkdir(exist_ok=True, parents=True)

        data = fetch_apocryphal_text(work)
        if data:
            out_file = category_dir / f"{work['id']}.json"
            out_file.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
            log.info(f"  ✓ {data['section_count']} secções → {out_file}")
            summary.append({
                "id": work["id"],
                "title": work["title_en"],
                "category": work["category"],
                "sections": data["section_count"],
            })
        else:
            log.warning(f"  ✗ Falhou: {work['title_en']}")
            summary.append({
                "id": work["id"],
                "title": work["title_en"],
                "category": work["category"],
                "sections": 0,
            })

        time.sleep(delay)

    (out / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    log.info(f"\nConcluído: {sum(1 for s in summary if s['sections'] > 0)}/{len(APOCRYPHA)} textos obtidos.")
    return summary


if __name__ == "__main__":
    fetch_all_apocrypha()
