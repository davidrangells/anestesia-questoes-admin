// Flashcards originais — Farmacologia dos anestésicos inalatórios.
// Conteúdo redigido a partir do mapa de conceitos dos capítulos citados
// (nada copiado/traduzido literalmente). Números conferidos no texto extraído.
//
// Gerar planilha:
//   node scripts/build-flashcards-xlsx.mjs \
//     --in=exports/referencias/planilhas/farmacologia-inalatorios.cards.mjs \
//     --out=exports/referencias/planilhas/flashcards_farmacologia-inalatorios_2026-09-08.xlsx

const SAESP40 = "Tratado de Anestesiologia SAESP, 10ª ed. — cap. 40, Anestésicos Inalatórios";
const SAESP41 = "Tratado de Anestesiologia SAESP, 10ª ed. — cap. 41, Farmacocinética dos Anestésicos Inalatórios";
const MILLER18 = "Miller's Anesthesia, 10ª ed. (2025) — cap. 18, Inhaled Anesthetic Uptake, Distribution, Metabolism, and Toxicity";
const STOELT4 = "Stoelting's Pharmacology & Physiology in Anesthetic Practice, 6ª ed. (2021) — cap. 4, Inhaled Anesthetics";

const THEME = {
  themeId: "farmacologia-dos-anestesicos-inalatorios",
  themeName: "Farmacologia dos Anestésicos Inalatórios",
  moduleId: "me",
  examType: "ME",
  level: "R1",
};

