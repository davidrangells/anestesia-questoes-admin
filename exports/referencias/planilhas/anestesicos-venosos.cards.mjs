// Flashcards originais — Anestésicos venosos (hipnóticos).
// Conteúdo redigido a partir do mapa de conceitos dos capítulos citados
// (nada copiado/traduzido literalmente). Números conferidos no texto extraído.
//
// Gerar planilha:
//   node scripts/build-flashcards-xlsx.mjs \
//     --in=exports/referencias/planilhas/anestesicos-venosos.cards.mjs \
//     --out=exports/referencias/planilhas/flashcards_anestesicos-venosos_2026-09-08.xlsx

const SAESP43 = "Tratado de Anestesiologia SAESP, 10ª ed. — cap. 43, Benzodiazepínicos e Barbitúricos";
const SAESP44 = "Tratado de Anestesiologia SAESP, 10ª ed. — cap. 44, Hipnóticos: Propofol, Etomidato, Cetamina e Alfa 2 Agonistas";

const THEME = {
  themeId: "anestesicos-venosos",
  themeName: "Anestésicos Venosos",
  moduleId: "me",
  examType: "ME",
  level: "R1",
};

const D_PROP = "venosos-propofol";
const D_BARB = "venosos-barbituricos-benzodiazepinicos";
const D_ETO = "venosos-etomidato-cetamina";
const D_A2 = "venosos-alfa2-agonistas";

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
    tema: "Anestésicos venosos (hipnóticos)",
    fontes: "SAESP 10ed caps. 43 e 44",
    observacoes:
      "Cards originais redigidos a partir do mapa de conceitos dos capítulos. Um card tem reviewNotes por divergência interna do próprio livro (dose do tiopental).",
  },
  decks: [
    {
      deckId: D_PROP,
      title: "Venosos — Propofol",
      description: "Mecanismo, doses, farmacocinética, efeitos sistêmicos, dor à injeção e síndrome da infusão do propofol.",
      moduleId: "me",
      themeId: THEME.themeId,
      order: 1,
    },
    {
      deckId: D_BARB,
      title: "Venosos — Barbitúricos e benzodiazepínicos",
      description: "Tiopental e demais barbitúricos, midazolam/diazepam/lorazepam, flumazenil e remimazolam.",
      moduleId: "me",
      themeId: THEME.themeId,
      order: 2,
    },
    {
      deckId: D_ETO,
      title: "Venosos — Etomidato e cetamina",
      description: "Etomidato (estabilidade hemodinâmica, supressão adrenal) e cetamina (NMDA, doses, reações de emergência).",
      moduleId: "me",
      themeId: THEME.themeId,
      order: 3,
    },
    {
      deckId: D_A2,
      title: "Venosos — Alfa-2 agonistas",
      description: "Clonidina e dexmedetomidina: seletividade, farmacocinética, doses e perfil hemodinâmico bifásico.",
      moduleId: "me",
      themeId: THEME.themeId,
      order: 4,
    },
  ],
  cards: [
    // ───────────── PROPOFOL ─────────────
    card(D_PROP,
      "Qual é o principal mecanismo de ação do propofol?",
      "Potencialização do receptor GABA-A, aumentando a condutância ao cloro",
      "Em concentrações altas também dessensibiliza o receptor. Atua ainda em receptores glicinérgicos e glutamatérgicos.",
      "easy", ["propofol", "mecanismo", "gaba"], SAESP44),

    card(D_PROP,
      "Qual é a dose de indução do propofol em adulto?",
      "1 a 2,5 mg/kg IV",
      "Cerca de 1 mg/kg quando há pré-medicação e até 1,75 mg/kg sem ela. Reduzir em idosos e hipovolêmicos.",
      "easy", ["propofol", "dose", "inducao"], SAESP44),

    card(D_PROP,
      "Qual é a DE95 do propofol para perda do reflexo palpebral?",
      "2,8 mg/kg sem pré-medicação e 2,0 mg/kg com pré-medicação",
      "A pré-medicação reduz em cerca de 30% a dose necessária, o que explica a faixa ampla recomendada para indução.",
      "hard", ["propofol", "de95", "dose"], SAESP44),

    card(D_PROP,
      "Como se ajusta a dose de propofol em crianças?",
      "Aumenta-se: indução ~50% maior e manutenção 25 a 50% maior",
      "Crianças têm volume de distribuição central e clearance maiores em relação ao peso, exigindo doses proporcionalmente maiores.",
      "medium", ["propofol", "pediatria", "dose"], SAESP44),

    card(D_PROP,
      "O que o clearance do propofol (3 a 4 L/min/70 kg) revela sobre seu metabolismo?",
      "Que há metabolismo extra-hepático, pois excede o fluxo sanguíneo hepático",
      "O fluxo hepático é de cerca de 1.500 mL/min. A depuração renal responde por até 30% da eliminação total.",
      "hard", ["propofol", "clearance", "metabolismo"], SAESP44),

    card(D_PROP,
      "Quanto do propofol é eliminado de forma inalterada?",
      "Menos de 1% na urina e cerca de 2% nas fezes",
      "Praticamente todo o fármaco é biotransformado antes da excreção, sobretudo por glicuronidação.",
      "medium", ["propofol", "eliminacao"], SAESP44),

    card(D_PROP,
      "Quais são as meias-vidas de distribuição e eliminação do propofol?",
      "Distribuição rápida 1–8 min, lenta 30–70 min; eliminação beta 4–24 h",
      "A ação curta após bolus decorre da redistribuição rápida, não da eliminação terminal.",
      "medium", ["propofol", "farmacocinetica"], SAESP44),

    card(D_PROP,
      "Qual é a meia-vida de equilíbrio (t½ke0) do propofol?",
      "Cerca de 2,5 minutos",
      "É o tempo para equilíbrio entre plasma e biofase. Explica por que o pico de efeito não coincide com o pico plasmático.",
      "hard", ["propofol", "ke0", "biofase"], SAESP44),

    card(D_PROP,
      "Qual é a queda de pressão arterial esperada após indução com propofol?",
      "15% a 30%, de forma dose-dependente",
      "Com 2 mg/kg a pressão sistólica cai cerca de 30%. O efeito é maior em hipovolêmicos, idosos e cardiopatas.",
      "easy", ["propofol", "hipotensao", "hemodinamica"], SAESP44),

    card(D_PROP,
      "Qual é o principal mecanismo da hipotensão causada pelo propofol?",
      "Queda da resistência vascular sistêmica, que pode chegar a 50%",
      "O pico da vasodilatação ocorre por volta do quinto minuto após a indução. Há também depressão miocárdica associada.",
      "medium", ["propofol", "rvs", "hemodinamica"], SAESP44),

    card(D_PROP,
      "Qual é a incidência de apneia após indução com propofol?",
      "30% a 60% em pacientes não pré-medicados",
      "Com opioide associado, a apneia é praticamente universal. Sempre ter via aérea e ventilação preparadas.",
      "easy", ["propofol", "apneia", "respiratorio"], SAESP44),

    card(D_PROP,
      "Quanto o propofol reduz a resposta ventilatória ao CO2?",
      "40% a 60%",
      "A depressão é dose-dependente e se soma à dos opioides, um dos motivos do risco em sedação sem monitorização.",
      "medium", ["propofol", "respiratorio", "co2"], SAESP44),

    card(D_PROP,
      "Por que o propofol tem bom perfil no paciente asmático?",
      "Promove broncodilatação e atenua o reflexo vagal das vias aéreas",
      "Reduz o risco de broncoespasmo à intubação, ao contrário do tiopental.",
      "medium", ["propofol", "asma", "broncodilatacao"], SAESP44),

    card(D_PROP,
      "Quais são os efeitos do propofol sobre o sistema nervoso central?",
      "Reduz fluxo sanguíneo cerebral, PIC e CMRO2, com aumento da resistência vascular cerebral",
      "Perfil favorável em neuroanestesia, desde que a pressão de perfusão cerebral seja preservada (cuidado com a hipotensão).",
      "medium", ["propofol", "fsc", "pic", "neuroanestesia"], SAESP44),

    card(D_PROP,
      "Os movimentos excitatórios observados na indução com propofol são convulsões?",
      "Não; decorrem de ativação extrapiramidal subcortical",
      "São mioclonias e movimentos distônicos autolimitados, sem correlato epileptiforme no EEG.",
      "medium", ["propofol", "mioclonia", "excitatorio"], SAESP44),

    card(D_PROP,
      "Qual é o efeito do propofol sobre a pressão intraocular?",
      "Reduz a PIO",
      "Vantajoso em cirurgia oftálmica e em ferimento ocular aberto, ao contrário da succinilcolina e da cetamina.",
      "easy", ["propofol", "pio", "oftalmologia"], SAESP44),

    card(D_PROP,
      "Qual é a incidência de dor à injeção do propofol?",
      "26% a 90%",
      "É um dos efeitos adversos mais frequentes, relacionado à fração aquosa livre do fármaco na emulsão.",
      "easy", ["propofol", "dor-a-injecao"], SAESP44),

    card(D_PROP,
      "Como prevenir a dor à injeção do propofol?",
      "Lidocaína 0,1 a 0,5 mg/kg IV antes da injeção",
      "Também ajudam usar veia calibrada e injeção mais lenta. Formulações com maior fração lipídica reduzem o problema.",
      "easy", ["propofol", "lidocaina", "dor-a-injecao"], SAESP44),

    card(D_PROP,
      "O propofol causa liberação significativa de histamina?",
      "Não; não eleva de forma relevante histamina, IgE ou complemento C3",
      "As reações anafilactoides descritas são raras e geralmente atribuídas a outros componentes ou fármacos associados.",
      "medium", ["propofol", "histamina", "alergia"], SAESP44),

    card(D_PROP,
      "Em que dose e por quanto tempo de infusão a síndrome da infusão do propofol costuma ocorrer?",
      "Infusão maior ou igual a 4 mg/kg/h por 48 horas ou mais",
      "Há relatos com apenas 3 horas de infusão, então o tempo isolado não afasta o diagnóstico.",
      "hard", ["propofol", "sindrome-da-infusao"], SAESP44),

    card(D_PROP,
      "Quais são as manifestações da síndrome da infusão do propofol?",
      "Bradicardia refratária até assistolia, acidose metabólica, rabdomiólise e hepatomegalia",
      "É rara mas de alta letalidade. O tratamento é suspender o propofol e dar suporte, incluindo diálise se necessário.",
      "hard", ["propofol", "sindrome-da-infusao"], SAESP44),

    card(D_PROP,
      "Qual sinal laboratorial pode anteceder a síndrome da infusão do propofol?",
      "Lipemia (plasma lipêmico)",
      "A hiperlipidemia costuma aparecer antes da acidose e da bradicardia, servindo como alerta precoce em infusões prolongadas.",
      "hard", ["propofol", "sindrome-da-infusao", "lipemia"], SAESP44),

    card(D_PROP,
      "Qual é a composição da emulsão do propofol?",
      "Óleo de soja 10%, glicerol 2,25% e fosfatídeo de ovo 1,2%",
      "O veículo lipídico explica a dor à injeção, o risco de contaminação bacteriana e a hiperlipidemia no uso prolongado.",
      "medium", ["propofol", "formulacao"], SAESP44),

    card(D_PROP,
      "Por quanto tempo o propofol pode ser usado após a abertura do frasco?",
      "Até 6 horas",
      "A emulsão lipídica favorece proliferação bacteriana, por isso o preparo deve ser asséptico e a seringa identificada.",
      "easy", ["propofol", "contaminacao", "seguranca"], SAESP44),

    card(D_PROP,
      "Qual efeito adverso é característico do fospropofol após o bolus?",
      "Parestesias e prurido perineal",
      "É um pró-fármaco hidrossolúvel do propofol, aprovado pelo FDA em 2008, sem a dor à injeção da emulsão lipídica.",
      "hard", ["fospropofol", "efeito-adverso"], SAESP44),

    // ───────────── BARBITÚRICOS ─────────────
    card(D_BARB,
      "Qual é a dose de indução do tiopental?",
      "3 a 4 mg/kg IV",
      "O próprio capítulo cita 4 a 5 mg/kg como faixa usual em outro trecho; considere 3 a 5 mg/kg, reduzindo em idosos e hipovolêmicos.",
      "easy", ["tiopental", "dose", "inducao"], SAESP43,
      { reviewNotes: "Divergência interna do SAESP: Tabela 43.3 traz 3-4 mg/kg e o texto de farmacocinética cita 4-5 mg/kg." }),

    card(D_BARB,
      "Qual é o início e a duração de ação do tiopental?",
      "Início em 30 a 40 segundos; duração de 5 a 8 minutos",
      "O início rápido decorre da alta lipossolubilidade e da fração não ionizada que atravessa a barreira hematoencefálica.",
      "easy", ["tiopental", "inicio", "duracao"], SAESP43),

    card(D_BARB,
      "Por que o tiopental tem ação curta apesar da meia-vida de eliminação longa?",
      "Porque o despertar depende da redistribuição, não da eliminação (t½ de 7 a 17 h)",
      "Doses repetidas saturam os tecidos de redistribuição e prolongam muito o despertar — efeito cumulativo.",
      "medium", ["tiopental", "redistribuicao", "farmacocinetica"], SAESP43),

    card(D_BARB,
      "O que os barbitúricos fazem no canal de cloreto do receptor GABA-A?",
      "Prolongam o tempo de abertura do canal, sem aumentar a condutância nem a frequência",
      "Atuam em sítio alostérico distinto do dos benzodiazepínicos, o que explica a ausência de teto de efeito.",
      "medium", ["barbituricos", "gaba", "mecanismo"], SAESP43),

    card(D_BARB,
      "O que ocorre com o receptor GABA-A sob doses altas de barbitúrico?",
      "O canal de cloreto é ativado mesmo na ausência de GABA",
      "Essa ação direta (gabamimética) explica a depressão profunda do SNC e a ausência de dose-teto dos barbitúricos.",
      "hard", ["barbituricos", "gaba", "mecanismo"], SAESP43),

    card(D_BARB,
      "Os barbitúricos têm efeito analgésico?",
      "Não",
      "Em doses subanestésicas podem inclusive ser hiperalgésicos, por isso exigem analgésico associado.",
      "easy", ["barbituricos", "analgesia"], SAESP43),

    card(D_BARB,
      "Como varia a ordem cinética do tiopental conforme a dose?",
      "Primeira ordem nas doses usuais; ordem zero em doses muito altas",
      "Na ordem zero a eliminação satura e passa a ser constante por unidade de tempo, prolongando muito o despertar.",
      "hard", ["tiopental", "cinetica"], SAESP43),

    card(D_BARB,
      "Quais são as contraindicações clássicas do tiopental?",
      "Porfiria aguda intermitente, insuficiência renal, mixedema, cor pulmonale e enfisema grave",
      "Na porfiria, os barbitúricos induzem a ALA-sintetase e podem desencadear crise aguda.",
      "medium", ["tiopental", "porfiria", "contraindicacao"], SAESP43),

    card(D_BARB,
      "Por que os barbitúricos causam depressão cardiovascular acentuada?",
      "Bloqueiam canais de sódio e de cálcio voltagem-dependentes",
      "O efeito é mais intenso com os tiobarbitúricos, como o tiopental, do que com os oxibarbitúricos.",
      "medium", ["barbituricos", "hemodinamica", "mecanismo"], SAESP43),

    card(D_BARB,
      "O que acontece ao diluir tiopental abaixo de 2% em água destilada?",
      "A solução fica hipotônica e pode causar hemólise",
      "A reconstituição deve ser feita em soro fisiológico, glicose a 5% ou água destilada mantendo a concentração adequada.",
      "hard", ["tiopental", "preparo", "hemolise"], SAESP43),

    card(D_BARB,
      "Com quais fármacos o tiopental precipita na mesma via?",
      "Opioides e bloqueadores neuromusculares",
      "A solução tem pH alto (alcalino); ao encontrar fármacos ácidos ocorre precipitação. Lavar a via entre as injeções.",
      "medium", ["tiopental", "incompatibilidade", "preparo"], SAESP43),

    card(D_BARB,
      "Por que a meia-vida do tiopental é maior na gestante?",
      "Pelo maior volume de distribuição",
      "O mesmo ocorre no sexo feminino de modo geral. Já a cirrose não altera de forma significativa o clearance do tiopental.",
      "hard", ["tiopental", "gestacao", "farmacocinetica"], SAESP43),

    card(D_BARB,
      "Que condições aumentam a fração livre do tiopental no plasma?",
      "Uremia, hipovolemia, hipoalbuminemia e acidose",
      "Mais fármaco livre significa mais efeito com a mesma dose — reduzir a dose nesses pacientes.",
      "medium", ["tiopental", "ligacao-proteica"], SAESP43),

    card(D_BARB,
      "Por que barbitúricos podem causar efeito excitatório em neonatos?",
      "Porque nessa faixa etária o GABA ainda tem ação despolarizante",
      "A inversão do gradiente de cloro no neurônio imaturo pode transformar o efeito inibitório em excitatório, até com convulsões.",
      "hard", ["barbituricos", "neonato", "gaba"], SAESP43),

    // ───────────── BENZODIAZEPÍNICOS ─────────────
    card(D_BARB,
      "Que percentual de ocupação dos receptores GABA-A produz ansiólise, sedação e inconsciência?",
      "Cerca de 20% ansiólise, 30 a 50% sedação e 60% ou mais inconsciência",
      "Explica por que doses baixas ansiolíticas não produzem hipnose e por que a titulação é possível.",
      "hard", ["benzodiazepinicos", "receptor", "ocupacao"], SAESP43),

    card(D_BARB,
      "Qual subunidade do receptor GABA-A medeia a sedação e a amnésia dos benzodiazepínicos?",
      "Subunidade alfa-1 (ansiólise e relaxamento muscular são mediados pela alfa-2)",
      "A seletividade por subunidades é a base do desenvolvimento de agentes com menos sedação e mais ansiólise.",
      "hard", ["benzodiazepinicos", "receptor", "subunidade"], SAESP43),

    card(D_BARB,
      "Qual é a dose de indução do midazolam?",
      "0,1 a 0,2 mg/kg IV",
      "É pouco usado isoladamente para indução por ter início mais lento e despertar mais prolongado que propofol e tiopental.",
      "easy", ["midazolam", "dose", "inducao"], SAESP43),

    card(D_BARB,
      "Qual é a dose de midazolam como pré-anestésico em adulto?",
      "0,04 a 0,08 mg/kg IM ou IV",
      "Titular em pequenas frações no idoso, que é bem mais sensível ao efeito sedativo e à depressão respiratória.",
      "easy", ["midazolam", "dose", "pre-anestesico"], SAESP43),

    card(D_BARB,
      "Qual é a dose de midazolam por via oral em pediatria e quanto tempo antes?",
      "0,4 a 0,8 mg/kg, 10 a 15 minutos antes",
      "O xarope é bem aceito e evita a punção venosa na criança ansiosa antes da indução inalatória.",
      "medium", ["midazolam", "pediatria", "dose"], SAESP43),

    card(D_BARB,
      "Quais as doses de midazolam por via nasal e retal?",
      "Nasal 0,2 mg/kg; retal 1 mg/kg",
      "A via nasal causa irritação em cerca de 70% das crianças, o que limita seu uso apesar do início rápido.",
      "hard", ["midazolam", "vias-alternativas", "dose"], SAESP43),

    card(D_BARB,
      "Compare a meia-vida de eliminação de midazolam, lorazepam e diazepam.",
      "Midazolam ~1,9 h; lorazepam 11 a 22 h; diazepam ~43 h",
      "A meia-vida curta do midazolam o torna o benzodiazepínico de escolha em anestesia; o diazepam ainda gera metabólitos ativos.",
      "medium", ["benzodiazepinicos", "meia-vida", "comparacao"], SAESP43),

    card(D_BARB,
      "Qual é a ligação proteica dos benzodiazepínicos?",
      "Alta: de cerca de 70% (alprazolam) a 90% (diazepam)",
      "Em hipoalbuminemia a fração livre aumenta e o efeito é potencializado com a mesma dose.",
      "medium", ["benzodiazepinicos", "ligacao-proteica"], SAESP43),

    card(D_BARB,
      "Quanto o midazolam 0,15 mg/kg reduz o fluxo sanguíneo cerebral?",
      "Cerca de 34%",
      "Reduz também a CMRO2, mantendo o acoplamento entre fluxo e metabolismo — perfil aceitável em neuroanestesia.",
      "hard", ["midazolam", "fsc", "neuroanestesia"], SAESP43),

    card(D_BARB,
      "Qual benzodiazepínico deprime mais a ventilação?",
      "O midazolam, mais que diazepam e lorazepam",
      "A depressão é central e dose-dependente, e se potencializa muito quando associado a opioides.",
      "medium", ["midazolam", "respiratorio"], SAESP43),

    card(D_BARB,
      "Qual a incidência de amnésia anterógrada após midazolam venoso?",
      "Cerca de 76%",
      "A amnésia é anterógrada: o paciente não forma novas memórias após a dose, mas preserva as anteriores.",
      "medium", ["midazolam", "amnesia"], SAESP43),

    card(D_BARB,
      "Qual a frequência de reação paradoxal aos benzodiazepínicos?",
      "Cerca de 2%",
      "Manifesta-se como agitação, desinibição ou agressividade, mais comum em crianças e idosos.",
      "medium", ["benzodiazepinicos", "reacao-paradoxal"], SAESP43),

    card(D_BARB,
      "Como reduzir a dor venosa causada pelo diazepam?",
      "Lidocaína 10 mg IV antes da injeção",
      "A irritação venosa decorre do veículo (propilenoglicol) do diazepam, ausente na formulação hidrossolúvel do midazolam.",
      "medium", ["diazepam", "dor-a-injecao"], SAESP43),

    card(D_BARB,
      "Qual o risco do lorazepam em infusão contínua por mais de 48 horas?",
      "Insuficiência renal por acúmulo de propilenoglicol",
      "O veículo se acumula e cursa com acidose metabólica com ânion gap elevado, além da lesão renal.",
      "hard", ["lorazepam", "propilenoglicol", "toxicidade"], SAESP43),

    card(D_BARB,
      "Qual é a dose de flumazenil para reversão de benzodiazepínico?",
      "0,1 a 0,2 mg IV, repetida até o total de 3 mg",
      "Titular em incrementos pequenos para evitar reversão abrupta com agitação, dor e resposta adrenérgica.",
      "medium", ["flumazenil", "dose", "reversao"], SAESP43),

    card(D_BARB,
      "Por que existe risco de ressedação após o uso de flumazenil?",
      "Porque sua meia-vida plasmática é curta, de cerca de 1 hora",
      "É menor que a da maioria dos benzodiazepínicos revertidos. Manter vigilância ou usar infusão contínua.",
      "medium", ["flumazenil", "ressedacao"], SAESP43),

    card(D_BARB,
      "O flumazenil reverte a sedação por propofol, etomidato, cetamina ou barbitúricos?",
      "Não; atua apenas nos benzodiazepínicos",
      "É antagonista competitivo no sítio benzodiazepínico do receptor GABA-A, sem ação nos demais hipnóticos.",
      "easy", ["flumazenil", "reversao", "especificidade"], SAESP43),

    card(D_BARB,
      "Qual a meia-vida contexto-sensível do remimazolam após 2 horas de infusão?",
      "7 a 8 minutos",
      "É metabolizado por esterases teciduais em um metabólito com afinidade muito menor pelo GABA-A, o que evita acúmulo.",
      "hard", ["remimazolam", "contexto-sensivel"], SAESP43),

    // ───────────── ETOMIDATO ─────────────
    card(D_ETO,
      "Qual é a dose de indução do etomidato?",
      "0,2 a 0,6 mg/kg IV, sendo 0,3 mg/kg a dose usual",
      "Injetar em 30 a 60 segundos. É a escolha frequente no paciente hemodinamicamente instável.",
      "easy", ["etomidato", "dose", "inducao"], SAESP44),

    card(D_ETO,
      "Qual é a duração de ação do etomidato e o que determina seu término?",
      "3 a 5 minutos, terminada por redistribuição",
      "A meia-vida de eliminação é bem maior (2,9 a 5,3 h), mas não determina o despertar após dose única.",
      "medium", ["etomidato", "duracao", "redistribuicao"], SAESP44),

    card(D_ETO,
      "Qual é a particularidade do etomidato no receptor GABA-A?",
      "Age seletivamente em receptores com subunidades beta-2 ou beta-3",
      "Mimetiza o GABA no receptor. Essa seletividade é objeto de pesquisa para novos hipnóticos sem supressão adrenal.",
      "hard", ["etomidato", "gaba", "mecanismo"], SAESP44),

    card(D_ETO,
      "Qual o efeito do etomidato 0,2 a 0,3 mg/kg sobre fluxo cerebral e metabolismo?",
      "Reduz o FSC em 34% e a CMRO2 em 45%, sem alterar a pressão arterial média",
      "Combinação favorável em neuroanestesia: reduz a PIC preservando a pressão de perfusão cerebral.",
      "hard", ["etomidato", "fsc", "cmro2", "neuroanestesia"], SAESP44),

    card(D_ETO,
      "Qual a incidência de mioclonias após etomidato?",
      "50% a 80% em pacientes sem pré-medicação",
      "Não são convulsões. Podem ser atenuadas por benzodiazepínico ou pequena dose de opioide antes da indução.",
      "medium", ["etomidato", "mioclonia"], SAESP44),

    card(D_ETO,
      "Qual é a principal vantagem do etomidato como indutor?",
      "Estabilidade hemodinâmica: RVS e índice cardíaco pouco alterados",
      "Por isso é preferido no paciente instável, com estenose aórtica grave ou coronariopatia importante.",
      "easy", ["etomidato", "hemodinamica", "vantagem"], SAESP44),

    card(D_ETO,
      "O etomidato libera histamina?",
      "Não",
      "É uma vantagem adicional no paciente instável ou com histórico de reações alérgicas.",
      "easy", ["etomidato", "histamina"], SAESP44),

    card(D_ETO,
      "Qual enzima é inibida pelo etomidato, causando supressão adrenal?",
      "A 11-beta-hidroxilase",
      "A inibição é atribuída ao anel imidazólico da molécula, que bloqueia a síntese de cortisol no córtex adrenal.",
      "medium", ["etomidato", "supressao-adrenal", "enzima"], SAESP44),

    card(D_ETO,
      "Quanto tempo pode durar a supressão adrenal causada pelo etomidato?",
      "De 24 a 72 horas, mesmo após dose única",
      "Motivo da cautela clássica no paciente séptico, embora o impacto clínico da dose única seja discutido.",
      "medium", ["etomidato", "supressao-adrenal"], SAESP44),

    card(D_ETO,
      "O que mostra a evidência sobre etomidato em dose única na sepse?",
      "Metanálise não encontrou aumento de mortalidade (RR 1,06; IC95% 0,97–1,15)",
      "A supressão adrenal ocorre, mas o desfecho clínico não foi pior. A decisão deve considerar a estabilidade hemodinâmica.",
      "hard", ["etomidato", "sepse", "evidencia"], SAESP44),

    card(D_ETO,
      "Qual é a causa da dor à injeção do etomidato e como atenuá-la?",
      "O veículo propilenoglicol; usar lidocaína 20 a 40 mg antes",
      "Formulações em emulsão lipídica reduzem bastante a dor à injeção em comparação com a solução em propilenoglicol.",
      "medium", ["etomidato", "dor-a-injecao"], SAESP44),

    card(D_ETO,
      "Qual é a ligação proteica do etomidato e quanto é excretado inalterado?",
      "Cerca de 75% de ligação; apenas 2% excretado inalterado na urina",
      "É hidrolisado por esterases hepáticas e plasmáticas em metabólitos inativos, com clearance hepático alto.",
      "hard", ["etomidato", "farmacocinetica"], SAESP44),

    // ───────────── CETAMINA ─────────────
    card(D_ETO,
      "Qual é o principal mecanismo de ação da cetamina?",
      "Antagonismo de receptores glutamatérgicos NMDA",
      "Age em córtex, tálamo, hipocampo e sistema límbico, produzindo a chamada anestesia dissociativa.",
      "easy", ["cetamina", "nmda", "mecanismo"], SAESP44),

    card(D_ETO,
      "A naloxona reverte os efeitos da cetamina?",
      "Não, apesar de a cetamina se ligar a receptores opioides",
      "Liga-se a receptores mu e kappa espinhais, mas o efeito analgésico principal decorre do bloqueio NMDA.",
      "hard", ["cetamina", "naloxona", "opioide"], SAESP44),

    card(D_ETO,
      "Qual é a dose de indução da cetamina?",
      "1 a 3 mg/kg IV ou 4 a 6 mg/kg IM",
      "A via intramuscular é útil na criança sem acesso venoso e em situações de emergência ou pré-hospitalar.",
      "easy", ["cetamina", "dose", "inducao"], SAESP44),

    card(D_ETO,
      "Qual é a dose de manutenção da cetamina em infusão contínua?",
      "15 a 90 microgramas/kg/min",
      "Habitualmente associada a benzodiazepínico para reduzir as reações psicomiméticas de emergência.",
      "medium", ["cetamina", "dose", "infusao"], SAESP44),

    card(D_ETO,
      "Qual é a dose analgésica subanestésica da cetamina?",
      "0,1 a 0,5 mg/kg IV ou 2 a 4 mg/kg IM",
      "Nessas doses há analgesia e efeito poupador de opioide, com preservação da consciência e da ventilação.",
      "medium", ["cetamina", "analgesia", "dose"], SAESP44),

    card(D_ETO,
      "Quanto dura a hipnose após cetamina 1 mg/kg IV?",
      "Cerca de 6 minutos",
      "A duração é dose-dependente: 0,5 mg/kg dura ~2 min; 1,5 mg/kg ~8 min; 2 mg/kg ~10 min.",
      "hard", ["cetamina", "duracao", "dose"], SAESP44),

    card(D_ETO,
      "Qual é o início de ação da cetamina por via venosa?",
      "Cerca de 30 segundos, com efeito máximo em 1 minuto",
      "A alta lipossolubilidade permite passagem rápida pela barreira hematoencefálica.",
      "easy", ["cetamina", "inicio"], SAESP44),

    card(D_ETO,
      "Por que a cetamina aumenta a frequência cardíaca e a pressão arterial?",
      "Por estimulação simpática central e inibição da recaptação de catecolaminas",
      "O efeito de inibição da recaptação é semelhante ao da cocaína, e não é revertido por betabloqueio isolado.",
      "medium", ["cetamina", "hemodinamica", "catecolaminas"], SAESP44),

    card(D_ETO,
      "A resposta hemodinâmica à cetamina é dose-dependente?",
      "Não; não há diferença entre 0,5 e 1,5 mg/kg, e há taquifilaxia na segunda dose",
      "Isso significa que aumentar a dose não intensifica a resposta pressórica, mas doses repetidas a atenuam.",
      "hard", ["cetamina", "hemodinamica", "taquifilaxia"], SAESP44),

    card(D_ETO,
      "Em que situação a cetamina pode causar hipotensão grave?",
      "Na depleção de catecolaminas, com queda súbita do débito cardíaco",
      "No choque prolongado o efeito depressor miocárdico direto se manifesta, pois não há reserva simpática a ser estimulada.",
      "hard", ["cetamina", "hipotensao", "choque"], SAESP44),

    card(D_ETO,
      "Quais são os efeitos da cetamina sobre as vias aéreas?",
      "Broncodilatação e aumento da complacência, porém com mais secreções",
      "A broncodilatação favorece o asmático; o aumento de secreções salivares e brônquicas justifica o antissialagogo.",
      "medium", ["cetamina", "via-aerea", "asma"], SAESP44),

    card(D_ETO,
      "A preservação dos reflexos protetores com cetamina descarta o risco de aspiração?",
      "Não; há casos de aspiração documentados",
      "Manter jejum e as mesmas precauções de via aérea, apesar da aparente preservação dos reflexos.",
      "medium", ["cetamina", "aspiracao", "seguranca"], SAESP44),

    card(D_ETO,
      "Quando ocorrem as reações de emergência da cetamina e como reduzi-las?",
      "Na primeira hora da recuperação; menores com S(+) e com benzodiazepínico associado",
      "São reações psicomiméticas (delírio, alucinações, sonhos vívidos), geralmente de curta duração e mais frequentes com uso isolado.",
      "medium", ["cetamina", "reacao-de-emergencia"], SAESP44),

    card(D_ETO,
      "Qual a diferença entre os enantiômeros S(+) e R(–) da cetamina?",
      "S(+) tem 4 vezes mais seletividade NMDA; R(–) tem mais afinidade kappa",
      "A maior afinidade kappa da R(–) explicaria seu maior potencial psicomimético em relação à S(+).",
      "hard", ["cetamina", "enantiomero", "s-cetamina"], SAESP44),

    card(D_ETO,
      "Quais são as contraindicações da cetamina?",
      "Hipertensão intracraniana, lesões expansivas, coronariopatia grave e aneurismas cerebrais",
      "Usar com cautela em doenças psiquiátricas pelo risco de reações psicomiméticas.",
      "medium", ["cetamina", "contraindicacao"], SAESP44),

    card(D_ETO,
      "Como a cetamina é metabolizada e qual seu metabólito ativo?",
      "Por CYP3A4 e CYP2B6 em norcetamina, depois hidroxinorcetamina",
      "Apenas 4% é excretado inalterado na urina. A meia-vida de eliminação é de cerca de 158 minutos.",
      "hard", ["cetamina", "metabolismo", "norcetamina"], SAESP44),

    // ───────────── ALFA-2 AGONISTAS ─────────────
    card(D_A2,
      "Qual é a seletividade alfa-2 / alfa-1 da dexmedetomidina?",
      "1.620 para 1, cerca de 8 vezes maior que a da clonidina",
      "Essa seletividade explica a sedação e a analgesia com menos efeitos alfa-1 do que os agonistas mais antigos.",
      "medium", ["dexmedetomidina", "seletividade"], SAESP44),

    card(D_A2,
      "Qual é a meia-vida de eliminação da dexmedetomidina?",
      "Cerca de 2 a 3 horas (distribuição em ~6 minutos)",
      "Não tem metabólitos ativos conhecidos. É amplamente biotransformada no fígado, com 95% de excreção urinária.",
      "medium", ["dexmedetomidina", "farmacocinetica"], SAESP44),

    card(D_A2,
      "Como varia a meia-vida contexto-sensível da dexmedetomidina?",
      "4 minutos após 10 minutos de infusão e 250 minutos após 8 horas",
      "O acúmulo tecidual é expressivo, então infusões longas prolongam muito a recuperação — planejar a suspensão com antecedência.",
      "hard", ["dexmedetomidina", "contexto-sensivel"], SAESP44),

    card(D_A2,
      "Qual é a dose de manutenção da dexmedetomidina em infusão?",
      "0,2 a 0,7 microgramas/kg/h, titulada ao efeito",
      "A apresentação é concentrada a 100 mcg/mL e exige diluição. Em disfunção hepática ou renal, usar 0,2 mcg/kg/h.",
      "medium", ["dexmedetomidina", "dose", "infusao"], SAESP44),

    card(D_A2,
      "Por que a dexmedetomidina pode causar hipertensão no início da infusão?",
      "Por vasoconstrição alfa-2 na musculatura lisa vascular",
      "Depois predomina a queda do drive simpático central, com vasodilatação e hipotensão — resposta bifásica. Evitar bolus rápido.",
      "hard", ["dexmedetomidina", "hemodinamica", "bifasico"], SAESP44),

    card(D_A2,
      "Qual é a ligação proteica da dexmedetomidina?",
      "Cerca de 93,7% (albumina e alfa-1-glicoproteína ácida)",
      "A alta ligação proteica torna relevante a hipoalbuminemia, situação em que a fração livre aumenta.",
      "hard", ["dexmedetomidina", "ligacao-proteica"], SAESP44),

    card(D_A2,
      "Qual é a dose de clonidina por via oral como pré-medicação?",
      "2 a 4 microgramas/kg",
      "Administrada 60 a 90 minutos antes do procedimento para produzir sedação e efeito poupador de anestésicos.",
      "medium", ["clonidina", "dose", "pre-medicacao"], SAESP44),

    card(D_A2,
      "Qual é o efeito poupador da clonidina pré-operatória?",
      "Reduz 20 a 30% do consumo de tiopental e propofol e até 52% dos opioides",
      "É a base do uso de alfa-2 agonistas como adjuvantes em anestesia multimodal.",
      "hard", ["clonidina", "efeito-poupador"], SAESP44),

    card(D_A2,
      "Como a clonidina pode ser usada contra tremores pós-operatórios?",
      "2 microgramas/kg IV ao término da cirurgia",
      "Os alfa-2 agonistas reduzem o limiar de tremor por ação central termorreguladora.",
      "medium", ["clonidina", "tremores"], SAESP44),

    card(D_A2,
      "Qual antagonista reverte a sedação e a hipotensão da dexmedetomidina?",
      "O atipamezol, com seletividade alfa-2 / alfa-1 de 8.500 para 1",
      "Em ordem decrescente de afinidade: atipamezol, idazoxan, ioimbina e efaroxan. Uso clínico ainda restrito.",
      "hard", ["atipamezol", "antagonista", "reversao"], SAESP44),

    card(D_A2,
      "O que a dexmedetomidina acrescenta quando usada no neuroeixo?",
      "Analgesia residual de 5 a 6 horas, com redução de 70% no consumo de analgésicos",
      "Descrita em doses equipotentes de 3 mcg e 30 mcg em raquianestesia.",
      "hard", ["dexmedetomidina", "neuroeixo", "raquianestesia"], SAESP44),
  ],
};
