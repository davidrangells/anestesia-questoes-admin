#!/usr/bin/env node
/**
 * Gera a planilha .xlsx de importacao de flashcards a partir de um JSON.
 *
 * Uso:
 *   node scripts/build-flashcards-xlsx.mjs --in=<cards.json> --out=<planilha.xlsx>
 *
 * Formato do JSON de entrada:
 * {
 *   "meta": { "tema": "...", "fontes": "...", "observacoes": "..." },
 *   "decks": [ { deckId, title, description, moduleId, themeId, order } ],
 *   "cards": [ { flashcardId?, frontText, backText, shortExplanation, themeId,
 *               themeName, moduleId, examType, level?, deckIds[], tags[],
 *               difficulty, sourceReference, reviewNotes? } ]
 * }
 *
 * - flashcardId ausente → gerado como fc_<themeId-slug>_<NNN>.
 * - cardCount dos decks eh calculado a partir dos cards.
 * - status/isActive/needsReview/sourceType/generationMethod sao fixados
 *   (pending_review / false / true / manual / manual_from_book_v3).
 * - Valida limites de tamanho e padroes proibidos antes de gravar.
 */

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const xlsx = require("xlsx");

function getArg(flag, def = null) {
  const p = `${flag}=`;
  const raw = process.argv.find((a) => a.startsWith(p));
  return raw ? raw.slice(p.length) : def;
}

const LIMITS = { front: 200, back: 100, explanation: 320 };

