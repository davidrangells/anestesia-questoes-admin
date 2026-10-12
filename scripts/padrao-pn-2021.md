# Padrão do comentário da Prova Nacional ME3 2021

A prova só existe em fotografia. O enunciado, as quatro alternativas e o gabarito **já foram
transcritos e conferidos** contra o PDF oficial do gabarito. Você escreve apenas `tema`, `r` e `e`
(e `nota`, quando houver o que registrar).

## Nunca altere

`id`, `p`, `o` e `gab`. O gabarito é o oficial da banca, inclusive nas duas questões que ela
alterou depois da prova. Se discordar, mantenha e descreva a divergência em `nota`.

## Formato do campo `e`

```
<p>Parágrafo que estabelece o conceito cobrado, de forma independente do caso.</p>
<p>Por que a resposta certa é certa, com os números, limiares e mecanismos que sustentam.</p>
<p><strong>Por que as demais estão incorretas:</strong> uma frase por alternativa errada, tratando
cada uma pelo conteúdo.</p>
```

- Dois a quatro parágrafos. Mínimo de 700 caracteres de texto visível; na prática 1.000 a 1.500.
- O último parágrafo **tem de** começar por `<strong>Por que as demais estão incorretas:</strong>`.
- **Nunca cite letra de alternativa**: as alternativas são embaralhadas no aplicativo. Refira-se ao conteúdo.
- Destaque termos-chave com `<strong>`. Números e pontos de corte são o que mais ajuda o residente.
- Proibidos travessão, hífen duplo e underscore duplo.
- Registro de professor explicando para residente, sem floreio e sem fórmulas de IA.

## Campo `tema`

Um dos 54 temas de `scripts/_temas_nivel.json`, grafado exatamente como está lá. É prova de
terceiro ano, então os temas tendem aos pontos 37 a 54, mas escolha sempre pelo conteúdo da questão.
O nível é derivado do tema automaticamente.

## Campo `r`

Capítulo nominal conferido contra o sumário real, nunca de memória. O sumário do Tratado está em
`scripts/_toc2.json` (chave `saesp`) e o do Miller em `scripts/_toc.json`. Formato:

`SAESP, Tratado de Anestesiologia, 10ª ed. — cap. 66: Avaliação da Via Aérea`

Dois capítulos, quando couber, separados por ` • `. Não cite página. Para ler o capítulo:
`python3 scripts/extrai-capitulo.py exports/quest_caps <N>`. Se o assunto não estiver no Tratado,
use outra obra do acervo e diga isso na `nota`.

## Validação

```
python3 scripts/valida-pn-2021.py exports/me_2021/pn/pn_me3_2021.json
```

Rode até sair `problemas: nenhum` para as suas questões. O validador protege o gabarito oficial,
a estrutura do comentário, o tamanho, o tema e a referência.

## Modelo pronto

`exports/quest_lotes/me1_2026_quad2.json` é um lote de múltipla escolha já importado, no mesmo
formato. Siga aquele tom e profundidade.
