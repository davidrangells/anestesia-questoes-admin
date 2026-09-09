// Flashcards originais — Opioides.
// Conteúdo redigido a partir do mapa de conceitos dos capítulos citados
// (nada copiado/traduzido literalmente). Números conferidos no texto extraído.
//
// Gerar planilha:
//   node scripts/build-flashcards-xlsx.mjs \
//     --in=exports/referencias/planilhas/opioides.cards.mjs \
//     --out=exports/referencias/planilhas/flashcards_opioides_2026-09-08.xlsx

const SAESP46 = "Tratado de Anestesiologia SAESP, 10ª ed. — cap. 46, Agonistas e Antagonistas Opioides";
const SAESP116 = "Tratado de Anestesiologia SAESP, 10ª ed. — cap. 116, Avaliação e Tratamento da Dor Aguda";
const SAESP117 = "Tratado de Anestesiologia SAESP, 10ª ed. — cap. 117, Analgesia Controlada pelo Paciente";
const MILLER22 = "Miller's Anesthesia, 10ª ed. (2025) — cap. 22, Opioids";
const STOELT7 = "Stoelting's Pharmacology & Physiology in Anesthetic Practice, 6ª ed. (2021) — cap. 7, Opioid Agonists and Antagonists";

const THEME = {
  themeId: "opioides",
  themeName: "Opioides",
  moduleId: "me",
  examType: "ME",
  level: "R1",
};

const D_REC = "opioides-receptores-potencia";
const D_PK = "opioides-farmacocinetica-agentes";
const D_ADV = "opioides-efeitos-adversos";
const D_ANT = "opioides-tolerancia-antagonistas";

const card = (deck, front, back, expl, difficulty, tags, ref, extra = {}) => ({
  ...THEME,
  frontText: front,
  backText: back,
  shortExplanation: expl,
  difficulty,
  deckIds: Array.isArray(deck) ? deck : [deck],
  tags,
  sourceReference: ref,
  ...extra,
});

