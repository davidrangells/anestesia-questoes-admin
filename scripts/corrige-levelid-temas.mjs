/** Conserta catalog_temas.levelId: 52 dos 54 temas apontam para "nivel_r1..r3", que nao
 *  existe em catalog_niveis (os docs de nivel tem ids gerados). Com a referencia quebrada,
 *  o editor do admin nao consegue agrupar os temas pelo ano selecionado.
 *  O rotulo (levelLabel) e a informacao confiavel e nao e alterado.
 *
 *  Uso: node scripts/corrige-levelid-temas.mjs [--apply]
 */
import { getFirestore } from "./_env.mjs";

const db = getFirestore();
const apply = process.argv.includes("--apply");

const idPorRotulo = {};
(await db.collection("catalog_niveis").get()).forEach((d) => {
  idPorRotulo[d.data().title] = d.id;
});

const snap = await db.collection("catalog_temas").get();
const mudar = [];
const semRotulo = [];

snap.forEach((d) => {
  const x = d.data();
  const rotulo = x.levelLabel || null;
  const alvo = rotulo ? idPorRotulo[rotulo] : null;
  if (!alvo) {
    semRotulo.push(`${d.id} (${x.title}) rotulo=${rotulo}`);
    return;
  }
  if (x.levelId !== alvo) mudar.push({ id: d.id, title: x.title, de: x.levelId || "(vazio)", para: alvo, rotulo });
});

console.log(`temas: ${snap.size} | a corrigir: ${mudar.length} | sem rotulo utilizavel: ${semRotulo.length}`);
for (const s of semRotulo) console.log("   sem rotulo:", s);
for (const m of mudar.slice(0, 6)) console.log(`   ${m.id} ${m.title} :: ${m.de} -> ${m.para} (${m.rotulo})`);
if (mudar.length > 6) console.log(`   ... e outros ${mudar.length - 6}`);

if (!apply) {
  console.log("\nnada gravado. rode de novo com --apply para aplicar.");
  process.exit(0);
}

const lote = db.batch();
for (const m of mudar) lote.update(db.collection("catalog_temas").doc(m.id), { levelId: m.para });
await lote.commit();
console.log(`pronto: ${mudar.length} temas atualizados.`);
