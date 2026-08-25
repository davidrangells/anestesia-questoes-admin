/**
 * Grava no campo `reference` das questões a citação verificada de capítulo.
 *
 * A citação foi montada a partir dos sumários reais dos PDFs de referência e
 * cada capítulo foi confirmado por busca de termos no texto da obra. Não há
 * número de página porque os PDFs não trazem numeração impressa recuperável —
 * a unidade citável confiável é o capítulo.
 *
 * Uso:
 *   node scripts/apply-references.mjs --file=<json>            # dry-run
 *   node scripts/apply-references.mjs --file=<json> --apply
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
const file = getArg("--file");
const apply = process.argv.includes("--apply");
if (!file || !fs.existsSync(file)) {
  console.error("Uso: node scripts/apply-references.mjs --file=<json> [--apply]");
  process.exit(1);
}

const refs = JSON.parse(fs.readFileSync(file, "utf8"));
const ids = Object.keys(refs);
const vazias = ids.filter((i) => !String(refs[i] || "").trim());
if (vazias.length) {
  console.error(`Abortado: ${vazias.length} referências vazias.`, vazias.slice(0, 5));
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

const existentes = new Set((await col.select().get()).docs.map((d) => d.id));
const ausentes = ids.filter((i) => !existentes.has(i));
if (ausentes.length) {
  console.error(`Abortado: ${ausentes.length} ids não existem na coleção.`, ausentes.slice(0, 5));
  process.exit(1);
}

console.log(`Referências a gravar: ${ids.length}`);
console.log(`Modo: ${apply ? "GRAVAR" : "DRY-RUN"}`);
console.log(`Exemplo: ${refs[ids[0]]}`);

if (!apply) {
  console.log("\nDry-run — nada gravado.");
  process.exit(0);
}

let n = 0;
for (let i = 0; i < ids.length; i += 400) {
  const grupo = ids.slice(i, i + 400);
  const batch = db.batch();
  for (const id of grupo) {
    batch.update(col.doc(id), { reference: refs[id], updatedAt: FieldValue.serverTimestamp() });
  }
  await batch.commit();
  n += grupo.length;
  console.log(`  → ${n}/${ids.length}`);
}
console.log(`\nConcluído: ${n} questões com referência verificada.`);
