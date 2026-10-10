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
// Cria a prova "Questões Autorais" nos catálogos e vincula as questões AUTORAL a ela.
// Uso: node scripts/vincula-autorais.mjs [--apply]
const db = getFirestore();
const aplicar = process.argv.includes("--apply");
const TITULO = "Questões Autorais", SIGLA = "AUTORAL";
const now = new Date();

const cat = await db.collection("catalog_provas").where("title", "==", TITULO).get();
let catId = cat.docs[0]?.id;
const leg = await db.collection("provas").where("sigla", "==", SIGLA).get();
let legId = leg.docs[0]?.id;

if (aplicar) {
  if (!catId) {
    const ref = await db.collection("catalog_provas").add({ code: "4", title: TITULO, status: "ativo", levelId: null, levelLabel: null, createdAt: now, updatedAt: now });
    catId = ref.id; console.log("catalog_provas criado:", catId);
  } else console.log("catalog_provas ja existia:", catId);
  if (!legId) {
    const ref = await db.collection("provas").add({ nome: TITULO, sigla: SIGLA, ordem: 2, ativo: true, createdAt: now, updatedAt: now });
    legId = ref.id; console.log("provas criado:", legId);
  } else console.log("provas ja existia:", legId);
}

const snap = await db.collection("questionsBank").where("prova_tipo", "==", "AUTORAL").get();
console.log(`questoes AUTORAL: ${snap.size} | sem examId: ${snap.docs.filter(d => !d.data().examId).length}`);
if (!aplicar) { console.log("dry-run: nada gravado. Rode com --apply"); process.exit(0); }

let n = 0;
for (let i = 0; i < snap.docs.length; i += 400) {
  const lote = db.batch();
  for (const d of snap.docs.slice(i, i + 400)) {
    lote.update(d.ref, { examId: catId, examType: "AUTORAL", examSource: d.data().Prova || "Autoral SBA 2026", updatedAt: now });
    n++;
  }
  await lote.commit();
}
console.log(`vinculadas: ${n} questoes ao examId ${catId}`);
