// Flashcards originais — Bloqueadores neuromusculares, monitorização e reversão.
// Conteúdo redigido a partir do mapa de conceitos dos capítulos citados
// (nada copiado/traduzido literalmente). Números conferidos no texto extraído.
//
// Gerar planilha:
//   node scripts/build-flashcards-xlsx.mjs \
//     --in=exports/referencias/planilhas/bloqueadores-neuromusculares.cards.mjs \
//     --out=exports/referencias/planilhas/flashcards_bnm_2026-09-08.xlsx

const SAESP22 = "Tratado de Anestesiologia SAESP, 10ª ed. — cap. 22, Fisiologia da Função Neuromuscular";
const SAESP53 = "Tratado de Anestesiologia SAESP, 10ª ed. — cap. 53, Bloqueadores Neuromusculares e Antagonistas";
const SAESP93 = "Tratado de Anestesiologia SAESP, 10ª ed. — cap. 93, Monitorização Neuromuscular";
const MILLER11 = "Miller's Anesthesia, 10ª ed. (2025) — cap. 11, Neuromuscular Physiology and Pharmacology";
const MILLER24 = "Miller's Anesthesia, 10ª ed. (2025) — cap. 24, Pharmacology of Neuromuscular Blocking Drugs and Antagonists (Reversal Agents)";
const MILLER39 = "Miller's Anesthesia, 10ª ed. (2025) — cap. 39, Neuromuscular Monitoring";
const STOELT12 = "Stoelting's Pharmacology & Physiology in Anesthetic Practice, 6ª ed. (2021) — cap. 12, Neuromuscular-Blocking Drugs and Reversal Agents";

const THEME = {
  themeId: "bloqueadores-neuromusculares",
  themeName: "Bloqueadores Neuromusculares",
  moduleId: "me",
  examType: "ME",
  level: "R1",
};

