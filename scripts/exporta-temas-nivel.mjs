/** Grava scripts/_temas_nivel.json com o mapa tema -> { ponto, nivel } do catalogo,
 *  para os validadores conferirem o nivel sem precisar de acesso ao Firestore.
 *  Uso: node scripts/exporta-temas-nivel.mjs */
import { getFirestore } from "./_env.mjs";
import fs from "node:fs";

const db = getFirestore();
const niveis = {};
(await db.collection("catalog_niveis").get()).forEach((d) => {
  niveis[d.id] = d.data().title;
});

const mapa = {};
(await db.collection("catalog_temas").get()).forEach((d) => {
  const x = d.data();
  mapa[x.title] = { ponto: x.pontoSBA ?? null, nivel: niveis[x.levelId] || x.levelLabel || null };
});

const ordenado = Object.fromEntries(Object.entries(mapa).sort((a, b) => (a[1].ponto ?? 99) - (b[1].ponto ?? 99)));
fs.writeFileSync("scripts/_temas_nivel.json", JSON.stringify(ordenado, null, 1), "utf8");
console.log(`temas gravados: ${Object.keys(ordenado).length}`);
