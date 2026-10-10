# -*- coding: utf-8 -*-
"""
Recorta capitulos do Miller's Anesthesia (PDF em ingles) usando os bookmarks do proprio arquivo.
Uso: python3 scripts/extrai-miller.py <pasta_saida> <cap> [cap ...]
"""
import fitz, re, sys, os
d = fitz.open('exports/referencias/Miller 2025 10ed.pdf')
marcas = [(t[1], t[2]) for t in d.get_toc() if re.match(r'^\d+\.\s', t[1])]
mapa = {}
for i, (titulo, pag) in enumerate(marcas):
    fim = marcas[i + 1][1] - 1 if i + 1 < len(marcas) else d.page_count
    mapa[titulo.split('.')[0]] = (titulo, pag, fim)
saida = sys.argv[1]; os.makedirs(saida, exist_ok=True)
for cap in sys.argv[2:]:
    titulo, ini, fim = mapa[cap]
    corpo = '\n'.join(d[p].get_text() for p in range(ini - 1, min(fim, d.page_count)))
    open(f'{saida}/miller_cap{cap}.txt', 'w').write(corpo)
    print(f'cap {cap}: paginas {ini} a {fim} | {len(corpo)} chars | {titulo}')
