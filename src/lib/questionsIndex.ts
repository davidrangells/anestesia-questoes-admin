/**
 * Indice de busca do banco de questoes, mantido em memoria na instancia.
 *
 * Antes, cada busca lia a colecao inteira (≈5.000 docs, ≈18 MB com explicacao,
 * alternativas e imagens), normalizava 9 campos por documento e so entao
 * filtrava — 6 a 7 s por tecla digitada, o que estourava o limite da funcao e
 * aparecia para o usuario como "lento" e "as vezes falha".
 *
 * Agora: uma unica carga com `select()` dos campos necessarios, normalizacao
 * feita uma vez, cache por 10 min e invalidacao imediata por um numero de
 * versao gravado em `system_settings/questionsIndex` sempre que uma questao e
 * criada, editada ou excluida pelo admin (vale entre instancias). Uma busca no
 * indice pronto leva menos de 1 ms.
 */
import { adminDb } from "@/lib/firebaseAdmin";

export type QuestionIndexEntry = {
  id: string;
  prompt: string;
  examType: string;
  examYear: number | string | null;
  examSource: string;
  level: string;
  themes: string[];
  isActive: boolean;
  explanationSource: string | null;
  hasImage: boolean;
  hasExplanation: boolean;
  updatedAt: number;
  createdAt: number;
  // campos normalizados para busca
  idNorm: string;
  promptNorm: string;
  explanationNorm: string;
  examNorm: string;
  yearNorm: string;
  levelNorm: string;
  themeNorm: string;
  haystack: string;
};

export type QuestionsIndex = {
  version: number;
  builtAt: number;
  entries: QuestionIndexEntry[];
  summary: { total: number; active: number; inactive: number; commented: number };
};

const VERSION_DOC = adminDb.collection("system_settings").doc("questionsIndex");
const TTL_MS = 10 * 60 * 1000;
const SELECT_FIELDS = [
  "prompt", "prompt_text", "questionText", "statement",
  "explanation", "explanationSource",
  "imageUrl", "options",
  "optionA_imageUrl", "optionB_imageUrl", "optionC_imageUrl", "optionD_imageUrl", "optionE_imageUrl",
  "examType", "prova_tipo", "examYear", "prova_ano", "examSource", "Prova",
  "level", "nivel", "themes", "isActive", "createdAt", "updatedAt",
];

let cache: QuestionsIndex | null = null;
let building: Promise<QuestionsIndex> | null = null;

type RecordData = Record<string, unknown>;

