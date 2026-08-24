/**
 * Etapa 1 do alinhamento do catálogo ao Programa Teórico oficial da SBA (54 pontos).
 *
 * - Renomeia temas cuja grafia diverge do programa oficial (o docId NÃO muda,
 *   então os themeIds já vinculados continuam válidos).
 * - Propaga o novo título para o texto exibido: questionsBank.themes,
 *   flashcards.themeName e flashcardDecks.title.
 * - Cria os 4 pontos oficiais que faltavam no catálogo.
 *
 * A reclassificação do conteúdo entre os temas desdobrados é feita depois,
 * por scripts/apply-theme-reclassification.mjs.
 *
 * Uso:
 *   node scripts/align-catalog-sba.mjs           # dry-run
 *   node scripts/align-catalog-sba.mjs --apply
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import fs from "node:fs";
import path from "node:path";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!key || process.env[key]) continue;
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}
loadEnvFile(path.resolve(process.cwd(), ".env.local"));
loadEnvFile(path.resolve(process.cwd(), ".env"));

const apply = process.argv.includes("--apply");

// título atual -> título oficial (ponto do programa)
const RENOMEAR = {
  "Anestesicos Venosos": { novo: "Farmacologia dos Anestésicos Venoso", ponto: 12 },
  "Suporte Ventilatorio": { novo: "Suporte Ventilatório", ponto: 52 },
  "Anestesia para Urologia": { novo: "Anestesia em Urologia", ponto: 30 },
  "Anestesia para geriatria": { novo: "Anestesia em Geriatria", ponto: 46 },
  "Anestesia para Transplante": { novo: "Anestesia para Transplantes", ponto: 48 },
  "Ética Médica e Bioética. Responsabilidade e risco Profissional do Anestesiologista": {
    novo: "Ética Médica e Bioética. Responsabilidade Profissional do Anestesiologista", ponto: 1,
  },
  "Dor": { novo: "Dor Aguda e Inflamação", ponto: 50 },
};

// pontos oficiais ausentes do catálogo
const CRIAR = [
  { id: "ponto-03-risco-profissional", title: "Risco Profissional do Anestesiologista", nivel: "R1", ponto: 3 },
  { id: "ponto-23-anestesia-inalatoria", title: "Anestesia Inalatória", nivel: "R2", ponto: 23 },
  { id: "ponto-24-anestesia-venosa", title: "Anestesia Venosa", nivel: "R2", ponto: 24 },
  { id: "ponto-51-dor-cronica", title: "Dor Crônica", nivel: "R3", ponto: 51 },
];
const NIVEL_ID = { R1: "nivel_r1", R2: "nivel_r2", R3: "nivel_r3" };

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    }),
  });
}
const db = getFirestore();

const catDocs = (await db.collection("catalog_temas").get()).docs;
const porTitulo = new Map(catDocs.map((d) => [String(d.data().title || "").trim(), d]));

const faltando = Object.keys(RENOMEAR).filter((t) => !porTitulo.has(t));
if (faltando.length) {
  console.error("Temas a renomear não encontrados:", faltando);
  process.exit(1);
}
const jaExiste = CRIAR.filter((c) => porTitulo.has(c.title));
if (jaExiste.length) {
  console.log("Já existem (serão ignorados):", jaExiste.map((c) => c.title).join(", "));
}

console.log("RENOMEAÇÕES:");
for (const [antigo, { novo, ponto }] of Object.entries(RENOMEAR)) {
  console.log(`  Ponto ${String(ponto).padStart(2)}: "${antigo}"\n            -> "${novo}"`);
}
console.log("\nNOVOS TEMAS:");
for (const c of CRIAR) {
  if (porTitulo.has(c.title)) continue;
  console.log(`  Ponto ${String(c.ponto).padStart(2)} [${c.nivel}]: ${c.title}`);
}

// levantamento do impacto textual
const qs = await db.collection("questionsBank").get();
const fcs = await db.collection("flashcards").get();
const dks = await db.collection("flashcardDecks").get();

const impacto = { questoes: 0, cards: 0, decks: 0 };
const updatesQ = [], updatesF = [], updatesD = [];
for (const d of qs.docs) {
  const arr = Array.isArray(d.data().themes) ? d.data().themes.map((t) => String(t || "").trim()) : [];
  if (!arr.some((t) => RENOMEAR[t])) continue;
  updatesQ.push({ ref: d.ref, novo: arr.map((t) => (RENOMEAR[t] ? RENOMEAR[t].novo : t)) });
  impacto.questoes++;
}
for (const d of fcs.docs) {
  const t = String(d.data().themeName || "").trim();
  if (!RENOMEAR[t]) continue;
  updatesF.push({ ref: d.ref, novo: RENOMEAR[t].novo });
  impacto.cards++;
}
// Decks: o título é gerado do slug (sem acento, capitalização estranha).
// Reconstrói a partir do catálogo para TODOS os decks, não só os renomeados.
const norm = (s) =>
  String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const tituloFinalPorTema = new Map(); // título normalizado -> título oficial
for (const d of catDocs) {
  const atual = String(d.data().title || "").trim();
  const oficial = RENOMEAR[atual] ? RENOMEAR[atual].novo : atual;
  tituloFinalPorTema.set(norm(atual), oficial);
}
for (const c of CRIAR) tituloFinalPorTema.set(norm(c.title), c.title);

const PREFIXO = { me: "ME", tea: "TEA", tsa: "TSA" };
for (const d of dks.docs) {
  const x = d.data();
  const slug = String(x.themeId || d.id).trim();
  const chave = norm(slug);
  let oficial = tituloFinalPorTema.get(chave);
  if (!oficial) {
    // slugs truncados no banco (ex.: etica-...-profis): casa por prefixo
    for (const [k, v] of tituloFinalPorTema) {
      if (k.startsWith(chave) || chave.startsWith(k)) { oficial = v; break; }
    }
  }
  if (!oficial) { console.log(`  AVISO: deck sem tema correspondente: ${d.id}`); continue; }
  const mod = x.moduleId ? PREFIXO[x.moduleId] : null;
  const novo = mod ? `${mod} - ${oficial}` : oficial;
  if (novo === String(x.title || "").trim()) continue;
  updatesD.push({ ref: d.ref, novo });
  impacto.decks++;
}
console.log(`\nPropagação do texto: ${impacto.questoes} questões, ${impacto.cards} cards, ${impacto.decks} decks`);

if (!apply) {
  console.log("\nDry-run — nada gravado. Rode com --apply para persistir.");
  process.exit(0);
}

// 1) catálogo
let batch = db.batch(); let n = 0;
const commit = async () => { if (n) { await batch.commit(); batch = db.batch(); n = 0; } };
for (const [antigo, { novo, ponto }] of Object.entries(RENOMEAR)) {
  batch.update(porTitulo.get(antigo).ref, { title: novo, pontoSBA: ponto, updatedAt: FieldValue.serverTimestamp() });
  if (++n === 400) await commit();
}
for (const c of CRIAR) {
  if (porTitulo.has(c.title)) continue;
  batch.set(db.collection("catalog_temas").doc(c.id), {
    title: c.title, status: "ativo", levelLabel: c.nivel, levelId: NIVEL_ID[c.nivel],
    code: String(c.ponto), pontoSBA: c.ponto,
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  });
  if (++n === 400) await commit();
}
await commit();
console.log("Catálogo atualizado.");

// 2) propagação do texto
for (const lote of [updatesQ, updatesF, updatesD]) {
  for (let i = 0; i < lote.length; i += 400) {
    const grupo = lote.slice(i, i + 400);
    const b = db.batch();
    for (const u of grupo) {
      if (Array.isArray(u.novo)) b.update(u.ref, { themes: u.novo, updatedAt: FieldValue.serverTimestamp() });
      else if (u.ref.path.startsWith("flashcards/")) b.update(u.ref, { themeName: u.novo, updatedAt: FieldValue.serverTimestamp() });
      else b.update(u.ref, { title: u.novo, updatedAt: FieldValue.serverTimestamp() });
    }
    await b.commit();
  }
}
console.log(`Propagado: ${impacto.questoes} questões, ${impacto.cards} cards, ${impacto.decks} decks.`);
