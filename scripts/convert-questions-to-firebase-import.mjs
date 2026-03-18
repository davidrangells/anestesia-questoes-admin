import fs from "node:fs";
import path from "node:path";
import xlsx from "xlsx";

const TARGET_HEADERS = [
  "docId",
  "prompt_text",
  "imageUrl",
  "optionA_text",
  "optionA_imageUrl",
  "optionB_text",
  "optionB_imageUrl",
  "optionC_text",
  "optionC_imageUrl",
  "optionD_text",
  "optionD_imageUrl",
  "optionE_text",
  "optionE_imageUrl",
  "correctOptionId",
  "shuffleOptions",
  "explanation",
  "reference",
  "internalNote",
  "themes",
  "prova_tipo",
  "prova_ano",
  "nivel",
  "Prova",
  "isActive",
];

const TRUE_VALUES = new Set(["1", "true", "t", "yes", "y", "sim", "s", "v", "verdadeiro", "x", "active", "ativo"]);

const FIELD_ALIASES = {
  docId: ["docId", "id", "ID", "uuid", "UUID", "codigo", "codigo_questao"],
  prompt: [
    "Questao (Pergunta)",
    "Questao",
    "Pergunta",
    "Enunciado",
    "Titulo",
    "prompt_text",
    "prompt",
    "questionText",
    "statement",
  ],
  prova: ["Prova", "prova", "examSource"],
  quiz: ["Quiz", "quiz"],
  provaTipo: ["prova_tipo", "examType", "tipo_prova"],
  provaAno: ["prova_ano", "examYear", "ano_prova"],
  nivel: ["nivel", "level", "Nível"],
  themes: ["Temas", "themes", "Topico", "Tópico", "topico", "tópico"],
  explanation: ["explicacao_padronizada", "explanation", "Notas", "notas", "comentario", "comentarios"],
  reference: ["referencia_final", "Referencia", "Referência", "reference", "fonte"],
  internalNote: ["internalNote", "Nota interna", "Observacao", "Observação", "observacao", "observação"],
  imageUrl: ["imageUrl", "imagem", "imagem_enunciado"],
  isActive: ["isActive", "ativo", "status"],
  correctOptionId: ["correctOptionId", "alternativa_correta", "gabarito"],
  shuffleOptions: ["shuffleOptions", "embaralhar", "shuffle"],
  correctAlternatives: [
    "Alternativas (Corretas)",
    "alternativas_corretas",
    "alternativas corretas",
    "resposta_correta",
  ],
  incorrectAlternatives: [
    "Alternativas (Incorretas)",
    "alternativas_incorretas",
    "alternativas incorretas",
    "respostas_incorretas",
  ],
  optionA_text: ["optionA_text", "resposta_A", "alternativa_A", "A"],
  optionB_text: ["optionB_text", "resposta_B", "alternativa_B", "B"],
  optionC_text: ["optionC_text", "resposta_C", "alternativa_C", "C"],
  optionD_text: ["optionD_text", "resposta_D", "alternativa_D", "D"],
  optionE_text: ["optionE_text", "resposta_E", "alternativa_E", "E"],
  optionA_imageUrl: ["optionA_imageUrl", "imagem_A"],
  optionB_imageUrl: ["optionB_imageUrl", "imagem_B"],
  optionC_imageUrl: ["optionC_imageUrl", "imagem_C"],
  optionD_imageUrl: ["optionD_imageUrl", "imagem_D"],
  optionE_imageUrl: ["optionE_imageUrl", "imagem_E"],
  corretoA: ["correto_A", "A_correta"],
  corretoB: ["correto_B", "B_correta"],
  corretoC: ["correto_C", "C_correta"],
  corretoD: ["correto_D", "D_correta"],
  corretoE: ["correto_E", "E_correta"],
};

function resolveArg(flag, fallback = "") {
  const entry = process.argv.slice(2).find((item) => item.startsWith(`${flag}=`));
  return entry ? entry.slice(flag.length + 1) : fallback;
}

