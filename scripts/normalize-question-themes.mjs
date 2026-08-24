/**
 * Normaliza o campo `themes` das questões para conter APENAS títulos do
 * catalog_temas, usando os `themeIds` já vinculados como fonte da verdade.
 *
 * Motivo: o app do aluno monta a lista de temas do "Novo simulado" a partir da
 * união da coleção `temas` com TODOS os valores de texto de `themes` das
 * questões. Qualquer tema granular gravado na questão vira um filtro solto.
 *
 * Uso:
 *   node scripts/normalize-question-themes.mjs            # dry-run
 *   node scripts/normalize-question-themes.mjs --apply
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
const catSnap = await db.collection("catalog_temas").get();
const tituloPorId = new Map(catSnap.docs.map((d) => [d.id, String(d.data().title || "").trim()]));
const titulosValidos = new Set(tituloPorId.values());

const qsSnap = await db.collection("questionsBank").get();

const aCorrigir = [];
const semThemeIds = [];
for (const doc of qsSnap.docs) {
  const data = doc.data();
  const atuais = Array.isArray(data.themes)
    ? data.themes.map((t) => String(t || "").trim()).filter(Boolean)
    : [];
  const ids = Array.isArray(data.themeIds)
    ? data.themeIds.map((i) => String(i || "").trim()).filter(Boolean)
    : [];

  const invalidos = atuais.filter((t) => !titulosValidos.has(t));
  if (!invalidos.length) continue;

  if (!ids.length) {
    // sem vínculo: não dá para derivar o título correto — apenas reporta
    semThemeIds.push({ id: doc.id, atuais });
    continue;
  }

  const desejados = [...new Set(ids.map((i) => tituloPorId.get(i)).filter(Boolean))];
  if (!desejados.length) {
    semThemeIds.push({ id: doc.id, atuais });
    continue;
  }
  const mudou = desejados.length !== atuais.length || desejados.some((t, i) => t !== atuais[i]);
  if (mudou) aCorrigir.push({ ref: doc.ref, id: doc.id, antes: atuais, depois: desejados });
}

console.log(`Questões na coleção: ${qsSnap.size}`);
console.log(`Questões com tema fora do catálogo e corrigíveis: ${aCorrigir.length}`);
console.log(`Questões sem themeId (precisam de remapeamento manual): ${semThemeIds.length}`);

for (const item of aCorrigir.slice(0, 15)) {
  console.log(`  ${item.id}`);
  console.log(`    antes:  ${item.antes.join(" | ")}`);
  console.log(`    depois: ${item.depois.join(" | ")}`);
}
if (aCorrigir.length > 15) console.log(`  ... e mais ${aCorrigir.length - 15}`);
for (const item of semThemeIds.slice(0, 10)) {
  console.log(`  SEM VÍNCULO: ${item.id} -> ${item.atuais.join(" | ")}`);
}

if (!apply) {
  console.log("\nDry-run — nada gravado. Rode com --apply para persistir.");
  process.exit(0);
}

let escritos = 0;
for (let i = 0; i < aCorrigir.length; i += 400) {
  const grupo = aCorrigir.slice(i, i + 400);
  const batch = db.batch();
  for (const item of grupo) {
    batch.update(item.ref, { themes: item.depois, updatedAt: FieldValue.serverTimestamp() });
  }
  await batch.commit();
  escritos += grupo.length;
  console.log(`  → ${escritos}/${aCorrigir.length}`);
}
console.log(`\nConcluído: ${escritos} questões normalizadas.`);
