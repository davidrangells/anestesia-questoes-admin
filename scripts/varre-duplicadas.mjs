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
// Varre o questionsBank em busca de enunciados duplicados e grava um JSON com os grupos,
// incluindo uso pelos alunos (respostas e acerto nos simulados) e erros reportados.
// Uso: node scripts/varre-duplicadas.mjs <saida.json>
const db = getFirestore();
const norm = s => String(s || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ")
  .normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/^\s*[\(\[][^\)\]]{2,30}[\)\]]\s*/, "").replace(/[^a-z0-9]+/g, " ").trim();
const qs = (await db.collection("questionsBank").get()).docs.map(d => ({ id: d.id, ...d.data() }));
const uso = {};
for (const s of (await db.collectionGroup("sessions").get()).docs) {
  for (const [qid, a] of Object.entries(s.data().answersMap || {})) {
    const u = (uso[qid] ||= { n: 0, ok: 0 }); u.n++; if (a && a.isCorrect) u.ok++;
  }
}
const erros = {};
for (const e of (await db.collection("erros_reportados").get()).docs) { const q = e.data().questionId; if (q) erros[q] = (erros[q] || 0) + 1; }
const grupos = new Map();
for (const q of qs) {
  const k = norm(q.prompt_text || q.prompt);
  if (k.length < 40) continue;
  if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(q);
}
const out = [];
for (const [k, g] of grupos) {
  if (g.length < 2) continue;
  out.push(g.map(q => {
    const L = ["A", "B", "C", "D", "E"].filter(l => q[`option${l}_text`] || q[`option${l}_imageUrl`]);
    return {
      id: q.id, ativo: q.isActive !== false && q.isActive !== 0, prompt: q.prompt_text || q.prompt || "",
      opcoes: L.map(l => [l, q[`option${l}_text`] || "(imagem)"]), correta: q.correctOptionId,
      corretaTexto: q[`option${q.correctOptionId}_text`] || "", tipo: q.prova_tipo || q.examType || "", ano: q.prova_ano || q.examYear || "",
      nivel: q.nivel || q.level || "", prova: q.Prova || q.examSource || "", temas: Array.isArray(q.themes) ? q.themes.join("; ") : (q.themes || ""),
      temExplicacao: String(q.explanation || "").replace(/<[^>]*>/g, "").trim().length, fonteExplicacao: q.explanationSource || "",
      temReferencia: !!q.reference, imagem: !!q.imageUrl, nota: q.internalNote || "",
      criado: q.createdAt?.toDate ? q.createdAt.toDate().toISOString().slice(0, 10) : "",
      respostas: uso[q.id]?.n || 0, acertos: uso[q.id]?.ok || 0, erros: erros[q.id] || 0,
    };
  }));
}
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log(`questoes: ${qs.length} | grupos: ${out.length} | questoes em grupos: ${out.reduce((a, g) => a + g.length, 0)} | sessoes com respostas contadas: ${Object.keys(uso).length} questoes`);
