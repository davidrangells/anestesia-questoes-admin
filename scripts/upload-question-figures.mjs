/**
 * Sobe figuras de uma prova para o Firebase Storage e devolve o mapa
 * arquivo -> URL pública, para ser usado na coluna `imageUrl` da planilha
 * de importação. Diferente do upload-tea2023-images.mjs, não depende de as
 * questões já existirem no Firestore — serve para subir antes de importar.
 *
 * Uso:
 *   node scripts/upload-question-figures.mjs --dir=<pasta> --prefixo=me1_2023           # dry-run
 *   node scripts/upload-question-figures.mjs --dir=<pasta> --prefixo=me1_2023 --apply
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import crypto from "node:crypto";
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
const dir = getArg("--dir");
const prefixo = getArg("--prefixo");
const apply = process.argv.includes("--apply");
if (!dir || !fs.existsSync(dir) || !prefixo) {
  console.error("Uso: node scripts/upload-question-figures.mjs --dir=<pasta> --prefixo=<slug> [--apply]");
  process.exit(1);
}

const bucketName =
  process.env.FIREBASE_ADMIN_STORAGE_BUCKET ||
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
if (!bucketName) {
  console.error("Bucket do Storage não configurado (NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET).");
  process.exit(1);
}

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
const bucket = getStorage().bucket();

const publicUrl = (objectPath, token) =>
  `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`;

const arquivos = fs.readdirSync(dir).filter((f) => /\.(png|jpe?g)$/i.test(f)).sort();
console.log(`Figuras encontradas: ${arquivos.length}`);
console.log(`Bucket: ${bucket.name} | destino: questionsBank/${prefixo}/`);
console.log(`Modo: ${apply ? "SUBIR" : "DRY-RUN"}`);

const mapa = {};
for (const f of arquivos) {
  const full = path.join(dir, f);
  const kb = Math.round(fs.statSync(full).size / 1024);
  const objectPath = `questionsBank/${prefixo}/${f}`;
  if (apply) {
    const token = crypto.randomUUID();
    await bucket.upload(full, {
      destination: objectPath,
      metadata: {
        contentType: f.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg",
        cacheControl: "public, max-age=31536000",
        metadata: { firebaseStorageDownloadTokens: token },
      },
    });
    mapa[f] = publicUrl(objectPath, token);
    console.log(`  ${f} (${kb} KB) -> ok`);
  } else {
    mapa[f] = "(dry-run)";
    console.log(`  ${f} (${kb} KB)`);
  }
}

if (apply) {
  const saida = path.join(dir, "_urls.json");
  fs.writeFileSync(saida, JSON.stringify(mapa, null, 1));
  console.log(`\nMapa arquivo -> URL salvo em ${saida}`);
} else {
  console.log("\nDry-run — nada foi enviado.");
}
