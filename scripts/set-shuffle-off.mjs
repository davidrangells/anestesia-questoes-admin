/**
 * Desliga o embaralhamento (`shuffleOptions = false`) em questões cuja ordem
 * das alternativas precisa ficar fixa.
 *
 * Dois casos: alternativas que são só uma letra apontando para rótulos de uma
 * figura (embaralhar tornaria o enunciado incoerente com a imagem) e
 * alternativas do tipo "Todas as alternativas estão corretas", que por
 * convenção ficam por último.
 *
 * As telas do aluno já se protegem sozinhas do primeiro caso, mas a flag no
 * banco precisa refletir a verdade: é o que o admin vê no editor.
 *
 * Uso:
 *   node scripts/set-shuffle-off.mjs --ids=1428,1551,...            # dry-run
 *   node scripts/set-shuffle-off.mjs --ids=1428,1551,... --apply
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import fs from "node:fs";
import path from "node:path";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    if (!k || process.env[k]) continue;
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[k] = v;
  }
}
loadEnvFile(path.resolve(process.cwd(), ".env.local"));
loadEnvFile(path.resolve(process.cwd(), ".env"));

const getArg = (f) => {
  const p = `${f}=`;
  const a = process.argv.find((x) => x.startsWith(p));
  return a ? a.slice(p.length) : null;
};
const ids = (getArg("--ids") || "").split(",").map((s) => s.trim()).filter(Boolean);
const apply = process.argv.includes("--apply");
if (!ids.length) {
  console.error("Uso: node scripts/set-shuffle-off.mjs --ids=<id1,id2,...> [--apply]");
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    }),
  });
}
const db = getFirestore();
const col = db.collection("questionsBank");

const snaps = await db.getAll(...ids.map((id) => col.doc(id)));
const ausentes = snaps.filter((s) => !s.exists).map((s) => s.id);
if (ausentes.length) {
  console.error(`Abortado: ${ausentes.length} ids não existem.`, ausentes);
  process.exit(1);
}
const jaDesligadas = snaps.filter((s) => s.data().shuffleOptions === false).map((s) => s.id);
const mudar = snaps.filter((s) => s.data().shuffleOptions !== false).map((s) => s.id);

console.log(`Ids: ${ids.length} | já desligadas: ${jaDesligadas.length} | a desligar: ${mudar.length}`);
for (const s of snaps) {
  const opts = (s.data().options || []).map((o) => String(o.text || "").replace(/<[^>]+>/g, "").trim().slice(0, 28));
  console.log(`  ${s.id.padEnd(14)} shuffle=${String(s.data().shuffleOptions).padEnd(5)} opts: ${opts.join(" | ")}`);
}
console.log(`Modo: ${apply ? "GRAVAR" : "DRY-RUN"}`);
if (!apply) { console.log("\nDry-run — nada gravado."); process.exit(0); }

const batch = db.batch();
for (const id of mudar) batch.update(col.doc(id), { shuffleOptions: false, updatedAt: FieldValue.serverTimestamp() });
await batch.commit();
console.log(`\nConcluído: ${mudar.length} questões com embaralhamento desligado.`);
