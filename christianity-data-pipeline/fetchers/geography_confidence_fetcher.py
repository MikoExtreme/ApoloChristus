"""
Enriquece `biblical_places` (já carregada a partir de merged.txt, ver
geography_fetcher.py) com percentagem de confiança e fontes académicas
por local, a partir do dataset estruturado mais recente do OpenBible.info
(github.com/openbibleinfo/Bible-Geocoding-Data, CC-BY 4.0).

O `merged.txt` usado antes é a versão "2007, simplificada" dos dados
(confirmado no próprio site). Este novo dataset em JSON Lines tem um
sistema de pontuação muito mais elaborado (múltiplos caminhos de
identificação, regressão temporal por década de publicação, taxonomia
de tipos de voto) — para não replicar esse aparato académico inteiro,
usamos só:
  - `time_total` da identificação com maior pontuação: já é o número
    "principal" que a própria documentação do dataset designa como
    resumo de confiança atual (escala 0–1000, convertida aqui para %).
  - `identification_sources`: dicionário de IDs de fonte -> resolvido
    para o nome legível via `source.jsonl`.

Correspondência por nome ao `biblical_places` já carregado: o novo
dataset desambigua locais com o mesmo nome em entradas separadas (ex:
"Gath 1", "Gath 2", "Gath 3"), com numeração que NÃO necessariamente
coincide com a do `merged.txt` mais antigo — por isso só atualizamos
locais com correspondência EXATA de nome (~85%, 1050/1232); os restantes
ficam sem confiança/fontes em vez de arriscar uma correspondência errada.
"""

import json
import logging
from pathlib import Path

import requests

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

RAW_BASE = "https://raw.githubusercontent.com/openbibleinfo/Bible-Geocoding-Data/master/data"


def load_sources() -> dict[str, str]:
    url = f"{RAW_BASE}/source.jsonl"
    log.info(f"A descarregar {url} ...")
    r = requests.get(url, timeout=60)
    r.raise_for_status()
    sources = {}
    for line in r.text.splitlines():
        if not line.strip():
            continue
        obj = json.loads(line)
        sources[obj["id"]] = obj.get("display_name", obj["id"])
    log.info(f"  {len(sources)} fontes carregadas.")
    return sources


def best_identification_confidence(identifications: list[dict]) -> int:
    totals = [
        ident.get("score", {}).get("time_total", 0)
        for ident in identifications
    ]
    return max(totals) if totals else 0


def fetch_confidence_and_sources(output_dir: str = "output/geography") -> list[dict]:
    sources_map = load_sources()

    url = f"{RAW_BASE}/ancient.jsonl"
    log.info(f"A descarregar {url} ...")
    r = requests.get(url, timeout=120)
    r.raise_for_status()

    enrichments = []
    for line in r.text.splitlines():
        if not line.strip():
            continue
        obj = json.loads(line)
        name = obj.get("friendly_id")
        if not name:
            continue

        confidence_raw = best_identification_confidence(obj.get("identifications", []))
        # 0-1000 -> 0-100. A regressão linear de "time_total" pode extrapolar
        # ligeiramente fora de [0,1000] em casos de tendência acentuada
        # (ex: "Ham 2" chega a 1169) — sem sentido como percentagem, por
        # isso fica limitado a [0,100].
        confidence_pct = max(0, min(100, round(confidence_raw / 10)))

        source_ids = list(obj.get("identification_sources", {}).keys())
        source_names = sorted({sources_map.get(sid, sid) for sid in source_ids})

        enrichments.append({
            "name": name,
            "confidence_pct": confidence_pct,
            "sources": source_names,
        })

    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    out_file = out / "geography_confidence.json"
    out_file.write_text(json.dumps(enrichments, ensure_ascii=False), encoding="utf-8")
    log.info(f"Guardado {len(enrichments)} enriquecimentos em {out_file}")
    return enrichments


if __name__ == "__main__":
    fetch_confidence_and_sources()
