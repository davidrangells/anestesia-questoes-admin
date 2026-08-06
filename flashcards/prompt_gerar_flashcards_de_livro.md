# Prompt para gerar flashcards a partir de um livro/PDF

Copie o texto abaixo (a partir da linha `---`) para o ChatGPT (GPT-4 ou superior) junto com o arquivo do livro/capítulo em PDF.

---

# CONTEXTO

Você vai gerar flashcards de estudo para o **Anestesia Questões**, uma plataforma
de preparação para provas de anestesiologia (ME1, ME2, ME3, TEA e TSA).

Os flashcards serão importados automaticamente para uma coleção Firestore
chamada `flashcards`. A planilha final deve seguir **exatamente** a estrutura
descrita abaixo, senão o importador rejeita.

Sua entrada será um livro ou capítulo em PDF (ou trecho colado). Sua saída
deve ser um **arquivo Excel (.xlsx) com 3 abas**.

---

# REGRAS DE QUALIDADE (LEIA ANTES DE COMEÇAR)

## O que é um bom flashcard

Um flashcard bom tem:

- **Frente**: pergunta única, curta e objetiva (**máximo 200 caracteres**).
  Feita para ser lida em menos de 5 segundos.
- **Verso**: resposta direta e conceitual (**máximo 100 caracteres**).
- **Explicação**: 1-3 frases justificando (**máximo 300 caracteres**).

## O que NÃO fazer (aprendido em iterações anteriores)

Estes padrões **não podem aparecer** — o importador vai rejeitar depois:

1. ❌ **Verso trivial**: não use "A", "B", "C", "V", "F", "6", "4" como resposta.
   Se a questão original respondia por letra/número, **reformule** para responder
   pelo conceito.
2. ❌ **Verso em V/F**: "V, F, V, F" não faz sentido sem o enunciado da questão.
   **Transforme cada afirmação** em um flashcard individual (frente = afirmação,
   verso = "Verdadeiro" ou "Falso" com contexto na explicação).
3. ❌ **Verso "Itens corretos: X; Y; Z"**: reformule em vários cards, um por item.
4. ❌ **"Somente 1 e 3 são corretas"**: idem — reformule em cards individuais.
5. ❌ **Frente com "quais afirmações"**, "Considere as assertivas": reformule para
   perguntar diretamente sobre o conceito.
6. ❌ **Frente truncada com "..."**: sempre escreva a pergunta completa.
7. ❌ **Frente que é reformulação da questão original**: o flashcard não é uma
   variação da questão. É um card de revisão sobre o **conceito** que a questão
   testa.

## Bons exemplos

**Exemplo 1** (Farmacologia)
- Frente: "Qual é o CAM do óxido nitroso?"
- Verso: "104%"
- Explicação: "O óxido nitroso é o anestésico inalatório menos potente,
  com CAM de 104% — precisa de combinação com outro agente para uso clínico."

**Exemplo 2** (Bloqueios)
- Frente: "Qual é o primeiro bloqueio a se instalar na raquianestesia?"
- Verso: "Simpático (autonômico)"
- Explicação: "Fibras simpáticas têm menor calibre e são as mais periféricas,
  bloqueadas antes das sensitivas e motoras."

**Exemplo 3** (Pediatria)
- Frente: "Fórmula da perda sanguínea máxima permitida (PSMP) em pediatria."
- Verso: "PSMP = VSE × (Ht inicial − Ht mínimo) / Ht médio"
- Explicação: "VSE = volume sanguíneo estimado (peso × 70-80 mL/kg).
  Ht médio = média entre Ht inicial e mínimo aceitável."

---

# ESTRUTURA DA PLANILHA

## Aba 1: `Flashcards_Import`

**Colunas (nesta ordem exata):**

