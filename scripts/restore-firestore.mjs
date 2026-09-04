/**
 * Restaura no Firestore um backup gerado por `backup-firestore.mjs`.
 *
 * Por padrão restaura TODAS as coleções do backup, fazendo `set` documento a
 * documento (sobrescreve o que existir com o mesmo id; não apaga documentos
 * que só existem no banco). Use `--collection=` para restaurar uma só, por
 * exemplo depois de um erro em massa em `questionsBank`.
 *
 * Os tipos serializados no backup (timestamp, geopoint, ref, bytes) são
 * reconstruídos.
 *
 * Uso:
 *   node scripts/restore-firestore.mjs --in=<pasta>                             # dry-run
 *   node scripts/restore-firestore.mjs --in=<pasta> --collection=questionsBank  # dry-run de uma
 *   node scripts/restore-firestore.mjs --in=<pasta> --apply
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp, GeoPoint } from "firebase-admin/firestore";
import fs from "node:fs";
import path from "node:path";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    if (!k || process.env[k]) continue;
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[k] = v;
  }
}
loadEnvFile(path.resolve(process.cwd(), ".env.local"));
loadEnvFile(path.resolve(process.cwd(), ".env"));

const getArg = (f) => {
  const p = `${f}=`;
  const a = process.argv.find((x) => x.startsWith(p));
  return a ? a.slice(p.length) : null;
};
const pasta = getArg("--in");
const filtro = getArg("--collection");
const apply = process.argv.includes("--apply");
if (!pasta || !fs.existsSync(path.join(pasta, "manifest.json"))) {
  console.error("Uso: node scripts/restore-firestore.mjs --in=<pasta do backup> [--collection=<nome>] [--apply]");
  process.exit(1);
}

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

const manifest = JSON.parse(fs.readFileSync(path.join(pasta, "manifest.json"), "utf8"));
if (manifest.projectId !== process.env.FIREBASE_ADMIN_PROJECT_ID) {
  console.error(`Abortado: backup é do projeto ${manifest.projectId}, credencial é de ${process.env.FIREBASE_ADMIN_PROJECT_ID}.`);
  process.exit(1);
}

function desserializa(v) {
  if (Array.isArray(v)) return v.map(desserializa);
  if (v && typeof v === "object") {
    if (v.__type === "timestamp") return Timestamp.fromDate(new Date(v.value));
    if (v.__type === "geopoint") return new GeoPoint(v.lat, v.lng);
    if (v.__type === "ref") return db.doc(v.path);
    if (v.__type === "bytes") return Buffer.from(v.base64, "base64");
    const o = {};
    for (const [k, x] of Object.entries(v)) o[k] = desserializa(x);
    return o;
  }
  return v;
}

const arquivos = fs.readdirSync(path.join(pasta, "firestore")).filter((f) => f.endsWith(".json"));
const selecionados = [];
for (const f of arquivos) {
  const { collection, docs } = JSON.parse(fs.readFileSync(path.join(pasta, "firestore", f), "utf8"));
  const raiz = collection.split("/")[0];
  if (filtro && raiz !== filtro && collection !== filtro) continue;
  selecionados.push({ collection, docs });
}
const totalDocs = selecionados.reduce((s, c) => s + c.docs.length, 0);
console.log(`Backup de ${manifest.geradoEm} (${manifest.totalDocumentos} documentos no total)`);
console.log(`Coleções selecionadas: ${selecionados.length} | documentos a gravar: ${totalDocs}`);
for (const c of selecionados.slice(0, 15)) console.log(`  ${String(c.docs.length).padStart(6)}  ${c.collection}`);
if (selecionados.length > 15) console.log(`  … e mais ${selecionados.length - 15} coleções`);
console.log(`Modo: ${apply ? "GRAVAR (sobrescreve documentos com o mesmo id)" : "DRY-RUN"}`);
if (!apply) { console.log("\nDry-run — nada gravado."); process.exit(0); }

let n = 0;
for (const { collection, docs } of selecionados) {
  for (let i = 0; i < docs.length; i += 400) {
    const batch = db.batch();
    for (const d of docs.slice(i, i + 400)) batch.set(db.collection(collection).doc(d.id), desserializa(d.data));
    await batch.commit();
    n += Math.min(400, docs.length - i);
    process.stdout.write(`\r  gravados: ${n}/${totalDocs}   `);
  }
}
console.log(`\n\nConcluído: ${n} documentos restaurados.`);
