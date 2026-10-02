# -*- coding: utf-8 -*-
"""
Valida um lote de questoes de multipla escolha (provas quadrimestrais e Prova Nacional)
contra o texto extraido do PDF da banca.

Confere: prefixo do docId, 4 alternativas unicas, gabarito igual ao "Resp." da fonte,
alternativas na mesma ordem da fonte, tracos proibidos, citacao de letra na explicacao,
estrutura <p> com "Por que as demais estao incorretas", tamanho minimo, referencia,
e lista as diferencas de texto (enunciado e alternativas) contra a fonte.

Uso: python3 scripts/valida-me.py <lote.json> <fonte.txt> <prefixo_docId>
"""
import json, re, sys, unicodedata, difflib

lote, fonte, prefixo = sys.argv[1], sys.argv[2], sys.argv[3]
qs = json.load(open(lote))
txt = open(fonte, encoding='utf-8').read()
txt = re.sub(r'PROVA QUADRIMESTRAL.*?\n\s*CCA\s*\n\s*Sociedade Brasileira de Anestesiologia\s*\n\s*\d+\s*\n', '\n', txt)

def norm(s):
    s = unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', ' ', s).split()

fonte_q = {}
for m in re.finditer(r'(?:^|\n)\s*(\d{1,2})-\s(.*?)(?=\n\s*\d{1,2}-\s|\Z)', txt, re.S):
    num, corpo = int(m.group(1)), m.group(2)
    r = re.search(r'Resp\.?\s*([A-D])', corpo)
    enun = re.split(r'\n\s*Quest[õo]es\s*\n', corpo)[0]
    ops = re.findall(r'\n\s*([A-D])\s*\n(.*?)(?=\n\s*[A-D]\s*\n|\n\s*Resp\.)', corpo, re.S)
    fonte_q[num] = {'gab': r.group(1) if r else None, 'enun': enun, 'ops': [o[1] for o in ops]}

probs, difs = [], []
for q in qs:
    i = q['id']
    if not i.startswith(prefixo): probs.append(f'{i}: prefixo')
    n = int(i.rsplit('_Q', 1)[1])
    f = fonte_q.get(n)
    if len(q['o']) != 4 or len(set(q['o'])) != 4: probs.append(f'{i}: alternativas')
    if not f: probs.append(f'{i}: questao {n} nao encontrada na fonte'); continue
    if f['gab'] != q['gab'] and 'ALTERAD' not in (q.get('nota') or '').upper():
        probs.append(f'{i}: gabarito {q["gab"]} difere da fonte {f["gab"]}')
    for pat, nome in ((r'—', 'travessao'), (r'(?<!<)--', 'hifen duplo'), (r'__', 'underscore')):
        if re.search(pat, q['e'] + q['p'] + ''.join(q['o'])): probs.append(f'{i}: {nome}')
    if re.search(r'\b(alternativa|letra|op[çc][ãa]o) [A-D]\b|\([A-D]\)', q['e']): probs.append(f'{i}: cita letra')
    if not q['e'].startswith('<p>') or 'Por que as demais est' not in q['e']: probs.append(f'{i}: estrutura da explicacao')
    if len(re.sub('<[^>]+>', '', q['e'])) < 700: probs.append(f'{i}: explicacao curta')
    if not q.get('r'): probs.append(f'{i}: sem referencia')
    corpo = re.sub(r'^\([^)]*\)\s*', '', q['p'])
    pares = [('enunciado', f['enun'], corpo)] + [(f'alt {"ABCD"[j]}', f['ops'][j] if j < len(f['ops']) else '', q['o'][j]) for j in range(4)]
    for nome, a, b in pares:
        a, b = norm(a), norm(b)
        for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b).get_opcodes():
            if tag != 'equal':
                difs.append(f'{i} {nome}: [{" ".join(a[i1:i2])}] -> [{" ".join(b[j1:j2])}]')

print(f'questoes: {len(qs)} | na fonte: {len(fonte_q)}')
print('gabaritos:', {k: sum(q['gab'] == k for q in qs) for k in 'ABCD'})
print('com nota:', [q['id'] for q in qs if q.get('nota')])
print('\ndiferencas de texto:'); print('\n'.join(difs) or '  nenhuma')
print('\nproblemas:', 'nenhum' if not probs else ''); print('\n'.join(probs))
