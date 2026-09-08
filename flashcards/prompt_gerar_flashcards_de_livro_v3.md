# Prompt v3 — gerar flashcards a partir de Miller 10ed + Tratado SAESP 10ed

Este prompt gera **flashcards nativos** (não são reformulações de questões) usando
trechos dos dois livros de referência da anestesia brasileira.

## Como usar

1. Anexe ao ChatGPT o arquivo `.md` gerado pelo `search-book-topic.mjs` (contém trechos
   do Miller em inglês + SAESP em português).
2. Cole o prompt abaixo (a partir da linha `---`).
3. Aguarde o ChatGPT entregar o `.xlsx` para download.
4. Salve em `exports/referencias/planilhas/` e importe.

---

# CONTEXTO

Você vai gerar **flashcards de estudo** (não questões) para uma plataforma de
preparação para provas de anestesiologia (ME1/2/3, TEA, TSA).

**Fonte:** trechos extraídos do Miller's Anesthesia 10ed (inglês) e do Tratado
de Anestesiologia SAESP 10ed (português), anexados neste chat.

**Diferença crucial que você deve respeitar:**

| Questão de prova | Flashcard |
|------------------|-----------|
| Cenário clínico + 5 alternativas | Pergunta objetiva sobre 1 conceito |
| 30-60 segundos para responder | 3-5 segundos para virar o card |
| Testa raciocínio integrativo | Testa memorização de fato/conceito |

**Não crie cards que pareçam questões reformuladas.** Você não está transformando
questões — está criando conteúdo novo, direto do livro, com foco em fatos e
conceitos memorizáveis.

# REGRAS DE QUALIDADE

## O que fazer

- **Frente**: pergunta única, direta. Máx 200 caracteres.
- **Verso**: resposta conceitual. Máx 100 caracteres. **Nunca** só uma letra.
- **Explicação**: 1-3 frases justificando. Máx 300 caracteres.
- Cite sempre a fonte (`sourceReference`): `Miller 10ed, cap. X` ou `SAESP 10ed, cap. X`.

## O que NÃO fazer (aprendido em iterações anteriores)

1. ❌ **Verso trivial**: nunca "A", "B", "C", "V", "F", "6".
2. ❌ **Verso em V/F**: "V, F, V, F" não faz sentido em flashcard.
3. ❌ **"Itens corretos: X; Y; Z"**: reformule em vários cards, um por item.
4. ❌ **"Somente 1 e 3 são corretas"**: reformule.
5. ❌ **Frente com "quais afirmações"**, "Considere as assertivas": pergunte
   diretamente sobre o conceito.
6. ❌ **Frente truncada com "..."**: escreva pergunta completa.
7. ❌ **Card que é reformulação de questão**: card é sobre o *conceito*, não sobre
   a *questão que testou o conceito*.

## Bons exemplos

**Exemplo 1** (fato numérico)
- Frente: `Qual é o CAM do óxido nitroso?`
- Verso: `104%`
- Explicação: `O N₂O é o anestésico inalatório menos potente. Precisa ser combinado com outro agente para uso clínico.`

**Exemplo 2** (conceito mecanístico)
- Frente: `Qual é o primeiro bloqueio a se instalar na raquianestesia?`
- Verso: `Simpático (autonômico)`
- Explicação: `Fibras simpáticas têm menor calibre e localização mais periférica, sendo bloqueadas antes das sensitivas e motoras.`

**Exemplo 3** (contraindicação)
- Frente: `Principal contraindicação do óxido nitroso?`
- Verso: `Espaços aéreos fechados (pneumotórax, obstrução intestinal, cirurgia oftalmológica com gás)`
- Explicação: `N₂O é 30x mais solúvel no sangue que N₂, expandindo cavidades aéreas fechadas rapidamente.`

**Exemplo 4** (dose)
- Frente: `Dose de propofol para indução em adulto saudável?`
- Verso: `1,5–2,5 mg/kg IV`
- Explicação: `Ajustar para 1–1,5 mg/kg em idosos e cardiopatas. Reduz PAM em 20–30% pela vasodilatação.`

# ESTRUTURA DA PLANILHA

## Aba 1: `Flashcards_Import`

