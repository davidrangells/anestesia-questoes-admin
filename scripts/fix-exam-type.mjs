#!/usr/bin/env node
/**
 * Normaliza examType / prova_tipo para o codigo canonico (ME | TEA | TSA)
 * nos documentos do questionsBank que receberam o nome longo da prova
 * (ex.: "TEA - Titulo de Especialista em Anestesiologia") na importacao.
 *
 *   node scripts/fix-exam-type.mjs            # simulacao
 *   node scripts/fix-exam-type.mjs --apply    # grava (backup antes)
 *
 * Nao toca em Prova / examSource (rotulos de exibicao) nem em outros campos.
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import fs from "node:fs";
import path from "node:path";
for (const l of fs.readFileSync(".env.local","utf8").split(/\r?\n/)) { const t=l.trim(); if(!t||t.startsWith("#")) continue; const i=t.indexOf("="); if(i<0) continue; const k=t.slice(0,i).trim(); if(!k||process.env[k]) continue; let v=t.slice(i+1).trim(); if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'"))) v=v.slice(1,-1); process.env[k]=v; }
if(!getApps().length) initializeApp({credential:cert({projectId:process.env.FIREBASE_ADMIN_PROJECT_ID,clientEmail:process.env.FIREBASE_ADMIN_CLIENT_EMAIL,privateKey:(process.env.FIREBASE_ADMIN_PRIVATE_KEY||"").replace(/\\n/g,"\n")})});
const db = getFirestore();
const APPLY = process.argv.includes("--apply");
const CANON = ["ME","TEA","TSA"];
// Mapeia o nome longo -> codigo pelo prefixo antes do " - " ou pela sigla contida.
function canonizar(v) {
  const s = String(v ?? "").trim();
  if (CANON.includes(s)) return s;
  const m = s.match(/^(?:Residência\s+)?(ME|TEA|TSA)\b/i);
  return m ? m[1].toUpperCase() : null;
}
const snap = await db.collection("questionsBank").get();
const alvo = [], irreconhecivel = [];
snap.forEach(d => { const x = d.data();
  const okType = CANON.includes(x.examType), okTipo = CANON.includes(x.prova_tipo);
  if (okType && okTipo) return;
  const c = canonizar(x.examType) ?? canonizar(x.prova_tipo);
  if (!c) { irreconhecivel.push({ id: d.id, examType: x.examType, prova_tipo: x.prova_tipo }); return; }
  alvo.push({ id: d.id, ref: d.ref, de: x.examType, para: c, status: x.status, examYear: x.examYear });
});
const porMapa = {}; alvo.forEach(a => { const k = `${a.de}  ->  ${a.para}`; porMapa[k] = (porMapa[k]||0)+1; });
console.log(`[${APPLY?"APPLY":"DRY-RUN"}] docs ${snap.size} | a corrigir ${alvo.length} | irreconheciveis ${irreconhecivel.length}`);
Object.entries(porMapa).forEach(([k,v]) => console.log(`  ${String(v).padStart(3)}  ${k}`));
if (irreconhecivel.length) console.log("irreconheciveis:", irreconhecivel);
if (!APPLY) { console.log("(dry-run — nada gravado)"); process.exit(0); }

const OUT = "exports/migracoes/exam-type"; fs.mkdirSync(OUT, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);
const backup = {}; for (const a of alvo) backup[a.id] = (await a.ref.get()).data();
fs.writeFileSync(path.join(OUT, `backup_${stamp}.json`), JSON.stringify(backup, null, 1));
console.log(`backup de ${alvo.length} docs em ${OUT}/backup_${stamp}.json`);
let n = 0;
for (let i = 0; i < alvo.length; i += 500) {
  const batch = db.batch();
  for (const a of alvo.slice(i, i+500)) { batch.update(a.ref, { examType: a.para, prova_tipo: a.para, updatedAt: FieldValue.serverTimestamp() }); n++; }
  await batch.commit(); console.log(`  lote ${Math.floor(i/500)+1}: ${n} gravados`);
}
// re-medicao
const s2 = await db.collection("questionsBank").get();
const dist = {}; s2.forEach(d => { const x=d.data(); const k=`${x.examType} / ${x.prova_tipo}`; dist[k]=(dist[k]||0)+1; });
console.log("\nre-medicao examType / prova_tipo:", dist);
