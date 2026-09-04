/**
 * Grava os comentários sem referência por letra de alternativa.
 *
 * Contexto: as telas do aluno passaram a embaralhar as alternativas, então um
 * comentário que diz "(B) está incorreta porque..." apontaria a alternativa
 * errada. Este script grava a versão que identifica cada alternativa pelo
 * conteúdo.
 *
 * Entrada: JSON no formato { "<docId>": "<explanation em HTML>", ... }
 *
 * Uso:
 *   node scripts/apply-letter-removal.mjs --file=<json>            # dry-run
 *   node scripts/apply-letter-removal.mjs --file=<json> --apply
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
  console.error("Uso: node scripts/apply-letter-removal.mjs --file=<json> [--apply]");
  process.exit(1);
}

const novos = JSON.parse(fs.readFileSync(file, "utf8"));
const ids = Object.keys(novos);

/* ---------- travas de segurança ---------- */

// Só letra MAIÚSCULA: minúscula casa com "(a)" de enumeração, com "do(a)
// paciente" e com a conjunção "e" ("alternativa e D"), que não são referência.
const LETRA = /\(\s*[A-E]\s*\)|\b(?:[Aa]lternativa|[Oo]p[çc][ãa]o|[Ll]etra)\s+[A-E]\b|[Rr]esposta\s+correta\s+[ée]\s+[A-E]\b/;
const TRAVESSAO = /[—–]/;

const vazios = ids.filter((i) => !String(novos[i] || "").trim());
if (vazios.length) {
  console.error(`Abortado: ${vazios.length} comentários vazios.`, vazios.slice(0, 5));
  process.exit(1);
}
const aindaComLetra = ids.filter((i) => LETRA.test(novos[i]));
if (aindaComLetra.length) {
  console.error(`Abortado: ${aindaComLetra.length} ainda citam letra.`, aindaComLetra.slice(0, 8));
  process.exit(1);
}
const comTravessao = ids.filter((i) => TRAVESSAO.test(novos[i]));
if (comTravessao.length) {
  console.error(`Abortado: ${comTravessao.length} contêm travessão.`, comTravessao.slice(0, 8));
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

// todos os ids precisam existir
const existentes = new Set((await col.select().get()).docs.map((d) => d.id));
const ausentes = ids.filter((i) => !existentes.has(i));
if (ausentes.length) {
  console.error(`Abortado: ${ausentes.length} ids não existem na coleção.`, ausentes.slice(0, 5));
  process.exit(1);
}

// nenhum comentário pode encolher demais: sinal de conteúdo perdido na reescrita
const atuais = new Map();
for (let i = 0; i < ids.length; i += 300) {
  const grupo = ids.slice(i, i + 300);
  const snaps = await db.getAll(...grupo.map((id) => col.doc(id)));
  for (const s of snaps) atuais.set(s.id, String(s.data()?.explanation || ""));
}
const encolheram = ids.filter((i) => novos[i].length < 0.6 * (atuais.get(i)?.length || 0));
if (encolheram.length) {
  console.error(`Abortado: ${encolheram.length} encolheram mais de 40%.`, encolheram.slice(0, 8));
  process.exit(1);
}
const semMudanca = ids.filter((i) => novos[i] === atuais.get(i));

console.log(`Comentários a gravar: ${ids.length}`);
console.log(`  sem alteração real: ${semMudanca.length}`);
console.log(`  travas: sem letra, sem travessão, sem encolhimento -> ok`);
console.log(`Modo: ${apply ? "GRAVAR" : "DRY-RUN"}`);

if (!apply) {
  console.log("\nDry-run — nada gravado.");
  process.exit(0);
}

let n = 0;
for (let i = 0; i < ids.length; i += 400) {
  const grupo = ids.slice(i, i + 400);
  const batch = db.batch();
  for (const id of grupo) {
    batch.update(col.doc(id), { explanation: novos[id], updatedAt: FieldValue.serverTimestamp() });
  }
  await batch.commit();
  n += grupo.length;
  console.log(`  → ${n}/${ids.length}`);
}
console.log(`\nConcluído: ${n} comentários sem referência por letra.`);
