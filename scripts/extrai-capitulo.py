# -*- coding: utf-8 -*-
"""
Extrai o texto de capitulos do SAESP a partir dos chunks em exports/referencias/txt/saesp.
Uso: python3 scripts/extrai-capitulo.py <pasta_saida> <cap> [cap ...]
"""
import json, re, glob, sys, os
toc = json.load(open('scripts/_toc2.json', encoding='utf-8'))['saesp']
txt = ''.join(open(f, encoding='utf-8', errors='ignore').read()
              for f in sorted(glob.glob('exports/referencias/txt/saesp/chunk-*.txt')))
ACENTOS = str.maketrans('áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
                        'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC')
def n(s):  # preserva o comprimento, para que as posicoes valham no texto original
    return re.sub(r'\s', ' ', s.translate(ACENTOS).lower())
T = n(txt)
def inicio(cap):
    titulo = re.split(r'\s{2,}|▪', toc[cap])[0].strip()
    alvo = n(titulo)[:60].strip()
    pos = [m.start() for m in re.finditer(re.escape(alvo), T)]
    return pos[-1] if pos else None
starts = {c: inicio(c) for c in toc}
ordem = sorted((p, c) for c, p in starts.items() if p is not None)
lim = {c: (p, next((q for q, _ in ordem if q > p), len(T))) for p, c in ordem}
saida = sys.argv[1]; os.makedirs(saida, exist_ok=True)
for cap in sys.argv[2:]:
    a, b = lim[cap]
    open(f'{saida}/cap{cap}.txt', 'w').write(txt[a:b])
    print(f'cap {cap}: {b-a} chars | {toc[cap][:60]}')