const D_PK = "inalatorios-farmacocinetica";
const D_CAM = "inalatorios-cam-potencia";
const D_AG = "inalatorios-agentes-efeitos";
const D_TOX = "inalatorios-metabolismo-toxicidade";

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
    tema: "Farmacologia dos anestésicos inalatórios",
    fontes: "SAESP 10ed caps. 40 e 41; Miller 10ed cap. 18; Stoelting 6ed cap. 4 (tabela físico-química)",
    observacoes:
      "Cards originais redigidos a partir do mapa de conceitos dos capítulos. Cards com reviewNotes têm valor numérico a confirmar na Tabela 40.2 do SAESP (não extraída do PDF).",
  },
  decks: [
    {
      deckId: D_PK,
      title: "Inalatórios — Farmacocinética",
      description: "Captação, solubilidade, FA/FI, efeito da concentração e do segundo gás, distribuição tecidual e eliminação.",
      moduleId: "me",
      themeId: THEME.themeId,
      order: 1,
    },
    {
      deckId: D_CAM,
      title: "Inalatórios — CAM e potência",
      description: "Definição de CAM, variantes (CAM-despertar, CAM-BAR, DA95) e fatores que aumentam ou reduzem a CAM.",
      moduleId: "me",
      themeId: THEME.themeId,
      order: 2,
    },
    {
      deckId: D_AG,
      title: "Inalatórios — Agentes e efeitos sistêmicos",
      description: "Perfil de cada agente (halotano, isoflurano, sevoflurano, desflurano, N2O, xenônio) e efeitos cardiovasculares, respiratórios e neurológicos.",
      moduleId: "me",
      themeId: THEME.themeId,
      order: 3,
    },
    {
      deckId: D_TOX,
      title: "Inalatórios — Metabolismo e toxicidade",
      description: "Biotransformação, hepatotoxicidade, nefrotoxicidade, composto A, monóxido de carbono e interação com a cal sodada.",
      moduleId: "me",
      themeId: THEME.themeId,
      order: 4,
    },
  ],
  cards: [
    // ───────────── FARMACOCINÉTICA ─────────────
    card(D_PK,
      "Qual é a força motriz que move o anestésico inalatório entre alvéolo, sangue e cérebro?",
      "O gradiente de pressão parcial",
      "O gás migra da região de maior para a de menor pressão parcial, independentemente dos outros gases da mistura. O equilíbrio ocorre quando a pressão parcial se iguala nos compartimentos.",
      "easy", ["pressao-parcial", "captacao"], MILLER18),

    card(D_PK,
      "O que representa o coeficiente de partição sangue/gás de um anestésico inalatório?",
      "A solubilidade do agente no sangue em relação à fase gasosa, no equilíbrio",
      "É a razão entre as concentrações nas duas fases quando as pressões parciais se igualam. Quanto maior o coeficiente, mais anestésico o sangue 'absorve' antes de a pressão parcial subir.",
      "easy", ["coeficiente-particao", "solubilidade"], MILLER18),

    card(D_PK,
      "Como a solubilidade sanguínea influencia a velocidade de indução com um anestésico inalatório?",
      "Menor solubilidade → FA/FI sobe mais rápido → indução mais rápida",
      "Agentes pouco solúveis são captados em menor quantidade pelo sangue, então a pressão parcial alveolar (e cerebral) se aproxima da inspirada mais depressa.",
      "easy", ["solubilidade", "fa-fi", "inducao"], SAESP41),

    card(D_PK,
      "Quais são os três fatores que determinam a captação de um anestésico inalatório pelo sangue pulmonar?",
      "Solubilidade (λ), débito cardíaco (Q) e gradiente alveolar-venoso (PA − PV)",
      "Captação = λ × Q × (PA − PV) / Pbar. Se qualquer fator tende a zero, a captação cessa e o alvéolo se equilibra rapidamente com o gás inspirado.",
      "medium", ["captacao", "debito-cardiaco", "formula"], SAESP41),

    card(D_PK,
      "Qual é o efeito do aumento do débito cardíaco sobre a velocidade de subida da relação FA/FI?",
      "Retarda a subida de FA/FI (indução mais lenta)",
      "Maior fluxo pulmonar remove mais anestésico do alvéolo, reduzindo a pressão parcial alveolar. O efeito é mais marcante com agentes solúveis.",
      "medium", ["debito-cardiaco", "fa-fi"], SAESP41),

    card(D_PK,
      "Como o aumento da ventilação alveolar altera a relação FA/FI?",
      "Acelera a subida de FA/FI (indução mais rápida)",
      "Mais ventilação repõe o anestésico captado pelo sangue. O benefício é maior com agentes solúveis, cuja captação é grande.",
      "easy", ["ventilacao", "fa-fi"], SAESP41),

    card(D_PK,
      "O que é o 'efeito da concentração' na farmacocinética dos inalatórios?",
      "Quanto maior a FI, mais rápida a subida de FA/FI",
      "Em altas concentrações inspiradas, a captação do gás 'concentra' o restante no alvéolo e gera influxo de gás fresco que repõe o volume captado. Relevante para o N2O.",
      "medium", ["efeito-concentracao", "oxido-nitroso"], SAESP41),

    card(D_PK,
      "O que é o 'efeito do segundo gás'?",
      "A captação rápida de um gás (N2O) acelera a subida de FA/FI de um segundo gás administrado junto",
      "Descrito por Epstein em 1964. A captação maciça de N2O concentra o halogenado no alvéolo e aumenta o influxo de gás fresco, elevando sua pressão parcial.",
      "medium", ["segundo-gas", "oxido-nitroso"], SAESP41),

    card(D_PK,
      "Como se calcula a constante de tempo de um sistema anestésico?",
      "Constante de tempo = volume do sistema ÷ fluxo de gás fresco",
      "Ex.: circuito de 8 L com fluxo de 2 L/min → τ = 4 min. Após 1τ atinge-se ~63% da concentração final; após 3τ, ~95%; após 4τ, ~98%.",
      "medium", ["constante-de-tempo", "circuito"], SAESP41),

    card(D_PK,
      "Após quantas constantes de tempo um sistema atinge ~95% da concentração final?",
      "Três constantes de tempo (3τ)",
      "1τ ≈ 63%, 2τ ≈ 86%, 3τ ≈ 95%, 4τ ≈ 98%. Fluxos altos encurtam τ e aceleram a mudança de concentração no circuito.",
      "easy", ["constante-de-tempo"], SAESP41),

    card(D_PK,
      "Qual grupo tecidual recebe ~75% do débito cardíaco apesar de representar ~10% da massa corporal?",
      "Grupo ricamente vascularizado (cérebro, coração, fígado, rins, glândulas)",
      "Por isso equilibra-se com o alvéolo em minutos. Músculo (≈50% da massa, ≈19% do DC) leva de 2 a 4 h; gordura (≈20% da massa, ≈6% do DC) demora muito mais.",
      "medium", ["distribuicao", "tecidos"], SAESP41),

    card(D_PK,
      "Em quanto tempo o grupo muscular se equilibra com a pressão parcial alveolar do anestésico?",
      "Cerca de 2 a 4 horas",
      "Músculo tem grande massa e perfusão relativamente baixa, funcionando como reservatório durante anestesias prolongadas.",
      "medium", ["distribuicao", "musculo"], SAESP41),

    card(D_PK,
      "Por que a gordura é o último compartimento a se equilibrar com o anestésico inalatório?",
      "Alta solubilidade lipídica (grande capacidade) com baixa perfusão",
      "O coeficiente gordura/sangue é elevado, então a gordura 'aceita' muito anestésico, mas recebe pouco fluxo sanguíneo — o equilíbrio leva dias.",
      "medium", ["distribuicao", "gordura"], SAESP41),

    card(D_PK,
      "Como um shunt direita-esquerda afeta a indução inalatória?",
      "Retarda a indução, sobretudo com agentes pouco solúveis",
      "O sangue desviado não passa pelos alvéolos e dilui o sangue arterial que carrega anestésico. Com agentes solúveis, o efeito é parcialmente compensado.",
      "hard", ["shunt", "cardiopatia-congenita"], SAESP41),

    card(D_PK,
      "Qual é a principal via de eliminação dos anestésicos inalatórios?",
      "Exalação pulmonar (depende da ventilação alveolar)",
      "A eliminação é o inverso da captação: os mesmos fatores (solubilidade, DC, ventilação) determinam a velocidade de queda da pressão parcial alveolar.",
      "easy", ["eliminacao", "despertar"], SAESP41),

    card(D_PK,
      "Por que o desflurano permite despertar mais rápido do que o isoflurano após anestesia prolongada?",
      "Muito menor solubilidade em sangue e músculo",
      "O coeficiente músculo/gás do isoflurano (~3,6) é cerca de 4,6× o do desflurano (~0,78). Menos agente acumulado nos tecidos → menor 'reservatório' a ser eliminado.",
      "hard", ["desflurano", "isoflurano", "despertar"], SAESP41),

    card(D_PK,
      "Ordene halotano, isoflurano, sevoflurano, desflurano e N2O do mais para o menos solúvel no sangue.",
      "Halotano > isoflurano > sevoflurano > N2O > desflurano",
      "Coeficientes sangue/gás aproximados: halotano 2,5; isoflurano 1,4–1,5; sevoflurano 0,69; N2O 0,46; desflurano 0,42.",
      "medium", ["coeficiente-particao", "solubilidade"], STOELT4),

    card(D_PK,
      "Qual é o coeficiente de partição sangue/gás do desflurano?",
      "≈ 0,42",
      "É o halogenado menos solúvel no sangue, o que explica a indução e o despertar mais rápidos entre os voláteis.",
      "easy", ["desflurano", "coeficiente-particao"], STOELT4),

    card(D_PK,
      "Qual é o coeficiente de partição sangue/gás do sevoflurano?",
      "≈ 0,69",
      "Baixa solubilidade sanguínea, intermediária entre desflurano (0,42) e isoflurano (~1,4). Permite indução inalatória rápida e suave.",
      "easy", ["sevoflurano", "coeficiente-particao"], STOELT4),

    card(D_PK,
      "Qual é o coeficiente de partição sangue/gás do isoflurano?",
      "≈ 1,4",
      "Solubilidade intermediária. Seu coeficiente cérebro/sangue é ~2,2, ou seja, o tecido cerebral concentra mais isoflurano do que o mesmo volume de sangue.",
      "easy", ["isoflurano", "coeficiente-particao"], MILLER18),

    card(D_PK,
      "Qual é o coeficiente de partição sangue/gás do xenônio?",
      "≈ 0,14 (o menor de todos os inalatórios)",
      "Baixíssima solubilidade → indução e despertar extremamente rápidos. Não sofre biotransformação.",
      "medium", ["xenonio", "coeficiente-particao"], SAESP40),

    card(D_PK,
      "O que acontece com a pressão parcial alveolar do anestésico ao administrar a mesma fração inspirada em grande altitude?",
      "Fica menor → efeito farmacológico reduzido",
      "A pressão parcial (não a porcentagem) determina o efeito. Com pressão barométrica menor, a mesma % corresponde a menor pressão parcial.",
      "hard", ["pressao-parcial", "altitude"], MILLER18),

    card(D_PK,
      "O que diferencia um anestésico 'volátil' de um anestésico 'gasoso' à temperatura ambiente?",
      "Volátil: pressão de vapor < 1 atm a 20 °C; gasoso: > 1 atm a 20 °C",
      "Halogenados são líquidos voláteis que precisam de vaporizador. N2O e xenônio são gases e, por baixa potência, compõem grande fração da mistura inspirada.",
      "medium", ["pressao-de-vapor", "vaporizador"], MILLER18),

    // ───────────── CAM E POTÊNCIA ─────────────
    card(D_CAM,
      "Defina concentração alveolar mínima (CAM) de um anestésico inalatório.",
      "Concentração alveolar, a 1 atm, que impede movimento à incisão cirúrgica em 50% dos pacientes",
      "É a medida-padrão de potência dos inalatórios, equivalente a uma DE50. Quanto menor a CAM, mais potente o agente.",
      "easy", ["cam", "potencia"], SAESP40),

    card(D_CAM,
      "Qual é a relação entre CAM e potência de um anestésico inalatório?",
      "Inversa: menor CAM = maior potência",
      "Halotano (CAM ≈ 0,74%) é muito mais potente que o N2O (CAM ≈ 104%), que nem atinge 1 CAM a 1 atm.",
      "easy", ["cam", "potencia"], SAESP40),

    card(D_CAM,
      "Que múltiplo da CAM garante imobilidade em ~95% dos pacientes (DA95)?",
      "≈ 1,3 CAM",
      "A curva dose-resposta dos inalatórios é íngreme: um aumento de ~30% sobre a CAM já impede movimento em quase todos os pacientes.",
      "easy", ["cam", "da95"], SAESP40),

    card(D_CAM,
      "O que é a CAM do despertar (CAM-awake) e qual seu valor aproximado?",
      "Concentração em que 50% dos pacientes abrem os olhos ao comando; ≈ 0,3–0,4 CAM",
      "É a concentração associada à recuperação da consciência. A amnésia ocorre em concentrações ainda menores.",
      "medium", ["cam-despertar", "consciencia"], SAESP40),

    card(D_CAM,
      "O que é a CAM-BAR e qual seu valor aproximado?",
      "Concentração que bloqueia a resposta adrenérgica ao estímulo cirúrgico em 50%; ≈ 1,5 CAM",
      "Bloquear a resposta autonômica (taquicardia, hipertensão) exige mais anestésico do que bloquear o movimento.",
      "medium", ["cam-bar", "resposta-adrenergica"], SAESP40),

    card(D_CAM,
      "Como se combinam as CAMs quando dois anestésicos inalatórios são usados juntos?",
      "De forma aditiva",
      "0,5 CAM de N2O + 0,5 CAM de sevoflurano ≈ 1 CAM total. Essa aditividade sugere mecanismo de ação semelhante.",
      "easy", ["cam", "aditividade"], SAESP40),

    card(D_CAM,
      "Qual é a CAM do halotano?",
      "≈ 0,74%",
      "É o halogenado mais potente em uso clínico (menor CAM). Já foi o agente de referência para comparação entre inalatórios.",
      "easy", ["halotano", "cam"], SAESP40),

    card(D_CAM,
      "Qual é a CAM do isoflurano?",
      "≈ 1,2%",
      "Mais potente que sevoflurano e desflurano, porém menos que o halotano.",
      "easy", ["isoflurano", "cam"], SAESP40,
      { reviewNotes: "Valor citado em outro capítulo do SAESP (ventilação/circuitos); confirmar na Tabela 40.2." }),

    card(D_CAM,
      "Qual é a CAM do sevoflurano em adultos?",
      "≈ 2%",
      "Potência intermediária. Em gestantes a CAM cai para cerca de 1,2–1,5%.",
      "easy", ["sevoflurano", "cam"], SAESP40,
      { reviewNotes: "Confirmar valor exato do adulto na Tabela 40.2 (SAESP)." }),

    card(D_CAM,
      "Qual é a CAM do desflurano?",
      "≈ 6–6,6%",
      "É o halogenado menos potente, mas o de menor solubilidade. O vaporizador específico é aquecido e entrega até 18%.",
      "easy", ["desflurano", "cam"], STOELT4),

    card(D_CAM,
      "Qual é a CAM do óxido nitroso?",
      "≈ 104%",
      "Por ser > 100%, o N2O não produz anestesia isoladamente a 1 atm. É usado como adjuvante para reduzir a CAM do halogenado.",
      "easy", ["oxido-nitroso", "cam"], STOELT4),

    card(D_CAM,
      "Qual é a CAM do xenônio?",
      "≈ 71%",
      "Mais potente que o N2O, mas ainda exige alta fração inspirada, limitando a FiO2. Custo elevado restringe o uso.",
      "medium", ["xenonio", "cam"], SAESP40),

    card(D_CAM,
      "Como a idade influencia a CAM?",
      "CAM é máxima no lactente jovem e cai progressivamente com a idade",
      "Idosos precisam de concentrações menores; prematuros e neonatos têm CAM um pouco menor que lactentes de alguns meses.",
      "easy", ["cam", "idade", "idoso"], SAESP40),

    card(D_CAM,
      "Cite 4 fatores fisiológicos ou clínicos que reduzem a CAM.",
      "Hipotermia, idade avançada, gestação, hiponatremia",
      "Outros: anemia grave, PaO2 < 40 mmHg, PaCO2 > 95 mmHg, hipotensão intensa e intoxicação alcoólica aguda.",
      "medium", ["cam", "fatores"], SAESP40),

    card(D_CAM,
      "Cite fármacos que reduzem a CAM dos anestésicos inalatórios.",
      "Opioides, benzodiazepínicos, cetamina, clonidina/dexmedetomidina, lítio",
      "Depressores do SNC e agonistas alfa-2 reduzem a necessidade de halogenado. Intoxicação alcoólica aguda também reduz.",
      "medium", ["cam", "farmacos", "opioides"], SAESP40),

    card(D_CAM,
      "Cite fatores que aumentam a CAM.",
      "Idade jovem, hipertermia, hipernatremia, alcoolismo crônico, cocaína/anfetamina/efedrina agudas",
      "Estados de hiperatividade do SNC e excesso de catecolaminas exigem mais anestésico para imobilidade.",
      "medium", ["cam", "fatores"], SAESP40),

    card(D_CAM,
      "O hipo ou hipertireoidismo altera a CAM dos anestésicos inalatórios?",
      "Não",
      "Apesar da mudança no metabolismo basal, a função tireoidiana não modifica a CAM de forma clinicamente relevante.",
      "medium", ["cam", "tireoide"], SAESP40),

    card(D_CAM,
      "A duração da anestesia altera a CAM?",
      "Não",
      "A CAM permanece estável ao longo do procedimento. Sexo do paciente também não influencia.",
      "easy", ["cam", "fatores"], SAESP40),

    card(D_CAM,
      "Por que a CAM de um agente a 1 atm não se aplica diretamente em câmara hiperbárica ou em grande altitude?",
      "Porque o efeito depende da pressão parcial, não da porcentagem",
      "A CAM em % pressupõe 1 atm. Fora dessa condição, corrige-se para pressão parcial absoluta (mmHg).",
      "hard", ["cam", "pressao-parcial"], MILLER18),

    // ───────────── AGENTES E EFEITOS SISTÊMICOS ─────────────
    card(D_AG,
      "Qual efeito respiratório é comum a todos os anestésicos halogenados em doses clínicas?",
      "Depressão da resposta ventilatória ao CO2 e à hipóxia",
      "A resposta à hipóxia já é reduzida com 0,1 CAM e praticamente abolida a 1,1 CAM. O volume corrente cai e a FR sobe (padrão rápido e superficial).",
      "medium", ["respiratorio", "hipoxia", "hipercapnia"], SAESP40),

    card(D_AG,
      "Qual é o efeito dos halogenados sobre a vasoconstrição pulmonar hipóxica (VPH)?",
      "Inibem parcialmente (~20% a 1 CAM)",
      "A inibição da VPH pode piorar o shunt e a oxigenação, sobretudo em ventilação monopulmonar.",
      "medium", ["vph", "ventilacao-monopulmonar"], SAESP40),

    card(D_AG,
      "Qual é o efeito dos halogenados sobre a musculatura lisa brônquica?",
      "Broncodilatação",
      "Útil em asmáticos. O sevoflurano é preferido por não ser pungente; desflurano pode causar tosse e laringoespasmo.",
      "easy", ["broncodilatacao", "asma"], SAESP40),

    card(D_AG,
      "Qual é o efeito dos halogenados sobre o tônus uterino?",
      "Reduzem o tônus uterino de forma dose-dependente",
      "Vantagem para extração fetal difícil ou versão externa; desvantagem por aumentar sangramento uterino na cesariana. N2O não relaxa o útero.",
      "medium", ["utero", "obstetricia"], SAESP40),

    card(D_AG,
      "Como os halogenados interagem com bloqueadores neuromusculares adespolarizantes?",
      "Potencializam o bloqueio (mais sevoflurano e desflurano)",
      "Reduzem a dose necessária e prolongam o bloqueio. O efeito é maior quanto mais tempo o agente esteve equilibrado no músculo.",
      "medium", ["bloqueio-neuromuscular", "interacao"], SAESP40),

    card(D_AG,
      "Como os halogenados afetam a pressão intraocular?",
      "Reduzem a PIO",
      "Efeito útil em cirurgias oftálmicas, ao contrário de succinilcolina e cetamina, que a elevam.",
      "easy", ["pio", "oftalmologia"], SAESP40),

    card(D_AG,
      "Qual halogenado mais reduz a resistência vascular sistêmica?",
      "Isoflurano (isoflurano > enflurano > halotano)",
      "A queda de PA com isoflurano decorre de vasodilatação; com halotano, decorre sobretudo de depressão miocárdica.",
      "medium", ["isoflurano", "rvs", "hemodinamica"], SAESP40),

    card(D_AG,
      "Qual halogenado mais sensibiliza o miocárdio às catecolaminas?",
      "Halotano",
      "Evitar adrenalina acima de ~1,5 µg/kg. Ordem de arritmogenicidade: halotano > isoflurano > enflurano > sevoflurano > desflurano.",
      "medium", ["halotano", "arritmia", "adrenalina"], SAESP40),

    card(D_AG,
      "O que é o 'roubo coronariano' atribuído ao isoflurano?",
      "Vasodilatação de coronárias normais desviando fluxo de áreas isquêmicas",
      "Preocupação teórica em coronariopatas com anatomia propensa a roubo; na prática clínica sua relevância é discutível.",
      "hard", ["isoflurano", "roubo-coronariano"], SAESP40),

    card(D_AG,
      "Qual efeito hemodinâmico peculiar ocorre ao elevar rapidamente a concentração de desflurano acima de ~6%?",
      "Hiperatividade simpática transitória (taquicardia e hipertensão)",
      "Decorre da pungência e ativação de receptores de via aérea. Atenuada por aumento gradual, opioides ou pequena dose de betabloqueador.",
      "medium", ["desflurano", "simpatico"], SAESP40),

    card(D_AG,
      "Qual halogenado preserva melhor o débito cardíaco e a frequência cardíaca?",
      "Sevoflurano",
      "Provoca pouca alteração de FC e mantém o DC. Reduz a RVS de forma discreta.",
      "easy", ["sevoflurano", "hemodinamica"], SAESP40),

    card(D_AG,
      "Por que o sevoflurano é o agente de escolha para indução inalatória em crianças?",
      "Não é pungente, tem baixa solubilidade e preserva a hemodinâmica",
      "Permite indução rápida e suave sob máscara. Desflurano e isoflurano são pungentes e provocam tosse, apneia e laringoespasmo.",
      "easy", ["sevoflurano", "pediatria", "inducao-inalatoria"], SAESP40),

    card(D_AG,
      "Qual halogenado é o que mais aumenta fluxo sanguíneo cerebral e pressão intracraniana?",
      "Halotano",
      "Ordem: halotano > enflurano > isoflurano ≈ desflurano ≈ sevoflurano. Todos reduzem o CMRO2, mas o halotano é potente vasodilatador cerebral.",
      "medium", ["halotano", "fsc", "pic"], SAESP40),

    card(D_AG,
      "Até que concentração o isoflurano preserva a autorregulação do fluxo sanguíneo cerebral?",
      "Até cerca de 1,5 CAM",
      "Acima disso a vasodilatação cerebral predomina. Abaixo de ~1 CAM, o aumento de FSC é discreto e a PIC pouco se altera.",
      "hard", ["isoflurano", "autorregulacao", "neuroanestesia"], SAESP40),

    card(D_AG,
      "Qual halogenado pode produzir atividade epileptiforme no EEG, sobretudo com hipocapnia e concentrações altas?",
      "Enflurano (acima de ~1,5 CAM)",
      "Sevoflurano em altas concentrações também pode causar padrão epileptiforme em crianças. Isoflurano é considerado anticonvulsivante.",
      "medium", ["enflurano", "convulsao", "eeg"], SAESP40),

    card(D_AG,
      "Quais halogenados são gatilhos de hipertermia maligna?",
      "Todos os halogenados (halotano é o mais potente); N2O é gatilho fraco/inexistente",
      "Em pacientes suscetíveis, usar anestesia venosa total e purgar o aparelho. A succinilcolina também é gatilho.",
      "easy", ["hipertermia-maligna", "gatilho"], SAESP40),

    card(D_AG,
      "O que é o pré-condicionamento anestésico induzido pelos halogenados?",
      "Proteção miocárdica contra isquemia-reperfusão após exposição prévia ao agente",
      "Mecanismo envolve abertura de canais K-ATP mitocondriais, espécies reativas de oxigênio e receptores de adenosina, imitando o pré-condicionamento isquêmico.",
      "hard", ["pre-condicionamento", "cardioprotecao"], SAESP40),

    card(D_AG,
      "Qual é a explicação da hipóxia difusional ao suspender o óxido nitroso?",
      "N2O sai rapidamente do sangue para o alvéolo, diluindo o O2 alveolar",
      "Prevenção: administrar O2 a 100% por 3–5 min após desligar o N2O.",
      "medium", ["oxido-nitroso", "hipoxia-difusional"], SAESP40),

    card(D_AG,
      "Por que o N2O expande cavidades aéreas fechadas?",
      "É ~20× mais solúvel no sangue que o nitrogênio, entrando na cavidade mais rápido do que o N2 sai",
      "Contraindicado em pneumotórax, embolia gasosa, obstrução intestinal, cirurgia de orelha média e após gás intraocular.",
      "medium", ["oxido-nitroso", "cavidades-fechadas", "contraindicacao"], SAESP40),

    card(D_AG,
      "Qual enzima é inativada pelo óxido nitroso e qual a consequência clínica?",
      "Metionina sintetase, por oxidação da vitamina B12",
      "Exposições prolongadas (> 6 h) ou repetidas podem causar anemia megaloblástica e neuropatia. Cautela em deficiência de B12.",
      "medium", ["oxido-nitroso", "b12", "metionina-sintetase"], SAESP40),

    card(D_AG,
      "Por que se evita o N2O em pacientes com hipertensão intracraniana?",
      "Aumenta FSC, CMRO2 e PIC",
      "Diferente dos halogenados, o N2O eleva o metabolismo cerebral. Também aumenta a resistência vascular pulmonar.",
      "medium", ["oxido-nitroso", "pic", "neuroanestesia"], SAESP40),

    card(D_AG,
      "Cite duas propriedades que tornam o xenônio um inalatório 'quase ideal'.",
      "Solubilidade baixíssima (sangue/gás ≈ 0,14) e ausência de biotransformação",
      "Também tem estabilidade hemodinâmica. Limitações: CAM alta (~71%), custo e necessidade de circuito fechado.",
      "medium", ["xenonio"], SAESP40),

    card(D_AG,
      "O que é o delirium de emergência associado aos halogenados e em quem é mais frequente?",
      "Agitação/confusão ao despertar; mais comum em pré-escolares com sevoflurano ou desflurano",
      "Incidência muito variável (2–80%). Geralmente autolimitado; estratégias incluem propofol, dexmedetomidina e analgesia adequada.",
      "medium", ["delirium-emergencia", "pediatria"], SAESP40),

    card(D_AG,
      "O que mostrou o estudo GAS sobre neurotoxicidade da anestesia inalatória em lactentes?",
      "Sem diferença neurocognitiva aos 5 anos entre anestesia geral com sevoflurano e raquianestesia",
      "Exposição única e breve a halogenado no lactente não mostrou prejuízo no neurodesenvolvimento nesse ensaio.",
      "hard", ["neurotoxicidade", "gas-trial", "pediatria"], SAESP40),

    card(D_AG,
      "Qual é a concentração máxima de saída de um vaporizador de desflurano?",
      "18%",
      "O vaporizador é aquecido e pressurizado devido à alta pressão de vapor do agente (ponto de ebulição próximo à temperatura ambiente).",
      "easy", ["desflurano", "vaporizador"], SAESP40),

    // ───────────── METABOLISMO E TOXICIDADE ─────────────
    card(D_TOX,
      "Ordene halotano, sevoflurano, isoflurano e desflurano pela fração metabolizada.",
      "Halotano (~20%) > sevoflurano (2–3%) > isoflurano (0,2%) > desflurano (0,02%)",
      "Enflurano fica em ~3–5%. Quanto maior a biotransformação, maior o potencial de toxicidade por metabólitos.",
      "medium", ["metabolismo", "biotransformacao"], SAESP40),

    card(D_TOX,
      "Qual enzima hepática é a principal responsável pelo metabolismo oxidativo dos halogenados?",
      "CYP2E1",
      "Indutores dessa isoenzima (álcool crônico, isoniazida, obesidade) aumentam a produção de metabólitos potencialmente tóxicos.",
      "medium", ["cyp2e1", "metabolismo"], SAESP40),

    card(D_TOX,
      "Qual metabólito do halotano está ligado à hepatite imunomediada?",
      "Ácido trifluoroacético (TFA)",
      "O TFA se liga a proteínas hepáticas formando neoantígenos. Sevoflurano não gera TFA, o que o torna mais seguro nesse aspecto.",
      "medium", ["halotano", "hepatite", "tfa"], SAESP40),

    card(D_TOX,
      "Quais são as duas formas de hepatotoxicidade do halotano?",
      "Forma precoce (tóxica, leve, elevação de transaminases) e forma tardia (imunológica, necrose maciça)",
      "A forma tardia (hepatite por halotano) ocorre em ~1:3.500–6.000 e é mais comum em mulheres, obesas e após exposições repetidas.",
      "hard", ["halotano", "hepatite"], SAESP40),

    card(D_TOX,
      "Qual é o principal fator de risco para hepatite por halotano?",
      "Exposições múltiplas ao halotano, especialmente em intervalo curto",
      "Outros fatores: sexo feminino, obesidade, meia-idade. A mortalidade da forma fulminante é alta.",
      "medium", ["halotano", "hepatite", "fator-de-risco"], SAESP40),

    card(D_TOX,
      "Qual halogenado clássico causava nefrotoxicidade por fluoreto e qual o nível sérico considerado tóxico?",
      "Metoxiflurano; fluoreto > 50 µmol/L",
      "Metoxiflurano foi abandonado por isso. Ordem de potencial nefrotóxico: metoxiflurano > enflurano > sevoflurano > isoflurano ≈ halotano > desflurano.",
      "medium", ["nefrotoxicidade", "fluoreto", "metoxiflurano"], SAESP40),

    card(D_TOX,
      "O que é o composto A e em que condições sua produção aumenta?",
      "Degradação do sevoflurano pela cal sodada; ↑ com baixos fluxos e absorvedor quente/desidratado",
      "Produção aumenta com temperatura do absorvedor > 65 °C. Nefrotóxico em ratos; em humanos não há evidência de lesão renal relevante, mas recomenda-se cautela com fluxos muito baixos.",
      "medium", ["sevoflurano", "composto-a", "cal-sodada"], SAESP40),

    card(D_TOX,
      "Qual halogenado é o mais estável e qual o menos estável em contato com a cal sodada?",
      "Mais estável: desflurano; menos estável: sevoflurano",
      "Ordem de estabilidade: desflurano > isoflurano > enflurano > halotano > sevoflurano.",
      "medium", ["cal-sodada", "estabilidade"], SAESP40),

    card(D_TOX,
      "Em que situação os halogenados podem gerar monóxido de carbono no circuito anestésico?",
      "Absorvedor de CO2 desidratado, sobretudo com KOH/cal baritada",
      "Desflurano é o maior produtor de CO, seguido de enflurano e isoflurano. Risco típico: primeira anestesia de segunda-feira após fluxo alto contínuo no fim de semana.",
      "medium", ["monoxido-de-carbono", "cal-sodada", "desflurano"], SAESP40),

    card(D_TOX,
      "Como se previne a formação de monóxido de carbono e de composto A no absorvedor de CO2?",
      "Evitar desidratação da cal e usar absorvedores sem bases fortes (KOH/NaOH)",
      "Desligar o fluxo de gás fresco quando o aparelho não está em uso. Absorvedores à base de hidróxido de cálcio praticamente não geram CO nem composto A.",
      "hard", ["cal-sodada", "prevencao"], SAESP40),

    card(D_TOX,
      "O óxido nitroso sofre metabolismo no organismo?",
      "Praticamente não (eliminação quase totalmente pulmonar)",
      "Pequena redução por bactérias intestinais. A toxicidade do N2O decorre da inativação da vitamina B12, não de metabólitos.",
      "easy", ["oxido-nitroso", "metabolismo"], SAESP40),

    card(D_TOX,
      "Por que o sevoflurano não causa hepatite semelhante à do halotano apesar de ter metabolismo relativamente alto?",
      "Sua biotransformação não produz ácido trifluoroacético (TFA)",
      "Gera fluoreto inorgânico e hexafluoroisopropanol, que é rapidamente glicuronidado. Sem TFA, não há formação dos neoantígenos hepáticos.",
      "hard", ["sevoflurano", "hepatite", "metabolismo"], SAESP40),

    card(D_TOX,
      "Qual halogenado mais reduz o fluxo sanguíneo hepático?",
      "Halotano",
      "Ordem: halotano > enflurano > desflurano > isoflurano > sevoflurano. Menor fluxo hepático + alta biotransformação favorece a hepatotoxicidade do halotano.",
      "medium", ["fluxo-hepatico", "halotano"], SAESP40),
  ],
};
