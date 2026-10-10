/**
 * Renomeia a prova das questões autorais para "Quest" (a IA do serviço):
 * catálogos (catalog_provas e provas) e os campos de prova das questões.
 *
 * Uso: node scripts/renomeia-quest.mjs [--apply]
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "node:fs"; import path from "node:path";
for (const f of [".env.local", ".env"]) {
  const p = path.resolve(process.cwd(), f); if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const t = line.trim(); if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("="); if (i < 0) continue;
    const k = t.slice(0, i).trim(); if (!k || process.env[k]) continue;
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[k] = v;
  }
}
if (!getApps().length) initializeApp({ credential: cert({ projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n") }) });
const db = getFirestore();
const aplicar = process.argv.includes("--apply");
const NOME = "Quest", SIGLA = "QUEST", ANTIGOS = ["AUTORAL"];
const now = new Date();

const cat = (await db.collection("catalog_provas").get()).docs.find((d) => ["Questões Autorais", NOME].includes(d.data().title));
const leg = (await db.collection("provas").get()).docs.find((d) => ["Questões Autorais", NOME].includes(d.data().nome));
console.log("catalog_provas:", cat?.id, JSON.stringify(cat?.data().title), "| provas:", leg?.id, JSON.stringify(leg?.data().nome));

const snap = await db.collection("questionsBank").where("prova_tipo", "in", [...ANTIGOS, SIGLA]).get();
console.log("questoes a renomear:", snap.size);
if (!aplicar) { console.log("dry-run: nada gravado. Rode com --apply"); process.exit(0); }

if (cat) await cat.ref.update({ title: NOME, code: SIGLA, updatedAt: now });
if (leg) await leg.ref.update({ nome: NOME, sigla: SIGLA, updatedAt: now });

let n = 0;
for (let i = 0; i < snap.docs.length; i += 400) {
  const lote = db.batch();
  for (const d of snap.docs.slice(i, i + 400)) {
    lote.update(d.ref, { prova_tipo: SIGLA, examType: SIGLA, Prova: NOME, examSource: NOME, examId: cat?.id ?? d.data().examId, updatedAt: now });
    n++;
  }
  await lote.commit();
}
console.log(`renomeadas: ${n} questoes para ${SIGLA} / "${NOME}"`);
