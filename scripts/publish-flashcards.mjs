#!/usr/bin/env node
/**
 * Publica (status=published, isActive=true, needsReview=false) flashcards e decks.
 *
 * Uso:
 *   node scripts/publish-flashcards.mjs --theme=<themeId> [--deck=<deckId>] [--dry-run]
 *   node scripts/publish-flashcards.mjs --all [--dry-run]
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import fs from "node:fs";
import path from "node:path";

for (const f of [".env.local", ".env"]) {
  const p = path.resolve(process.cwd(), f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    if (!k || process.env[k]) continue;
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[k] = v;
  }
}

const getArg = (flag) => {
  const raw = process.argv.find((a) => a.startsWith(`${flag}=`));
  return raw ? raw.slice(flag.length + 1) : null;
};
const theme = getArg("--theme");
const deck = getArg("--deck");
const all = process.argv.includes("--all");
const dryRun = process.argv.includes("--dry-run");
if (!theme && !deck && !all) {
  console.error("Uso: --theme=<themeId> | --deck=<deckId> | --all  [--dry-run]");
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

let cardsQ = db.collection("flashcards");
if (theme) cardsQ = cardsQ.where("themeId", "==", theme);
if (deck) cardsQ = cardsQ.where("deckIds", "array-contains", deck);
const cards = (await cardsQ.get()).docs.filter((d) => d.data().status !== "published" || !d.data().isActive);

const deckIds = new Set();
for (const d of cards) for (const id of d.data().deckIds ?? []) deckIds.add(id);
let decksQ = db.collection("flashcardDecks");
if (theme) decksQ = decksQ.where("themeId", "==", theme);
const decks = (await decksQ.get()).docs.filter(
  (d) => (all || theme || deckIds.has(d.id)) && (d.data().status !== "published" || !d.data().isActive)
);

console.log(`[publish] ${dryRun ? "DRY-RUN" : "GRAVAR"} — ${cards.length} cards, ${decks.length} decks`);
for (const d of decks) console.log(`  deck ${d.id} — ${d.data().title}`);
if (dryRun) process.exit(0);

const now = FieldValue.serverTimestamp();
let batch = db.batch();
let n = 0;
const flush = async () => { await batch.commit(); batch = db.batch(); n = 0; };
for (const d of cards) {
  batch.update(d.ref, { status: "published", isActive: true, needsReview: false, reviewedAt: now, reviewedBy: "script:publish-flashcards", updatedAt: now });
  if (++n >= 400) await flush();
}
for (const d of decks) {
  batch.update(d.ref, { status: "published", isActive: true, updatedAt: now });
  if (++n >= 400) await flush();
}
if (n) await flush();
console.log("✅ Publicado.");
