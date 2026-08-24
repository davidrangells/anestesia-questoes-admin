/**
 * Fecha o alinhamento ao Programa Teórico da SBA:
 *  - corrige "Farmacologia dos Anestésicos Venoso" -> "...Venosos" (a página da
 *    SBA traz o singular, aparentemente por erro de digitação)
 *  - grava o número do ponto (1 a 54) em `pontoSBA` em todos os temas, para
 *    permitir ordenar pela sequência oficial do programa
 *
 * Uso:
 *   node scripts/set-ponto-sba.mjs            # dry-run
 *   node scripts/set-ponto-sba.mjs --apply
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

const RENOMEAR = {
  "Farmacologia dos Anestésicos Venoso": "Farmacologia dos Anestésicos Venosos",
};

// Programa Teórico para Médicos em Especialização — 54 pontos
const PONTOS = [
  [1, "Ética Médica e Bioética. Responsabilidade Profissional do Anestesiologista"],
  [2, "Organização da SBA, Cooperativismo e SUS"],
  [3, "Risco Profissional do Anestesiologista"],
  [4, "Avaliação e Preparo Pré-Anestésico"],
  [5, "Vias Aéreas"], [6, "Posicionamento"], [7, "Equipamentos"],
  [8, "Sistema Nervoso Central e Autônomo"],
  [9, "Fisiologia e Farmacologia do Sistema Cardiocirculatório"],
  [10, "Fisiologia e Farmacologia do Sistema Respiratório"],
  [11, "Farmacologia Geral"],
  [12, "Farmacologia dos Anestésicos Venosos"],
  [13, "Farmacologia dos Anestésicos Inalatórios"],
  [14, "Farmacologia dos Anestésicos Locais"],
  [15, "Transmissão e Bloqueio Neuromuscular"],
  [16, "Parada Cardíaca e Reanimação"],
  [17, "Bloqueios Subaracnóideo e Peridural"],
  [18, "Complicações da Anestesia"],
  [19, "Recuperação Pós-anestésica"],
  [20, "Metodologia Científica"], [21, "Monitorização"],
  [22, "Sistemas de Administração de Anestesia Inalatória"],
  [23, "Anestesia Inalatória"], [24, "Anestesia Venosa"], [25, "Bloqueios Periféricos"],
  [26, "Equilíbrio Hidroeletrolítico e Acidobásico"],
  [27, "Reposição Volêmica e Transfusão"],
  [28, "Hemostasia e Anticoagulação"],
  [29, "Fisiologia e Farmacologia do Sistema Urinário"],
  [30, "Anestesia em Urologia"], [31, "Anestesia em Obstetrícia"], [32, "Anestesia em Ortopedia"],
  [33, "Anestesia para Cirurgia Abdominal"], [34, "Anestesia para Otorrinolaringologia"],
  [35, "Anestesia para Oftalmologia"], [36, "Anestesia Ambulatorial"],
  [37, "Anestesia e Sistema Endócrino"], [38, "Anestesia em Urgências e no Trauma"],
  [39, "Anestesia para Cirurgia Plástica"], [40, "Anestesia Bucomaxilofacial e para Odontologia"],
  [41, "Anestesia para Cirurgia Torácica"], [42, "Anestesia e Sistema Cardiovascular"],
  [43, "Anestesia para Neurocirurgia"], [44, "Hipotermia e Hipotensão Arterial Induzida"],
  [45, "Choque"], [46, "Anestesia em Geriatria"], [47, "Anestesia em Pediatria"],
  [48, "Anestesia para Transplantes"], [49, "Anestesia para Procedimentos Fora do Centro Cirúrgico"],
  [50, "Dor Aguda e Inflamação"], [51, "Dor Crônica"], [52, "Suporte Ventilatório"],
  [53, "Qualidade e Segurança em Anestesia"], [54, "Gerenciamento do Centro Cirúrgico"],
];

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
const pontoPorTitulo = new Map(PONTOS.map(([n, t]) => [t, n]));

// aplica a renomeação primeiro (em memória) para casar com a tabela de pontos
const resolvido = catDocs.map((d) => {
  const atual = String(d.data().title || "").trim();
  const final = RENOMEAR[atual] || atual;
  return { doc: d, atual, final, ponto: pontoPorTitulo.get(final) ?? null };
});

const semPonto = resolvido.filter((r) => r.ponto === null);
if (semPonto.length) {
  console.error("Temas sem correspondência no programa oficial:");
  semPonto.forEach((r) => console.error("  -", r.final));
  process.exit(1);
}
const pontosCobertos = new Set(resolvido.map((r) => r.ponto));
const faltantes = PONTOS.filter(([n]) => !pontosCobertos.has(n));
if (faltantes.length) {
  console.error("Pontos do programa ausentes no catálogo:", faltantes.map(([n, t]) => `${n} ${t}`));
  process.exit(1);
}

const renomear = resolvido.filter((r) => r.atual !== r.final);
console.log(`Temas no catálogo: ${resolvido.length} (todos casam com os 54 pontos)`);
console.log(`Renomeações: ${renomear.length}`);
renomear.forEach((r) => console.log(`  "${r.atual}" -> "${r.final}"`));

// impacto textual da renomeação
const qs = await db.collection("questionsBank").get();
const fcs = await db.collection("flashcards").get();
const dks = await db.collection("flashcardDecks").get();
const updQ = [], updF = [], updD = [];
for (const d of qs.docs) {
  const arr = (Array.isArray(d.data().themes) ? d.data().themes : []).map((t) => String(t || "").trim());
  if (!arr.some((t) => RENOMEAR[t])) continue;
  updQ.push({ ref: d.ref, novo: arr.map((t) => RENOMEAR[t] || t) });
}
for (const d of fcs.docs) {
  const t = String(d.data().themeName || "").trim();
  if (RENOMEAR[t]) updF.push({ ref: d.ref, novo: RENOMEAR[t] });
}
for (const d of dks.docs) {
  const t = String(d.data().title || "").trim();
  for (const [de, para] of Object.entries(RENOMEAR)) {
    if (t === de) updD.push({ ref: d.ref, novo: para });
    else if (t.endsWith(` - ${de}`)) updD.push({ ref: d.ref, novo: t.replace(` - ${de}`, ` - ${para}`) });
  }
}
console.log(`Propagação: ${updQ.length} questões, ${updF.length} cards, ${updD.length} decks`);
console.log(`pontoSBA a gravar/atualizar: ${resolvido.length} temas`);

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

await gravar(resolvido, (b, r) =>
  b.update(r.doc.ref, {
    title: r.final, pontoSBA: r.ponto, code: String(r.ponto), updatedAt: FieldValue.serverTimestamp(),
  }));
console.log(`Catálogo atualizado: ${resolvido.length} temas com pontoSBA.`);

await gravar(updQ, (b, u) => b.update(u.ref, { themes: u.novo, updatedAt: FieldValue.serverTimestamp() }));
await gravar(updF, (b, u) => b.update(u.ref, { themeName: u.novo, updatedAt: FieldValue.serverTimestamp() }));
await gravar(updD, (b, u) => b.update(u.ref, { title: u.novo, updatedAt: FieldValue.serverTimestamp() }));
console.log(`Propagado: ${updQ.length} questões, ${updF.length} cards, ${updD.length} decks.`);