export function toSafeString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function normalizeSearchValue(value: unknown) {
  return toSafeString(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getQuestionPrompt(data: RecordData) {
  return toSafeString(data.prompt_text ?? data.prompt ?? data.questionText ?? data.statement);
}

export function getQuestionThemes(data: RecordData) {
  const raw = data.themes;
  if (Array.isArray(raw)) return raw.map((item) => toSafeString(item).trim()).filter(Boolean);
  if (typeof raw === "string" && raw.trim()) return raw.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
  return [];
}

export function explanationHasMeaningfulText(value: unknown) {
  const text = normalizeSearchValue(value);
  if (!text) return false;
  return ![
    "em breve estara disponivel",
    "em breve comentario disponivel",
    "comentario em breve",
    "sem comentario",
  ].includes(text);
}

function toMillis(value: unknown) {
  if (!value) return 0;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "object" && value !== null) {
    const ts = value as { toMillis?: () => number; seconds?: number };
    if (typeof ts.toMillis === "function") return ts.toMillis() || 0;
    if (typeof ts.seconds === "number") return ts.seconds * 1000;
  }
  return 0;
}

function hasAnyImage(data: RecordData) {
  if (toSafeString(data.imageUrl)) return true;
  const options = Array.isArray(data.options) ? (data.options as RecordData[]) : [];
  if (options.some((o) => toSafeString(o?.imageUrl))) return true;
  return ["optionA_imageUrl", "optionB_imageUrl", "optionC_imageUrl", "optionD_imageUrl", "optionE_imageUrl"].some(
    (k) => toSafeString(data[k])
  );
}

function toEntry(id: string, data: RecordData): QuestionIndexEntry {
  const prompt = getQuestionPrompt(data);
  const examType = toSafeString(data.examType ?? data.prova_tipo);
  const examYearRaw = data.examYear ?? data.prova_ano ?? null;
  const examYear = typeof examYearRaw === "number" || typeof examYearRaw === "string" ? examYearRaw : null;
  const examSource = toSafeString(data.examSource ?? data.Prova);
  const level = toSafeString(data.level ?? data.nivel);
  const themes = getQuestionThemes(data);
  const idNorm = normalizeSearchValue(id);
  const promptNorm = normalizeSearchValue(prompt);
  const examNorm = normalizeSearchValue(`${examType} ${examSource} ${examYear ?? ""}`);
  const yearNorm = normalizeSearchValue(String(examYear ?? ""));
  const levelNorm = normalizeSearchValue(level);
  const themeNorm = normalizeSearchValue(themes.join(" "));
  return {
    id,
    prompt,
    examType,
    examYear,
    examSource,
    level,
    themes,
    isActive: data.isActive !== false,
    explanationSource: toSafeString(data.explanationSource) || null,
    hasImage: hasAnyImage(data),
    hasExplanation: explanationHasMeaningfulText(data.explanation),
    updatedAt: toMillis(data.updatedAt),
    createdAt: toMillis(data.createdAt),
    idNorm,
    promptNorm,
    explanationNorm: normalizeSearchValue(data.explanation),
    examNorm,
    yearNorm,
    levelNorm,
    themeNorm,
    haystack: [idNorm, promptNorm, examNorm, levelNorm, themeNorm].join(" "),
  };
}

async function readVersion() {
  const snap = await VERSION_DOC.get();
  const v = snap.exists ? Number((snap.data() as RecordData).version) : 0;
  return Number.isFinite(v) ? v : 0;
}

async function build(version: number): Promise<QuestionsIndex> {
  const snap = await adminDb.collection("questionsBank").select(...SELECT_FIELDS).get();
  const entries = snap.docs
    .map((d) => toEntry(d.id, d.data() as RecordData))
    .sort((a, b) => Math.max(b.updatedAt, b.createdAt) - Math.max(a.updatedAt, a.createdAt));
  const summary = entries.reduce(
    (acc, e) => {
      if (e.isActive) acc.active += 1; else acc.inactive += 1;
      if (e.hasExplanation) acc.commented += 1;
      return acc;
    },
    { total: entries.length, active: 0, inactive: 0, commented: 0 }
  );
  return { version, builtAt: Date.now(), entries, summary };
}

/** Devolve o indice, reconstruindo se a versao mudou ou o cache venceu. */
export async function getQuestionsIndex(): Promise<QuestionsIndex> {
  const version = await readVersion();
  if (cache && cache.version === version && Date.now() - cache.builtAt < TTL_MS) return cache;
  if (!building) {
    building = build(version)
      .then((idx) => { cache = idx; return idx; })
      .finally(() => { building = null; });
  }
  return building;
}

/** Chamar apos criar, editar ou excluir questao: invalida em todas as instancias. */
export async function bumpQuestionsIndexVersion() {
  cache = null;
  await VERSION_DOC.set({ version: Date.now(), updatedAt: new Date() }, { merge: true });
}

// ─── busca ───────────────────────────────────────────────────────────────────

export type SearchFilters = {
  generalTokens: string[];
  yearTokens: string[];
  examTokens: string[];
  themeTokens: string[];
  levelTokens: string[];
  idTokens: string[];
  promptTokens: string[];
  explanationTokens: string[];
};

const FIELD_ALIASES: Record<string, keyof SearchFilters> = {
  ano: "yearTokens", year: "yearTokens",
  prova: "examTokens", exam: "examTokens", tipo: "examTokens",
  tema: "themeTokens", topico: "themeTokens",
  nivel: "levelTokens",
  id: "idTokens", codigo: "idTokens", cod: "idTokens",
  enunciado: "promptTokens", texto: "promptTokens", prompt: "promptTokens",
  comentario: "explanationTokens", explicacao: "explanationTokens", explanation: "explanationTokens",
};

export function parseAdvancedSearch(raw: string): SearchFilters {
  const filters: SearchFilters = {
    generalTokens: [], yearTokens: [], examTokens: [], themeTokens: [],
    levelTokens: [], idTokens: [], promptTokens: [], explanationTokens: [],
  };
  const rawTokens = raw.match(/"[^"]+"|\S+/g) ?? [];
  const push = (target: string[], value: string) => {
    for (const t of normalizeSearchValue(value).split(" ")) if (t) target.push(t);
  };
  for (const rawToken of rawTokens) {
    const token = rawToken.trim();
    if (!token) continue;
    const sep = token.indexOf(":");
    if (sep > 0) {
      const field = normalizeSearchValue(token.slice(0, sep));
      const value = token.slice(sep + 1).replace(/^"|"$/g, "");
      const target = FIELD_ALIASES[field];
      if (target && value.trim()) { push(filters[target], value); continue; }
    }
    push(filters.generalTokens, token);
  }
  return filters;
}

const includesAll = (haystack: string, tokens: string[]) =>
  tokens.every((t) => haystack.includes(t));

/**
 * Pontua a relevancia de uma questao para os termos gerais. Quanto maior,
 * melhor: id exato > id por prefixo > termos no inicio do enunciado > termos
 * como palavra inteira > ocorrencia em qualquer lugar.
 */
function score(entry: QuestionIndexEntry, tokens: string[]) {
  if (!tokens.length) return 0;
  const joined = tokens.join(" ");
  let s = 0;
  if (entry.idNorm === joined) s += 1000;
  else if (entry.idNorm.startsWith(joined)) s += 500;
  if (entry.promptNorm.startsWith(joined)) s += 120;
  else if (entry.promptNorm.includes(joined)) s += 60;
  for (const t of tokens) {
    if (entry.promptNorm.includes(` ${t} `) || entry.promptNorm.startsWith(`${t} `)) s += 10;
    if (entry.themeNorm.includes(t)) s += 6;
    if (entry.examNorm.includes(t)) s += 4;
  }
  return s;
}

export function searchIndex(
  index: QuestionsIndex,
  opts: { filters: SearchFilters; hasSearch: boolean; status: string; theme: string }
) {
  const { filters, hasSearch, status, theme } = opts;
  const matches: Array<{ entry: QuestionIndexEntry; score: number }> = [];
  for (const entry of index.entries) {
    if (status === "ativas" && !entry.isActive) continue;
    if (status === "inativas" && entry.isActive) continue;
    if (theme && !entry.themes.includes(theme)) continue;
    if (hasSearch) {
      if (!includesAll(entry.haystack, filters.generalTokens)) continue;
      if (!includesAll(entry.yearNorm, filters.yearTokens)) continue;
      if (!includesAll(entry.examNorm, filters.examTokens)) continue;
      if (!includesAll(entry.themeNorm, filters.themeTokens)) continue;
      if (!includesAll(entry.levelNorm, filters.levelTokens)) continue;
      if (!includesAll(entry.idNorm, filters.idTokens)) continue;
      if (!includesAll(entry.promptNorm, filters.promptTokens)) continue;
      if (!includesAll(entry.explanationNorm, filters.explanationTokens)) continue;
    }
    matches.push({ entry, score: hasSearch ? score(entry, filters.generalTokens) : 0 });
  }
  // Com busca: mais relevante primeiro; empate mantem a ordem por atualizacao.
  if (hasSearch) matches.sort((a, b) => b.score - a.score);
  return matches.map((m) => m.entry);
}

/** Projecao enviada para a listagem (sem explicacao/alternativas: ~10x menor). */
export function toListItem(e: QuestionIndexEntry) {
  return {
    id: e.id,
    prompt: e.prompt,
    examType: e.examType,
    examYear: e.examYear,
    examSource: e.examSource,
    level: e.level,
    themes: e.themes,
    isActive: e.isActive,
    explanationSource: e.explanationSource,
    hasImage: e.hasImage,
    hasExplanation: e.hasExplanation,
    updatedAt: e.updatedAt || null,
  };
}
