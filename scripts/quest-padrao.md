# Padrão das questões autorais do Quest

Questões **originais**, escritas do zero em português, cobrindo conceitos do capítulo indicado.
O livro é fonte de **conceitos**, nunca de texto: é proibido copiar, traduzir ou parafrasear de perto
qualquer frase. Um validador automático rejeita qualquer sequência de 10 palavras igual à do livro.
Quando a fonte estiver em inglês, a proibição de traduzir é ainda mais estrita: aproveite apenas
fatos, números e mecanismos, e escreva tudo com construção própria em português do Brasil.

## Formato de cada questão (JSON)

```json
{
 "id": "LIVRO_Q021",
 "tema": "<nome exato do tema, como dado na tarefa>",
 "nivel": "R1" | "R2" | "R3",
 "gab": "A" | "B" | "C" | "D",
 "p": "enunciado, sem rótulo de prova e sem numeração",
 "o": ["alternativa A", "alternativa B", "alternativa C", "alternativa D"],
 "e": "<p style=\"margin:0 0 1rem 0;\">…</p>…<ul><li><strong>Resumo da alternativa</strong>: correta/incorreta. …</li>…</ul>",
 "r": "<string de referência, exatamente uma das fornecidas na tarefa>"
}
```

## Regras do enunciado

- Português do Brasil, registro clínico, claro e direto.
- Cerca de metade das questões em forma de **caso clínico curto** (idade, contexto, dado objetivo),
  a outra metade em forma direta ("Sobre X, é correto afirmar:").
- Nada de "assinale a alternativa INCORRETA" nem de negativas em caixa alta.
- Sem menção a figura, gráfico, tabela ou traçado: as questões não terão imagem.
- Sem citar autor, número de capítulo ou página dentro do enunciado.

## Regras das alternativas

- Exatamente 4, todas plausíveis, de tamanho parecido, na mesma categoria gramatical.
- Uma única correta. As erradas devem ser erradas por conteúdo, não por absurdo ou por vaguidade.
- **As alternativas são embaralhadas no aplicativo**: nunca escreva "todas as anteriores",
  "nenhuma das anteriores", "as alternativas A e B" ou qualquer referência a letra ou posição.
- Não repetir no enunciado a palavra-chave que entrega a correta.

## Regras da explicação (campo `e`)

- HTML, de 2 a 4 parágrafos `<p style="margin:0 0 1rem 0;">`, explicando o conceito e **por que**
  a resposta certa é a certa. No mínimo 900 caracteres de texto visível.
- Terminar com uma `<ul>` com um `<li>` por alternativa, na ordem em que aparecem no campo `o`,
  cada um começando por `<strong>` com um resumo curto do conteúdo daquela alternativa (nunca a letra),
  seguido de "correta" ou "incorreta" e da justificativa em uma ou duas frases.
- Destacar termos-chave com `<strong>`.
- Proibidos: travessão (—), hífen duplo (--), underscore duplo, "(A)", "alternativa B", "letra C".
- Escrever como um professor explica para o residente, sem floreio e sem fórmulas de IA.

## Nível

`nivel` **não é dificuldade**: é o ano do programa da SBA a que o **tema** pertence.
Cada um dos 54 pontos do programa pertence a um único ano (pontos 1 a 19 = R1, 20 a 36 = R2,
37 a 54 = R3), e o aplicativo usa esse campo para mostrar ao residente o conteúdo do ano dele.

- Todas as questões de um lote têm o mesmo tema, portanto **o mesmo nível**.
- O nível correto do tema está em `scripts/_temas_nivel.json` (e vem informado na tarefa).
  Consulte o arquivo, não decida por conta própria.
- Exemplo: "Anestesia em Obstetrícia" é o ponto 31, logo **R2**, mesmo numa questão fácil;
  "Farmacologia dos Anestésicos Inalatórios" é o ponto 13, logo **R1**, mesmo numa questão difícil.

A dificuldade se distribui dentro do lote pelo conteúdo (umas mais diretas, outras de caso
complexo), mas isso não aparece em nenhum campo.

## Referência

Use **exatamente** uma das strings fornecidas na tarefa, sem inventar capítulo ou título.

## Como trabalhar o capítulo

O arquivo do capítulo é grande. Leia por partes (por exemplo `sed -n '1,400p'`, depois `400,800p`,
ou `grep -n` por um assunto) e vá anotando conceitos examináveis: números, limiares, condutas,
mecanismos, contraindicações, complicações, definições. Cubra assuntos variados do capítulo,
sem concentrar tudo na introdução.

## Saída

Grave o JSON (lista de objetos) no caminho indicado na tarefa, com `ensure_ascii=False` e indentação 1.
O caminho fica dentro de `exports/`, que é durável; não grave lotes em pastas temporárias.
Ao terminar, responda apenas com: quantas questões gravou, a distribuição por nível e os assuntos
cobertos, em até 8 linhas.
