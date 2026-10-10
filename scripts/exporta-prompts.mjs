/** Exporta os enunciados do questionsBank para a checagem de duplicidade das ondas do Quest.
 *  Uso: node scripts/exporta-prompts.mjs exports/quest_caps/banco_prompts.json */
import { getFirestore, fs } from "./_env.mjs";
const snap = await getFirestore().collection("questionsBank").select("prompt_text", "prompt").get();
const out = {};
snap.forEach(d => { const x = d.data(); out[d.id] = String(x.prompt_text || x.prompt || "").replace(/<[^>]*>/g, " ").slice(0, 400); });
fs.writeFileSync(process.argv[2], JSON.stringify(out));
console.log("prompts exportados:", Object.keys(out).length);
