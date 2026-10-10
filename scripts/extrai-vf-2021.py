# -*- coding: utf-8 -*-
"""
Le as provas trimestrais da SBA de 2021 (formato verdadeiro/falso, 5 questoes com 5
afirmativas cada) e devolve enunciado, afirmativas e o gabarito de cada afirmativa.

O gabarito vem marcado de duas formas conforme a prova:
  - um "X" no texto, antes de F ou antes de V;
  - um quadradinho preenchido (desenho vetorial), em tres provas.
Nos dois casos a regra e a mesma: a marca que vier ANTES do F significa Falsa,
a que vier entre o F e o V significa Verdadeira.

Uso: python3 scripts/extrai-vf-2021.py <arquivo.pdf> [--json=saida.json]
"""
import fitz, re, sys, json, unicodedata

def limpa(s):
    return re.sub(r'\s+', ' ', s).strip()

def marcas_desenhadas(doc):
    """Nas provas em que o gabarito e um quadradinho preenchido, devolve
    {(pagina, y_da_linha): 'F'|'V'} lendo a posicao da marca em relacao ao F e ao V."""
    out = {}
    for n, p in enumerate(doc):
        fs = [w for w in p.get_text('words') if w[4] == 'F']
        vs = [w for w in p.get_text('words') if w[4] == 'V']
        escuros = []
        for d in p.get_drawings():
            cor = d.get('fill')
            if cor is None or sum(cor) / 3 > 0.45: continue
            r = d['rect']
            if 5 < r.width < 40 and 5 < r.height < 25:
                escuros.append(((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2))
        for cx, cy in escuros:
            f = min((w for w in fs if abs((w[1] + w[3]) / 2 - cy) < 9), key=lambda w: abs(w[0] - cx), default=None)
            v = min((w for w in vs if abs((w[1] + w[3]) / 2 - cy) < 9), key=lambda w: abs(w[0] - cx), default=None)
            if not f or not v: continue
            if cx < f[0]: out[(n, round(cy))] = 'F'
            elif f[2] < cx < v[0]: out[(n, round(cy))] = 'V'
    return out

def le_pdf(caminho):
    doc = fitz.open(caminho)
    texto = '\n'.join(p.get_text() for p in doc)
    # marcas desenhadas: retangulos preenchidos de escuro
    caixas = []
    for i, p in enumerate(doc):
        for d in p.get_drawings():
            if d.get('fill') is None: continue
            cor = d['fill']
            if sum(cor) / 3 > 0.45: continue          # so marcas escuras
            r = d['rect']
            if 6 < r.width < 40 and 6 < r.height < 24:
                caixas.append((i, r.x0, r.y0))
    return doc, texto, caixas

def gabarito_por_texto(cauda):
    seq = [t for t in re.findall(r'\b([FVX])\b', cauda)]
    if 'X' not in seq: return None
    i = seq.index('X')
    depois = seq[i+1:i+2]
    antes = seq[max(0,i-1):i]
    if depois == ['F']: return 'F'
    if antes == ['F']: return 'V'
    return None

def gabaritos_por_desenho(doc):
    """Devolve a sequencia de 'F'/'V' na ordem de leitura da prova."""
    marcas = marcas_desenhadas(doc)
    return [g for (_, _), g in sorted(marcas.items())]

def parse(caminho):
    doc, texto, caixas = le_pdf(caminho)
    t = re.sub(r'PROVA TRIMESTRAL[^\n]*\n\s*CET\s*\n\s*Sociedade Brasileira de Anestesiologia\s*\n\s*\d+\s*\n', '\n', texto)
    t = re.sub(r'\nSociedade Brasileira de Anestesiologia\s*\n', '\n', t)
    questoes = []
    for bloco in re.split(r'(?:^|\n)\s*(?=\d{1,2}\s*[-–]\s)', t):
        m = re.match(r'\s*(\d{1,2})\s*[-–]\s(.*)', bloco, re.S)
        if not m: continue
        num, corpo = int(m.group(1)), m.group(2)
        partes = re.split(r'\n\s*([a-e])\)\s', corpo)
        if len(partes) < 3: continue
        enun = limpa(partes[0])
        itens = []
        for i in range(1, len(partes) - 1, 2):
            bruto = partes[i+1]
            corte = re.search(r'\n\s*[FVX]\s*(\n|$)', bruto)
            txt = limpa(bruto[:corte.start()] if corte else bruto)
            cauda = bruto[corte.start():] if corte else ''
            itens.append({'letra': partes[i], 'texto': txt, 'gab': gabarito_por_texto(cauda)})
        if len(enun) > 15 and itens:
            questoes.append({'n': num, 'enun': enun, 'itens': itens})

    # Provas sem "X" no texto: o gabarito esta desenhado. Casa-se a sequencia de
    # marcas, na ordem de leitura, com a sequencia de afirmativas.
    faltando = [i for q in questoes for i in q['itens'] if not i['gab']]
    if faltando:
        seq = gabaritos_por_desenho(doc)
        todos = [i for q in questoes for i in q['itens']]
        if len(seq) == len(todos):
            for item, g in zip(todos, seq):
                item['gab'] = g
        else:
            print(f'  AVISO: {len(seq)} marcas desenhadas para {len(todos)} afirmativas', file=sys.stderr)
    return questoes, caixas, doc

if __name__ == '__main__':
    caminho = sys.argv[1]
    qs, caixas, doc = parse(caminho)
    saida = next((a.split('=',1)[1] for a in sys.argv[2:] if a.startswith('--json=')), None)
    lidos = sum(1 for q in qs for i in q['itens'] if i['gab'])
    total = sum(len(q['itens']) for q in qs)
    print(f'{caminho.split("/")[-1]}: {len(qs)} questoes, {total} afirmativas, {lidos} com gabarito no texto, {len(caixas)} caixas desenhadas')
    for q in qs:
        print(f'  {q["n"]}- {q["enun"][:70]}')
        for i in q['itens']:
            print(f'      {i["letra"]}) [{i["gab"] or "?"}] {i["texto"][:72]}')
    if saida:
        json.dump(qs, open(saida,'w',encoding='utf-8'), ensure_ascii=False, indent=1)
        print('gravado em', saida)
