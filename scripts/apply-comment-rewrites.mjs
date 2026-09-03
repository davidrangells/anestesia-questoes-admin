/**
 * Grava reescritas de comentário (campo `explanation`) por docId.
 * Uso: node scripts/apply-comment-rewrites.mjs --file=<json> [--apply]
 * O JSON é um objeto { docId: "<html>" }.
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import fs from "node:fs";
import path from "node:path";
function loadEnv(p) {
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const t = line.trim(); if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("="); if (eq === -1) continue;
    const k = t.slice(0, eq).trim(); if (!k || process.env[k]) continue;
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[k] = v;
  }
}
loadEnv(path.resolve(process.cwd(), ".env.local"));
loadEnv(path.resolve(process.cwd(), ".env"));
const getArg = (f) => { const p = `${f}=`; const a = process.argv.find((x) => x.startsWith(p)); return a ? a.slice(p.length) : null; };
const file = getArg("--file"); const apply = process.argv.includes("--apply");
if (!file || !fs.existsSync(file)) { console.error("Uso: --file=<json> [--apply]"); process.exit(1); }
const dados = JSON.parse(fs.readFileSync(file, "utf8"));
const ids = Object.keys(dados);
const ruins = ids.filter((i) => !String(dados[i] || "").trim() || /[—–]/.test(dados[i]));
if (ruins.length) { console.error(`Abortado: ${ruins.length} com travessão ou vazios.`, ruins.slice(0, 5)); process.exit(1); }
if (!getApps().length) initializeApp({ credential: cert({
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
})});
const db = getFirestore(); const col = db.collection("questionsBank");
const existentes = new Set((await col.select().get()).docs.map((d) => d.id));
const ausentes = ids.filter((i) => !existentes.has(i));
if (ausentes.length) { console.error(`Abortado: ${ausentes.length} ids inexistentes.`, ausentes.slice(0, 5)); process.exit(1); }
console.log(`Comentários a gravar: ${ids.length} | modo: ${apply ? "GRAVAR" : "DRY-RUN"}`);
if (!apply) { console.log("Dry-run — nada gravado."); process.exit(0); }
let n = 0;
for (let i = 0; i < ids.length; i += 400) {
  const g = ids.slice(i, i + 400); const b = db.batch();
  for (const id of g) b.update(col.doc(id), { explanation: dados[id], updatedAt: FieldValue.serverTimestamp() });
  await b.commit(); n += g.length; console.log(`  → ${n}/${ids.length}`);
}
console.log(`\nConcluído: ${n} comentários atualizados.`);
