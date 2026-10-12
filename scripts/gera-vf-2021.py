# -*- coding: utf-8 -*-
"""
Converte uma prova trimestral V/F de 2021 no formato de multipla escolha usado no banco:
enunciado com as afirmativas I a V, quatro alternativas do tipo "Apenas as afirmativas
X e Y sao falsas" e o gabarito correspondente ao padrao real da banca.

A explicacao, o tema e a referencia NAO sao gerados aqui: ficam em branco para serem
escritos depois, item a item.

Uso: python3 scripts/gera-vf-2021.py <prova.pdf> <prefixo> <saida.json>
     prefixo e o docId sem o numero, por exemplo ME1_2021_TRI1
"""
import sys, json, hashlib, importlib.util, re

spec = importlib.util.spec_from_file_location('vf', 'scripts/extrai-vf-2021.py')
vf = importlib.util.module_from_spec(spec); spec.loader.exec_module(vf)

ROM = ['I', 'II', 'III', 'IV', 'V']

def descreve(indices, falsas):
    """Frase que descreve um conjunto de afirmativas (indices base 0)."""
    r = [ROM[i] for i in sorted(indices)]
    if not r:
        # conjunto vazio: o lado oposto cobre todas
        return 'Todas as afirmativas são ' + ('verdadeiras.' if falsas else 'falsas.')
    if len(r) == 5:
        return 'Todas as afirmativas são ' + ('falsas.' if falsas else 'verdadeiras.')
    if len(r) == 1:
        return f'Apenas a afirmativa {r[0]} é ' + ('falsa.' if falsas else 'verdadeira.')
    lista = ', '.join(r[:-1]) + ' e ' + r[-1]
    return f'Apenas as afirmativas {lista} são ' + ('falsas.' if falsas else 'verdadeiras.')

def alternativas(reais_f, semente):
    """Quatro alternativas distintas, uma so correta. reais_f = indices das falsas."""
    reais_v = {i for i in range(5)} - reais_f
    # a correta descreve o lado minoritario, que rende a frase mais curta
    if len(reais_f) <= len(reais_v):
        certa, lado_certo = descreve(reais_f, True), ('F', reais_f)
    else:
        certa, lado_certo = descreve(reais_v, False), ('V', reais_v)

    rnd = int(hashlib.sha256(semente.encode()).hexdigest(), 16)
    cands = []
    for falsas in (True, False):
        base = reais_f if falsas else reais_v
        for troca in range(5):
            for entra in range(5):
                c = set(base)
                if troca in c and entra not in c:
                    c.discard(troca); c.add(entra)
                elif troca in c and len(c) > 1:
                    c.discard(troca)
                elif entra not in c and len(c) < 4:
                    c.add(entra)
                else:
                    continue
                if not c or len(c) == 5: continue
                # nao pode descrever o padrao real por nenhuma das duas vias
                if (falsas and c == reais_f) or (not falsas and c == reais_v): continue
                cands.append(descreve(c, falsas))
    vistos, distratoras = {certa}, []
    for j in range(len(cands)):
        c = cands[(rnd + j * 7) % len(cands)]
        if c in vistos: continue
        vistos.add(c); distratoras.append(c)
        if len(distratoras) == 3: break

    opcoes = [certa] + distratoras
    pos = rnd % 4
    opcoes = opcoes[1:pos+1] + [certa] + opcoes[pos+1:]
    return opcoes, 'ABCD'[pos]

def main():
    pdf, prefixo, saida = sys.argv[1], sys.argv[2], sys.argv[3]
    rotulo = '(' + prefixo.replace('_2021_', '-').replace('_', '-') + '-2021)'
    qs, _, _ = vf.parse(pdf)
    lote = []
    for q in qs:
        itens = q['itens']
        if len(itens) != 5 or any(not i['gab'] for i in itens):
            print(f'  PULADA questao {q["n"]}: {len(itens)} itens, gabarito incompleto'); continue
        reais_f = {k for k, i in enumerate(itens) if i['gab'] == 'F'}
        docid = f'{prefixo}_Q{q["n"]:02d}'
        opcoes, gab = alternativas(reais_f, docid)
        corpo = '\n'.join(f'{ROM[k]} - {i["texto"]}' for k, i in enumerate(itens))
        lote.append({
            'id': docid,
            'p': f'{rotulo} {q["enun"]}\n\n{corpo}',
            'o': opcoes,
            'gab': gab,
            'tema': '', 'r': '', 'e': '',
            'vf': ''.join(i['gab'] for i in itens),
        })
    json.dump(lote, open(saida, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'{saida}: {len(lote)} questoes')
    for q in lote:
        print(f'  {q["id"]} [{q["vf"]}] gab {q["gab"]}  -> {q["o"]["ABCD".index(q["gab"])]}')

main()
