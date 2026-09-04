/**
 * Remove as referências por letra ("(B)", "alternativa C") dos comentários das
 * questões, para permitir o embaralhamento das alternativas na tela do aluno.
 *
 * Por que: as telas do aluno passam a exibir as alternativas em ordem sorteada.
 * Um comentário que diz "(B) está incorreta porque..." passaria a apontar a
 * alternativa errada, já que a letra B na tela deixa de ser a B do banco.
 *
 * Estratégia: a maior parte dos comentários já descreve o conteúdo logo após a
 * letra ("(C) o teste de Fisher serve a dados categóricos"), então basta apagar
 * a marca. Só os trechos que começam por verbo conjugado ("(B) inverte os
 * conceitos") perdem o sujeito e precisam de reescrita por IA; esses são
 * separados aqui e tratados à parte.
 *
 * Uso:
 *   node scripts/strip-option-letters.mjs --dump=exports/_letras_dump.json            # classifica
 *   node scripts/strip-option-letters.mjs --dump=... --out=exports/_strip.json        # gera transformação
 */
import fs from "node:fs";

const getArg = (f) => {
  const p = `${f}=`;
  const a = process.argv.find((x) => x.startsWith(p));
  return a ? a.slice(p.length) : null;
};

/* ---------- classificação ---------- */

// Formas verbais finitas: se o trecho começa por uma delas, o sujeito era a
// letra e some junto com ela. Inclui cópulas (é, são, está) e verbos de 3ª
// pessoa comuns nesses comentários.
const VERBOS_FINITOS = new Set([
  "é", "sao", "são", "esta", "está", "estao", "estão", "era", "eram", "foi", "foram", "fica", "ficam",
  "tem", "têm", "tinha", "havia", "possui", "possuem", "consiste", "consistem", "ocorre", "ocorrem",
  "inverte", "invertem", "descreve", "descrevem", "confunde", "confundem", "atribui", "atribuem",
  "subestima", "subestimam", "superestima", "superestimam", "ignora", "ignoram", "reune", "reúne",
  "reunem", "reúnem", "troca", "trocam", "acerta", "acertam", "usa", "usam", "associa", "associam",
  "corresponde", "correspondem", "contradiz", "contradizem", "aplica", "aplicam", "propoe", "propõe",
  "propoem", "propõem", "sugere", "sugerem", "indica", "indicam", "inclui", "incluem", "exclui",
  "excluem", "mistura", "misturam", "equipara", "equiparam", "generaliza", "generalizam", "repete",
  "repetem", "omite", "omitem", "desloca", "deslocam", "amplia", "ampliam", "restringe", "restringem",
  "limita", "limitam", "exagera", "exageram", "falha", "falham", "erra", "erram", "peca", "pecam",
  "desconsidera", "desconsideram", "despreza", "desprezam", "considera", "consideram", "trata",
  "tratam", "aponta", "apontam", "afirma", "afirmam", "nega", "negam", "assume", "assumem", "adota",
  "adotam", "escolhe", "escolhem", "prioriza", "priorizam", "recomenda", "recomendam", "mantem",
  "mantém", "retira", "retiram", "suspende", "suspendem", "posiciona", "posicionam", "classifica",
  "classificam", "define", "definem", "caracteriza", "caracterizam", "representa", "representam",
  "expressa", "expressam", "traduz", "traduzem", "reflete", "refletem", "remete", "remetem", "refere",
  "referem", "pressupoe", "pressupõe", "exige", "exigem", "requer", "requerem", "dispensa",
  "dispensam", "permite", "permitem", "impede", "impedem", "provoca", "provocam", "causa", "causam",
  "gera", "geram", "produz", "produzem", "determina", "determinam", "resulta", "resultam", "leva",
  "levam", "conduz", "conduzem", "implica", "implicam", "reduz", "reduzem", "aumenta", "aumentam",
  "eleva", "elevam", "diminui", "diminuem", "cai", "caem", "sobe", "sobem", "vale", "valem",
  "serve", "servem", "cabe", "cabem", "depende", "dependem", "decorre", "decorrem", "surge", "surgem",
]);

// Construções impessoais: não precisam de sujeito explícito.
const IMPESSOAL = /^(?:n[ãa]o\s+(?:h[áa]|existe|existem|se\s)|h[áa]\s|existem?\s|nenhum|nenhuma|trata-se)/i;
// Determinantes e preposições: o que vem depois é sintagma nominal (conteúdo).
const DETERMINANTE = /^(?:[ao]s?|um|uma|uns|umas|n[ao]s?|d[ao]s?|à|ao|pel[ao]s?|es[st][ae]s?|aquel[ae]s?|seu|sua|todo|toda|todos|todas|outr[ao]s?|qualquer|cada|ambos|ambas)\b/i;

const semAcento = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

