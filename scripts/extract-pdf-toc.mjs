#!/usr/bin/env node
/**
 * Extrai o sumario (primeiras N paginas) e informacoes basicas de um PDF.
 *
 * Uso:
 *   node scripts/extract-pdf-toc.mjs --file=<caminho.pdf> [--pages=20] [--out=<caminho.txt>]
 *
 * O objetivo eh mapear os capitulos por tema antes de extrair o texto integral.
 */

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

function getArg(flag, def = null) {
  const p = `${flag}=`;
  const raw = process.argv.find((a) => a.startsWith(p));
  return raw ? raw.slice(p.length) : def;
}

async function main() {
  const filePath = getArg("--file");
  if (!filePath || !fs.existsSync(filePath)) {
    console.error("Uso: node scripts/extract-pdf-toc.mjs --file=<caminho.pdf> [--pages=20] [--out=<txt>]");
    process.exit(1);
  }
  const maxPages = Number(getArg("--pages", "20"));
  const outPath = getArg("--out");

  const buffer = fs.readFileSync(filePath);
  console.log(`[extract] ${path.basename(filePath)} (${(buffer.length / 1024 / 1024).toFixed(1)}MB)`);

  const parser = new PDFParse({ data: buffer });
  const info = await parser.getInfo();
  console.log(`[extract] Total de paginas no PDF: ${info.numpages || info.pages || "?"}`);

  const startPage = Number(getArg("--start", "1"));
  const endPage = Number(getArg("--end", String(maxPages)));
  console.log(`[extract] Extraindo paginas ${startPage} a ${endPage}...`);

  const data = await parser.getText({ first: startPage, last: endPage });
  const text = data.text || "";

  if (outPath) {
    fs.writeFileSync(outPath, text);
    console.log(`[extract] Texto salvo em: ${outPath} (${text.length} chars)`);
  } else {
    console.log("\n=== TEXTO EXTRAIDO ===\n");
    console.log(text.slice(0, 20000));
    if (text.length > 20000) {
      console.log(`\n... [truncado — ${text.length} chars totais]`);
    }
  }
  await parser.destroy();
}

main().catch((err) => {
  console.error("[extract] Falha:", err);
  process.exit(1);
});
