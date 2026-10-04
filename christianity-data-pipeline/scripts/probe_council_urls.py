"""Sonda URLs do newadvent.org para encontrar as páginas certas dos concílios."""
import re, requests
from bs4 import BeautifulSoup

HEADERS = {"User-Agent": "ApoloChristus/1.0 (academic)"}

CANDIDATES = {
    "ephesus":           ["https://www.newadvent.org/fathers/3816.htm",
                          "https://www.newadvent.org/fathers/3808.htm",
                          "https://www.newadvent.org/fathers/3817.htm"],
    "constantinople_ii": ["https://www.newadvent.org/fathers/3815.htm",
                          "https://www.newadvent.org/fathers/3819.htm",
                          "https://www.newadvent.org/fathers/3820.htm"],
    "constantinople_iii":["https://www.newadvent.org/fathers/3821.htm",
                          "https://www.newadvent.org/fathers/3822.htm"],
    "nicaea_ii":         ["https://www.newadvent.org/fathers/3818.htm",
                          "https://www.newadvent.org/fathers/3823.htm"],
}

for council, urls in CANDIDATES.items():
    print(f"\n[{council}]")
    for url in urls:
        try:
            r = requests.get(url, headers=HEADERS, timeout=15)
            if r.status_code != 200:
                print(f"  HTTP {r.status_code}  {url}")
                continue
            soup = BeautifulSoup(r.text, "html.parser")
            title = soup.find("title")
            title_text = title.get_text(strip=True) if title else "?"
            # contar ocorrências de "Canon" no texto
            body_text = soup.get_text()
            canon_matches = re.findall(r"Canon\s+\d+", body_text, re.IGNORECASE)
            print(f"  OK  {url}")
            print(f"      Título: {title_text[:80]}")
            print(f"      'Canon N' encontrados: {len(canon_matches)} — {canon_matches[:5]}")
        except Exception as e:
            print(f"  ERRO: {e}  {url}")
