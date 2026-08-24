/**
 * Etapa 2 do alinhamento ao Programa Teórico da SBA: move questões e flashcards
 * dos temas que foram desdobrados para os novos pontos oficiais.
 *
 * Lê os arquivos de classificação produzidos na análise item a item e aplica:
 *  - questionsBank: troca o título em `themes` e o id em `themeIds`
 *  - flashcards:    troca `themeName`, `themeId` e `deckIds`
 *  - flashcardDecks: cria os decks dos temas novos e recalcula `cardCount`
 *
 * Uso:
 *   node scripts/apply-theme-reclassification.mjs --dir=<pasta>            # dry-run
 *   node scripts/apply-theme-reclassification.mjs --dir=<pasta> --apply
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

const getArg = (flag) => {
  const p = `${flag}=`;
  const f = process.argv.find((a) => a.startsWith(p));
  return f ? f.slice(p.length) : null;
};
const dir = getArg("--dir");
const apply = process.argv.includes("--apply");
if (!dir || !fs.existsSync(dir)) {
  console.error("Uso: node scripts/apply-theme-reclassification.mjs --dir=<pasta> [--apply]");
  process.exit(1);
}

const GRUPOS = [
  { arquivo: "resultado_dor.json", origem: "Dor Aguda e Inflamação", destino: "Dor Crônica" },
  {
    arquivo: "resultado_etica.json",
    origem: "Ética Médica e Bioética. Responsabilidade Profissional do Anestesiologista",
    destino: "Risco Profissional do Anestesiologista",
  },
  { arquivo: "resultado_venosos.json", origem: "Farmacologia dos Anestésicos Venoso", destino: "Anestesia Venosa" },
  { arquivo: "resultado_inalatorios.json", origem: "Farmacologia dos Anestésicos Inalatórios", destino: "Anestesia Inalatória" },
];

const slugify = (s) =>
  String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

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
const idPorTitulo = new Map(catDocs.map((d) => [String(d.data().title || "").trim(), d.id]));
const nivelPorTitulo = new Map(catDocs.map((d) => [String(d.data().title || "").trim(), String(d.data().levelLabel || "")]));

// carrega classificações
const mover = [];               // {id, de, para}
for (const g of GRUPOS) {
  const p = path.join(dir, g.arquivo);
  if (!fs.existsSync(p)) { console.error(`Faltando: ${g.arquivo}`); process.exit(1); }
  const itens = JSON.parse(fs.readFileSync(p, "utf8"));
  for (const it of itens) {
    if (String(it.tema).trim() === g.destino) mover.push({ id: it.id, de: g.origem, para: g.destino });
    else if (String(it.tema).trim() !== g.origem) {
      console.error(`Tema inesperado em ${g.arquivo}: ${it.tema}`); process.exit(1);
    }
  }
  if (!idPorTitulo.has(g.origem) || !idPorTitulo.has(g.destino)) {
    console.error(`Tema ausente no catálogo: ${g.origem} / ${g.destino}`); process.exit(1);
  }
}
console.log(`Itens a mover: ${mover.length}`);
const porDestino = mover.reduce((a, m) => ((a[m.para] = (a[m.para] || 0) + 1), a), {});
console.log("Por destino:", JSON.stringify(porDestino, null, 1));

const idsMover = new Set(mover.map((m) => m.id));
const destinoPorId = new Map(mover.map((m) => [m.id, m]));

const qs = await db.collection("questionsBank").get();
const fcs = await db.collection("flashcards").get();

const updQ = [], updF = [];
for (const d of qs.docs) {
  if (!idsMover.has(d.id)) continue;
  const { de, para } = destinoPorId.get(d.id);
  const x = d.data();
  const temas = (Array.isArray(x.themes) ? x.themes : []).map((t) => String(t || "").trim());
  const ids = (Array.isArray(x.themeIds) ? x.themeIds : []).map((i) => String(i || "").trim());
  const novoTemas = [...new Set(temas.map((t) => (t === de ? para : t)))];
  const novoIds = [...new Set(ids.map((i) => (i === idPorTitulo.get(de) ? idPorTitulo.get(para) : i)))];
  updQ.push({ ref: d.ref, id: d.id, temas: novoTemas, ids: novoIds });
}
for (const d of fcs.docs) {
  if (!idsMover.has(d.id)) continue;
  const { para } = destinoPorId.get(d.id);
  const x = d.data();
  const slug = slugify(para);
  const mod = x.moduleId ? String(x.moduleId) : null;
  const decks = mod ? [slug, `${mod}-${slug}`] : [slug];
  updF.push({ ref: d.ref, id: d.id, themeName: para, themeId: slug, deckIds: decks, moduleId: mod });
}
console.log(`  questões: ${updQ.length} | flashcards: ${updF.length}`);
const naoAchados = [...idsMover].filter((i) => !updQ.some((u) => u.id === i) && !updF.some((u) => u.id === i));
if (naoAchados.length) console.log(`  AVISO: ${naoAchados.length} ids não encontrados no banco`);

// decks necessários para os temas de destino
const decksExistentes = new Set((await db.collection("flashcardDecks").get()).docs.map((d) => d.id));
const decksCriar = new Map();
for (const u of updF) {
  for (const dk of u.deckIds) {
    if (decksExistentes.has(dk)) continue;
    const destino = u.themeName;
    const mod = dk.startsWith(`${u.moduleId}-`) ? u.moduleId : null;
    const PREF = { me: "ME", tea: "TEA", tsa: "TSA" };
    decksCriar.set(dk, {
      title: mod ? `${PREF[mod]} - ${destino}` : destino,
      description: `Deck do ponto "${destino}" do Programa Teórico da SBA.`,
      moduleId: mod, themeId: slugify(destino), order: 1,
      isActive: true, status: "published", cardCount: 0,
    });
  }
}
console.log(`Decks a criar: ${decksCriar.size}`, decksCriar.size ? [...decksCriar.keys()] : "");

if (!apply) {
  console.log("\nDry-run — nada gravado. Rode com --apply para persistir.");
  process.exit(0);
}

const gravar = async (lista, fn) => {
  for (let i = 0; i < lista.length; i += 400) {
    const b = db.batch();
    for (const u of lista.slice(i, i + 400)) fn(b, u);
    await b.commit();
  }
};

for (const [id, doc] of decksCriar) {
  await db.collection("flashcardDecks").doc(id).set({
    ...doc, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}
console.log(`Decks criados: ${decksCriar.size}`);

await gravar(updQ, (b, u) => b.update(u.ref, { themes: u.temas, themeIds: u.ids, updatedAt: FieldValue.serverTimestamp() }));
console.log(`Questões movidas: ${updQ.length}`);

await gravar(updF, (b, u) => b.update(u.ref, {
  themeName: u.themeName, themeId: u.themeId, deckIds: u.deckIds, updatedAt: FieldValue.serverTimestamp(),
}));
console.log(`Flashcards movidos: ${updF.length}`);

// recalcula cardCount de todos os decks a partir dos cards publicados
const cards2 = await db.collection("flashcards").get();
const contagem = new Map();
for (const d of cards2.docs) {
  const x = d.data();
  if (!(x.status === "published" && x.isActive === true)) continue;
  for (const dk of (Array.isArray(x.deckIds) ? x.deckIds : [])) contagem.set(dk, (contagem.get(dk) || 0) + 1);
}
const decks2 = (await db.collection("flashcardDecks").get()).docs;
const ajustes = decks2.filter((d) => (d.data().cardCount ?? 0) !== (contagem.get(d.id) || 0));
await gravar(ajustes, (b, d) => b.update(d.ref, { cardCount: contagem.get(d.id) || 0, updatedAt: FieldValue.serverTimestamp() }));
console.log(`cardCount recalculado em ${ajustes.length} decks.`);
