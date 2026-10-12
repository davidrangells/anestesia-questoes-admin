# -*- coding: utf-8 -*-
"""
Valida um lote de questoes autorais do Quest (multipla escolha, 4 alternativas):
formato, embaralhamento seguro, tamanho da explicacao, tema e referencia,
originalidade contra o texto dos capitulos (n-gramas) e duplicidade contra o banco.

Uso: python3 scripts/valida-autorais.py <lote.json> [--fonte=<pasta_dos_capitulos>] [--banco=<prompts.json>]
"""
import json, re, sys, unicodedata, html, collections, glob, os, difflib

lote = sys.argv[1]
fonte = next((a.split('=', 1)[1] for a in sys.argv[2:] if a.startswith('--fonte=')), None)
banco = next((a.split('=', 1)[1] for a in sys.argv[2:] if a.startswith('--banco=')), None)
qs = json.load(open(lote, encoding='utf-8'))

# nivel = ano do ponto da SBA a que o tema pertence, nunca a dificuldade da questao
mapa_nivel = {}
_mapa = os.path.join(os.path.dirname(os.path.abspath(__file__)), '_temas_nivel.json')
if os.path.exists(_mapa):
    mapa_nivel = {k: v['nivel'] for k, v in json.load(open(_mapa, encoding='utf-8')).items()}

def txt(h): return re.sub(r'\s+', ' ', html.unescape(re.sub('<[^>]+>', ' ', h or ''))).strip()
def norm(s):
    s = unicodedata.normalize('NFD', s or '').encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()
def ngrams(s, k=10):
    w = norm(s).split()
    return {' '.join(w[i:i+k]) for i in range(max(0, len(w) - k + 1))}

probs = []
fonte_ng = set()
if fonte:
    for f in glob.glob(f'{fonte}/*.txt'):
        fonte_ng |= ngrams(open(f, encoding='utf-8', errors='ignore').read())

banco_prompts = {}
if banco and os.path.exists(banco):
    banco_prompts = {k: norm(v) for k, v in json.load(open(banco, encoding='utf-8')).items()}

vistos = {}
for q in qs:
    i = q.get('id', '?')
    for campo in ('id', 'tema', 'nivel', 'gab', 'p', 'o', 'e', 'r'):
        if not q.get(campo): probs.append(f'{i}: falta {campo}')
    if q.get('nivel') not in ('R1', 'R2', 'R3'): probs.append(f'{i}: nivel invalido')
    esperado = mapa_nivel.get(q.get('tema'))
    if esperado and q.get('nivel') != esperado:
        probs.append(f"{i}: nivel {q.get('nivel')} mas o tema e do {esperado}")
    if q.get('tema') and mapa_nivel and q.get('tema') not in mapa_nivel:
        probs.append(f"{i}: tema fora do catalogo -> {q.get('tema')}")
    if q.get('gab') not in list('ABCD'): probs.append(f'{i}: gabarito invalido')
    o = q.get('o') or []
    if len(o) != 4 or len({norm(x) for x in o}) != 4: probs.append(f'{i}: alternativas')
    corpo = (q.get('p', '') + ' ' + ' '.join(o) + ' ' + txt(q.get('e', '')))
    for pat, nome in ((r'—', 'travessao'), (r'(?<!<)--', 'hifen duplo'), (r'__', 'underscore')):
        if re.search(pat, corpo): probs.append(f'{i}: {nome}')
    if re.search(r'\b(alternativa|letra|op[çc][ãa]o|item)s?\s+[A-E]\b|\([A-E]\)|todas as (anteriores|acima)|nenhuma das', corpo, re.I):
        probs.append(f'{i}: referencia a letra ou posicao')
    if re.search(r'\b(figura|gr[áa]fico|tabela|imagem|tra[çc]ado|abaixo ilustra)\b', q.get('p', ''), re.I):
        probs.append(f'{i}: enunciado depende de imagem')
    if re.search(r'incorret[ao]|falsa', q.get('p', ''), re.I) and 'assinale' in q.get('p', '').lower():
        probs.append(f'{i}: enunciado pede a incorreta')
    e = q.get('e', '')
    if not e.startswith('<p') or '<ul>' not in e: probs.append(f'{i}: estrutura da explicacao')
    if len(txt(e)) < 900: probs.append(f'{i}: explicacao curta ({len(txt(e))})')
    if e.count('<li>') != 4: probs.append(f'{i}: explicacao sem um item por alternativa')
    if fonte_ng:
        ig = (ngrams(q.get('p', '')) | ngrams(txt(e))) & fonte_ng
        if ig: probs.append(f'{i}: trecho igual ao livro -> "{sorted(ig)[0]}"')
    k = norm(q.get('p', ''))
    if k in vistos: probs.append(f'{i}: enunciado repetido de {vistos[k]}')
    vistos[k] = i
    for doc, p in banco_prompts.items():
        if p and difflib.SequenceMatcher(None, k[:300], p[:300]).ratio() > 0.85:
            probs.append(f'{i}: parecido com questao {doc} do banco'); break

print(f'questoes: {len(qs)}')
print('niveis:', dict(collections.Counter(q.get('nivel') for q in qs)))
print('gabaritos:', dict(collections.Counter(q.get('gab') for q in qs)))
print('temas:', dict(collections.Counter(q.get('tema') for q in qs)))
print('referencias:', dict(collections.Counter(q.get('r') for q in qs)))
print('explicacao (media de caracteres):', round(sum(len(txt(q.get('e', ''))) for q in qs) / max(1, len(qs))))
print('\nproblemas:', 'nenhum' if not probs else len(probs))
print('\n'.join(probs))
