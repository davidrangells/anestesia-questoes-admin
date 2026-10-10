/** Alinha o nivel (R1/R2/R3) de cada questao ao ano do tema no catalogo (ponto da SBA).
 *  O nivel do produto e o ano do programa a que o tema pertence, nao a dificuldade
 *  da questao nem o ano da prova de origem (esse fica em prova_tipo/prova_ano).
 *
 *  Uso: node scripts/corrige-nivel-tema.mjs [--fonte=QUEST] [--apply]
 *  Sem --apply so mostra o que mudaria. Sempre grava o backup em exports/backup_nivel_<fonte>.csv.
 */
import { getFirestore } from "./_env.mjs";
import fs from "node:fs";

const db = getFirestore();
const apply = process.argv.includes("--apply");
const fonteArg = (process.argv.find((a) => a.startsWith("--fonte=")) || "").split("=")[1] || null;

const niveis = {};
(await db.collection("catalog_niveis").get()).forEach((d) => {
  niveis[d.id] = d.data().title;
});

// catalog_temas guarda levelId como "nivel_r1..r3" na maioria dos temas, que nao existe
// em catalog_niveis; o rotulo (levelLabel) e a informacao confiavel. As questoes usam o
// doc id de verdade, entao traduzimos rotulo -> doc id.
const idPorRotulo = Object.fromEntries(Object.entries(niveis).map(([id, t]) => [t, id]));

const temas = {};
(await db.collection("catalog_temas").get()).forEach((d) => {
  const x = d.data();
  const rotulo = niveis[x.levelId] || x.levelLabel || null;
  temas[x.title] = { id: d.id, nivel: rotulo, levelId: idPorRotulo[rotulo] || null };
});

const snap = await db
  .collection("questionsBank")
  .select("themes", "nivel", "level", "levelId", "prova_tipo", "prova_ano")
  .get();

const mudar = [];
const ambiguas = [];
let semTema = 0;

snap.forEach((docSnap) => {
  const q = docSnap.data();
  const fonte = q.prova_tipo || "(sem prova)";
  if (fonteArg && fonte !== fonteArg) return;

  const lista = Array.isArray(q.themes) ? q.themes.filter(Boolean) : [];
  const achados = lista.map((t) => temas[t]).filter((t) => t && t.nivel);
  if (!achados.length) {
    semTema += 1;
    return;
  }

  const distintos = new Set(achados.map((t) => t.nivel));
  const alvo = achados[0];
  const atual = q.nivel || q.level || null;
  if (distintos.size > 1) ambiguas.push([docSnap.id, fonte, lista.join(" + "), atual, alvo.nivel]);
  if (atual === alvo.nivel && q.levelId === alvo.levelId) return;

  mudar.push({ id: docSnap.id, fonte, ano: q.prova_ano ?? "", tema: lista[0], de: atual, para: alvo.nivel, levelId: alvo.levelId });
});

const rotulo = fonteArg ? fonteArg.toLowerCase() : "todas";
const backup = `exports/backup_nivel_${rotulo}.csv`;
// Nao apaga backup existente: rodar de novo depois da correcao acha 0 divergencias e
// sobrescreveria com um arquivo vazio, justamente o registro necessario para desfazer.
if (!mudar.length) {
  console.log("nada a corrigir; backup existente preservado.");
} else {
  if (fs.existsSync(backup)) {
    const selo = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "");
    fs.renameSync(backup, backup.replace(/\.csv$/, `_${selo}.csv`));
  }
  fs.writeFileSync(
    backup,
    ["docId;fonte;ano;tema;nivel_antes;nivel_depois", ...mudar.map((m) => [m.id, m.fonte, m.ano, m.tema, m.de ?? "", m.para].join(";"))].join("\n") + "\n",
    "utf8"
  );
}

const porFonte = {};
for (const m of mudar) porFonte[m.fonte] = (porFonte[m.fonte] || 0) + 1;
console.log(`questoes analisadas: ${snap.size}${fonteArg ? ` (filtro ${fonteArg})` : ""}`);
console.log(`sem tema no catalogo: ${semTema}`);
console.log(`a corrigir: ${mudar.length}`, porFonte);
console.log(`temas de niveis diferentes na mesma questao (usei o primeiro tema): ${ambiguas.length}`);
for (const a of ambiguas.slice(0, 25)) console.log("   ", a.join(" | "));
if (mudar.length) console.log(`backup do estado anterior: ${backup}`);

if (!apply) {
  console.log("\nnada gravado. rode de novo com --apply para aplicar.");
  process.exit(0);
}

let feitas = 0;
for (let i = 0; i < mudar.length; i += 400) {
  const lote = db.batch();
  for (const m of mudar.slice(i, i + 400)) {
    lote.update(db.collection("questionsBank").doc(m.id), { nivel: m.para, level: m.para, levelId: m.levelId });
    feitas += 1;
  }
  await lote.commit();
  console.log(`  gravadas ${feitas}/${mudar.length}`);
}
console.log("pronto.");
