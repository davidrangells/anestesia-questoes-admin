# -*- coding: utf-8 -*-
"""
Valida um lote de questoes no formato Verdadeiro/Falso convertido para multipla escolha.
Confere estilo e, sobretudo, se a alternativa marcada como correta bate com o padrao
V/F que a propria explicacao descreve item a item, e se nenhuma distratora tambem bate.

Uso: python3 scripts/valida-vf.py <arquivo.json> <prefixo_docid> <nivel>
"""
import json, re, sys, unicodedata
from collections import Counter

arq, prefixo = sys.argv[1], sys.argv[2]
qs = json.load(open(arq))
ROM = {'I':1,'II':2,'III':3,'IV':4,'V':5}
probs, ids, temas = [], set(), set()

for q in qs:
    i = q['id']
    if i in ids: probs.append(f'{i}: id duplicado')
    ids.add(i); temas.add(q['tema'])
    if not i.startswith(prefixo): probs.append(f'{i}: docId fora do padrao')
    if len(q['o']) != 4: probs.append(f'{i}: {len(q["o"])} alternativas')
    if len(set(q['o'])) != 4: probs.append(f'{i}: alternativas repetidas')
    if q['gab'] not in 'ABCD': probs.append(f'{i}: gabarito invalido')
    for r in ROM:
        if f'\n{r} - ' not in q['p']: probs.append(f'{i}: falta item {r} no enunciado')
    for pat, nome in ((r'—','travessao'), (r'(?<!<)--','hifen duplo'), (r'__','underscore')):
        n = len(re.findall(pat, q['e']))
        if n: probs.append(f'{i}: {n}x {nome} na explicacao')
    if re.search(r'\balternativa [A-E]\b', q['e']): probs.append(f'{i}: cita letra de alternativa')
    if '<p>' not in q['e']: probs.append(f'{i}: sem paragrafo html')
    if not q.get('r'): probs.append(f'{i}: sem referencia')
    n = len(re.sub(r'<[^>]+>', '', q['e']))
    if n < 700: probs.append(f'{i}: explicacao curta ({n} ch)')

    vf = {}
    for m in re.finditer(r'<strong>(I{1,3}|IV|V)\.</strong>\s*(Verdadeira|Falsa)', q['e']):
        vf[ROM[m.group(1)]] = (m.group(2) == 'Verdadeira')
    if len(vf) != 5:
        probs.append(f'{i}: explicacao rotula {len(vf)}/5 itens'); continue
    verd = {k for k, v in vf.items() if v}
    fals = {k for k, v in vf.items() if not v}
    for j, o in enumerate(q['o']):
        t = unicodedata.normalize('NFD', o.lower())
        t = ''.join(c for c in t if unicodedata.category(c) != 'Mn')
        nums = {ROM[x] for x in re.findall(r'\b(I{1,3}|IV|V)\b', o)}
        bate = (('todas' in t and 'verdadeira' in t and len(verd) == 5) or
                ('todas' in t and 'falsa' in t and len(fals) == 5) or
                ('verdadeira' in t and 'todas' not in t and nums == verd) or
                ('falsa' in t and 'todas' not in t and nums == fals))
        certa = (j == 'ABCD'.index(q['gab']))
        if bate and not certa:
            probs.append(f'{i}: distratora {"ABCD"[j]} tambem esta correta -> "{o}"')
        if certa and not bate:
            probs.append(f'{i}: GABARITO NAO BATE -> "{o}" | explicacao diz V={sorted(verd)} F={sorted(fals)}')

print(f'questoes: {len(qs)}')
print('por prova:', dict(Counter(x['id'].split('_Q')[0] for x in qs)))
print('gabaritos:', dict(Counter(x['gab'] for x in qs)))
print('com figura:', [x['id'] for x in qs if x.get('img')] or 'nenhuma')
print('com nota interna:', [x['id'] for x in qs if x.get('nota')] or 'nenhuma')
json.dump(sorted(temas), open('/tmp/temas_usados.json', 'w'), ensure_ascii=False)
print()
print('problemas:', 'nenhum' if not probs else len(probs))
for p in probs: print('  -', p)
sys.exit(1 if probs else 0)