| Coluna | Tipo | Obrigatório? | Descrição |
|--------|------|--------------|-----------|
| `flashcardId` | string | ✅ | ID único. Formato: `fc_<slug-do-tema>_<n>` (ex: `fc_farmacologia_inalatorios_001`) |
| `frontText` | string | ✅ | Pergunta do card. **Máx 200 chars** |
| `backText` | string | ✅ | Resposta direta. **Máx 100 chars** |
| `shortExplanation` | string | ✅ | Justificativa. **Máx 300 chars** |
| `themeId` | string | ✅ | Slug do tema (ex: `farmacologia-dos-anestesicos-inalatorios`). Use kebab-case, sem acentos |
| `themeName` | string | ✅ | Nome legível do tema (ex: `Farmacologia dos Anestésicos Inalatórios`) |
| `moduleId` | string | ✅ | Um de: `me`, `tea`, `tsa` |
| `examType` | string | ✅ | Um de: `ME`, `TEA`, `TSA` (mesmo módulo, em maiúsculas) |
| `examYear` | número | Opcional | Ano da prova, se aplicável. Deixe vazio se veio de livro |
| `level` | string | Opcional | `R1`, `R2` ou `R3` (só para módulo ME) |
| `deckIds` | string | ✅ | IDs de decks separados por `;`. Ex: `farmacologia-anestesicos-inalatorios;me-farmacologia` |
| `tags` | string | Opcional | Tags separadas por `;` (ex: `oxido-nitroso;cam;potencia`) |
| `difficulty` | string | ✅ | `easy`, `medium` ou `hard` |
| `status` | string | ✅ | Sempre `pending_review` |
| `isActive` | boolean | ✅ | Sempre `false` |
| `sourceType` | string | ✅ | `manual` (para cards de livro) |
| `sourceQuestionId` | string | Opcional | Deixe vazio (não veio de questão) |
| `sourceCorrectOptionId` | string | Opcional | Deixe vazio |
| `sourceCorrectOptionText` | string | Opcional | Deixe vazio |
| `sourceReference` | string | ✅ | Livro/página. Ex: `Miller's Anesthesia 10th ed, cap. 12, p. 342` |
| `sourceQuestionPreview` | string | Opcional | Deixe vazio |
| `generationMethod` | string | ✅ | Sempre `manual_from_book` |
| `needsReview` | boolean | ✅ | Sempre `true` |
| `reviewNotes` | string | Opcional | Observações para o revisor humano |

## Aba 2: `Decks_Import`

**Colunas:**

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `deckId` | string | Slug único (ex: `farmacologia-anestesicos-inalatorios`) |
| `title` | string | Nome exibido (ex: `Farmacologia dos Anestésicos Inalatórios`) |
| `description` | string | 1-2 frases descrevendo o deck |
| `moduleId` | string | `me`, `tea`, `tsa` ou vazio se transversal |
| `themeId` | string | Slug do tema |
| `cardCount` | número | Quantos cards deste deck existem na planilha |
| `isActive` | boolean | Sempre `false` |
| `order` | número | Ordem de exibição (1, 2, 3...) |
| `status` | string | Sempre `pending_review` |

## Aba 3: `Instrucoes_Importacao`

**Colunas:** `Chave`, `Valor`

Preencha assim:

| Chave | Valor |
|-------|-------|
| Origem | Nome do livro/capítulo |
| Data de geração | Data (ex: 2026-07-15) |
| Total de flashcards | Número total gerado |
| Total de decks | Número de decks criados |
| Observações | Notas para revisão humana |

---

# INSTRUÇÕES DE EXECUÇÃO

1. Leia o PDF do livro/capítulo por completo.
2. Identifique os **conceitos-chave** que caem em prova (fórmulas, definições,
   valores de referência, mecanismos de ação, contraindicações, condutas).
3. Para cada conceito, gere **1 flashcard** seguindo o formato descrito.
4. Agrupe cards do mesmo assunto em um deck. Crie 1-3 decks por capítulo.
5. Cada `flashcardId` deve ser **único e sequencial** dentro do arquivo.
6. Ao final, forneça o arquivo `.xlsx` para download.

## Ordem de prioridade dos cards

Se o capítulo for grande, priorize nesta ordem:

