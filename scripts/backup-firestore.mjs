/**
 * Backup completo do Firestore (e, opcionalmente, do Storage) em arquivos locais.
 *
 * Percorre TODAS as coleções raiz e, recursivamente, as subcoleções de cada
 * documento (ex.: users/{uid}/meta, users/{uid}/sessions), gravando um JSON
 * por coleção. Timestamps, GeoPoints e referências são serializados com um
 * marcador de tipo para que o restore (`restore-firestore.mjs`) os reconstrua.
 *
 * Não altera nada no banco: só lê.
 *
 * Uso:
 *   node scripts/backup-firestore.mjs --list                      # só conta documentos
 *   node scripts/backup-firestore.mjs --out=<pasta>               # Firestore
 *   node scripts/backup-firestore.mjs --out=<pasta> --storage     # + arquivos do Storage
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp, GeoPoint, DocumentReference } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
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
const soListar = process.argv.includes("--list");
const comStorage = process.argv.includes("--storage");
const out = getArg("--out");
if (!soListar && !out) {
  console.error("Uso: node scripts/backup-firestore.mjs --list | --out=<pasta> [--storage]");
  process.exit(1);
}

const bucketName = process.env.FIREBASE_ADMIN_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    }),
    storageBucket: bucketName,
  });
}
const db = getFirestore();

/* ---------- serialização com tipos ---------- */
function serializa(v) {
  if (v instanceof Timestamp) return { __type: "timestamp", value: v.toDate().toISOString() };
  if (v instanceof GeoPoint) return { __type: "geopoint", lat: v.latitude, lng: v.longitude };
  if (v instanceof DocumentReference) return { __type: "ref", path: v.path };
  if (Buffer.isBuffer(v)) return { __type: "bytes", base64: v.toString("base64") };
  if (Array.isArray(v)) return v.map(serializa);
  if (v && typeof v === "object") {
    const o = {};
    for (const [k, x] of Object.entries(v)) o[k] = serializa(x);
    return o;
  }
  return v;
}

/* ---------- percurso recursivo ---------- */
const contagem = {};
let totalDocs = 0;

async function dumpColecao(colRef, pastaSaida) {
  const caminho = colRef.path; // ex.: users/abc/sessions
  const docs = [];
  const snap = await colRef.get();
  for (const d of snap.docs) {
    docs.push({ id: d.id, data: serializa(d.data()) });
    const subs = await d.ref.listCollections();
    for (const sub of subs) await dumpColecao(sub, pastaSaida);
  }
  contagem[caminho.split("/").filter((_, i) => i % 2 === 0).join("/*/")] =
    (contagem[caminho.split("/").filter((_, i) => i % 2 === 0).join("/*/")] || 0) + docs.length;
  totalDocs += docs.length;
  if (!soListar && docs.length) {
    const arquivo = path.join(pastaSaida, "firestore", `${caminho.replace(/\//g, "__")}.json`);
    fs.mkdirSync(path.dirname(arquivo), { recursive: true });
    fs.writeFileSync(arquivo, JSON.stringify({ collection: caminho, docs }, null, 1));
  }
  process.stdout.write(`\r  documentos lidos: ${totalDocs}      `);
}

const inicio = Date.now();
const raizes = await db.listCollections();
console.log(`Projeto: ${process.env.FIREBASE_ADMIN_PROJECT_ID}`);
console.log(`Coleções raiz: ${raizes.map((c) => c.id).join(", ")}`);
console.log(`Modo: ${soListar ? "LISTAR" : "GRAVAR em " + out}`);
for (const c of raizes) await dumpColecao(c, out);
console.log(`\n\nDocumentos por coleção (subcoleções agrupadas):`);
for (const [k, v] of Object.entries(contagem).sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(7)}  ${k}`);
console.log(`  ${String(totalDocs).padStart(7)}  TOTAL`);

/* ---------- Storage ---------- */
if (comStorage && !soListar) {
  if (!bucketName) { console.error("Bucket do Storage não configurado; pulando."); }
  else {
    const bucket = getStorage().bucket();
    const [arquivos] = await bucket.getFiles();
    console.log(`\nStorage: ${arquivos.length} arquivos em ${bucket.name}`);
    let n = 0, bytes = 0;
    for (const f of arquivos) {
      const destino = path.join(out, "storage", f.name);
      fs.mkdirSync(path.dirname(destino), { recursive: true });
      await f.download({ destination: destino });
      n++; bytes += Number(f.metadata.size || 0);
      process.stdout.write(`\r  baixados: ${n}/${arquivos.length} (${(bytes / 1048576).toFixed(1)} MB)   `);
    }
    console.log();
  }
}

if (!soListar) {
  fs.writeFileSync(path.join(out, "manifest.json"), JSON.stringify({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    geradoEm: new Date().toISOString(),
    totalDocumentos: totalDocs,
    colecoes: contagem,
    storage: comStorage,
  }, null, 1));
}
console.log(`\nConcluído em ${((Date.now() - inicio) / 1000).toFixed(0)}s.`);