| Coluna | Obrigatório | Descrição |
|--------|-------------|-----------|
| flashcardId | ✅ | `fc_<tema-slug>_<n>` (ex: `fc_farmacologia_inalatorios_001`) |
| frontText | ✅ | Pergunta (máx 200 chars) |
| backText | ✅ | Resposta (máx 100 chars) |
| shortExplanation | ✅ | Justificativa (máx 300 chars) |
| themeId | ✅ | Slug do tema (ex: `farmacologia-anestesicos-inalatorios`) |
| themeName | ✅ | Nome legível (ex: `Farmacologia dos Anestésicos Inalatórios`) |
| moduleId | ✅ | `me`, `tea` ou `tsa` |
| examType | ✅ | `ME`, `TEA` ou `TSA` |
| examYear | Opcional | Deixe vazio (não veio de prova) |
| level | Opcional | `R1`, `R2`, `R3` (só para ME) |
| deckIds | ✅ | Slugs de decks separados por `;` |
| tags | Opcional | Tags por `;` (ex: `oxido-nitroso;cam;potencia`) |
| difficulty | ✅ | `easy`, `medium` ou `hard` |
| status | ✅ | Sempre `pending_review` |
| isActive | ✅ | Sempre `false` |
| sourceType | ✅ | `manual` |
| sourceQuestionId | — | Deixe vazio |
| sourceCorrectOptionId | — | Deixe vazio |
| sourceCorrectOptionText | — | Deixe vazio |
| sourceReference | ✅ | `Miller 10ed, cap. X` OU `SAESP 10ed, cap. Y` |
| sourceQuestionPreview | — | Deixe vazio |
| generationMethod | ✅ | `manual_from_book_v3` |
| needsReview | ✅ | Sempre `true` |
| reviewNotes | Opcional | Ex: `Confirmar dose com Stoelting` |

## Aba 2: `Decks_Import`

| Coluna | Descrição |
|--------|-----------|
| deckId | Slug único (ex: `farmacologia-anestesicos-inalatorios`) |
| title | Nome exibido |
| description | 1-2 frases |
| moduleId | `me`, `tea`, `tsa` ou vazio |
| themeId | Slug do tema |
| cardCount | Quantos cards deste deck no arquivo |
| isActive | `false` |
| order | Ordem numérica |
| status | `pending_review` |

## Aba 3: `Instrucoes_Importacao`

Colunas: `Chave`, `Valor`

| Chave | Valor |
|-------|-------|
| Tema | Ex: Farmacologia dos anestésicos inalatórios |
| Fontes | Miller 10ed cap. X, SAESP 10ed cap. Y |
| Data | ISO (ex: 2026-09-08) |
| Total de flashcards | N |
| Total de decks | M |
| Observações | Notas para revisão humana |

# INSTRUÇÕES DE EXECUÇÃO

## Passo 1: Leia os trechos

Os trechos anexados vêm de dois idiomas — **prefira sempre a linguagem em
português** ao redigir a frente/verso (o aluno é brasileiro). Use o Miller
(inglês) principalmente para conferir números, doses e nomenclaturas técnicas.

## Passo 2: Extraia conceitos-chave

Para cada trecho, identifique:

1. **Definições clássicas** (o que é X)
2. **Valores de referência** (CAM, dose, meia-vida, coeficiente)
3. **Mecanismos de ação** (por que faz X)
4. **Efeitos colaterais e contraindicações**
5. **Condutas em situações específicas** (o que fazer se...)
6. **Diferenças entre agentes/técnicas semelhantes**

## Passo 3: Gere 1 flashcard por conceito

**Não gere múltiplos cards sobre o mesmo conceito**. Se o Miller e o SAESP
falam da mesma coisa, gere apenas 1 card (cite a fonte principal).

## Passo 4: Distribua a dificuldade

- `easy` (40%): fatos memorizáveis diretos (valores, definições curtas)
- `medium` (40%): raciocínio conceitual (por que acontece)
- `hard` (20%): aplicação clínica ou casos complexos

## Passo 5: Agrupe em decks

Crie **1-3 decks** por tema. Use nomes claros:
- `farmacologia-anestesicos-inalatorios` — Farmacologia dos Anestésicos Inalatórios
- `bloqueios-perifericos-mmss` — Bloqueios Periféricos de MMSS

# ANTES DE ENTREGAR — CHECKLIST

- [ ] Cada `flashcardId` é único?
- [ ] Toda frente tem menos de 200 chars?
- [ ] Todo verso tem menos de 100 chars e **não é** só uma letra ou V/F?
- [ ] Todos os cards têm `status: pending_review` e `isActive: false`?
- [ ] `sourceReference` cita o livro e capítulo?
- [ ] `generationMethod` está como `manual_from_book_v3`?
- [ ] Aba `Decks_Import` tem todos os decks referenciados em `deckIds`?
- [ ] Não há cards no formato "questão de prova reformulada"?

Só entregue quando **todos** os itens passarem.

# NOMEIE O ARQUIVO

`flashcards_<tema-slug>_<AAAA-MM-DD>.xlsx`

Exemplo: `flashcards_farmacologia-inalatorios_2026-09-08.xlsx`

# ESCOPO

Se os trechos anexados forem grandes, priorize **50-80 cards de alta qualidade**
em vez de 200 cards fracos. Melhor entregar menos e melhor.

---

**Comece a gerar agora.** Confirme no início da resposta que leu este briefing
e liste os temas que identificou nos trechos.
