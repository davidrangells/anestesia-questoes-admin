#!/usr/bin/env node
/**
 * Corrige os 3 documentos do questionsBank em que o rotulo (Prova/examSource)
 * contradizia o codigo (examType). Decisao por evidencia documentada abaixo.
 *   node scripts/fix-exam-label-contradictions.mjs [--apply]
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import fs from "node:fs"; import path from "node:path";
for (const l of fs.readFileSync(".env.local","utf8").split(/\r?\n/)) { const t=l.trim(); if(!t||t.startsWith("#")) continue; const i=t.indexOf("="); if(i<0) continue; const k=t.slice(0,i).trim(); if(!k||process.env[k]) continue; let v=t.slice(i+1).trim(); if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'"))) v=v.slice(1,-1); process.env[k]=v; }
if(!getApps().length) initializeApp({credential:cert({projectId:process.env.FIREBASE_ADMIN_PROJECT_ID,clientEmail:process.env.FIREBASE_ADMIN_CLIENT_EMAIL,privateKey:(process.env.FIREBASE_ADMIN_PRIVATE_KEY||"").replace(/\\n/g,"\n")})});
const db = getFirestore(); const APPLY = process.argv.includes("--apply");

// Catalogo (catalog_provas): { code, title } -> sigla pelo titulo
const cat = {};
(await db.collection("catalog_provas").get()).forEach(d => {
  const t = String(d.data().title ?? "");
  const m = t.match(/\b(ME|TEA|TSA)\b/);
  if (m) cat[m[1]] = { id: d.id, nome: t };
});
console.log("catalogo:", cat);
for (const s of ["ME","TEA","TSA"]) if (!cat[s]) { console.error(`sigla ${s} nao encontrada no catalogo`); process.exit(1); }

const fixes = [
  // 63 e 745: codigo, examId e prefixo (TSA-2014) concordam; so o rotulo estava errado.
  { id: "63",   set: { Prova: cat.TSA.nome, examSource: cat.TSA.nome }, motivo: "rotulo -> TSA (prefixo (TSA-2014), examId TSA)" },
  { id: "745",  set: { Prova: cat.TSA.nome, examSource: cat.TSA.nome }, motivo: "rotulo -> TSA (prefixo (TSA-2014), examId TSA)" },
  // 1154: prefixo (ME2-2006), internalNote ME2-2006, level R2 e rotulo dizem ME; codigo/examId estavam em TEA.
  { id: "1154", set: { examType: "ME", prova_tipo: "ME", examId: cat.ME.id, Prova: cat.ME.nome, examSource: cat.ME.nome }, motivo: "codigo+examId -> ME (prefixo (ME2-2006), nota ME2-2006, level R2)" },
];
const backup = {};
for (const f of fixes) {
  const d = await db.collection("questionsBank").doc(f.id).get(); backup[f.id] = d.data();
  const x = d.data(); const pre = String(x.prompt??"").replace(/<[^>]*>/g," ").trim().slice(0,32);
  console.log(`\n${f.id}: ${f.motivo}\n  antes: examType=${x.examType} examId=${x.examId} Prova="${x.Prova}"\n  prefixo: ${pre}\n  depois:`, f.set);
}
if (!APPLY) { console.log("\n(dry-run — nada gravado)"); process.exit(0); }
const OUT="exports/migracoes/exam-type"; fs.mkdirSync(OUT,{recursive:true});
const stamp=new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);
fs.writeFileSync(path.join(OUT,`backup_contradicoes_${stamp}.json`), JSON.stringify(backup,null,1));
const batch = db.batch();
for (const f of fixes) batch.update(db.collection("questionsBank").doc(f.id), { ...f.set, updatedAt: FieldValue.serverTimestamp() });
await batch.commit();
console.log(`\ngravados: ${fixes.length} | backup em ${OUT}/backup_contradicoes_${stamp}.json`);
// re-medicao: rotulo vs codigo em toda a colecao
const sigla=(s)=>{const m=String(s??"").match(/\b(ME|TEA|TSA)\b/i);return m?m[1].toUpperCase():null;};
let contrad=0; (await db.collection("questionsBank").get()).forEach(d=>{const x=d.data();const lab=sigla(x.Prova)??sigla(x.examSource);if(lab&&lab!==x.examType)contrad++;});
console.log(`re-medicao: rotulo contradizendo codigo = ${contrad}`);
