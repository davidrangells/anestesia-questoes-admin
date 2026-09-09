#!/usr/bin/env node
/**
 * Migracao: preenche examYear / prova_ano nas questoes antigas do questionsBank
 * a partir do prefixo do enunciado "(ME1-2009) ..." e/ou do internalNote "ME1-2009".
 *
 *   node scripts/fill-exam-year.mjs            # simulacao (nao grava)
 *   node scripts/fill-exam-year.mjs --apply    # grava (faz backup antes)
 *
 * Regras:
 *  - nunca sobrescreve examYear/prova_ano ja preenchidos
 *  - pula IDs com _AUT_ (autorais); se tiverem candidato, lista como anomalia
 *  - se prefixo e nota discordarem, nao grava e lista
 *  - so toca em examYear, prova_ano e updatedAt
 *  - grava em lotes de 500 com writeBatch
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import fs from "node:fs";
import path from "node:path";

for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const t = line.trim(); if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("="); if (i < 0) continue;
  const k = t.slice(0, i).trim(); if (!k || process.env[k]) continue;
  let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[k] = v;
}
if (!getApps().length) initializeApp({ credential: cert({
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n") }) });
const db = getFirestore();

const APPLY = process.argv.includes("--apply");
const OUT = "exports/migracoes/exam-year";
fs.mkdirSync(OUT, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

// ─── extracao (validada na proposta) ───────────────────────────────────────
function anoDoPrefixo(prompt) {
  const s = String(prompt ?? "").replace(/<[^>]*>/g, " ").trim();
  const m = s.slice(0, 60).match(/^[\(\[]\s*([A-Za-z0-9º\s\-]+?)[\-\s](19|20)(\d{2})\s*[\)\]]/);
  return m ? `${m[2]}${m[3]}` : "";
}
function anoDaNota(internalNote) {
  const s = String(internalNote ?? "").trim();
  const m = s.match(/(?:^|[^0-9])((?:19|20)\d{2})(?:[^0-9]|$)/);
  return m ? m[1] : "";
}
const temAno = (v) => v !== undefined && v !== null && v !== "" && Number(v) > 0;

// ─── leitura ────────────────────────────────────────────────────────────────
console.log(`[${APPLY ? "APPLY" : "DRY-RUN"}] projeto ${process.env.FIREBASE_ADMIN_PROJECT_ID} / questionsBank`);
const snap = await db.collection("questionsBank").get();
const all = snap.docs.map((d) => ({ id: d.id, ref: d.ref, ...d.data() }));
const ativas = all.filter((q) => q.status === "ativo");
console.log(`docs: ${all.length} | ativas: ${ativas.length} | inativas: ${all.length - ativas.length}`);

// Como esta representado o "vazio" de examYear nas que nao tem ano?
const vazios = {};
for (const q of all) if (!temAno(q.examYear)) vazios[JSON.stringify(q.examYear)] = (vazios[JSON.stringify(q.examYear)] || 0) + 1;
console.log("representacao do examYear vazio:", vazios);

// ─── validacao do padrao contra as que ja tem ano ───────────────────────────
const comAno = ativas.filter((q) => temAno(q.examYear));
let concorda = 0, diverge = 0, semPrefixo = 0; const divergentes = [];
for (const q of comAno) {
  const p = anoDoPrefixo(q.prompt);
  if (!p) semPrefixo++;
  else if (p === String(q.examYear)) concorda++;
  else { diverge++; divergentes.push({ id: q.id, examYear: q.examYear, prefixo: p }); }
}
console.log(`\nvalidacao (ativas com ano = ${comAno.length}): concorda ${concorda} | diverge ${diverge} | sem prefixo ${semPrefixo}`);
if (divergentes.length) console.log("  divergentes:", divergentes.slice(0, 20));

// ─── classificacao das sem ano ──────────────────────────────────────────────
const semAno = ativas.filter((q) => !temAno(q.examYear) && !temAno(q.prova_ano));
const gravar = [], autorais = [], semSinal = [];
const anomalias = { autoralComCandidato: [], prefixoDiferenteNota: [], anoForaFaixa: [] };

for (const q of semAno) {
  const p = anoDoPrefixo(q.prompt);
  const n = anoDaNota(q.internalNote);
  const isAut = q.id.includes("_AUT_");
  const cand = p || n;
  const fonte = p && n ? "ambos" : p ? "prefixo" : n ? "nota" : "";

  if (isAut) {
    autorais.push(q);
    if (cand) anomalias.autoralComCandidato.push({ id: q.id, prefixo: p, nota: n });
    continue;
  }
  if (!cand) { semSinal.push(q); continue; }
  if (p && n && p !== n) { anomalias.prefixoDiferenteNota.push({ id: q.id, prefixo: p, nota: n }); continue; }
  const ano = Number(cand);
  if (ano < 2000 || ano > 2026) { anomalias.anoForaFaixa.push({ id: q.id, ano, fonte }); continue; }
  gravar.push({ id: q.id, ref: q.ref, examType: q.examType, level: q.level, ano, fonte });
}

console.log(`\nsem ano (ativas): ${semAno.length}`);
console.log(`  gravar (recuperavel): ${gravar.length}`);
console.log(`  autorais _AUT_ (nao grava): ${autorais.length}`);
console.log(`  sem sinal (nao grava): ${semSinal.length}`);
console.log(`  anomalias: autoral c/ candidato ${anomalias.autoralComCandidato.length} | prefixo≠nota ${anomalias.prefixoDiferenteNota.length} | ano fora 2000-2026 ${anomalias.anoForaFaixa.length}`);
const soma = gravar.length + autorais.length + semSinal.length + anomalias.autoralComCandidato.length * 0 + anomalias.prefixoDiferenteNota.length + anomalias.anoForaFaixa.length;
console.log(`  (soma dos grupos: ${soma} — deve ser ${semAno.length})`);

const porFonte = {}, porAno = {}, porNivelPrefixo = {};
for (const g of gravar) {
  porFonte[g.fonte] = (porFonte[g.fonte] || 0) + 1;
  porAno[g.ano] = (porAno[g.ano] || 0) + 1;
}
console.log("\npor fonte:", porFonte);
console.log("por ano:", Object.entries(porAno).sort((a, b) => b[0] - a[0]).map(([a, n]) => `${a}:${n}`).join("  "));

// prefixos das "sem sinal" (o que sobrou)
const prefixosSemSinal = {};
for (const q of semSinal) {
  const s = String(q.prompt ?? "").replace(/<[^>]*>/g, " ").trim().slice(0, 12);
  const m = s.match(/^[\(\[]([^\)\]]{1,10})[\)\]]/);
  const k = m ? m[1] : "(sem prefixo)";
  prefixosSemSinal[k] = (prefixosSemSinal[k] || 0) + 1;
}
console.log("prefixos das sem sinal:", prefixosSemSinal);

// ─── arquivos da simulacao ──────────────────────────────────────────────────
const lista = ["id | examType | level | ano | fonte", ...gravar.map((g) => `${g.id} | ${g.examType} | ${g.level} | ${g.ano} | ${g.fonte}`)].join("\n");
fs.writeFileSync(path.join(OUT, `simulacao_${stamp}.txt`), lista);
fs.writeFileSync(path.join(OUT, `simulacao_${stamp}.json`), JSON.stringify({
  resumo: { semAno: semAno.length, gravar: gravar.length, autorais: autorais.length, semSinal: semSinal.length, porFonte, porAno },
  anomalias,
  semSinal: semSinal.map((q) => ({ id: q.id, examType: q.examType, level: q.level, prompt: String(q.prompt ?? "").slice(0, 80) })),
  gravar: gravar.map(({ ref, ...g }) => g),
}, null, 2));
console.log(`\nsimulacao salva em ${OUT}/simulacao_${stamp}.{txt,json}`);

if (!APPLY) { console.log("\n(dry-run — nada gravado. Rode com --apply para gravar.)"); process.exit(0); }

// ─── APPLY: backup + gravacao ───────────────────────────────────────────────
const backup = {};
for (const g of gravar) { const d = await g.ref.get(); backup[g.id] = d.data(); }
const bkPath = path.join(OUT, `backup_${stamp}.json`);
fs.writeFileSync(bkPath, JSON.stringify(backup, null, 1));
console.log(`\nbackup de ${Object.keys(backup).length} documentos em ${bkPath}`);

let escritos = 0, lote = 0;
for (let i = 0; i < gravar.length; i += 500) {
  const chunk = gravar.slice(i, i + 500);
  const batch = db.batch();
  for (const g of chunk) {
    // re-checa no backup recem-lido: nunca sobrescreve
    const cur = backup[g.id];
    if (temAno(cur?.examYear) || temAno(cur?.prova_ano)) { console.log(`  pulando ${g.id}: ja tem ano`); continue; }
    if (g.id.includes("_AUT_")) { console.log(`  pulando ${g.id}: autoral`); continue; }
    batch.update(g.ref, { examYear: g.ano, prova_ano: g.ano, updatedAt: FieldValue.serverTimestamp() });
    escritos++;
  }
  await batch.commit();
  lote++;
  console.log(`  lote ${lote}: ${chunk.length} docs no lote, ${escritos} escritos ate agora`);
}
console.log(`\ngravados: ${escritos}`);

// ─── re-medicao ─────────────────────────────────────────────────────────────
const snap2 = await db.collection("questionsBank").where("status", "==", "ativo").get();
let aindaSem = 0, aindaAut = 0; const anos = new Set();
snap2.forEach((d) => { const x = d.data();
  if (!temAno(x.examYear)) { aindaSem++; if (d.id.includes("_AUT_")) aindaAut++; } else anos.add(Number(x.examYear)); });
console.log(`\nre-medicao: ativas ${snap2.size} | ainda sem ano ${aindaSem} (autorais ${aindaAut}, outras ${aindaSem - aindaAut}) | anos distintos ${anos.size}: ${[...anos].sort().join(", ")}`);
console.log(`esperado sem ano: ${autorais.length + semSinal.length + anomalias.prefixoDiferenteNota.length + anomalias.anoForaFaixa.length}`);