export default {
  meta: {
    tema: "Opioides",
    fontes: "SAESP 10ed caps. 46, 116 e 117; Miller 10ed cap. 22; Stoelting 6ed cap. 7",
    observacoes:
      "Cards originais. As doses anestésicas (fentanil, remifentanil, alfentanil) não constam do cap. 46 do SAESP e vieram de Miller e Stoelting. Cards com reviewNotes marcam divergências entre as fontes.",
  },
  decks: [
    {
      deckId: D_REC,
      title: "Opioides — Receptores e potência",
      description: "Receptores mu, kappa, delta e NOP, mecanismo de transdução e potência relativa entre os agentes.",
      moduleId: "me",
      themeId: THEME.themeId,
      order: 1,
    },
    {
      deckId: D_PK,
      title: "Opioides — Farmacocinética e agentes",
      description: "Meia-vida contexto-sensível, metabolismo, metabólitos ativos, doses e particularidades de cada opioide.",
      moduleId: "me",
      themeId: THEME.themeId,
      order: 2,
    },
    {
      deckId: D_ADV,
      title: "Opioides — Efeitos adversos",
      description: "Depressão respiratória, rigidez torácica, prurido, náusea, miose, efeitos cardiovasculares e gastrointestinais.",
      moduleId: "me",
      themeId: THEME.themeId,
      order: 3,
    },
    {
      deckId: D_ANT,
      title: "Opioides — Tolerância e antagonistas",
      description: "Tolerância, hiperalgesia induzida por opioide, naloxona e demais antagonistas.",
      moduleId: "me",
      themeId: THEME.themeId,
      order: 4,
    },
  ],
  cards: [
    // ───────────── RECEPTORES E POTÊNCIA ─────────────
    card(D_REC,
      "Quais são os quatro receptores opioides e seus genes?",
      "Mu (OPRM-1), kappa (OPRK-1), delta (OPRD-1) e NOP (OPRL-1)",
      "Os três primeiros são os clássicos; o NOP (ou ORL-1) foi identificado depois e tem farmacologia distinta.",
      "medium", ["receptores", "genes"], SAESP46),

    card(D_REC,
      "A que família de receptores pertencem os receptores opioides?",
      "Receptores de sete domínios transmembrana acoplados à proteína G",
      "A ativação da proteína G é o que desencadeia toda a cascata inibitória subsequente.",
      "medium", ["receptores", "proteina-g"], SAESP46),

    card(D_REC,
      "Quais efeitos são mediados pelo receptor mu?",
      "Analgesia, depressão respiratória, euforia, sedação, dependência e íleo",
      "É o receptor responsável tanto pelo efeito terapêutico quanto pelos principais efeitos adversos dos opioides.",
      "easy", ["receptor-mu"], SAESP46),

    card(D_REC,
      "Quais efeitos caracterizam a ativação do receptor kappa?",
      "Analgesia, sedação, disforia e aversão, além de dependência física",
      "A disforia e a aversão diferenciam o kappa do mu, e explicam por que agonistas kappa têm menor potencial de abuso.",
      "medium", ["receptor-kappa"], SAESP46),

    card(D_REC,
      "Qual é o perfil dos agonistas do receptor delta?",
      "Analgesia espinhal e supraespinhal, efeito ansiolítico e menor risco de abuso",
      "Podem, porém, ser epileptogênicos, o que limitou seu desenvolvimento como analgésicos clínicos.",
      "hard", ["receptor-delta"], SAESP46),

    card(D_REC,
      "A naloxona antagoniza o receptor NOP (ORL-1)?",
      "Não; ela bloqueia os demais receptores opioides, mas não o NOP",
      "Essa é a exceção ao antagonismo amplo da naloxona e explica o interesse em agonistas NOP com perfil de segurança diferente.",
      "hard", ["naloxona", "nop"], SAESP46),

    card(D_REC,
      "Qual é o mecanismo de transdução da ativação do receptor opioide?",
      "Inibe a adenilato ciclase, abre canais de potássio e inibe canais de cálcio pré-sinápticos",
      "A hiperpolarização pós-sináptica somada à menor entrada de cálcio pré-sináptica reduz a transmissão nociceptiva.",
      "hard", ["mecanismo", "transducao"], SAESP46),

    card(D_REC,
      "Quais neurotransmissores têm sua liberação bloqueada pelos opioides?",
      "Glutamato, substância P e peptídeo relacionado ao gene da calcitonina (CGRP)",
      "São os principais mediadores excitatórios da transmissão nociceptiva no corno dorsal da medula.",
      "hard", ["mecanismo", "neurotransmissores"], SAESP46),

    card(D_REC,
      "Em qual lâmina medular se concentram os receptores mu?",
      "Lâmina II de Rexed (substância gelatinosa)",
      "É o principal sítio de ação espinhal dos opioides, o que fundamenta seu uso no neuroeixo.",
      "hard", ["receptor-mu", "medula"], SAESP46),

    card(D_REC,
      "Qual a potência do fentanil em relação à morfina?",
      "75 a 125 vezes maior",
      "A alta lipossolubilidade explica também seu início rápido e a curta duração após dose única, por redistribuição.",
      "easy", ["fentanil", "potencia"], STOELT7),

    card(D_REC,
      "Qual a potência do sufentanil em relação ao fentanil?",
      "5 a 10 vezes maior",
      "É o opioide mais potente em uso clínico rotineiro, com margem terapêutica ampla.",
      "easy", ["sufentanil", "potencia"], STOELT7),

    card(D_REC,
      "Como se compara a potência do remifentanil com a do fentanil e do alfentanil?",
      "Semelhante à do fentanil e cerca de 15 a 20 vezes a do alfentanil",
      "Apesar da potência semelhante ao fentanil, o comportamento cinético é radicalmente diferente pelo metabolismo por esterases.",
      "medium", ["remifentanil", "potencia"], STOELT7,
      { reviewNotes: "SAESP cita 20 a 30 vezes a potência do alfentanil; Stoelting cita 15 a 20 vezes." }),

    card(D_REC,
      "Qual a potência da meperidina em relação à morfina?",
      "Cerca de um décimo",
      "Por isso as doses são cerca de 10 vezes maiores em miligramas para o mesmo efeito analgésico.",
      "medium", ["meperidina", "potencia"], STOELT7),

    card(D_REC,
      "Qual a potência da hidromorfona em relação à morfina?",
      "6 a 8 vezes maior (7,5 mg de morfina equivalem a 1 mg)",
      "É opção útil quando se busca menor volume de infusão ou menos metabólitos ativos que a morfina.",
      "medium", ["hidromorfona", "potencia"], SAESP46,
      { reviewNotes: "Stoelting cita cerca de 5 vezes a potência da morfina; SAESP cita 6 a 8 vezes." }),

    card(D_REC,
      "Por que a oxicodona tem melhor desempenho por via oral que a morfina?",
      "Biodisponibilidade oral de 60 a 80%, contra 30 a 50% da morfina",
      "Sua potência é apenas 1,2 a 1,5 vez a da morfina, mas a absorção oral superior amplia a diferença na prática.",
      "medium", ["oxicodona", "biodisponibilidade"], SAESP46),

    card(D_REC,
      "Qual é a afinidade da codeína pelo receptor opioide em relação à morfina?",
      "Cerca de 200 vezes menor",
      "O efeito analgésico depende quase todo da conversão em morfina pela CYP2D6, e não da molécula original.",
      "medium", ["codeina", "afinidade"], SAESP46),

    card(D_REC,
      "Qual a potência da buprenorfina em relação à morfina?",
      "25 a 30 vezes maior, com afinidade pelo receptor mu cerca de 50 vezes maior",
      "A altíssima afinidade explica por que é difícil deslocá-la do receptor e por que a reversão exige doses altas de naloxona.",
      "hard", ["buprenorfina", "potencia"], SAESP46),

    card(D_REC,
      "Qual opioide tem a maior meia-vida de eliminação entre os de uso clínico?",
      "A metadona",
      "Meia-vida muito longa e variável, entre 15 e 150 horas, com risco de acúmulo nos primeiros dias de titulação.",
      "medium", ["metadona", "meia-vida"], SAESP46,
      { reviewNotes: "Miller cita faixa de 13 a 100 horas; SAESP cita 15 a 150 horas." }),

    // ───────────── FARMACOCINÉTICA E AGENTES ─────────────
    card(D_PK,
      "O que é a meia-vida contexto-sensível?",
      "Tempo para a concentração plasmática cair 50% após interromper uma infusão, conforme sua duração",
      "O “contexto” é o tempo de infusão. Explica por que fármacos com meia-vida de eliminação semelhante despertam de modo tão diferente.",
      "medium", ["contexto-sensivel", "farmacocinetica"], SAESP46),

    card(D_PK,
      "Qual é a meia-vida contexto-sensível do remifentanil após 3 horas de infusão?",
      "Cerca de 3 minutos",
      "Praticamente não varia com a duração da infusão, ao contrário do alfentanil, que chega a cerca de 47 minutos.",
      "medium", ["remifentanil", "contexto-sensivel"], SAESP46),

    card(D_PK,
      "Compare a meia-vida contexto-sensível de fentanil, sufentanil e alfentanil após 4 horas.",
      "Fentanil cerca de 260 min; alfentanil cerca de 60 min; sufentanil cerca de 30 min",
      "Contra a intuição, o sufentanil tem a menor das três, por sua distribuição tecidual ampla com redistribuição eficaz.",
      "hard", ["contexto-sensivel", "comparacao"], STOELT7),

    card(D_PK,
      "Como o remifentanil é metabolizado?",
      "Por esterases não específicas presentes em vários tecidos",
      "Não é substrato da pseudocolinesterase e independe de função hepática ou renal, o que o torna previsível em qualquer paciente.",
      "easy", ["remifentanil", "metabolismo", "esterases"], SAESP46),

    card(D_PK,
      "A insuficiência renal ou hepática altera a dose de remifentanil?",
      "Não; o metabolismo por esterases teciduais independe desses órgãos",
      "Ajustar apenas no idoso e usar massa magra no obeso. A hipotermia reduz o metabolismo em cerca de 20%.",
      "medium", ["remifentanil", "insuficiencia-renal"], SAESP46),

    card(D_PK,
      "Qual é a faixa de infusão do remifentanil em anestesia?",
      "0,1 a 1,0 micrograma/kg/min",
      "A ausência de acúmulo permite titulação livre, mas exige planejar a analgesia pós-operatória antes de suspender a infusão.",
      "medium", ["remifentanil", "dose", "infusao"], MILLER22),

    card(D_PK,
      "Qual é a meia-vida de equilíbrio no sítio efetor (t½ke0) dos opioides potentes?",
      "Cerca de 5 minutos para fentanil e sufentanil; 1 minuto para alfentanil e remifentanil",
      "Explica por que alfentanil e remifentanil têm pico de efeito quase imediato, úteis para bloquear estímulos breves e intensos.",
      "hard", ["ke0", "biofase"], SAESP46),

    card(D_PK,
      "Por que o alfentanil tem início de ação tão rápido apesar da baixa lipossolubilidade?",
      "Tem o menor pKa entre os opioides, com alta fração não ionizada em pH fisiológico",
      "Cerca de 90% da molécula está não ionizada, disponível para atravessar a barreira hematoencefálica de imediato.",
      "hard", ["alfentanil", "pka", "inicio"], SAESP46),

    card(D_PK,
      "Quais são os dois principais metabólitos da morfina e qual é ativo?",
      "M3G e M6G, na proporção aproximada de 6:1; o M6G é o ativo",
      "O M6G é agonista mu mais potente e mais duradouro que a própria morfina; o M3G não se liga ao receptor.",
      "medium", ["morfina", "m6g", "metabolito"], SAESP46,
      { reviewNotes: "Stoelting cita a proporção M3G:M6G como 9:1; SAESP cita 6:1." }),

    card(D_PK,
      "Por que a morfina é perigosa na insuficiência renal?",
      "O M6G, metabólito ativo de excreção renal, acumula e prolonga a depressão respiratória",
      "Doses habituais podem causar depressão respiratória tardia. Prefira opioides sem metabólitos ativos nesses pacientes.",
      "medium", ["morfina", "insuficiencia-renal", "m6g"], SAESP46),

    card(D_PK,
      "Qual metabólito da meperidina é neurotóxico e o que ele causa?",
      "A normeperidina, que causa agitação, mioclonias e convulsões",
      "Tem excreção renal e meia-vida muito mais longa que a da meperidina, acumulando em uso prolongado e na insuficiência renal.",
      "medium", ["meperidina", "normeperidina", "convulsao"], STOELT7),

    card(D_PK,
      "Por que a meperidina não é recomendada em analgesia controlada pelo paciente?",
      "Pelo risco de acúmulo de normeperidina com doses repetidas",
      "O uso prolongado, sobretudo além de 3 dias, associa-se a delirium e convulsões.",
      "medium", ["meperidina", "pca", "seguranca"], STOELT7),

    card(D_PK,
      "Qual é o mecanismo antitremor da meperidina?",
      "Ação em receptores kappa, somada a efeito em receptores alfa-2",
      "É o opioide de escolha para tremores pós-anestésicos, efeito não compartilhado igualmente pelos demais.",
      "medium", ["meperidina", "tremores"], STOELT7),

    card(D_PK,
      "Quais são os dois mecanismos analgésicos da metadona além do agonismo mu?",
      "Antagonismo do receptor NMDA e inibição da recaptação de serotonina e noradrenalina",
      "É o que a torna especialmente útil em dor neuropática e em pacientes tolerantes a opioides.",
      "medium", ["metadona", "nmda"], SAESP46),

    card(D_PK,
      "A partir de que dose a metadona prolonga o intervalo QT de forma relevante?",
      "Acima de 40 mg/dia",
      "QTc de 500 ms ou mais indica alto risco de torsades. Atenção a hipocalemia, hipomagnesemia e fármacos associados.",
      "hard", ["metadona", "qt", "torsades"], SAESP46),

    card(D_PK,
      "Por que a analgesia da metadona dura muito menos que sua meia-vida?",
      "A analgesia dura 4 a 8 horas, enquanto a meia-vida chega a dezenas de horas",
      "O descompasso é a principal armadilha: doses repetidas pelo alívio da dor levam a acúmulo e depressão respiratória tardia.",
      "hard", ["metadona", "acumulo"], SAESP46),

    card(D_PK,
      "Qual é o duplo mecanismo de ação do tramadol?",
      "Agonismo mu fraco somado à inibição da recaptação de noradrenalina e serotonina",
      "O efeito opioide depende do metabólito M1, gerado pela CYP2D6, cuja afinidade mu é cerca de 200 vezes maior.",
      "medium", ["tramadol", "mecanismo"], SAESP46),

    card(D_PK,
      "A naloxona reverte completamente o efeito do tramadol?",
      "Não; antagoniza apenas cerca de 30% do efeito",
      "O componente monoaminérgico não é opioide e por isso não é revertido, o que também explica o risco de síndrome serotoninérgica.",
      "hard", ["tramadol", "naloxona"], STOELT7),

    card(D_PK,
      "Qual é a dose diária máxima do tramadol?",
      "400 mg",
      "Doses maiores aumentam o risco de convulsões, sobretudo em epilépticos ou com fármacos serotoninérgicos associados.",
      "medium", ["tramadol", "dose-maxima"], SAESP116),

    card(D_PK,
      "Que enzima converte a codeína em morfina e qual a implicação clínica?",
      "A CYP2D6; apenas 5 a 10% da dose é convertida",
      "Metabolizadores lentos não obtêm analgesia; ultrarrápidos correm risco de intoxicação, motivo da contraindicação em crianças.",
      "medium", ["codeina", "cyp2d6", "farmacogenetica"], SAESP46),

    card(D_PK,
      "Qual a prevalência de metabolizadores lentos da CYP2D6?",
      "7 a 10% dos caucasianos e 1 a 2% dos afro-americanos",
      "Nesses indivíduos a codeína e o tramadol têm eficácia analgésica muito reduzida.",
      "hard", ["cyp2d6", "farmacogenetica"], SAESP46),

    card(D_PK,
      "Por que a codeína é contraindicada em crianças?",
      "Risco de depressão respiratória grave em metabolizadores ultrarrápidos da CYP2D6",
      "Houve mortes após amigdalectomia, o que levou à restrição formal de uso pediátrico.",
      "medium", ["codeina", "pediatria", "contraindicacao"], SAESP46),

    card(D_PK,
      "Qual a dose de morfina venosa em bolus para dor aguda?",
      "Cerca de 0,15 mg/kg a cada 3 a 4 horas",
      "Em infusão contínua, 0,03 a 0,1 mg/kg/h. Titular sempre pela resposta e pelo nível de sedação.",
      "medium", ["morfina", "dose"], SAESP116),

    card(D_PK,
      "Qual a dose de morfina por via intratecal?",
      "0,1 a 1 mg em dose única",
      "Por ser hidrofílica, difunde-se em sentido rostral e pode causar depressão respiratória tardia — exige vigilância prolongada.",
      "medium", ["morfina", "intratecal", "dose"], SAESP116),

    card(D_PK,
      "Qual a dose de fentanil por via intratecal?",
      "5 a 20 microgramas",
      "Sendo lipofílico, tem ação predominantemente segmentar, início rápido e menor risco de depressão respiratória tardia.",
      "medium", ["fentanil", "intratecal", "dose"], SAESP116),

    card(D_PK,
      "Quanto tempo leva o pico do opioide no liquor após injeção peridural?",
      "10 a 20 minutos para o fentanil e 1 a 4 horas para a morfina",
      "A diferença é explicada pela lipossolubilidade: o fentanil atravessa rápido, a morfina permanece no liquor e migra em sentido cefálico.",
      "hard", ["peridural", "opioide", "liquor"], SAESP46),

    card(D_PK,
      "Que dose de fentanil produz analgesia sem hipnose?",
      "1 a 2 microgramas/kg IV",
      "Doses de 50 a 150 microgramas/kg foram usadas historicamente como anestesia em altas doses na cirurgia cardíaca.",
      "medium", ["fentanil", "dose", "analgesia"], STOELT7),

    card(D_PK,
      "Qual a proporção de fentanil captada na primeira passagem pulmonar?",
      "Cerca de 75%",
      "Esse sequestro pulmonar transitório reduz o pico plasmático inicial e depois libera o fármaco de volta à circulação.",
      "hard", ["fentanil", "primeira-passagem", "pulmao"], MILLER22),

    card(D_PK,
      "Quanto tempo dura o fentanil transdérmico até atingir o equilíbrio?",
      "Cerca de 24 horas, com meia-vida aparente de aproximadamente 20 horas",
      "O depósito cutâneo mantém liberação por horas após a retirada do adesivo — não serve para titulação rápida de dor aguda.",
      "hard", ["fentanil", "transdermico"], SAESP46),

    // ───────────── EFEITOS ADVERSOS ─────────────
    card(D_ADV,
      "Qual é o mecanismo da depressão respiratória induzida por opioides?",
      "Redução da resposta bulbar ao CO2 e à hipoxemia, de forma dose-dependente",
      "A queda da resposta ao CO2 aparece antes mesmo do efeito analgésico pleno, o que explica risco já em doses analgésicas.",
      "easy", ["depressao-respiratoria", "mecanismo"], SAESP46),

    card(D_ADV,
      "Qual é o método mais confiável para detectar depressão respiratória por opioide?",
      "A capnometria",
      "A oximetria de pulso atrasa a detecção, sobretudo em paciente recebendo oxigênio suplementar.",
      "medium", ["depressao-respiratoria", "capnometria", "monitorizacao"], SAESP46),

    card(D_ADV,
      "Qual é o padrão respiratório típico da intoxicação por opioide?",
      "Bradipneia, podendo evoluir para respiração de Cheyne-Stokes",
      "O volume corrente costuma ser preservado no início; a queda é sobretudo da frequência respiratória.",
      "medium", ["depressao-respiratoria", "padrao"], SAESP46),

    card(D_ADV,
      "Qual é o mecanismo da rigidez torácica induzida por opioides?",
      "Ativação de receptores mu no sistema nervoso central",
      "É atenuada por agonistas de receptores delta e kappa. A resistência ventilatória é sobretudo glótica, não da parede torácica.",
      "hard", ["rigidez-toracica", "mecanismo"], SAESP46),

    card(D_ADV,
      "O prurido causado por opioide no neuroeixo é mediado por histamina?",
      "Não; o mecanismo não é histaminérgico",
      "Por isso o anti-histamínico é pouco eficaz e a naloxona em microdose ou a nalbufina funcionam melhor.",
      "medium", ["prurido", "neuroeixo"], SAESP46),

    card(D_ADV,
      "Como tratar o prurido causado por morfina no neuroeixo?",
      "Naloxona 0,04 a 0,08 mg IV, ou infusão de cerca de 100 microgramas/h",
      "A nalbufina 4 mg IV é igualmente eficaz e tem a vantagem de não reverter tanto a analgesia.",
      "medium", ["prurido", "naloxona", "tratamento"], SAESP117),

    card(D_ADV,
      "Qual é a incidência de náusea e vômito associada aos opioides?",
      "20 a 60%, de forma dose-dependente e independente da via",
      "Decorre de estímulo da zona de gatilho quimiorreceptora no assoalho do quarto ventrículo, somado a componente vestibular.",
      "easy", ["nvpo", "incidencia"], SAESP46),

    card(D_ADV,
      "Qual efeito adverso dos opioides não é dose-dependente?",
      "A constipação (e também a retenção urinária)",
      "Por isso o laxante deve ser prescrito profilaticamente sempre que se inicia opioide, independentemente da dose.",
      "medium", ["constipacao", "efeito-adverso"], SAESP116),

    card(D_ADV,
      "Existe tolerância ao efeito miótico dos opioides?",
      "Não; a miose persiste mesmo em usuários crônicos",
      "Decorre de estímulo do núcleo de Edinger-Westphal. Midríase em usuário de opioide sugere hipoxemia grave.",
      "medium", ["miose", "tolerancia"], SAESP46),

    card(D_ADV,
      "Qual é o mecanismo da bradicardia induzida por opioides?",
      "Estímulo central do núcleo do vago, na base do quarto ventrículo",
      "A morfina também deprime diretamente o nó sinusal e a condução atrioventricular.",
      "medium", ["bradicardia", "mecanismo"], SAESP46),

    card(D_ADV,
      "Quais opioides liberam histamina de forma clinicamente relevante?",
      "Morfina e meperidina",
      "A liberação causa vasodilatação, hipotensão e broncoconstrição — evitar bolus rápido no paciente instável ou asmático.",
      "medium", ["histamina", "morfina", "meperidina"], SAESP46),

    card(D_ADV,
      "Qual opioide tem efeito inotrópico negativo direto, ao contrário dos demais?",
      "A meperidina",
      "Também causa taquicardia por semelhança estrutural com a atropina, o oposto da bradicardia típica da classe.",
      "hard", ["meperidina", "inotropismo"], STOELT7),

    card(D_ADV,
      "Como se trata o espasmo biliar induzido por opioide?",
      "Glucagon 2 mg IV",
      "A naloxona também reverte, mas às custas da analgesia. O fentanil é o que mais eleva a pressão no colédoco.",
      "hard", ["espasmo-biliar", "glucagon"], STOELT7),

    card(D_ADV,
      "Que alteração endócrina o uso crônico de opioides provoca?",
      "Redução dos níveis plasmáticos de testosterona",
      "O hipogonadismo induzido por opioides ocorre independentemente do fármaco escolhido e costuma ser subdiagnosticado.",
      "hard", ["endocrino", "testosterona"], SAESP46),

    card(D_ADV,
      "Qual é o teto de dose diária de morfina recomendado em paciente virgem de opioide?",
      "90 mg de morfina ou equivalente por dia",
      "Acima disso o risco de depressão respiratória e de desenvolvimento de dependência aumenta significativamente.",
      "medium", ["dose-maxima", "seguranca"], SAESP116),

    card(D_ADV,
      "Que dose de fentanil equivale a 1 mg de morfina em analgesia controlada pelo paciente?",
      "Cerca de 40 microgramas",
      "Bolus habituais em não tolerantes: morfina 1 a 2 mg, fentanil 10 a 20 microgramas, com bloqueio de 10 minutos.",
      "hard", ["pca", "equipotencia"], SAESP117),

    // ───────────── TOLERÂNCIA E ANTAGONISTAS ─────────────
    card(D_ANT,
      "Qual a diferença entre tolerância e hiperalgesia induzida por opioides?",
      "Tolerância é perda de efeito com a mesma dose; hiperalgesia é aumento da sensibilidade à dor",
      "Na tolerância aumentar a dose ajuda; na hiperalgesia, piora. Distinguir as duas muda completamente a conduta.",
      "hard", ["tolerancia", "hiperalgesia"], SAESP46),

    card(D_ANT,
      "Qual é o mecanismo proposto para a hiperalgesia induzida por opioides?",
      "Interação entre receptores NMDA e receptores mu na substância cinzenta periaquedutal",
      "É a base do uso de cetamina, antagonista NMDA, para prevenir ou tratar a hiperalgesia.",
      "hard", ["hiperalgesia", "nmda"], SAESP46),

    card(D_ANT,
      "Qual fármaco previne a tolerância aguda induzida pelo remifentanil?",
      "A cetamina, em doses baixas",
      "Como antagonista NMDA, abole a tolerância aguda. A naloxona em microdose também foi descrita com esse efeito.",
      "hard", ["cetamina", "tolerancia", "remifentanil"], STOELT7),

    card(D_ANT,
      "Qual é o mecanismo molecular da dessensibilização do receptor opioide?",
      "Fosforilação por quinases seguida de ligação da beta-arrestina e internalização do receptor",
      "A retirada do receptor da membrana é o que reduz a resposta à mesma concentração do agonista.",
      "hard", ["dessensibilizacao", "beta-arrestina"], SAESP46),

    card(D_ANT,
      "Qual é a dose de naloxona para reverter depressão respiratória por opioide?",
      "1 a 4 microgramas/kg IV, tituladas",
      "Em overdose, doses iniciais de 0,4 a 0,8 mg. Titular para restaurar a ventilação sem abolir totalmente a analgesia.",
      "medium", ["naloxona", "dose"], STOELT7),

    card(D_ANT,
      "Por que há risco de ressedação após reverter um opioide com naloxona?",
      "Sua duração de ação é curta, de cerca de 30 a 45 minutos",
      "É menor que a da maioria dos opioides revertidos. Manter vigilância e considerar infusão contínua.",
      "medium", ["naloxona", "ressedacao"], SAESP46),

    card(D_ANT,
      "Que dose de naloxona em infusão previne depressão respiratória sem reverter a analgesia neuraxial?",
      "5 microgramas/kg/h",
      "A microdose antagoniza os efeitos adversos periféricos e centrais mantendo o efeito analgésico espinhal.",
      "hard", ["naloxona", "infusao", "neuroeixo"], STOELT7),

    card(D_ANT,
      "Quais são os riscos de reverter abruptamente um opioide com naloxona?",
      "Hipertensão, taquicardia, edema agudo de pulmão e fibrilação ventricular",
      "Evitar em coronariopatas, idosos e hipertensos; administrar lentamente, em 2 a 3 minutos.",
      "medium", ["naloxona", "complicacao"], SAESP46),

    card(D_ANT,
      "Por que a naloxona deve ser evitada em gestante dependente de opioide?",
      "Atravessa a placenta e pode desencadear abstinência aguda no feto",
      "A abstinência fetal pode causar sofrimento e trabalho de parto prematuro.",
      "hard", ["naloxona", "gestacao"], STOELT7),

    card(D_ANT,
      "Por que a buprenorfina é difícil de reverter com naloxona?",
      "Sua afinidade pelo receptor mu é cerca de 50 vezes a da morfina",
      "A reversão exige doses muito maiores que as habituais, e mesmo assim pode ser incompleta.",
      "hard", ["buprenorfina", "naloxona", "reversao"], MILLER22),

    card(D_ANT,
      "Qual antagonista opioide tem ação oral prolongada, usada em dependência química?",
      "A naltrexona, com antagonismo por até 24 horas",
      "É empregada também no tratamento do alcoolismo, ao contrário da naloxona, cuja biodisponibilidade oral é mínima.",
      "medium", ["naltrexona", "antagonista"], STOELT7),

    card(D_ANT,
      "Qual antagonista opioide não atravessa a barreira hematoencefálica?",
      "A metilnaltrexona, um composto de amônio quaternário",
      "Reverte a constipação e o retardo do esvaziamento gástrico sem antagonizar a analgesia central.",
      "medium", ["metilnaltrexona", "constipacao"], SAESP46),

    card(D_ANT,
      "Qual é a afinidade do alvimopam pelo receptor mu em relação à naloxona?",
      "Cerca de 5 vezes maior",
      "Antagonista periférico usado para acelerar a recuperação da função intestinal no pós-operatório abdominal.",
      "hard", ["alvimopam", "antagonista-periferico"], SAESP46),

    card(D_ANT,
      "Qual é a vantagem do nalmefeno sobre a naloxona?",
      "Duração de ação mais prolongada",
      "Reduz o risco de ressedação após reversão de opioides de ação longa. É um derivado hidrossolúvel da naltrexona.",
      "hard", ["nalmefeno", "antagonista"], SAESP46),

    card(D_ANT,
      "Qual é a dose máxima única e diária da nalbufina?",
      "20 mg em dose única e 160 mg por dia",
      "Como agonista-antagonista, tem efeito teto de depressão respiratória, mas também teto analgésico.",
      "hard", ["nalbufina", "dose"], MILLER22),

    card(D_ANT,
      "Que dose de butorfanol equivale a 10 mg de morfina?",
      "2 a 3 mg IM",
      "Agonista-antagonista com depressão ventilatória semelhante à da morfina nessa dose equianalgésica.",
      "hard", ["butorfanol", "equipotencia"], STOELT7),
  ],
};
