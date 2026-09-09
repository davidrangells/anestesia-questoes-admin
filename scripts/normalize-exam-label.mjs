#!/usr/bin/env node
/**
 * Uniformiza o rotulo de exibicao da prova (Prova / examSource) no questionsBank
 * para o formato que o editor do admin gera: "(TIPO-ANO)" ou "(TIPO)" sem ano.
 * Rotulo e so exibicao no admin; o portal do aluno nao le esses campos.
 *
 *   node scripts/normalize-exam-label.mjs            # simulacao
 *   node scripts/normalize-exam-label.mjs --apply    # backup + gravacao
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import fs from "node:fs"; import path from "node:path";
for (const l of fs.readFileSync(".env.local","utf8").split(/\r?\n/)) { const t=l.trim(); if(!t||t.startsWith("#")) continue; const i=t.indexOf("="); if(i<0) continue; const k=t.slice(0,i).trim(); if(!k||process.env[k]) continue; let v=t.slice(i+1).trim(); if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'"))) v=v.slice(1,-1); process.env[k]=v; }
if(!getApps().length) initializeApp({credential:cert({projectId:process.env.FIREBASE_ADMIN_PROJECT_ID,clientEmail:process.env.FIREBASE_ADMIN_CLIENT_EMAIL,privateKey:(process.env.FIREBASE_ADMIN_PRIVATE_KEY||"").replace(/\\n/g,"\n")})});
const db = getFirestore(); const APPLY = process.argv.includes("--apply");
const CANON = ["ME","TEA","TSA"];
const temAno = (v) => v !== undefined && v !== null && v !== "" && Number(v) > 0;
// Mesma regra de buildProofLabel (editor/importador) sem o fallback de planilha.
const rotulo = (tipo, ano) => temAno(ano) ? `(${tipo}-${Number(ano)})` : `(${tipo})`;

const snap = await db.collection("questionsBank").get();
const alvo = [], pulados = [], jaOk = [];
const porTransf = {};
snap.forEach(d => { const x = d.data();
  if (!CANON.includes(x.examType)) { pulados.push({ id: d.id, motivo: `examType fora do padrao: ${x.examType}` }); return; }
  const novo = rotulo(x.examType, x.examYear);
  if (x.Prova === novo && x.examSource === novo) { jaOk.push(d.id); return; }
  alvo.push({ id: d.id, ref: d.ref, de: x.Prova, deSrc: x.examSource, para: novo });
  const k = `${String(x.Prova).replace(/\d{4}/, "AAAA").replace(/^\((ME|TEA|TSA)\)$/, "($1)")}  ->  ${novo.replace(/\d{4}/, "AAAA")}`;
  porTransf[k] = (porTransf[k] || 0) + 1;
});
console.log(`[${APPLY?"APPLY":"DRY-RUN"}] docs ${snap.size} | alterar ${alvo.length} | ja no padrao ${jaOk.length} | pulados ${pulados.length}`);
console.log("\ntransformacoes (ano generalizado como AAAA):");
Object.entries(porTransf).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log(`  ${String(v).padStart(5)}  ${k}`));
if (pulados.length) console.log("pulados:", pulados);
const divergeSrc = alvo.filter(a => a.de !== a.deSrc).length;
console.log(`\nProva != examSource antes da mudanca: ${divergeSrc} (esperado 0; ambos serao igualados)`);
if (!APPLY) { console.log("\n(dry-run — nada gravado)"); process.exit(0); }

const OUT="exports/migracoes/exam-label"; fs.mkdirSync(OUT,{recursive:true});
const stamp=new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);
const backup={}; for (const a of alvo) backup[a.id] = { Prova: a.de, examSource: a.deSrc };
fs.writeFileSync(path.join(OUT,`backup_${stamp}.json`), JSON.stringify(backup,null,1));
console.log(`\nbackup (Prova/examSource de ${alvo.length} docs) em ${OUT}/backup_${stamp}.json`);
let n=0, lote=0;
for (let i=0;i<alvo.length;i+=500) { const batch=db.batch();
  for (const a of alvo.slice(i,i+500)) { batch.update(a.ref,{ Prova:a.para, examSource:a.para, updatedAt:FieldValue.serverTimestamp() }); n++; }
  await batch.commit(); lote++; console.log(`  lote ${lote}: ${n} gravados`); }
// re-medicao
const s2 = await db.collection("questionsBank").get(); const fmt={}; let fora=0, dif=0;
s2.forEach(d=>{const x=d.data(); const esperado=rotulo(x.examType,x.examYear); if(x.Prova!==esperado) fora++; if(x.Prova!==x.examSource) dif++;
  fmt[String(x.Prova).replace(/\d{4}/,"AAAA")]=(fmt[String(x.Prova).replace(/\d{4}/,"AAAA")]||0)+1;});
console.log(`\nre-medicao: fora do padrao ${fora} | Prova != examSource ${dif}`);
console.log("formatos presentes:", fmt);
