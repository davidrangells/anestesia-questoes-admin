/**
 * Espelha nas planilhas de origem correções feitas direto no Firestore.
 *
 * Por quê: o importador sobrescreve os campos com o que está na planilha. Uma
 * correção só no banco some na próxima importação (já aconteceu com themeIds e
 * shuffleOptions). Toda correção em massa precisa chegar às duas pontas.
 *
 * Entrada: JSON { "<docId>": { "explanation": "...", "shuffleOptions": 0 }, ... }
 * Só as chaves presentes em cada entrada são alteradas; colunas ausentes na
 * planilha são ignoradas com aviso.
 *
 * Uso:
 *   node scripts/mirror-to-xlsx.mjs --file=<json> --xlsx=a.xlsx,b.xlsx           # dry-run
 *   node scripts/mirror-to-xlsx.mjs --file=<json> --xlsx=a.xlsx,b.xlsx --apply
 */
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const getArg = (f) => {
  const p = `${f}=`;
  const a = process.argv.find((x) => x.startsWith(p));
  return a ? a.slice(p.length) : null;
};
const file = getArg("--file");
const xlsxList = (getArg("--xlsx") || "").split(",").map((s) => s.trim()).filter(Boolean);
const apply = process.argv.includes("--apply");
if (!file || !fs.existsSync(file) || !xlsxList.length) {
  console.error("Uso: node scripts/mirror-to-xlsx.mjs --file=<json> --xlsx=<a.xlsx,b.xlsx> [--apply]");
  process.exit(1);
}
const mudancas = JSON.parse(fs.readFileSync(file, "utf8"));
const pendentes = new Set(Object.keys(mudancas));

for (const caminho of xlsxList) {
  if (!fs.existsSync(caminho)) { console.error(`Não existe: ${caminho}`); process.exit(1); }
  const wb = XLSX.readFile(caminho, { cellStyles: false });
  let alterou = 0;
  for (const nome of wb.SheetNames) {
    const ws = wb.Sheets[nome];
    const linhas = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
    if (!linhas.length) continue;
    const head = linhas[0].map((c) => (c == null ? "" : String(c).trim()));
    const ci = head.indexOf("docId");
    if (ci === -1) continue;
    const colunas = {};
    for (const campo of ["explanation", "shuffleOptions"]) {
      const idx = head.indexOf(campo);
      if (idx !== -1) colunas[campo] = idx;
    }
    for (let r = 1; r < linhas.length; r++) {
      const id = linhas[r][ci] == null ? "" : String(linhas[r][ci]).trim();
      if (!id || !mudancas[id]) continue;
      for (const [campo, valor] of Object.entries(mudancas[id])) {
        if (!(campo in colunas)) { console.warn(`  aviso: ${caminho} não tem coluna ${campo}`); continue; }
        const ref = XLSX.utils.encode_cell({ r, c: colunas[campo] });
        ws[ref] = typeof valor === "number" ? { t: "n", v: valor } : { t: "s", v: String(valor) };
        alterou++;
      }
      pendentes.delete(id);
    }
  }
  console.log(`${caminho}: ${alterou} célula(s) ${apply ? "gravada(s)" : "a gravar"}`);
  if (apply && alterou) XLSX.writeFile(wb, caminho);
}
console.log(`\nIds sem planilha correspondente (só existem no Firestore): ${pendentes.size}`);
if (pendentes.size) console.log("  ", [...pendentes].slice(0, 40).join(", "));
if (!apply) console.log("\nDry-run — nenhuma planilha alterada.");