function slug(s) {
  return String(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function validateCard(c, idx) {
  const errs = [];
  const tag = c.flashcardId || `card #${idx + 1}`;
  for (const k of ["frontText", "backText", "shortExplanation", "themeId", "themeName", "moduleId", "examType", "difficulty", "sourceReference"]) {
    if (!c[k] || !String(c[k]).trim()) errs.push(`${tag}: campo ${k} vazio`);
  }
  if (c.frontText && c.frontText.length > LIMITS.front) errs.push(`${tag}: frontText com ${c.frontText.length} chars (max ${LIMITS.front})`);
  if (c.backText && c.backText.length > LIMITS.back) errs.push(`${tag}: backText com ${c.backText.length} chars (max ${LIMITS.back})`);
  if (c.shortExplanation && c.shortExplanation.length > LIMITS.explanation) errs.push(`${tag}: shortExplanation com ${c.shortExplanation.length} chars (max ${LIMITS.explanation})`);
  const back = String(c.backText ?? "").trim();
  if (/^[A-EVF]$/i.test(back)) errs.push(`${tag}: verso trivial "${back}"`);
  if (/^[VF]([\s,]+[VF])+$/i.test(back)) errs.push(`${tag}: verso V/F`);
  if (/^itens corretos\s*:/i.test(back)) errs.push(`${tag}: verso "Itens corretos:"`);
  if (/^somente\s+[\d\s,eE]+\s+(esta|é|sao|estao)/i.test(back)) errs.push(`${tag}: verso "Somente X corretas"`);
  if (/\.{3,}\s*$|…\s*$/.test(String(c.frontText ?? ""))) errs.push(`${tag}: frente truncada com ...`);
  if (/quais\s+(afirmac|assertiv|itens)|considere\s+as\s+(afirmac|assertiv)/i.test(String(c.frontText ?? ""))) errs.push(`${tag}: frente em formato de assertivas`);
  if (!["me", "tea", "tsa"].includes(c.moduleId)) errs.push(`${tag}: moduleId invalido`);
  if (!["easy", "medium", "hard"].includes(c.difficulty)) errs.push(`${tag}: difficulty invalido`);
  if (!Array.isArray(c.deckIds) || c.deckIds.length === 0) errs.push(`${tag}: deckIds vazio`);
  return errs;
}

async function main() {
  const inPath = getArg("--in");
  const outPath = getArg("--out");
  if (!inPath || !outPath) {
    console.error("Uso: node scripts/build-flashcards-xlsx.mjs --in=<cards.json|cards.mjs> --out=<planilha.xlsx>");
    process.exit(1);
  }
  // Aceita .json ou um modulo .mjs com `export default { meta, decks, cards }`
  // (o .mjs permite usar constantes para tema/referencias repetidas).
  const data = inPath.endsWith(".mjs")
    ? (await import(path.resolve(inPath))).default
    : JSON.parse(fs.readFileSync(inPath, "utf8"));
  const decks = data.decks ?? [];
  const cards = data.cards ?? [];
  const meta = data.meta ?? {};

  // IDs automaticos + validacao
  const seen = new Set();
  const counters = new Map();
  const errors = [];
  cards.forEach((c, i) => {
    if (!c.flashcardId) {
      const base = slug(c.themeId || "card");
      const n = (counters.get(base) || 0) + 1;
      counters.set(base, n);
      c.flashcardId = `fc_${base}_${String(n).padStart(3, "0")}`;
    }
    if (seen.has(c.flashcardId)) errors.push(`${c.flashcardId}: id duplicado`);
    seen.add(c.flashcardId);
    errors.push(...validateCard(c, i));
    for (const d of c.deckIds ?? []) {
      if (!decks.some((dk) => dk.deckId === d)) errors.push(`${c.flashcardId}: deck "${d}" nao existe em decks[]`);
    }
  });
  if (errors.length) {
    console.error(`\n[build] ${errors.length} problema(s):`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  // cardCount por deck
  const countByDeck = new Map();
  cards.forEach((c) => c.deckIds.forEach((d) => countByDeck.set(d, (countByDeck.get(d) || 0) + 1)));

  const flashRows = cards.map((c) => ({
    flashcardId: c.flashcardId,
    frontText: c.frontText,
    backText: c.backText,
    shortExplanation: c.shortExplanation,
    themeId: c.themeId,
    themeName: c.themeName,
    moduleId: c.moduleId,
    examType: c.examType,
    examYear: "",
    level: c.level ?? "",
    deckIds: c.deckIds.join(";"),
    tags: (c.tags ?? []).join(";"),
    difficulty: c.difficulty,
    status: "pending_review",
    isActive: false,
    sourceType: "manual",
    sourceQuestionId: "",
    sourceCorrectOptionId: "",
    sourceCorrectOptionText: "",
    sourceReference: c.sourceReference,
    sourceQuestionPreview: "",
    generationMethod: "manual_from_book_v3",
    needsReview: true,
    reviewNotes: c.reviewNotes ?? "",
  }));

  const deckRows = decks.map((d, i) => ({
    deckId: d.deckId,
    title: d.title,
    description: d.description ?? "",
    moduleId: d.moduleId ?? "",
    themeId: d.themeId ?? "",
    cardCount: countByDeck.get(d.deckId) || 0,
    isActive: false,
    order: d.order ?? i + 1,
    status: "pending_review",
  }));

  const infoRows = [
    { Chave: "Tema", Valor: meta.tema ?? "" },
    { Chave: "Fontes", Valor: meta.fontes ?? "" },
    { Chave: "Data", Valor: new Date().toISOString().slice(0, 10) },
    { Chave: "Total de flashcards", Valor: cards.length },
    { Chave: "Total de decks", Valor: decks.length },
    { Chave: "Observacoes", Valor: meta.observacoes ?? "" },
  ];

  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(flashRows), "Flashcards_Import");
  xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(deckRows), "Decks_Import");
  xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(infoRows), "Instrucoes_Importacao");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  xlsx.writeFile(wb, outPath);

  const dist = cards.reduce((a, c) => ((a[c.difficulty] = (a[c.difficulty] || 0) + 1), a), {});
  console.log(`[build] ${cards.length} cards, ${decks.length} decks → ${outPath}`);
  console.log(`[build] dificuldade: ${JSON.stringify(dist)}`);
}

main();
