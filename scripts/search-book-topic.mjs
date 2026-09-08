#!/usr/bin/env node
/**
 * Busca trechos de um tema nos chunks extraidos dos livros (PT-BR + EN).
 *
 * Uso:
 *   node scripts/search-book-topic.mjs \
 *     --pt="oxido nitroso" \
 *     --en="nitrous oxide" \
 *     --dirs=exports/referencias/txt/saesp,exports/referencias/txt/miller \
 *     --out=exports/referencias/temas/oxido-nitroso.md \
 *     --max=30 \
 *     --context=1800
 *
 * O termo `--pt` eh buscado nos chunks em portugues (SAESP).
 * O termo `--en` eh buscado nos chunks em ingles (Miller).
 * Os trechos sao concatenados em um Markdown pronto para colar no ChatGPT.
 */

import fs from "node:fs";
import path from "node:path";

function getArg(flag, def = null) {
  const p = `${flag}=`;
  const raw = process.argv.find((a) => a.startsWith(p));
  return raw ? raw.slice(p.length) : def;
}

function normalize(s) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function searchInDir(dir, terms, context, maxHits) {
  if (!fs.existsSync(dir)) return [];
  const hits = [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".txt")).sort();
  const normTerms = terms.map(normalize).filter(Boolean);
  if (normTerms.length === 0) return [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), "utf8");
    const normalized = normalize(content);

    let idx = 0;
    while (idx < normalized.length && hits.length < maxHits) {
      // Encontra a proxima ocorrencia de QUALQUER um dos termos
      let nextPos = -1;
      let nextTerm = "";
      for (const term of normTerms) {
        const pos = normalized.indexOf(term, idx);
        if (pos !== -1 && (nextPos === -1 || pos < nextPos)) {
          nextPos = pos;
          nextTerm = term;
        }
      }
      if (nextPos === -1) break;

      const winStart = Math.max(0, nextPos - context / 2);
      const winEnd = Math.min(content.length, nextPos + context / 2);
      const snippet = content.slice(winStart, winEnd).trim();

      // Score: quantos termos aparecem no snippet
      const snippetNorm = normalize(snippet);
      const score = normTerms.filter((t) => snippetNorm.includes(t)).length;

      hits.push({ file, position: nextPos, snippet, score, matchedTerm: nextTerm });
      idx = nextPos + context; // pula pra nao repetir muito
    }
    if (hits.length >= maxHits) break;
  }

  // Ordena por score (mais termos = mais relevante)
  hits.sort((a, b) => b.score - a.score);
  return hits;
}

async function main() {
  const ptQuery = getArg("--pt", "");
  const enQuery = getArg("--en", "");
  const dirs = (getArg("--dirs", "") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const context = Number(getArg("--context", "1800"));
  const outPath = getArg("--out");
  const maxHits = Number(getArg("--max", "30"));

  if ((!ptQuery && !enQuery) || dirs.length === 0) {
    console.error(
      'Uso: --pt="<termos pt>" --en="<termos en>" --dirs=<d1>,<d2> [--context=1800] [--max=30] [--out=<md>]'
    );
    process.exit(1);
  }

  const ptTerms = ptQuery ? ptQuery.split(/\s+/).filter(Boolean) : [];
  const enTerms = enQuery ? enQuery.split(/\s+/).filter(Boolean) : [];

  console.log(`[search] PT: ${ptTerms.join(", ") || "(vazio)"}`);
  console.log(`[search] EN: ${enTerms.join(", ") || "(vazio)"}`);

  const allHits = [];
  for (const dir of dirs) {
    const isPt = /saesp|pt|portugu/i.test(dir);
    const terms = isPt ? ptTerms : enTerms;
    const lang = isPt ? "PT-BR (SAESP)" : "EN (Miller)";
    console.log(`\n[search] ${path.basename(dir)} (${lang})`);
    const hits = searchInDir(dir, terms, context, Math.ceil(maxHits / dirs.length) + 5);
    console.log(`  ${hits.length} trecho(s)`);
    hits.forEach((h) => allHits.push({ ...h, source: path.basename(dir), lang }));
  }

  // Prioriza trechos com maior score
  allHits.sort((a, b) => b.score - a.score);
  const top = allHits.slice(0, maxHits);
  console.log(`\n[search] Total: ${top.length} trecho(s) selecionado(s).`);

  const md = [
    `# Trechos para geracao de flashcards`,
    ``,
    `- Termos PT: ${ptTerms.join(", ") || "(vazio)"}`,
    `- Termos EN: ${enTerms.join(", ") || "(vazio)"}`,
    `- Total de trechos: ${top.length}`,
    ``,
    `---`,
    ``,
    ...top.map(
      (h, i) =>
        `## Trecho ${i + 1} — ${h.source} / ${h.file} (score ${h.score})\n\n${h.snippet}\n`
    ),
  ].join("\n");

  if (outPath) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, md);
    console.log(`[search] Salvo em: ${outPath} (${(md.length / 1024).toFixed(1)}KB)`);
  } else {
    console.log("\n" + md.slice(0, 5000));
  }
}

main().catch((err) => {
  console.error("[search] Falha:", err);
  process.exit(1);
});
