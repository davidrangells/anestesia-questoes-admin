# -*- coding: utf-8 -*-
"""
Valida o lote da Prova Nacional ME3 2021 (multipla escolha, 4 alternativas).
A prova so existe em foto, entao nao ha texto da banca para comparar: o que este
script protege e o gabarito congelado, a estrutura do comentario e o tema/referencia.

Uso: python3 scripts/valida-pn-2021.py <lote.json>
"""
import json, re, sys, os
from collections import Counter

lote = sys.argv[1]
qs = json.load(open(lote, encoding='utf-8'))

GAB_OFICIAL = "BCDBCBDBCCCCDCDBCBABCCBADABBBBCADBCCBDBD"
mapa = os.path.join(os.path.dirname(os.path.abspath(__file__)), '_temas_nivel.json')
temas_ok = set(json.load(open(mapa, encoding='utf-8'))) if os.path.exists(mapa) else set()

probs = []
for q in qs:
    i = q['id']
    n = int(i[-2:])
    if q['gab'] != GAB_OFICIAL[n-1]:
        probs.append(f'{i}: gabarito {q["gab"]} difere do oficial {GAB_OFICIAL[n-1]}')
    if len(q['o']) != 4 or len(set(q['o'])) != 4:
        probs.append(f'{i}: alternativas')
    if not q['p'].startswith('(ME3-2021) '):
        probs.append(f'{i}: enunciado sem o rotulo da prova')
    e = q.get('e') or ''
    if not e:
        probs.append(f'{i}: sem comentario'); continue
    if not e.startswith('<p>'): probs.append(f'{i}: comentario nao comeca com paragrafo')
    if 'Por que as demais est' not in e: probs.append(f'{i}: falta o paragrafo final das incorretas')
    visivel = len(re.sub(r'<[^>]+>', '', e))
    if visivel < 700: probs.append(f'{i}: comentario curto ({visivel} ch)')
    for pat, nome in ((r'—','travessao'), (r'(?<!<)--','hifen duplo'), (r'__','underscore')):
        if re.search(pat, e): probs.append(f'{i}: {nome} no comentario')
    if re.search(r'\b(alternativa|letra|op[çc][ãa]o)\s+[A-E]\b|\([A-E]\)', e):
        probs.append(f'{i}: cita letra de alternativa')
    if not q.get('tema'): probs.append(f'{i}: sem tema')
    elif temas_ok and q['tema'] not in temas_ok: probs.append(f'{i}: tema fora do catalogo -> {q["tema"]}')
    if not q.get('r'): probs.append(f'{i}: sem referencia')

print(f'questoes: {len(qs)}')
print('gabaritos:', dict(Counter(q['gab'] for q in qs)))
print('com figura:', [q['id'] for q in qs if q.get('img')] or 'nenhuma')
print('com nota interna:', [q['id'] for q in qs if q.get('nota')] or 'nenhuma')
print('comentario (media de caracteres):', round(sum(len(re.sub(r'<[^>]+>','',q.get('e') or '')) for q in qs) / max(1,len(qs))))
print('\nproblemas:', 'nenhum' if not probs else len(probs))
print('\n'.join(probs))
