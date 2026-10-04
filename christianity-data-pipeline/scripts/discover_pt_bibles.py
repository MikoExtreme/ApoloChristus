"""Descobre versões PT da Bíblia disponíveis em fontes públicas conhecidas."""
import requests

CANDIDATES = [
    # BibliaJFAAL org — especializada em Bíblias PT livres
    ("BibliaJFAAL/JFAAL — 1819", "https://raw.githubusercontent.com/BibliaJFAAL/JFAAL/main/original/1819-JFA.json"),
    ("BibliaJFAAL/JFAAL — 1842", "https://raw.githubusercontent.com/BibliaJFAAL/JFAAL/main/original/1842-JFA.json"),
    ("BibliaJFAAL/JFAAL — 1877", "https://raw.githubusercontent.com/BibliaJFAAL/JFAAL/main/original/1877-JFA.json"),
    ("BibliaJFAAL/JFAAL — 1898", "https://raw.githubusercontent.com/BibliaJFAAL/JFAAL/main/original/1898-JFA.json"),
    ("BibliaJFAAL/JFAAL — 1917", "https://raw.githubusercontent.com/BibliaJFAAL/JFAAL/main/original/1917-JFA.json"),
    # Repositório isbdnt/bible (JSON, múltiplas línguas)
    ("isbdnt/bible — pt.json", "https://raw.githubusercontent.com/isbdnt/bible/master/json/pt.json"),
    # christos-c/bible-corpus (corpus NLP, XML OSIS)
    ("christos-c — Portuguese.xml", "https://raw.githubusercontent.com/christos-c/bible-corpus/master/bibles/Portuguese.xml"),
    # Thiagobodruk — outros ficheiros
    ("thiagobodruk — nvi-pt.json", "https://raw.githubusercontent.com/thiagobodruk/biblia/master/json/nvi-pt.json"),
    ("thiagobodruk — nvt.json", "https://raw.githubusercontent.com/thiagobodruk/biblia/master/json/nvt.json"),
]

print("A verificar fontes...\n")
for label, url in CANDIDATES:
    try:
        r = requests.head(url, timeout=10, allow_redirects=True)
        size = r.headers.get("Content-Length", "?")
        size_kb = f"{int(size)//1024}KB" if size != "?" else "?"
        status = "OK" if r.status_code == 200 else f"HTTP {r.status_code}"
        print(f"  [{status}] {size_kb:>8}  {label}")
        print(f"           {url}")
    except Exception as e:
        print(f"  [ERRO]           {label}: {e}")
    print()