1. **Definições clássicas** (o que é X)
2. **Valores de referência** (dose, CAM, meia-vida, etc.)
3. **Mecanismos de ação**
4. **Efeitos colaterais e contraindicações**
5. **Condutas em situações específicas** (o que fazer se...)
6. **Diferenças entre agentes/técnicas semelhantes**

## Distribuição de dificuldade sugerida

- `easy` (40%): fatos memorizáveis (valores, definições)
- `medium` (40%): raciocínio conceitual (por quê acontece)
- `hard` (20%): aplicação clínica ou casos complexos

---

# ANTES DE ENTREGAR

Confira mentalmente cada card com este checklist:

- [ ] A frente tem menos de 200 caracteres?
- [ ] A frente é uma pergunta objetiva, sem "assinale a alternativa" ou similar?
- [ ] O verso tem menos de 100 caracteres?
- [ ] O verso NÃO é uma letra sozinha ("A", "B") ou "V/F"?
- [ ] A explicação justifica em 1-3 frases?
- [ ] O tema e módulo estão preenchidos corretamente?
- [ ] A dificuldade está coerente com o conteúdo?
- [ ] O `flashcardId` é único?
- [ ] O `sourceReference` cita livro e página?

Só entregue o arquivo quando **todos os cards** passarem no checklist.

---

# EXEMPLO DE 3 CARDS PRONTOS (pra você calibrar o formato)

Aba `Flashcards_Import`, 3 linhas:

```
fc_farmacologia_inalatorios_001 | Qual é o CAM do óxido nitroso? | 104% | O óxido nitroso é o anestésico inalatório menos potente. Precisa combinar com outro agente. | farmacologia-dos-anestesicos-inalatorios | Farmacologia dos Anestésicos Inalatórios | me | ME |  | R1 | farmacologia-anestesicos-inalatorios;me-farmacologia | oxido-nitroso;cam;potencia | easy | pending_review | false | manual |  |  |  | Miller's Anesthesia 10th ed, cap. 27, p. 512 |  | manual_from_book | true | 
fc_farmacologia_inalatorios_002 | Qual anestésico inalatório tem o maior coeficiente de partição sangue/gás? | Halotano (2,4) | Coeficiente sangue/gás alto = indução mais lenta. Halotano tem o maior entre os agentes modernos. | farmacologia-dos-anestesicos-inalatorios | Farmacologia dos Anestésicos Inalatórios | me | ME |  | R2 | farmacologia-anestesicos-inalatorios;me-farmacologia | coeficiente-particao;halotano | medium | pending_review | false | manual |  |  |  | Miller's Anesthesia 10th ed, cap. 27, p. 518 |  | manual_from_book | true | 
fc_farmacologia_inalatorios_003 | Qual é a principal contraindicação do óxido nitroso? | Espaços aéreos fechados (pneumotórax, obstrução intestinal) | O N2O é 30x mais solúvel que o nitrogênio — expande cavidades aéreas fechadas rapidamente. | farmacologia-dos-anestesicos-inalatorios | Farmacologia dos Anestésicos Inalatórios | me | ME |  | R2 | farmacologia-anestesicos-inalatorios;me-farmacologia | oxido-nitroso;contraindicacao | medium | pending_review | false | manual |  |  |  | Miller's Anesthesia 10th ed, cap. 27, p. 515 |  | manual_from_book | true | 
```

Aba `Decks_Import`, 1 linha:

```
farmacologia-anestesicos-inalatorios | Farmacologia dos Anestésicos Inalatórios | Deck sobre CAM, coeficientes de partição, mecanismos de ação e efeitos dos anestésicos inalatórios. | me | farmacologia-dos-anestesicos-inalatorios | 3 | false | 1 | pending_review
```

---

# RESUMO PARA VOCÊ, CHATGPT

- Leia o PDF completo.
- Extraia conceitos-chave (não copie o texto — resuma em pergunta/resposta).
- Gere flashcards curtos, específicos e testáveis.
- **NUNCA** use "letra correta", V/F, "itens corretos", ou verso trivial.
- Entregue `.xlsx` com as 3 abas exatamente como descrito.
- Nomeie o arquivo: `flashcards_<nome-do-livro>_<data>.xlsx`
