# Geração de flashcards a partir de Miller 10ed + Tratado SAESP 10ed

## Estrutura de pastas

```
exports/referencias/
├── Miller 2025 10ed.pdf                     (fonte, EN, ~13.500 pgs)
├── Tratado de Anestesiologia - SAESP 10 ed.pdf  (fonte, PT-BR, ~6.300 pgs)
├── txt/
│   ├── miller/     (45 chunks .txt de 300 pgs cada)
│   ├── saesp/      (21 chunks .txt de 300 pgs cada)
│   └── stoelting/  (16 chunks .txt de 200 pgs — tabelas de CAM/coeficientes)
├── temas/          (extratos por tema para colar no ChatGPT)
└── planilhas/      (<tema>.cards.mjs = fonte dos cards; .xlsx = pronto para importar)
```

## Workflow para gerar um novo lote de flashcards

### 1. Escolha um tema

Ex: `Farmacologia dos anestésicos inalatórios`, `Bloqueios peridural e subaracnóideo`,
`Anestesia em pediatria`, `Cardiovascular`.

### 2. Extraia trechos dos dois livros

```bash
cd /Users/davidrangel/Projetos/anestesia-admin

node scripts/search-book-topic.mjs \
  --pt="oxido nitroso cam potencia halotano sevoflurano" \
  --en="nitrous oxide MAC potency halothane sevoflurane" \
  --dirs=exports/referencias/txt/saesp,exports/referencias/txt/miller \
  --context=2000 \
  --max=30 \
  --out=exports/referencias/temas/farmacologia-inalatorios.md
```

O `--max=30` pega os 30 trechos mais relevantes (mais termos coincidindo).
O `--context=2000` traz ~2000 caracteres de contexto ao redor de cada match.

### 3. Gere os cards (aqui no Claude Code — fluxo padrão)

Peça ao Claude para ler os capítulos do tema nos chunks `.txt`, montar o mapa de
conceitos e escrever um arquivo `planilhas/<tema>.cards.mjs` com cards **originais**
(nunca cópia/tradução do livro). O arquivo exporta `{ meta, decks, cards }`; ver
`planilhas/farmacologia-inalatorios.cards.mjs` como modelo.

Regras que o Claude aplica: capítulo citado conferido em `scripts/_toc.json`
(Miller) / `scripts/_toc2.json` (SAESP, Stoelting, Guyton, NYSORA); valores
numéricos só quando confirmados no texto extraído (senão `reviewNotes`).

Depois gere a planilha:

```bash
node scripts/build-flashcards-xlsx.mjs \
  --in=exports/referencias/planilhas/farmacologia-inalatorios.cards.mjs \
  --out=exports/referencias/planilhas/flashcards_farmacologia-inalatorios_2026-09-08.xlsx
```

O script valida limites (frente 200 / verso 100 / explicação 320), padrões
proibidos (V/F, verso trivial, assertivas) e calcula `cardCount` dos decks.

Alternativa: rodar `flashcards/prompt_gerar_flashcards_de_livro_v3.md` no ChatGPT
com o `.md` do passo 2 anexado.

Cada tema deve gerar ~50-80 cards de qualidade.

### 4. Valide o .xlsx

```bash
# Salve o arquivo em exports/referencias/planilhas/
# Rode em dry-run primeiro
npm run flashcards:import -- --file="exports/referencias/planilhas/inalatorios-2026-09-08.xlsx" --dry-run
```

### 5. Importe de verdade

```bash
npm run flashcards:import -- --file="exports/referencias/planilhas/inalatorios-2026-09-08.xlsx"
```

## Sugestão de ordem por prioridade

| # | Tema | Termos PT | Termos EN |
|---|------|-----------|-----------|
| 1 | Farmacologia anestésicos inalatórios | oxido nitroso sevoflurano isoflurano halotano cam | nitrous oxide sevoflurane isoflurane halothane MAC |
| 2 | Anestésicos venosos | propofol tiopental etomidato cetamina | propofol thiopental etomidate ketamine |
| 3 | Opióides | morfina fentanil remifentanil sufentanil | morphine fentanyl remifentanil sufentanil |
| 4 | Bloqueadores neuromusculares | rocuronio cisatracurio succinilcolina | rocuronium cisatracurium succinylcholine |
| 5 | Bloqueios raquianestesia e peridural | raquianestesia peridural bupivacaina lidocaina | spinal epidural bupivacaine lidocaine |
| 6 | Bloqueios periféricos | plexo braquial femoral popliteo ultrassom | brachial plexus femoral popliteal ultrasound |
| 7 | Cardiovascular | isquemia infarto hemodinamica beta bloqueador | ischemia infarct hemodynamic beta blocker |
| 8 | Pediatria | pediatrica lactente neonato circuito | pediatric infant neonate circuit |
| 9 | Obstetrícia | cesariana pre eclampsia hipotensao raqui | cesarean preeclampsia hypotension spinal |
| 10 | Via aérea | intubacao mascara laringea videolaringoscopio | intubation laryngeal mask videolaryngoscope |
| 11 | Monitorização | bis capnografia oximetria pressao arterial | BIS capnography pulse oximetry arterial pressure |
| 12 | Recuperação e complicações | nvpo delirium hipotermia tremor | PONV delirium hypothermia shivering |

## Boas práticas

- Sempre `--dry-run` antes de importar
- Reveja alguns cards antes de publicar (use o wizard `/admin/flashcards/revisar`)
- Se der problema, `npm run flashcards:clear` limpa tudo