const D_JNM = "bnm-juncao-mecanismo";
const D_AG = "bnm-agentes-doses";
const D_MON = "bnm-monitorizacao";
const D_REV = "bnm-reversao";

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
    tema: "Bloqueadores neuromusculares",
    fontes: "SAESP 10ed caps. 22, 53 e 93; Miller 10ed caps. 11, 24 e 39; Stoelting 6ed cap. 12",
    observacoes:
      "Cards originais. As tabelas de dose do Miller não foram extraídas do PDF; as doses vêm do SAESP cap. 53 e do Stoelting. Cards com reviewNotes marcam divergências entre tabela e texto.",
  },
  decks: [
    {
      deckId: D_JNM,
      title: "BNM — Junção neuromuscular e mecanismo",
      description: "Fisiologia da placa motora, receptor nicotínico, margem de segurança e mecanismo despolarizante versus adespolarizante.",
      moduleId: "me",
      themeId: THEME.themeId,
      order: 1,
    },
    {
      deckId: D_AG,
      title: "BNM — Agentes, doses e efeitos",
      description: "Succinilcolina, benzilisoquinolínicos e aminoesteroides: doses, metabolismo, efeitos adversos e interações.",
      moduleId: "me",
      themeId: THEME.themeId,
      order: 2,
    },
    {
      deckId: D_MON,
      title: "BNM — Monitorização neuromuscular",
      description: "TOF, tétano, contagem pós-tetânica, DBS, sequência de bloqueio dos músculos e critérios de recuperação.",
      moduleId: "me",
      themeId: THEME.themeId,
      order: 3,
    },
    {
      deckId: D_REV,
      title: "BNM — Reversão",
      description: "Neostigmina, anticolinérgicos e sugamadex: mecanismo, doses por profundidade de bloqueio e cuidados.",
      moduleId: "me",
      themeId: THEME.themeId,
      order: 4,
    },
  ],
  cards: [
    // ───────────── JUNÇÃO E MECANISMO ─────────────
    card(D_JNM,
      "Qual é a largura aproximada da fenda sináptica na junção neuromuscular?",
      "Cerca de 50 nm",
      "A distância curta permite que a acetilcolina alcance os receptores em menos de um milissegundo.",
      "hard", ["juncao", "anatomia"], SAESP22),

    card(D_JNM,
      "O que é um quantum de acetilcolina?",
      "O conteúdo de uma vesícula sináptica, entre 2.000 e 10.000 moléculas",
      "A liberação espontânea de um quantum gera o potencial de placa em miniatura, de 0,5 a 1 mV, que não se propaga.",
      "hard", ["quantum", "acetilcolina"], SAESP22),

    card(D_JNM,
      "Quantos quanta de acetilcolina são liberados por impulso nervoso?",
      "Cerca de 400 a 500, de forma sincrônica",
      "Essa liberação maciça é parte da margem de segurança da junção neuromuscular.",
      "hard", ["quantum", "juncao"], SAESP22),

    card(D_JNM,
      "Que percentual dos receptores precisa abrir para gerar potencial de ação muscular?",
      "Apenas 5% a 20%",
      "No pico do potencial de placa cerca de 340.000 canais estão abertos — muito além do necessário.",
      "hard", ["margem-de-seguranca", "receptor"], SAESP22),

    card(D_JNM,
      "Em que consiste a margem de segurança da junção neuromuscular?",
      "Excesso de receptores disponíveis somado ao excesso de acetilcolina liberada",
      "Por isso é preciso bloquear cerca de 75% dos receptores antes de aparecer qualquer sinal clínico de fraqueza.",
      "medium", ["margem-de-seguranca"], SAESP22),

    card(D_JNM,
      "Quantas subunidades compõem o receptor nicotínico da placa motora?",
      "Cinco subunidades dispostas em torno de um poro central",
      "No receptor maduro a composição é alfa-1, beta-1, delta e épsilon; a acetilcolina liga-se às duas subunidades alfa.",
      "medium", ["receptor-nicotinico", "estrutura"], SAESP22),

    card(D_JNM,
      "Qual a diferença entre o receptor nicotínico maduro e o imaturo (fetal)?",
      "O imaturo tem subunidade gama no lugar da épsilon",
      "O imaturo tem meia-vida curta, maior tempo de abertura do canal, mais sensibilidade à acetilcolina e resistência aos adespolarizantes.",
      "hard", ["receptor-nicotinico", "imaturo"], SAESP22),

    card(D_JNM,
      "Quantos sítios de ligação para acetilcolina existem em cada receptor nicotínico?",
      "Dois, um em cada subunidade alfa",
      "Basta um antagonista ocupar uma das duas subunidades alfa para impedir a abertura do canal.",
      "medium", ["receptor-nicotinico", "sitio"], SAESP22),

    card(D_JNM,
      "Quais situações causam proliferação (up regulation) de receptores extrajuncionais?",
      "Lesão de neurônio motor, desuso muscular, queimaduras e uso crônico de bloqueador adespolarizante",
      "É o substrato da hipercalemia grave após succinilcolina e da resistência aos adespolarizantes nesses pacientes.",
      "medium", ["up-regulation", "receptor"], SAESP22),

    card(D_JNM,
      "Qual é o mecanismo de ação dos bloqueadores adespolarizantes?",
      "Ocupam uma ou as duas subunidades alfa sem mudar a conformação do receptor",
      "Como não abrem o canal, agem como antagonistas competitivos — o bloqueio é revertido pelo excesso de acetilcolina.",
      "easy", ["adespolarizante", "mecanismo"], SAESP53),

    card(D_JNM,
      "Qual é o mecanismo de ação da succinilcolina?",
      "Age como agonista, causando despolarização mantida da placa motora",
      "Mimetiza a acetilcolina, mas não é hidrolisada pela acetilcolinesterase, mantendo a despolarização e a inexcitabilidade.",
      "easy", ["succinilcolina", "mecanismo"], SAESP53),

    card(D_JNM,
      "Por que ocorre fadiga (fade) ao TOF com adespolarizantes, mas não com succinilcolina?",
      "Os adespolarizantes também bloqueiam o receptor pré-juncional alfa-3-beta-2",
      "A succinilcolina não tem afinidade por esse receptor pré-sináptico, por isso o bloqueio fase I não apresenta fadiga.",
      "hard", ["fade", "pre-juncional"], MILLER11),

    // ───────────── AGENTES E DOSES ─────────────
    card(D_AG,
      "Qual é a DE95 da succinilcolina?",
      "0,5 a 0,6 mg/kg",
      "Os anestésicos voláteis reduzem a DE95 para 0,2 a 0,3 mg/kg, por potencializarem o bloqueio.",
      "medium", ["succinilcolina", "de95"], SAESP53,
      { reviewNotes: "Stoelting cita DE95 de aproximadamente 0,3 mg/kg; SAESP e Miller citam 0,5 a 0,63 mg/kg." }),

    card(D_AG,
      "Em quanto tempo a succinilcolina 1,5 mg/kg produz condições de intubação?",
      "Cerca de 60 segundos",
      "É o menor tempo de latência entre os bloqueadores, motivo de seu uso clássico na indução em sequência rápida.",
      "easy", ["succinilcolina", "inicio"], SAESP53),

    card(D_AG,
      "Por que a succinilcolina não deve ser usada em infusão contínua?",
      "Pelo risco de bloqueio de fase II",
      "A exposição prolongada transforma o bloqueio despolarizante em um padrão com fadiga, semelhante ao adespolarizante.",
      "medium", ["succinilcolina", "fase-ii"], SAESP53),

    card(D_AG,
      "Que proporção da dose injetada de succinilcolina chega à junção neuromuscular?",
      "Apenas cerca de 10%",
      "O restante é hidrolisado pela colinesterase plasmática antes de alcançar a placa motora.",
      "hard", ["succinilcolina", "farmacocinetica"], SAESP53),

    card(D_AG,
      "Quanto a succinilcolina eleva o potássio sérico?",
      "0,5 a 1 mEq/L",
      "Elevações maciças com parada cardíaca são raras, mas ocorrem em pacientes com proliferação de receptores extrajuncionais.",
      "easy", ["succinilcolina", "hipercalemia"], SAESP53),

    card(D_AG,
      "Quais condições contraindicam a succinilcolina pelo risco de hipercalemia grave?",
      "Lesão de neurônio motor, denervação, atrofia, queimaduras e distrofias musculares",
      "A vulnerabilidade começa em poucos dias após a lesão e persiste por vários meses.",
      "medium", ["succinilcolina", "contraindicacao"], SAESP53),

    card(D_AG,
      "Qual é a incidência de mialgia após succinilcolina?",
      "30% a 85% dos casos",
      "Predomina em pescoço, dorso e abdome. A pré-curarização tem efeito modesto sobre essa complicação.",
      "medium", ["succinilcolina", "mialgia"], SAESP53),

    card(D_AG,
      "Por que a succinilcolina causa bradicardia, especialmente na segunda dose?",
      "Por estímulo de receptores muscarínicos cardíacos",
      "É típica quando a segunda dose é dada cerca de 5 minutos após a primeira. Depois pode haver taquicardia por estímulo ganglionar.",
      "medium", ["succinilcolina", "bradicardia"], SAESP53),

    card(D_AG,
      "Acima de que pressão intragástrica o esfíncter esofágico se torna incompetente?",
      "20 cmH2O",
      "É o limiar que fundamenta a preocupação com a insuflação gástrica durante a ventilação sob máscara.",
      "hard", ["pressao-intragastrica", "aspiracao"], SAESP53),

    card(D_AG,
      "Como se comporta a pressão intraocular após succinilcolina?",
      "Sobe em 1 minuto, com pico em 2 a 4 minutos, cedendo em cerca de 6 minutos",
      "Tosse e vômito elevam a PIO três a quatro vezes mais que a succinilcolina, o que relativiza a contraindicação clássica.",
      "hard", ["succinilcolina", "pio"], MILLER11),

    card(D_AG,
      "Como se caracteriza o bloqueio fase I da succinilcolina?",
      "Razão T4/T1 maior que 0,7, sem facilitação pós-tetânica e potencializado por anticolinesterásico",
      "É o bloqueio despolarizante puro: dar neostigmina piora, em vez de reverter.",
      "hard", ["fase-i", "succinilcolina"], SAESP53),

    card(D_AG,
      "Como se caracteriza o bloqueio fase II da succinilcolina?",
      "Fadiga ao TOF (T4/T1 menor que 0,3), facilitação pós-tetânica e possibilidade de antagonismo",
      "Também chamado de bloqueio dual ou por dessensibilização, decorre de exposição prolongada ou de doses repetidas.",
      "hard", ["fase-ii", "succinilcolina"], SAESP53),

    card(D_AG,
      "Qual a frequência do heterozigoto e do homozigoto para colinesterase atípica?",
      "Heterozigoto cerca de 1:480 e homozigoto cerca de 1:3.200",
      "No heterozigoto a recuperação leva 15 a 30 minutos; no homozigoto, de 2,5 a 3 horas.",
      "hard", ["colinesterase-atipica", "genetica"], SAESP53),

    card(D_AG,
      "O que é o número de dibucaína e o que ele avalia?",
      "Inibição da colinesterase pela dibucaína; avalia a qualidade, não a quantidade da enzima",
      "Cerca de 80 no indivíduo normal, 40 a 60 no heterozigoto e cerca de 20 no homozigoto atípico.",
      "hard", ["numero-de-dibucaina"], SAESP53),

    card(D_AG,
      "Na hepatopatia, o número de dibucaína está alterado?",
      "Não; permanece normal",
      "A hepatopatia reduz a quantidade de enzima, mas não sua qualidade — o número de dibucaína só detecta a variante atípica.",
      "hard", ["numero-de-dibucaina", "hepatopatia"], SAESP53),

    card(D_AG,
      "Que condições reduzem a atividade da colinesterase plasmática?",
      "Gravidez, hepatopatia, hipotireoidismo, câncer, organofosforados e quimioterápicos",
      "Prolongam o efeito da succinilcolina e do mivacúrio, mas geralmente de forma modesta.",
      "medium", ["colinesterase", "interacao"], SAESP53),

    card(D_AG,
      "Qual é a DE95 do atracúrio e sua duração clínica?",
      "DE95 de 0,2 mg/kg; com 2 vezes a DE95 a duração é de 30 a 40 minutos",
      "Duração intermediária. A infusão contínua usual é de 7 a 10 microgramas/kg/min.",
      "medium", ["atracurio", "de95", "dose"], SAESP53),

    card(D_AG,
      "Qual é a DE95 do cisatracúrio?",
      "0,05 mg/kg",
      "É cerca de 4 vezes mais potente que o atracúrio, com menor liberação de histamina e menos laudanosina.",
      "medium", ["cisatracurio", "de95"], SAESP53),

    card(D_AG,
      "O que é a degradação de Hofmann?",
      "Degradação espontânea, não enzimática, facilitada por pH alcalino e temperatura elevada",
      "Dispensa qualquer órgão ou substrato biológico, tornando atracúrio e cisatracúrio úteis na insuficiência renal e hepática.",
      "medium", ["hofmann", "metabolismo"], SAESP53),

    card(D_AG,
      "Quais são os metabólitos da degradação de Hofmann?",
      "Laudanosina e um monoacrilato",
      "A laudanosina é convulsivante em concentrações muito altas, alcançadas apenas em modelos animais.",
      "medium", ["laudanosina", "hofmann"], SAESP53),

    card(D_AG,
      "Como a hipotermia altera a duração do atracúrio?",
      "Prolonga o bloqueio, por reduzir a degradação de Hofmann",
      "A alcalose acelera e a acidose retarda a via de Hofmann, mas os efeitos opostos sobre a hidrólise éster tendem a se compensar.",
      "hard", ["atracurio", "hipotermia"], SAESP53),

    card(D_AG,
      "Por que o cisatracúrio gera menos laudanosina que o atracúrio?",
      "É cerca de 4 vezes mais potente, logo a dose em massa é bem menor",
      "As concentrações plasmáticas de laudanosina ficam cerca de 5 vezes menores.",
      "hard", ["cisatracurio", "laudanosina"], SAESP53),

    card(D_AG,
      "Qual é a dose de intubação do rocurônio e seu tempo de início?",
      "0,6 mg/kg (2 vezes a DE95), com condições de intubação em cerca de 60 segundos",
      "Em sequência rápida usam-se 0,9 a 1,2 mg/kg, encurtando ainda mais a latência ao custo de duração maior.",
      "easy", ["rocuronio", "dose", "inducao"], SAESP53),

    card(D_AG,
      "Por que o rocurônio tem início de ação tão rápido?",
      "Por sua baixa potência, 6 a 12 vezes menor que a do vecurônio",
      "Menor potência exige mais moléculas por dose, e o maior gradiente de concentração acelera a chegada à junção.",
      "hard", ["rocuronio", "potencia", "inicio"], SAESP53),

    card(D_AG,
      "Como o rocurônio é eliminado?",
      "Predominantemente pela bile, de forma inalterada; cerca de 30% pela via renal",
      "Não tem metabólito ativo conhecido, ao contrário do vecurônio e do pancurônio.",
      "medium", ["rocuronio", "eliminacao"], SAESP53),

    card(D_AG,
      "Qual é a dose de intubação do vecurônio?",
      "0,1 mg/kg (2 vezes a DE95), com início em cerca de 3 minutos",
      "Cerca de 40% é excretado na bile e 30% na urina; o metabólito 3-desacetil tem cerca de 60% da potência.",
      "medium", ["vecuronio", "dose"], SAESP53),

    card(D_AG,
      "Como a insuficiência renal afeta o vecurônio?",
      "Reduz o clearance em cerca de 40% e prolonga a duração em cerca de 80%",
      "O metabólito ativo também se acumula, o que pode causar bloqueio residual prolongado.",
      "hard", ["vecuronio", "insuficiencia-renal"], SAESP53),

    card(D_AG,
      "Qual é a DE95 do pancurônio e sua duração?",
      "DE95 de 0,06 mg/kg, com duração de 60 a 90 minutos",
      "É de longa duração e 80% é eliminado inalterado pelos rins, o que limita seu uso na insuficiência renal.",
      "medium", ["pancuronio", "de95"], SAESP53),

    card(D_AG,
      "Como se classificam os bloqueadores adespolarizantes por duração de ação?",
      "Curta 8 a 20 min, intermediária 20 a 50 min e longa acima de 50 min",
      "A duração clínica é definida como o tempo até a recuperação de 25% da resposta-controle, ou seja, o retorno de T3 ao TOF.",
      "medium", ["classificacao", "duracao"], SAESP53),

    card(D_AG,
      "Que condições dificultam a reversão do bloqueio neuromuscular?",
      "Acidose respiratória, hipotermia, hipocalemia, hipocalcemia e hipermagnesemia",
      "Também aminoglicosídeos, anestésicos locais e furosemida potencializam o bloqueio e dificultam o antagonismo.",
      "medium", ["interacao", "reversao"], SAESP53),

    card(D_AG,
      "Como o magnésio interfere no bloqueio neuromuscular?",
      "Inibe canais de cálcio pré-sinápticos, reduzindo a liberação de acetilcolina",
      "Reduz em cerca de 25% a DE50 do vecurônio, com efeito pré e pós-sináptico — relevante na pré-eclâmpsia.",
      "hard", ["magnesio", "interacao"], MILLER24),

    card(D_AG,
      "Por que os anticolinesterásicos prolongam o efeito da succinilcolina e do mivacúrio?",
      "Porque inibem também a colinesterase plasmática, que é a via de metabolismo desses fármacos",
      "Por isso o edrofônio, que inibe menos a enzima plasmática, é o antagonista de escolha para o mivacúrio.",
      "hard", ["anticolinesterasico", "mivacurio", "interacao"], SAESP53),

    // ───────────── MONITORIZAÇÃO ─────────────
    card(D_MON,
      "Qual é a corrente supramáxima habitual ao estimular o nervo ulnar no punho?",
      "Em geral não ultrapassa 50 mA",
      "O monitor ideal fornece corrente constante de 60 a 80 mA, com duração de estímulo de 0,1 a 0,3 ms.",
      "hard", ["neuroestimulacao", "corrente"], SAESP93),

    card(D_MON,
      "Como é composto o estímulo em sequência de quatro (TOF)?",
      "Quatro estímulos supramáximos a cada 0,5 segundo, ou seja, a 2 Hz durante 2 segundos",
      "As séries devem ser repetidas com intervalo de pelo menos 10 a 15 segundos para não haver fadiga artificial.",
      "easy", ["tof", "estimulo"], SAESP93),

    card(D_MON,
      "A partir de que ocupação de receptores a razão do TOF começa a cair?",
      "Quando mais de 70% a 75% dos receptores estão ocupados",
      "É a tradução da margem de segurança: só há sinal de bloqueio depois de um grau elevado de ocupação.",
      "hard", ["tof", "margem-de-seguranca"], SAESP93),

    card(D_MON,
      "Qual é a razão T4/T1 considerada adequada para evitar bloqueio residual?",
      "Igual ou maior que 0,9",
      "Abaixo desse valor persiste risco de disfunção faríngea, aspiração e obstrução de via aérea, mesmo sem sintomas.",
      "easy", ["tof", "bloqueio-residual"], SAESP93),

    card(D_MON,
      "O desaparecimento de T4 no TOF corresponde a que grau de bloqueio?",
      "T1 em cerca de 70% do controle, ou seja, razão T4/T1 de aproximadamente 0,7",
      "A contagem de respostas permite estimar a profundidade: 1 a 3 respostas indicam bloqueio de 90% a 75%.",
      "hard", ["tof", "interpretacao"], SAESP93),

    card(D_MON,
      "Como se comporta a razão T4/T1 no bloqueio despolarizante puro?",
      "Mantém-se entre 0,9 e 1,0, sem fadiga",
      "Todas as quatro respostas diminuem igualmente. O aparecimento de fadiga indica evolução para bloqueio fase II.",
      "medium", ["tof", "despolarizante"], SAESP93),

    card(D_MON,
      "Como é feita a contagem pós-tetânica (CPT)?",
      "Tétano de 50 Hz por 5 segundos, pausa de 3 segundos e então estímulos simples a 1 Hz",
      "Só é válida em bloqueio profundo, quando não há resposta ao TOF, e não deve ser repetida antes de 3 minutos.",
      "hard", ["cpt", "bloqueio-profundo"], SAESP93),

    card(D_MON,
      "Por que a contagem pós-tetânica não deve ser repetida antes de 3 minutos?",
      "A facilitação pós-tetânica altera a resposta e falseia a avaliação seguinte",
      "A facilitação decorre da mobilização de acetilcolina pelo tétano e dura cerca de 60 segundos.",
      "hard", ["cpt", "facilitacao"], SAESP93),

    card(D_MON,
      "Como se define bloqueio neuromuscular profundo?",
      "Ausência de resposta ao TOF, com 1 a 2 respostas na contagem pós-tetânica",
      "No bloqueio completo não há resposta nem ao TOF nem à contagem pós-tetânica.",
      "medium", ["profundidade", "cpt"], SAESP93),

    card(D_MON,
      "O que é o estímulo de dupla salva (DBS)?",
      "Duas rajadas de 50 Hz com três impulsos cada, separadas por 750 ms",
      "Facilita a percepção tátil da fadiga em comparação com o TOF, mas não detecta fadiga quando T4/T1 já é 0,6 ou mais.",
      "hard", ["dbs", "monitorizacao"], SAESP93),

    card(D_MON,
      "Até que razão T4/T1 a avaliação tátil ou visual consegue detectar fadiga?",
      "Somente abaixo de 0,40 a 0,60",
      "É a razão pela qual a avaliação subjetiva não descarta bloqueio residual e a monitorização quantitativa é recomendada.",
      "medium", ["monitorizacao", "avaliacao-tatil"], SAESP93),

    card(D_MON,
      "Qual é o músculo mais resistente aos bloqueadores neuromusculares?",
      "O diafragma",
      "É seguido pelo corrugador do supercílio e pelos adutores da laringe; a musculatura faríngea é a mais sensível.",
      "medium", ["musculos", "sequencia"], SAESP93),

    card(D_MON,
      "Qual músculo deve ser monitorizado para escolher o momento da intubação?",
      "O corrugador do supercílio, porque reflete os adutores da laringe",
      "O adutor do polegar é mais sensível e ainda estaria bloqueado quando a laringe já permite a intubação.",
      "hard", ["corrugador", "intubacao"], SAESP93),

    card(D_MON,
      "Qual músculo deve ser monitorizado para decidir a extubação e por quê?",
      "O adutor do polegar, porque a faringe se recupera depois dele",
      "Confirmar a recuperação plena do adutor do polegar é o que garante segurança faríngea na extubação.",
      "medium", ["adutor-do-polegar", "extubacao"], SAESP93),

    card(D_MON,
      "Os testes clínicos de beira-leito são confiáveis para avaliar bloqueio residual?",
      "Não; perderam credibilidade e devem ser abandonados como critério isolado",
      "Levantar a cabeça por 5 segundos e segurar objeto entre os dentes não excluem razão T4/T1 abaixo de 0,9.",
      "medium", ["bloqueio-residual", "testes-clinicos"], SAESP93),

    card(D_MON,
      "Por que a aceleromiografia exige normalização da razão do TOF?",
      "Porque o valor-controle costuma ser maior que 1,00",
      "Se o controle é 1,30, uma leitura de 0,9 corresponde na verdade a 0,69 — bloqueio residual não reconhecido.",
      "hard", ["aceleromiografia", "normalizacao"], SAESP93),

    card(D_MON,
      "Que proporção de pacientes ainda tem TOF abaixo de 0,9 duas horas após dose única de adespolarizante?",
      "Cerca de 37%",
      "O dado clássico de Debaene mostra que o tempo decorrido não substitui a medida objetiva.",
      "hard", ["bloqueio-residual", "evidencia"], MILLER24),

    card(D_MON,
      "Qual nervo e qual músculo as diretrizes atuais recomendam monitorizar?",
      "Estimular o nervo ulnar e monitorizar quantitativamente o adutor do polegar",
      "Recomendação das diretrizes europeias e da ASA, com grau de recomendação forte.",
      "medium", ["diretrizes", "monitorizacao"], SAESP53),

    // ───────────── REVERSÃO ─────────────
    card(D_REV,
      "Qual é o mecanismo de ação da neostigmina?",
      "Inibe a acetilcolinesterase, aumentando a acetilcolina disponível na fenda",
      "O excesso de acetilcolina compete com o bloqueador pelo receptor, deslocando-o do sítio de ligação.",
      "easy", ["neostigmina", "mecanismo"], SAESP53),

    card(D_REV,
      "Por que a neostigmina tem efeito teto?",
      "Porque satura a acetilcolinesterase; acima de 0,07 mg/kg não há efeito adicional",
      "O platô experimental corresponde a uma razão T4/T1 de cerca de 0,6, insuficiente como alvo de recuperação.",
      "medium", ["neostigmina", "efeito-teto"], SAESP53),

    card(D_REV,
      "A neostigmina reverte bloqueio neuromuscular profundo?",
      "Não; é ineficaz e a reversão deve ser adiada até haver sinais de recuperação espontânea",
      "Em bloqueio profundo a alternativa é o sugamadex, que atua independentemente da profundidade.",
      "medium", ["neostigmina", "bloqueio-profundo"], SAESP53),

    card(D_REV,
      "Por que a neostigmina exige anticolinérgico associado?",
      "Para prevenir os efeitos muscarínicos do excesso de acetilcolina",
      "Bradicardia, ritmo nodal, broncoconstrição, aumento de secreções e náusea seriam a consequência sem a associação.",
      "easy", ["neostigmina", "anticolinergico"], SAESP53),

    card(D_REV,
      "Qual anticolinérgico tem início mais rápido, atropina ou glicopirrolato?",
      "A atropina, com cerca de 1 minuto contra 2 a 3 minutos do glicopirrolato",
      "Por isso a atropina combina melhor com o edrofônio e o glicopirrolato com a neostigmina, cujo início é mais lento.",
      "medium", ["atropina", "glicopirrolato"], SAESP53),

    card(D_REV,
      "Qual é o tempo de início da neostigmina, do edrofônio e da piridostigmina?",
      "Edrofônio 1 a 2 min, neostigmina 7 a 11 min e piridostigmina cerca de 16 min",
      "A neostigmina é cerca de 5 vezes mais potente que a piridostigmina e 12 a 35 vezes mais que o edrofônio.",
      "hard", ["anticolinesterasicos", "inicio"], SAESP53),

    card(D_REV,
      "O que acontece se a neostigmina for dada com o bloqueio já revertido?",
      "Pode causar fraqueza por dessensibilização dos receptores pós-sinápticos",
      "Com TOF já em 1,0, a neostigmina aumenta a colapsabilidade da via aérea superior e prejudica o genioglosso.",
      "hard", ["neostigmina", "fraqueza-paradoxal"], MILLER24),

    card(D_REV,
      "Qual é a dose de neostigmina recomendada com quatro respostas ao TOF sem fadiga?",
      "Dose baixa, de 15 a 30 microgramas/kg",
      "As doses clássicas de 40 a 70 microgramas/kg destinam-se a bloqueios mais profundos e hoje são consideradas excessivas nesse cenário.",
      "hard", ["neostigmina", "dose"], SAESP53,
      { reviewNotes: "Divergência interna do SAESP: o texto do cap. 53 recomenda 40 a 70 mcg/kg e a Tabela 53.8 recomenda 15 a 50 mcg/kg." }),

    card(D_REV,
      "A que classe química pertence o sugamadex?",
      "É uma gama-ciclodextrina modificada, com oito unidades de glicopiranose",
      "A cavidade lipofílica de cerca de 9,5 angstroms encaixa o anel esteroide do rocurônio.",
      "medium", ["sugamadex", "estrutura"], SAESP53),

    card(D_REV,
      "Qual é o mecanismo de ação do sugamadex?",
      "Encapsula o bloqueador no plasma formando complexo 1:1, criando gradiente que o retira da junção",
      "Não atua na acetilcolinesterase, por isso não tem efeitos muscarínicos nem exige anticolinérgico associado.",
      "medium", ["sugamadex", "mecanismo"], SAESP53),

    card(D_REV,
      "Qual é a dose de sugamadex para bloqueio moderado (duas respostas ao TOF)?",
      "2 mg/kg",
      "A recuperação da razão T4/T1 para 0,9 ocorre em cerca de 1,4 a 2 minutos com rocurônio.",
      "easy", ["sugamadex", "dose", "bloqueio-moderado"], SAESP53),

    card(D_REV,
      "Qual é a dose de sugamadex para bloqueio profundo?",
      "4 mg/kg, quando há 1 a 2 respostas na contagem pós-tetânica",
      "A reversão ocorre em cerca de 3 minutos, contra mais de 50 minutos com neostigmina 70 microgramas/kg.",
      "medium", ["sugamadex", "dose", "bloqueio-profundo"], SAESP53),

    card(D_REV,
      "Qual é a dose de sugamadex na situação “não intubo, não ventilo”?",
      "16 mg/kg",
      "Após rocurônio 1,2 mg/kg, permite recuperação em cerca de 6 minutos — mais rápido que a recuperação espontânea da succinilcolina.",
      "medium", ["sugamadex", "dose", "resgate"], SAESP53),

    card(D_REV,
      "O sugamadex reverte bloqueio por cisatracúrio ou succinilcolina?",
      "Não; atua apenas sobre aminoesteroides, com afinidade rocurônio maior que vecurônio",
      "A afinidade pelo rocurônio é milhares de vezes maior que pelo atracúrio, tornando-o ineficaz nos benzilisoquinolínicos.",
      "medium", ["sugamadex", "especificidade"], SAESP53),

    card(D_REV,
      "Como o sugamadex é eliminado?",
      "Sem metabolismo, com cerca de 80% eliminado inalterado na urina em 24 horas",
      "Seu uso é questionado quando o clearance de creatinina é menor que 30 mL/min.",
      "medium", ["sugamadex", "eliminacao", "renal"], SAESP53),

    card(D_REV,
      "Que dose de rocurônio usar se for preciso rebloquear 5 minutos após o sugamadex?",
      "1,2 mg/kg (4 vezes a DE95)",
      "Após 4 horas, a dose habitual de 0,6 mg/kg volta a ser suficiente. O bloqueio precoce instala-se em cerca de 4 minutos e dura pouco.",
      "hard", ["sugamadex", "rebloqueio", "rocuronio"], SAESP53),

    card(D_REV,
      "Qual é a interação do sugamadex com contraceptivos hormonais?",
      "Encapsula o hormônio, com efeito equivalente ao esquecimento de uma dose",
      "Orienta-se método contraceptivo alternativo nos dias seguintes. Também complexa cortisona, atropina e verapamil.",
      "medium", ["sugamadex", "contraceptivo", "interacao"], SAESP53,
      { reviewNotes: "Stoelting recomenda método contraceptivo alternativo por 7 dias; SAESP apenas equipara ao esquecimento de uma dose." }),

    card(D_REV,
      "Qual é a única contraindicação absoluta ao sugamadex?",
      "Alergia ao próprio fármaco",
      "Casos de anafilaxia foram descritos em minutos após doses de 1,9 a 4 mg/kg, embora sejam raros.",
      "medium", ["sugamadex", "contraindicacao", "anafilaxia"], SAESP53),

    card(D_REV,
      "Que dose baixa de sugamadex pode causar recurarização e por quê?",
      "0,5 mg/kg, por encapsulamento insuficiente com redistribuição do bloqueador",
      "O complexo incompleto libera o bloqueador de volta à junção, com retorno do bloqueio após aparente reversão.",
      "hard", ["sugamadex", "recurarizacao"], SAESP53),

    card(D_REV,
      "Quando se pode iniciar a reversão com neostigmina, segundo o Miller?",
      "Somente quando as quatro respostas ao TOF já estão presentes",
      "Iniciar antes disso resulta em reversão incompleta e bloqueio residual na sala de recuperação.",
      "medium", ["neostigmina", "momento", "reversao"], MILLER39),
  ],
};