function normalizeText(value) {
  if (value == null) return "";
  return String(value).trim();
}

function normalizeKey(value) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function normalizeBool(value, fallback = false) {
  const key = normalizeKey(value);
  if (!key) return fallback;
  return TRUE_VALUES.has(key);
}

function resolveFilePath(inputPath) {
  const raw = normalizeText(inputPath);
  if (!raw) {
    throw new Error("Informe o arquivo com --file=/caminho/arquivo.xlsx");
  }

  const filePath = path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo nao encontrado: ${filePath}`);
  }
  return filePath;
}

function findValue(row, aliases) {
  for (const alias of aliases) {
    if (Object.prototype.hasOwnProperty.call(row, alias)) {
      return row[alias];
    }
  }

  const aliasKeys = aliases.map((alias) => normalizeKey(alias));
  for (const [key, value] of Object.entries(row)) {
    if (aliasKeys.includes(normalizeKey(key))) {
      return value;
    }
  }
  return undefined;
}

function resolveField(row, aliasKey) {
  return normalizeText(findValue(row, FIELD_ALIASES[aliasKey] || []));
}

function resolveCorrectOptionId(row) {
  const direct = resolveField(row, "correctOptionId").toUpperCase();
  if (["A", "B", "C", "D", "E"].includes(direct)) return direct;

  const byFlags = [
    normalizeBool(findValue(row, FIELD_ALIASES.corretoA)) ? "A" : "",
    normalizeBool(findValue(row, FIELD_ALIASES.corretoB)) ? "B" : "",
    normalizeBool(findValue(row, FIELD_ALIASES.corretoC)) ? "C" : "",
    normalizeBool(findValue(row, FIELD_ALIASES.corretoD)) ? "D" : "",
    normalizeBool(findValue(row, FIELD_ALIASES.corretoE)) ? "E" : "",
  ].filter(Boolean);

  if (byFlags.length === 1) return byFlags[0];
  if (byFlags.length > 1) return "__MULTI__";
  return "";
}

function splitAlternatives(rawValue) {
  const raw = normalizeText(rawValue);
  if (!raw) return [];

  return raw
    .split(/\s*(?:\||\n|;|•|-{3,})\s*/g)
    .map((item) => normalizeText(item))
    .filter(Boolean);
}

function hashString(value) {
  const text = normalizeText(value);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function placeCorrectOption({
  correctText,
  incorrectOptions,
  seed,
}) {
  const incorrect = Array.from(new Set(incorrectOptions)).filter(Boolean);
  if (!correctText || incorrect.length < 3) return null;

  const slots = ["A", "B", "C", "D"];
  const correctIndex = hashString(seed) % slots.length;
  const ordered = new Array(slots.length).fill("");
  ordered[correctIndex] = correctText;

  let cursor = 0;
  for (let i = 0; i < slots.length; i += 1) {
    if (ordered[i]) continue;
    ordered[i] = incorrect[cursor] || "";
    cursor += 1;
  }

  return {
    optionA: ordered[0],
    optionB: ordered[1],
    optionC: ordered[2],
    optionD: ordered[3],
    optionE: incorrect[cursor] || "",
    correctOptionId: slots[correctIndex],
  };
}

function autoDocId(baseType, baseYear, idx) {
  const type = normalizeText(baseType).toUpperCase() || "Q";
  const year = normalizeText(baseYear) || "0000";
  return `${type}-${year}-${String(idx + 1).padStart(4, "0")}`;
}

function parseExamMetaFromPrompt(prompt) {
  const text = normalizeText(prompt);
  if (!text) return { examType: "", examYear: "" };

  const match = text.match(/[\(\[]\s*([A-Za-z]{2,5})\s*[-–]\s*((?:19|20)\d{2})\s*[\)\]]/);
  if (!match) return { examType: "", examYear: "" };

  return {
    examType: normalizeText(match[1]).toUpperCase(),
    examYear: normalizeText(match[2]),
  };
}

function detectSheetName(wb, preferredName) {
  if (preferredName && wb.SheetNames.includes(preferredName)) return preferredName;

  const preferredCandidates = ["questions_padronizadas", "firebase_import", "Sheet1"];
  for (const candidate of preferredCandidates) {
    if (wb.SheetNames.includes(candidate)) return candidate;
  }

  return wb.SheetNames[0];
}

function writeWorkbook(filePath, validRows, issuesNoCorrect, issuesMultiCorrect) {
  const wb = xlsx.utils.book_new();

  const wsImport = xlsx.utils.json_to_sheet(validRows, { header: TARGET_HEADERS });
  xlsx.utils.book_append_sheet(wb, wsImport, "firebase_import");

  if (issuesNoCorrect.length) {
    const ws = xlsx.utils.json_to_sheet(issuesNoCorrect);
    xlsx.utils.book_append_sheet(wb, ws, "issues_no_correct");
  }

  if (issuesMultiCorrect.length) {
    const ws = xlsx.utils.json_to_sheet(issuesMultiCorrect);
    xlsx.utils.book_append_sheet(wb, ws, "issues_multi_correct");
  }

  const summary = [
    { metric: "total_rows_lidas", value: String(validRows.length + issuesNoCorrect.length + issuesMultiCorrect.length) },
    { metric: "validas_firebase_import", value: String(validRows.length) },
    { metric: "issues_no_correct", value: String(issuesNoCorrect.length) },
    { metric: "issues_multi_correct", value: String(issuesMultiCorrect.length) },
  ];
  const wsSummary = xlsx.utils.json_to_sheet(summary);
  xlsx.utils.book_append_sheet(wb, wsSummary, "summary");

  xlsx.writeFile(wb, filePath);
}

function main() {
  const filePath = resolveFilePath(resolveArg("--file"));
  const sheetArg = resolveArg("--sheet");
  const outArg = resolveArg("--out");

  const wb = xlsx.readFile(filePath, { raw: false, cellDates: false });
  const sheetName = detectSheetName(wb, sheetArg);
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Aba nao encontrada: ${sheetName}`);

  const rows = xlsx.utils.sheet_to_json(ws, { raw: false, defval: "" });

  const validRows = [];
  const issuesNoCorrect = [];
  const issuesMultiCorrect = [];

  rows.forEach((row, idx) => {
    const prompt = resolveField(row, "prompt");
    const parsedPromptMeta = parseExamMetaFromPrompt(prompt);
    const provaTipo = resolveField(row, "provaTipo") || parsedPromptMeta.examType;
    const provaAno = resolveField(row, "provaAno") || parsedPromptMeta.examYear;
    const prova = resolveField(row, "prova") || resolveField(row, "quiz");
    const nivel = resolveField(row, "nivel");
    const themes = resolveField(row, "themes");
    const explanation = resolveField(row, "explanation");
    const reference = resolveField(row, "reference");
    const internalNote = resolveField(row, "internalNote");
    const imageUrl = resolveField(row, "imageUrl");
    const isActive = normalizeBool(findValue(row, FIELD_ALIASES.isActive), true) ? "1" : "0";
    const shuffleOptions = normalizeBool(findValue(row, FIELD_ALIASES.shuffleOptions), true) ? "1" : "0";

    let optionA = resolveField(row, "optionA_text");
    let optionB = resolveField(row, "optionB_text");
    let optionC = resolveField(row, "optionC_text");
    let optionD = resolveField(row, "optionD_text");
    let optionE = resolveField(row, "optionE_text");
    let correctOptionId = resolveCorrectOptionId(row);

    // Suporte ao formato: uma coluna de corretas + uma coluna de incorretas separadas por "|".
    if (!optionA || !optionB || !optionC || !optionD || !correctOptionId) {
      const correctList = splitAlternatives(findValue(row, FIELD_ALIASES.correctAlternatives));
      const incorrectList = splitAlternatives(findValue(row, FIELD_ALIASES.incorrectAlternatives));

      if (correctList.length > 1) {
        correctOptionId = "__MULTI__";
      } else if (correctList.length === 1 && incorrectList.length >= 3) {
        const uniqueIncorrect = Array.from(new Set(incorrectList)).filter((item) => item !== correctList[0]);
        const randomized = placeCorrectOption({
          correctText: correctList[0],
          incorrectOptions: uniqueIncorrect,
          seed: `${resolveField(row, "docId") || ""}|${prompt}|${idx}`,
        });
        if (randomized) {
          optionA = randomized.optionA;
          optionB = randomized.optionB;
          optionC = randomized.optionC;
          optionD = randomized.optionD;
          optionE = randomized.optionE;
          correctOptionId = randomized.correctOptionId;
        }
      }
    }

    const docId = resolveField(row, "docId") || autoDocId(provaTipo, provaAno, idx);
    const proofLabel = prova || (provaTipo && provaAno ? `(${provaTipo}-${provaAno})` : "");

    const baseIssue = {
      docId,
      Prova: proofLabel,
      prova_tipo: provaTipo,
      prova_ano: provaAno,
      nivel,
      Temas: themes,
      "Questao (Pergunta)": prompt,
      resposta_A: optionA,
      resposta_B: optionB,
      resposta_C: optionC,
      resposta_D: optionD,
    };

    if (correctOptionId === "__MULTI__") {
      issuesMultiCorrect.push({
        ...baseIssue,
        correto_A: normalizeBool(findValue(row, FIELD_ALIASES.corretoA)) ? "1" : "",
        correto_B: normalizeBool(findValue(row, FIELD_ALIASES.corretoB)) ? "1" : "",
        correto_C: normalizeBool(findValue(row, FIELD_ALIASES.corretoC)) ? "1" : "",
        correto_D: normalizeBool(findValue(row, FIELD_ALIASES.corretoD)) ? "1" : "",
        correto_E: normalizeBool(findValue(row, FIELD_ALIASES.corretoE)) ? "1" : "",
      });
      return;
    }

    if (!correctOptionId) {
      issuesNoCorrect.push(baseIssue);
      return;
    }

    if (!prompt || !optionA || !optionB || !optionC || !optionD) {
      issuesNoCorrect.push({
        ...baseIssue,
        motivo: "Linha sem enunciado ou alternativas A-D completas.",
      });
      return;
    }

    validRows.push({
      docId,
      prompt_text: prompt,
      imageUrl,
      optionA_text: optionA,
      optionA_imageUrl: resolveField(row, "optionA_imageUrl"),
      optionB_text: optionB,
      optionB_imageUrl: resolveField(row, "optionB_imageUrl"),
      optionC_text: optionC,
      optionC_imageUrl: resolveField(row, "optionC_imageUrl"),
      optionD_text: optionD,
      optionD_imageUrl: resolveField(row, "optionD_imageUrl"),
      optionE_text: optionE,
      optionE_imageUrl: resolveField(row, "optionE_imageUrl"),
      correctOptionId,
      shuffleOptions,
      explanation,
      reference,
      internalNote,
      themes,
      prova_tipo: provaTipo,
      prova_ano: provaAno,
      nivel,
      Prova: proofLabel,
      isActive,
    });
  });

  const defaultOut = path.join(
    process.cwd(),
    "exports",
    `${path.basename(filePath, path.extname(filePath))}_firebase_import.xlsx`
  );
  const outFile = outArg
    ? path.isAbsolute(outArg)
      ? outArg
      : path.resolve(process.cwd(), outArg)
    : defaultOut;

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  writeWorkbook(outFile, validRows, issuesNoCorrect, issuesMultiCorrect);

  console.log(`Arquivo origem: ${filePath}`);
  console.log(`Aba lida: ${sheetName}`);
  console.log(`Linhas lidas: ${rows.length}`);
  console.log(`Linhas validas: ${validRows.length}`);
  console.log(`Issues sem correta: ${issuesNoCorrect.length}`);
  console.log(`Issues multiplas corretas: ${issuesMultiCorrect.length}`);
  console.log(`Saida: ${outFile}`);
}

main();
