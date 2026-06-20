"""
Fetcher de geografia bíblica via OpenBible.info (CC-BY 4.0, requer
atribuição a OpenBible.info — não é domínio público puro).

Fonte: https://www.openbible.info/geo/data/merged.txt — TSV com 1274
locais bíblicos. Usamos "merged.txt" em vez de "places.txt" porque já
resolve coordenadas para referências indiretas (ex: "Abarim" não tem
coordenadas próprias, mas o ficheiro resolve para as coordenadas do seu
"root" — "Mount Nebo"); o "places.txt" só tem coordenadas diretas
(1056/1274 entradas, vs 1274/1274 no merged.txt).

Formato (verificado): ESV Name \t Root \t Lat \t Lon \t Verses \t Comment
  - Lat/Lon podem ter prefixo '~' (aproximado) ou '>'/'<' (a localização
    real é uma área maior/menor que o ponto, ex: uma região ou uma porta
    dentro de uma cidade) — removidos antes de converter para float.
  - "Verses" é uma lista separada por vírgulas de referências em formato
    livre (ex: "Gen 35:8, Josh 21:18") — guardadas como texto, sem
    parsing estruturado para livro/capítulo/versículo (fora do âmbito
    desta passagem; o valor principal aqui é a localização em si).
"""

import json
import logging
import re
from pathlib import Path

import requests

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

DATA_URL = "https://www.openbible.info/geo/data/merged.txt"

COORD_PREFIX_RE = re.compile(r"^[~<>]+")


def parse_coord(raw: str) -> tuple[float | None, bool]:
    """Devolve (valor, is_approximate). raw pode ter prefixo ~/</>."""
    raw = raw.strip()
    if not raw:
        return None, False
    is_approx = raw.startswith("~")
    cleaned = COORD_PREFIX_RE.sub("", raw)
    try:
        return float(cleaned), is_approx
    except ValueError:
        return None, False


def download_and_parse() -> list[dict]:
    log.info(f"A descarregar {DATA_URL} ...")
    r = requests.get(DATA_URL, timeout=30, headers={"User-Agent": "Mozilla/5.0"})
    r.raise_for_status()
    lines = r.text.splitlines()

    places = []
    skipped = 0
    for line in lines:
        if line.startswith("#") or not line.strip():
            continue
        parts = line.split("\t")
        if len(parts) < 4:
            skipped += 1
            continue

        name = parts[0].strip()
        root = parts[1].strip() if len(parts) > 1 else ""
        lat_raw = parts[2].strip() if len(parts) > 2 else ""
        lon_raw = parts[3].strip() if len(parts) > 3 else ""
        verses_raw = parts[4].strip() if len(parts) > 4 else ""
        comment = parts[5].strip() if len(parts) > 5 else ""

        if not name:
            skipped += 1
            continue

        lat, lat_approx = parse_coord(lat_raw)
        lon, lon_approx = parse_coord(lon_raw)
        if lat is None or lon is None:
            skipped += 1
            continue

        verses = [v.strip() for v in verses_raw.split(",") if v.strip()]

        places.append({
            "name": name,
            "root_name": root or None,
            "lat": lat,
            "lon": lon,
            "is_approximate": lat_approx or lon_approx,
            "verses": verses,
            "comment": comment or None,
        })

    log.info(f"Resultado: {len(places)} locais ({skipped} linhas ignoradas).")
    return places


def fetch_all_places(output_dir: str = "output/geography"):
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    places = download_and_parse()

    out_file = out / "biblical_places.json"
    out_file.write_text(json.dumps(places, ensure_ascii=False), encoding="utf-8")
    log.info(f"Guardado em {out_file} ({len(places)} locais).")
    return places


if __name__ == "__main__":
    fetch_all_places()
