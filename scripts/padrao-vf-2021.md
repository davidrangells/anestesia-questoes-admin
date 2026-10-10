# Padrão do comentário das provas V/F (trimestrais da SBA)

Cada questão já vem pronta no arquivo do lote: enunciado com as afirmativas I a V,
as quatro alternativas e o gabarito. **Você escreve apenas três campos**: `tema`, `r` e `e`
(e, quando necessário, `nota`).

## Nunca altere

`id`, `p`, `o`, `gab` e `vf`. O texto do enunciado é o da banca, copiado do PDF oficial.

## O campo `vf` manda

`vf` traz o gabarito oficial de cada afirmativa, em ordem, por exemplo `FVVFV` significa
I falsa, II verdadeira, III verdadeira, IV falsa e V verdadeira. A explicação **tem de rotular
cada item exatamente com esse valor**. Um validador recusa o lote se divergir.

Se você discordar do gabarito da banca em algum item, **não inverta**: mantenha o rótulo oficial,
explique o item do melhor modo possível e descreva a divergência no campo `nota`, que é interna
e não aparece para o aluno.

## Formato do campo `e`

```
<p>Um parágrafo de abertura com o conceito que a questão cobra.</p><ul>
<li><strong>I.</strong> Verdadeira. Justificativa em uma ou duas frases.</li>
<li><strong>II.</strong> Falsa. O que o item afirma, por que está errado e qual é o dado correto.</li>
... um <li> por afirmativa, de I a V ...
</ul><p>Logo, <strong>apenas as afirmativas X e Y são falsas</strong>.</p>
```

- O rótulo é exatamente `<strong>I.</strong> Verdadeira` ou `<strong>I.</strong> Falsa`, nessa grafia.
- O parágrafo final repete, em negrito, a frase da alternativa correta.
- Mínimo de 700 caracteres de texto visível; na prática fica entre 900 e 1.500.
- Destaque termos-chave com `<strong>`. Números, limiares e pontos de corte são o que mais ajuda o aluno.
- **Nunca cite letra de alternativa** ("alternativa B", "letra C"): as alternativas são embaralhadas no app.
- Proibidos travessão, hífen duplo e underscore duplo.
- Registro de professor explicando para residente: direto, sem floreio e sem fórmulas de IA.

## Campo `tema`

Um dos 54 temas de `scripts/_temas_nivel.json`, grafado exatamente como está lá. Escolha pelo
conteúdo predominante da questão. O nível (R1/R2/R3) é derivado do tema automaticamente, não escreva nada sobre isso.

## Campo `r`

Capítulo nominal conferido contra o sumário real, nunca de memória. O sumário está em
`scripts/_toc2.json` (chave `saesp`). Formato:

`SAESP, Tratado de Anestesiologia, 10ª ed. — cap. 66: Avaliação da Via Aérea`

Dois capítulos, quando couber, separados por ` • `. Não cite página. Se precisar ler o capítulo,
extraia com `python3 scripts/extrai-capitulo.py exports/quest_caps <N>` e leia por partes.
Para assunto que o Tratado não cobre, use outra obra do acervo e diga isso na `nota`.

## Validação

```
python3 scripts/valida-vf.py <lote.json> <PREFIXO> R1
```

O validador confere, entre outras coisas, se o gabarito bate com o padrão V/F que a sua explicação
descreve e se nenhuma distratora também bate. Rode até sair `problemas: nenhum`.

## Modelo pronto

`exports/me_2021/lotes/me1_2021_tri1.json` já está escrito e importado. Siga o mesmo tom e profundidade.
