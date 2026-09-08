#!/usr/bin/env node
/**
 * Extrai o texto de um PDF grande em "chunks" (blocos de N paginas),
 * salvando cada chunk em um .txt separado. Facilita busca por tema depois.
 *
 * Uso:
 *   node scripts/extract-book-chunks.mjs \
 *     --file="<caminho.pdf>" \
 *     --out-dir="<pasta_destino>" \
 *     --chunk=200
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
  const outDir = getArg("--out-dir");
  const chunkSize = Number(getArg("--chunk", "200"));

  if (!filePath || !fs.existsSync(filePath) || !outDir) {
    console.error("Uso: --file=<pdf> --out-dir=<pasta> [--chunk=200]");
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });

  const buffer = fs.readFileSync(filePath);
  console.log(`[chunks] ${path.basename(filePath)} (${(buffer.length / 1024 / 1024).toFixed(1)}MB)`);

  const parser = new PDFParse({ data: buffer });

  // Descobre o total de paginas fazendo uma leitura minima primeiro
  const meta = await parser.getText({ first: 1, last: 1 });
  // Total nao vem em meta — precisamos ir empurrando por chunks e detectar fim
  console.log(`[chunks] Extraindo em blocos de ${chunkSize} paginas...`);

  let page = 1;
  let chunkIndex = 1;

  while (true) {
    const start = page;
    const end = page + chunkSize - 1;
    const outPath = path.join(outDir, `chunk-${String(chunkIndex).padStart(3, "0")}_p${start}-p${end}.txt`);

    if (fs.existsSync(outPath)) {
      console.log(`  [skip] ${path.basename(outPath)} ja existe`);
      page = end + 1;
      chunkIndex += 1;
      continue;
    }

    try {
      const data = await parser.getText({ first: start, last: end });
      const text = data.text || "";
      if (!text.trim()) {
        console.log(`[chunks] Sem texto na faixa ${start}-${end}. Fim.`);
        break;
      }
      fs.writeFileSync(outPath, text);
      console.log(`  → ${path.basename(outPath)} (${(text.length / 1024).toFixed(0)}KB)`);
      if (text.length < 500) {
        console.log(`[chunks] Chunk muito pequeno — provavelmente fim do PDF.`);
        break;
      }
    } catch (err) {
      console.log(`[chunks] Erro na faixa ${start}-${end}: ${err.message}. Assumindo fim.`);
      break;
    }
    page = end + 1;
    chunkIndex += 1;
  }

  await parser.destroy();
  console.log(`\n✅ Extraidos ${chunkIndex - 1} chunks em ${outDir}`);
}

main().catch((err) => {
  console.error("[chunks] Falha:", err);
  process.exit(1);
});