export function classificaTrecho(txt) {
  const t = String(txt || "").trim().toLowerCase();
  if (!t) return "vazio";
  if (IMPESSOAL.test(t)) return "seguro";
  const primeira = t.split(/[\s,:;.]+/)[0] || "";
  // verbo finito -> o sujeito era a letra; precisa reescrita
  if (VERBOS_FINITOS.has(primeira) || VERBOS_FINITOS.has(semAcento(primeira))) return "reescrever";
  if (/^n[ãa]o\s/.test(t)) {
    const segunda = t.split(/[\s,:;.]+/)[1] || "";
    if (VERBOS_FINITOS.has(segunda) || VERBOS_FINITOS.has(semAcento(segunda))) return "reescrever";
    return "seguro";
  }
  if (DETERMINANTE.test(t)) return "seguro";
  if (/^[\d[("'«]/.test(t)) return "seguro";                 // número, fórmula, citação
  if (/^[a-zçãõáéíóúâêôà]+(?:ar|er|ir)\b/.test(t)) return "seguro"; // infinitivo
  return "seguro"; // substantivo/termo técnico
}

/* ---------- transformação ---------- */

const LETRA = "\\(\\s*[A-E]\\s*\\)";

export function removeLetras(htmlText) {
  let t = String(htmlText || "");
  // 1) marca antes de pontuação: "...não explica o quadro (B)." -> "...o quadro."
  t = t.replace(new RegExp(`\\s*${LETRA}\\s*(?=[.;,:!?])`, "g"), "");
  // 2) marca após ponto final: capitaliza a palavra seguinte
  t = t.replace(new RegExp(`([.!?]\\s*(?:<[^>]+>\\s*)*)${LETRA}\\s*([a-zà-ú])`, "g"),
    (_, pre, ch) => pre + ch.toUpperCase());
  // 3) marca abrindo trecho após ":" ou ";" -> some, mantendo um espaço
  t = t.replace(new RegExp(`([:;]\\s*(?:<[^>]+>\\s*)*)${LETRA}\\s*`, "g"), "$1");
  // 4) marca logo após tag de abertura (início de parágrafo/item)
  t = t.replace(new RegExp(`(<[^>]+>\\s*)${LETRA}\\s*`, "g"), "$1");
  // (As formas por extenso, "alternativa C" e afins, não são tratadas aqui:
  //  trocá-las por "essa alternativa" produz texto capenga, e a letra minúscula
  //  esbarra na conjunção "e" e no artigo "a" do português. Vão para reescrita.)
  // 6) sobras
  t = t.replace(new RegExp(`${LETRA}\\s*`, "g"), "");
  // limpeza
  t = t.replace(/[ \t]{2,}/g, " ").replace(/\s+([.;,:!?])/g, "$1").replace(/>\s+</g, "><");
  return t.trim();
}

/* ---------- execução ---------- */

const dumpFile = getArg("--dump");
const outFile = getArg("--out");
if (!dumpFile || !fs.existsSync(dumpFile)) {
  console.error("Uso: node scripts/strip-option-letters.mjs --dump=<json> [--out=<json>]");
  process.exit(1);
}
const dump = JSON.parse(fs.readFileSync(dumpFile, "utf8"));
const semTag = (s) => s.replace(/<[^>]+>/g, " ");

const seguras = {}, paraIA = [];
for (const q of dump) {
  const plano = semTag(q.explanation).replace(new RegExp(`${LETRA}\\s*([.;,])`, "g"), "$1");
  const partes = plano.split(new RegExp(`\\(\\s*([A-E])\\s*\\)`));
  const classes = [];
  for (let i = 1; i < partes.length; i += 2) classes.push(classificaTrecho(partes[i + 1]));
  const precisa = classes.includes("reescrever");
  // cita a letra do gabarito -> sempre para IA, é o caso mais grave
  const citaGabarito = /(alternativa|resposta)\s+correta\s*\(?\s*[A-E]\s*\)?|correta\s*\(\s*[A-E]\s*\)/i.test(plano);
  // forma por extenso ("alternativa C", "opção B", "letra D"): a letra é rótulo
  // do trecho e apagá-la deixa a frase sem referente. Letra em MAIÚSCULA só,
  // senão casaria com a conjunção "e" e o artigo "a".
  const porExtenso = /\b(?:alternativa|op[çc][ãa]o|letra)\s+[A-E]\b/.test(plano);
  if (precisa || citaGabarito || porExtenso) {
    paraIA.push({
      ...q,
      motivo: citaGabarito ? "cita letra do gabarito" : porExtenso ? "letra por extenso" : "trecho sem sujeito",
    });
    continue;
  }

  // Rede de segurança: olha o resultado JÁ transformado. Se ainda sobrou uma
  // letra maiúscula solta perto de uma palavra que a trate como rótulo (o caso
  // "Esta alternativa e D:", em que a conjunção separa a palavra da letra),
  // manda para reescrita em vez de gravar texto ambíguo.
  const resultado = removeLetras(q.explanation);
  const sobrou = /\b(?:alternativa|op[çc][ãa]o|letra|resposta|item)\b[^.<]{0,20}\b[A-E]\b/.test(semTag(resultado));
  if (sobrou) {
    paraIA.push({ ...q, motivo: "rótulo de letra remanescente" });
  } else {
    seguras[q.id] = resultado;
  }
}

console.log(`Questões analisadas: ${dump.length}`);
console.log(`  resolvidas por script: ${Object.keys(seguras).length}`);
console.log(`  para reescrita por IA: ${paraIA.length}`);
const restou = Object.entries(seguras).filter(([, v]) => new RegExp(LETRA).test(v));
console.log(`  com letra remanescente após transformação: ${restou.length}`);
if (restou.length) console.log("   ", restou.slice(0, 5).map(([k]) => k));

if (outFile) {
  fs.writeFileSync(outFile, JSON.stringify({ seguras, paraIA }, null, 1));
  console.log(`\nSaída: ${outFile}`);
}
