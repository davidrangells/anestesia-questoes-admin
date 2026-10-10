/** Confere no Firestore um lote do Quest recem-importado.
 *  Uso: node scripts/verifica-quest.mjs exports/quest_lotes/<lote>.json */
import { getFirestore, fs } from "./_env.mjs";
const db = getFirestore();
const qs = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
let ok = 0; const ruins = [];
for (const q of qs) {
  const d = (await db.collection("questionsBank").doc(q.id).get()).data();
  if (!d) { ruins.push(`${q.id}: nao existe`); continue; }
  const p = [];
  if (d.correctOptionId !== q.gab) p.push("gabarito");
  if (!(d.themeIds || []).length) p.push("sem themeIds");
  if ((d.themes || []).join(" | ") !== q.tema) p.push(`tema ${JSON.stringify(d.themes)}`);
  if (d.explanationSource !== "ia" || !d.reference) p.push("selo/referencia");
  if (d.isActive === false) p.push("inativa");
  if (d.prova_tipo !== "QUEST" || d.Prova !== "Quest" || !d.examId) p.push("prova");
  if (p.length) ruins.push(`${q.id}: ${p.join(", ")}`); else ok++;
}
console.log(`verificadas: ${qs.length} | ok: ${ok} | problemas: ${ruins.length}`);
if (ruins.length) console.log(ruins.slice(0, 8).join("\n"));
const snap = await db.collection("questionsBank").select("prova_tipo").get();
const t = {}; snap.forEach(d => t[d.data().prova_tipo] = (t[d.data().prova_tipo] || 0) + 1);
console.log("banco:", snap.size, JSON.stringify(t));
