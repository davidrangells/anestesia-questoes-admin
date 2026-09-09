#!/usr/bin/env node
/**
 * Corrige o espelho level/nivel nos documentos do questionsBank em que o
 * importador gravou levelId certo mas level/nivel errado (lote ME 2018).
 * Criterio: level != titulo(levelId) E titulo(levelId) == nivel do prefixo
 * do enunciado "(ME3-2018)". Assim so entram casos com duas fontes concordando.
 *   node scripts/fix-level-mirror.mjs [--apply]
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import fs from "node:fs"; import path from "node:path";
for (const l of fs.readFileSync(".env.local","utf8").split(/\r?\n/)) { const t=l.trim(); if(!t||t.startsWith("#")) continue; const i=t.indexOf("="); if(i<0) continue; const k=t.slice(0,i).trim(); if(!k||process.env[k]) continue; let v=t.slice(i+1).trim(); if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'"))) v=v.slice(1,-1); process.env[k]=v; }
if(!getApps().length) initializeApp({credential:cert({projectId:process.env.FIREBASE_ADMIN_PROJECT_ID,clientEmail:process.env.FIREBASE_ADMIN_CLIENT_EMAIL,privateKey:(process.env.FIREBASE_ADMIN_PRIVATE_KEY||"").replace(/\\n/g,"\n")})});
const db = getFirestore(); const APPLY = process.argv.includes("--apply");
const nivelDoPrefixo = (p) => { const m = String(p??"").replace(/<[^>]*>/g," ").trim().slice(0,60).match(/^[\(\[]\s*ME\s*([123])\b/i); return m ? `R${m[1]}` : ""; };
const idToTitle = {}; (await db.collection("catalog_niveis").get()).forEach(d => idToTitle[d.id] = d.data().title);
const snap = await db.collection("questionsBank").get();
const alvo = [], excluidos = [];
snap.forEach(d => { const x = d.data(); const lid = idToTitle[x.levelId]; if (!lid || lid === x.level) return;
  const pref = nivelDoPrefixo(x.prompt);
  if (pref && pref === lid) alvo.push({ id: d.id, ref: d.ref, de: x.level, para: lid, prefixo: pref, status: x.status });
  else excluidos.push({ id: d.id, level: x.level, levelId: lid, prefixo: pref || "-" });
});
console.log(`[${APPLY?"APPLY":"DRY-RUN"}] level != levelId: ${alvo.length + excluidos.length} | corrigir ${alvo.length} | excluidos (sem 2 fontes concordando) ${excluidos.length}`);
alvo.forEach(a => console.log(`  ${a.id}  level ${a.de} -> ${a.para}  (levelId ${a.para}, prefixo ${a.prefixo}) [${a.status}]`));
if (excluidos.length) console.log("excluidos:", excluidos);
if (!APPLY) { console.log("(dry-run — nada gravado)"); process.exit(0); }
const OUT="exports/migracoes/level"; fs.mkdirSync(OUT,{recursive:true});
const stamp=new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);
const backup={}; for (const a of alvo) backup[a.id]=(await a.ref.get()).data();
fs.writeFileSync(path.join(OUT,`backup_${stamp}.json`), JSON.stringify(backup,null,1));
const batch=db.batch(); for (const a of alvo) batch.update(a.ref,{ level:a.para, nivel:a.para, updatedAt:FieldValue.serverTimestamp() });
await batch.commit();
console.log(`\ngravados: ${alvo.length} | backup em ${OUT}/backup_${stamp}.json`);
// re-medicao
const s2 = await db.collection("questionsBank").get(); let esp=0, disc=0, ln=0;
s2.forEach(d=>{const x=d.data(); const lid=idToTitle[x.levelId]; if(lid&&lid!==x.level) esp++; if(x.level!==x.nivel) ln++; const p=nivelDoPrefixo(x.prompt); if(p&&x.level&&p!==x.level) disc++;});
console.log(`re-medicao: level != levelId ${esp} | level != nivel ${ln} | prefixo != level ${disc}`);
