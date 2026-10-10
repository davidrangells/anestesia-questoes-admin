/** Confere o nivel (R1/R2/R3) de cada questao contra o ano do tema no catalogo (ponto da SBA).
 *  Uso: node scripts/audita-nivel-tema.mjs [--csv=<saida.csv>] */
import { getFirestore, fs } from "./_env.mjs";
const db = getFirestore();
const niveis = {}; (await db.collection("catalog_niveis").get()).forEach(d => niveis[d.id] = d.data().title);
const temas = {};
(await db.collection("catalog_temas").get()).forEach(d => {
  const x = d.data();
  temas[x.title] = { id: d.id, nivel: niveis[x.levelId] || x.levelLabel || null, ponto: x.pontoSBA ?? null };
});
const snap = await db.collection("questionsBank").select("themes", "themeIds", "nivel", "level", "prova_tipo", "prova_ano", "Prova").get();
const linhas = []; let semTema = 0, semNivelTema = 0;
const porFonte = {}, matriz = {};
snap.forEach(d => {
  const x = d.data();
  const tema = (Array.isArray(x.themes) ? x.themes[0] : x.themes) || null;
  const nivelQ = (x.nivel || x.level || "").toUpperCase();
  if (!tema) { semTema++; return; }
  const t = temas[tema]; if (!t || !t.nivel) { semNivelTema++; return; }
  const fonte = x.prova_tipo || "?";
  const bate = nivelQ === t.nivel;
  porFonte[fonte] = porFonte[fonte] || { total: 0, divergentes: 0 };
  porFonte[fonte].total++;
  const k = `${tema} :: ${nivelQ} -> ${t.nivel}`;
  if (!bate) {
    porFonte[fonte].divergentes++;
    matriz[k] = (matriz[k] || 0) + 1;
    linhas.push([d.id, fonte, x.prova_ano ?? "", tema, t.ponto, nivelQ, t.nivel].join(";"));
  }
});
console.log("questoes sem tema:", semTema, "| tema fora do catalogo:", semNivelTema);
console.log("\npor fonte:");
Object.entries(porFonte).sort().forEach(([f, v]) => console.log(`  ${f.padEnd(7)} total ${String(v.total).padStart(5)} | divergentes ${String(v.divergentes).padStart(5)} (${Math.round(100*v.divergentes/v.total)}%)`));
console.log("\nmaiores divergencias (tema :: nivel gravado -> nivel do ponto):");
Object.entries(matriz).sort((a,b)=>b[1]-a[1]).slice(0,25).forEach(([k,v]) => console.log(`  ${String(v).padStart(4)}  ${k}`));
const csv = process.argv.find(a => a.startsWith("--csv="));
if (csv) { fs.writeFileSync(csv.split("=")[1], "docId;fonte;ano;tema;ponto;nivel_gravado;nivel_do_ponto\n" + linhas.join("\n")); console.log("\ncsv:", csv.split("=")[1], linhas.length, "linhas"); }
