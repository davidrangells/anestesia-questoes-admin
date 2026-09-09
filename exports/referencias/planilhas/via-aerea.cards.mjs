// Flashcards originais — Via aérea.
// Conteúdo redigido a partir do mapa de conceitos dos capítulos citados
// (nada copiado/traduzido literalmente). Números conferidos no texto extraído.
//
// Gerar planilha:
//   node scripts/build-flashcards-xlsx.mjs \
//     --in=exports/referencias/planilhas/via-aerea.cards.mjs \
//     --out=exports/referencias/planilhas/flashcards_via-aerea_2026-09-08.xlsx

const SAESP23 = "Tratado de Anestesiologia SAESP, 10ª ed. — cap. 23, Anatomia do Sistema Respiratório";
const SAESP66 = "Tratado de Anestesiologia SAESP, 10ª ed. — cap. 66, Avaliação da Via Aérea";
const SAESP67 = "Tratado de Anestesiologia SAESP, 10ª ed. — cap. 67, Controle da Via Aérea";
const SAESP68 = "Tratado de Anestesiologia SAESP, 10ª ed. — cap. 68, Via Aérea Difícil";
const SAESP222 = "Tratado de Anestesiologia SAESP, 10ª ed. — cap. 222, Complicações Respiratórias";
const MILLER40 = "Miller's Anesthesia, 10ª ed. (2025) — cap. 40, Airway Management in the Adult";

const THEME = {
  themeId: "via-aerea",
  themeName: "Via Aérea",
  moduleId: "me",
  examType: "ME",
  level: "R1",
};

const D_AVAL = "via-aerea-avaliacao";
const D_TEC = "via-aerea-tecnicas-dispositivos";
const D_DIF = "via-aerea-dificil";
const D_COMP = "via-aerea-complicacoes-extubacao";

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
    tema: "Via aérea",
    fontes: "SAESP 10ed caps. 23, 66, 67, 68 e 222; Miller 10ed cap. 40",
    observacoes:
      "Cards originais. Os bloqueios de nervos da via aérea não constam do SAESP e vieram do Miller cap. 40. Cards com reviewNotes marcam divergências entre as fontes.",
  },
  decks: [
    {
      deckId: D_AVAL,
      title: "Via aérea — Avaliação e preditores",
      description: "Mallampati, distâncias, teste da mordida, escores compostos, Cormack-Lehane e o desempenho real desses testes.",
      moduleId: "me",
      themeId: THEME.themeId,
      order: 1,
    },
    {
      deckId: D_TEC,
      title: "Via aérea — Técnicas e dispositivos",
      description: "Pré-oxigenação, indução em sequência rápida, dispositivos supraglóticos e videolaringoscopia.",
      moduleId: "me",
      themeId: THEME.themeId,
      order: 2,
    },
    {
      deckId: D_DIF,
      title: "Via aérea difícil",
      description: "Algoritmos ASA, DAS e Vortex, intubação acordado, bloqueios da via aérea e via aérea cirúrgica de emergência.",
      moduleId: "me",
      themeId: THEME.themeId,
      order: 3,
    },
    {
      deckId: D_COMP,
      title: "Via aérea — Complicações e extubação",
      description: "Confirmação da intubação, laringoespasmo, pressão do balonete, estratégia de extubação e teste de escape.",
      moduleId: "me",
      themeId: THEME.themeId,
      order: 4,
    },
  ],
  cards: [
    // ───────────── AVALIAÇÃO ─────────────
    card(D_AVAL,
      "Como se classifica o Mallampati modificado?",
      "Classe I vê palato mole, fauce, úvula e pilares; classe IV não vê nem o palato mole",
      "Avaliar com o paciente sentado, cabeça neutra, boca aberta e língua protraída, sem fonação.",
      "easy", ["mallampati", "avaliacao"], SAESP66),

    card(D_AVAL,
      "Quem acrescentou a quarta classe ao teste de Mallampati?",
      "Samsoon e Young, em 1987",
      "Por isso o nome tecnicamente correto do teste de quatro classes seria classificação de Samsoon e Young.",
      "hard", ["mallampati", "historia"], SAESP66),

    card(D_AVAL,
      "O teste de Mallampati isolado é bom preditor de via aérea difícil?",
      "Não; tem acurácia limitada e não serve como teste de triagem isolado",
      "Sua sensibilidade fica em torno de 65% a 81% e o valor preditivo positivo é baixo, em torno de 8% a 9%.",
      "medium", ["mallampati", "acuracia"], SAESP66),

    card(D_AVAL,
      "O que é o Mallampati classe zero?",
      "Visualização de qualquer parte da epiglote à protrusão da língua",
      "Descrito por Ezri, com incidência de 1,18% e apenas em mulheres; associa-se a laringoscopia ainda mais fácil que a classe I.",
      "hard", ["mallampati", "classe-zero"], SAESP66),

    card(D_AVAL,
      "Por que o Mallampati é considerado dinâmico na gestante?",
      "Pode variar de classe I a IV na mesma paciente ao longo do trabalho de parto",
      "O edema progressivo das vias aéreas exige reavaliação imediatamente antes da indução, e não apenas na admissão.",
      "medium", ["mallampati", "obstetricia"], SAESP66),

    card(D_AVAL,
      "Qual valor de distância tireomentoniana sugere intubação difícil?",
      "Menor que 6 cm, cerca de três dedos de largura média",
      "Mede-se do bordo inferior do mento à proeminência da cartilagem tireoide, com a cabeça estendida.",
      "easy", ["distancia-tireomentoniana"], SAESP66,
      { reviewNotes: "Miller adota o ponto de corte de 6,5 cm; a legenda de figura do SAESP indica 5 a 6 cm." }),

    card(D_AVAL,
      "Qual valor de distância esternomentoniana sugere intubação difícil?",
      "12,5 cm ou menos",
      "Medida com a cabeça estendida e a boca fechada; tem especificidade alta, em torno de 89%.",
      "medium", ["distancia-esternomentoniana"], SAESP66),

    card(D_AVAL,
      "Que abertura bucal é considerada suficiente para a laringoscopia direta?",
      "Pelo menos 3 cm de distância interincisivos",
      "Abaixo disso a lâmina não tem espaço para deslocar a língua, e o valor preditivo positivo do teste sobe muito.",
      "easy", ["abertura-bucal"], SAESP66),

    card(D_AVAL,
      "Como se classifica o teste da mordida do lábio superior?",
      "Classe I morde acima do vermelhão, classe II abaixo e classe III não consegue morder",
      "Avalia a mobilidade da articulação temporomandibular e a capacidade de protrusão mandibular.",
      "medium", ["mordida-do-labio", "avaliacao"], SAESP66),

    card(D_AVAL,
      "Qual teste de beira-leito teve as melhores propriedades de acurácia na revisão Cochrane?",
      "O teste da mordida do lábio superior",
      "Ainda assim, a conclusão geral é que os testes de triagem à beira do leito são inadequados isoladamente.",
      "medium", ["cochrane", "acuracia"], SAESP66),

    card(D_AVAL,
      "Quais variáveis compõem o índice de Wilson?",
      "Peso, movimento de cabeça e pescoço, movimento mandibular, retração mandibular e dentes protrusos",
      "Escores compostos têm especificidade alta (86% a 92%), mas sensibilidade baixa, em torno de 42% a 55%.",
      "hard", ["wilson", "escore"], SAESP66),

    card(D_AVAL,
      "Quais são os preditores de ventilação sob máscara difícil?",
      "IMC acima de 30, protrusão mandibular limitada, barba, Mallampati III ou IV, idade avançada e ronco",
      "A barba é o único fator modificável no momento da anestesia.",
      "medium", ["ventilacao-dificil", "preditores"], SAESP66),

    card(D_AVAL,
      "Quais são os preditores de ventilação sob máscara impossível?",
      "Radiação cervical, sexo masculino, apneia do sono, Mallampati III ou IV e barba",
      "A radiação cervical prévia é o preditor mais forte. A ventilação impossível ocorre em cerca de 0,15% dos casos.",
      "hard", ["ventilacao-impossivel", "preditores"], SAESP66),

    card(D_AVAL,
      "Qual a frequência da combinação de ventilação difícil com laringoscopia difícil?",
      "Cerca de 0,40%, ou 1 em cada 250 anestesias",
      "É o cenário mais temido, mas em parte dos casos a ventilação melhora após o bloqueador neuromuscular.",
      "hard", ["via-aerea-dificil", "incidencia"], SAESP66),

    card(D_AVAL,
      "Que proporção das intubações difíceis não é antecipada pela avaliação pré-operatória?",
      "Cerca de 93%",
      "E apenas 25% das intubações previstas como difíceis realmente o são — daí a importância de estar sempre preparado.",
      "hard", ["via-aerea-dificil", "previsao"], SAESP66),

    card(D_AVAL,
      "Que circunferência cervical se associa a maior risco de intubação difícil no obeso?",
      "A partir de 40 cm o risco é de 5%, chegando a cerca de 35% com 60 cm",
      "No obeso mórbido apenas a circunferência cervical e o Mallampati elevado se mostraram preditores úteis.",
      "hard", ["obesidade", "circunferencia-cervical"], SAESP66),

    card(D_AVAL,
      "O que significa o mnemônico LEMON?",
      "Look, Evaluate 3-3-2, Mallampati, Obstrução/obesidade e Neck mobility",
      "A regra 3-3-2 avalia abertura bucal, distância hioide-mento e distância entre o assoalho da boca e a cartilagem tireoide.",
      "medium", ["lemon", "mnemonico"], SAESP66),

    card(D_AVAL,
      "O que avalia o mnemônico ROMAN?",
      "Dificuldade de ventilação sob máscara: Radiação, Obesidade/obstrução, Máscara, Age e No teeth",
      "Existem mnemônicos análogos para outros cenários: RODS para dispositivo supraglótico e SMART para cricotireoidostomia.",
      "hard", ["roman", "mnemonico"], SAESP66),

    card(D_AVAL,
      "Como se classifica a laringoscopia segundo Cormack-Lehane?",
      "Grau 1 vê toda a fenda glótica; grau 3 vê só a epiglote; grau 4 não vê estrutura laríngea alguma",
      "Descrita em 1984, em artigo sobre intubação difícil em obstetrícia, usando lâmina de Macintosh.",
      "easy", ["cormack-lehane"], SAESP66),

    card(D_AVAL,
      "Qual é a utilidade da subdivisão dos graus de Cormack-Lehane em IIa/IIb e IIIa/IIIb?",
      "Separa os casos em fácil (I e IIa), restrito (IIb e IIIa) e difícil (IIIb e IV)",
      "Os graus IIb e III têm incidência significativamente maior de falha de intubação que I e IIa.",
      "hard", ["cormack-lehane", "subdivisao"], SAESP66),

    card(D_AVAL,
      "Qual escala de visualização laríngea tem maior confiabilidade entre observadores?",
      "A escala POGO, que quantifica a porcentagem de abertura glótica visível",
      "Supera o Cormack-Lehane, cuja classificação em graus é mais sujeita à interpretação subjetiva.",
      "hard", ["pogo", "escala"], MILLER40),

    card(D_AVAL,
      "O edentulismo facilita ou dificulta a via aérea?",
      "Facilita a intubação, mas pode dificultar a ventilação sob máscara",
      "Sem os dentes falta o suporte para o selo da máscara, embora sobre espaço para a laringoscopia.",
      "medium", ["edentulismo"], MILLER40),

    // ───────────── TÉCNICAS E DISPOSITIVOS ─────────────
    card(D_TEC,
      "Quanto tempo de ventilação em volume corrente é necessário para pré-oxigenação adequada?",
      "Cerca de 3 minutos, substituindo 95% do gás alveolar",
      "O alvo objetivo é fração expirada de oxigênio acima de 90%, medida mais fiel que arbitrar um tempo fixo.",
      "easy", ["pre-oxigenacao"], SAESP67),

    card(D_TEC,
      "Qual é o alvo objetivo da pré-oxigenação?",
      "Fração expirada de oxigênio maior que 90%",
      "Demora para atingir esse valor costuma indicar vazamento no selo da máscara, e não falha do paciente.",
      "medium", ["pre-oxigenacao", "feo2"], SAESP67),

    card(D_TEC,
      "Qual fluxo de oxigênio deve ser usado na pré-oxigenação?",
      "10 a 12 L/min de oxigênio a 100%",
      "Fluxos menores permitem reinalação de gás expirado e impedem atingir a fração expirada desejada.",
      "medium", ["pre-oxigenacao", "fluxo"], SAESP67),

    card(D_TEC,
      "Quantas manobras de capacidade vital são necessárias em uma pré-oxigenação de emergência?",
      "Oito manobras em 1 minuto",
      "Quatro manobras em 30 segundos não alcançam a mesma fração expirada que 3 minutos de volume corrente.",
      "medium", ["pre-oxigenacao", "emergencia"], SAESP67),

    card(D_TEC,
      "Quanto o CO2 se acumula durante a apneia?",
      "8 a 16 mmHg no primeiro minuto e cerca de 3 mmHg/min depois",
      "A oxigenação apneica mantém a oxigenação, mas não impede a hipercarbia progressiva.",
      "hard", ["oxigenacao-apneica", "co2"], SAESP67),

    card(D_TEC,
      "Como funciona a oxigenação apneica?",
      "O consumo tecidual de oxigênio cria gradiente que aspira gás dos alvéolos para o sangue",
      "Basta manter oxigênio na faringe, por cânula nasal a 15 L/min, para prolongar bastante o tempo de apneia segura.",
      "medium", ["oxigenacao-apneica", "mecanismo"], SAESP68),

    card(D_TEC,
      "Quanto tempo de apneia segura tem um adulto magro saudável bem pré-oxigenado?",
      "Cerca de 9 minutos, contra 3 minutos ou menos na criança e no obeso",
      "É o tempo até a saturação cair abaixo de 90%, e explica a urgência muito maior nesses grupos.",
      "medium", ["apneia-segura", "pre-oxigenacao"], MILLER40),

    card(D_TEC,
      "Qual é a dose de succinilcolina na indução em sequência rápida se houver pré-curarização?",
      "1,5 a 2,0 mg/kg",
      "A pré-curarização com cerca de um décimo da dose de adespolarizante antagoniza parte do efeito, exigindo dose maior.",
      "hard", ["sequencia-rapida", "succinilcolina"], SAESP67),

    card(D_TEC,
      "Qual dose de rocurônio é usada na indução em sequência rápida?",
      "1,0 a 1,2 mg/kg, com início em cerca de 60 segundos",
      "Tornou-se alternativa segura à succinilcolina depois da disponibilidade do sugamadex para resgate.",
      "medium", ["sequencia-rapida", "rocuronio"], SAESP67),

    card(D_TEC,
      "Que força de pressão cricoide foi proposta como eficaz para ocluir o esôfago?",
      "Cerca de 44 N; alternativamente 10 N acordado e 30 N após a indução",
      "A descrição original de Sellick era imprecisa, falando apenas em pressão “moderada” e depois “firme”.",
      "hard", ["pressao-cricoide", "sellick"], SAESP67),

    card(D_TEC,
      "Qual achado de ressonância questiona a eficácia da pressão cricoide?",
      "O esôfago se desloca lateralmente em cerca de 90% das aplicações",
      "Há consenso, além disso, de que a manobra dificulta ou impede a colocação de dispositivo supraglótico.",
      "hard", ["pressao-cricoide", "controversia"], SAESP67),

    card(D_TEC,
      "Que pressão máxima deve ser usada na ventilação manual para evitar insuflação gástrica?",
      "20 cmH2O medidos no circuito",
      "Acima disso o esfíncter esofágico inferior se torna incompetente e o ar passa a distender o estômago.",
      "medium", ["ventilacao-manual", "insuflacao-gastrica"], SAESP67),

    card(D_TEC,
      "O que caracteriza um dispositivo supraglótico de segunda geração?",
      "A presença de canal de drenagem gástrica",
      "Exemplos: ProSeal, LMA Supreme, i-gel e tubo laríngeo com canal. Reduzem o risco de aspiração e permitem maior pressão de selo.",
      "easy", ["supraglotico", "geracao"], SAESP67),

    card(D_TEC,
      "O selo faríngeo do dispositivo supraglótico protege contra aspiração?",
      "Não; não garante proteção em caso de regurgitação",
      "É a diferença fundamental para o tubo traqueal com balonete, que é a única via aérea considerada definitiva.",
      "medium", ["supraglotico", "aspiracao"], SAESP67),

    card(D_TEC,
      "Qual é a particularidade do i-gel entre os dispositivos supraglóticos?",
      "Tem manguito não inflável, feito de elastômero termoplástico",
      "Dispensa a checagem de pressão do balonete e molda-se à anatomia com o calor corporal.",
      "medium", ["i-gel", "supraglotico"], SAESP67),

    card(D_TEC,
      "Quais são as contraindicações eletivas ao dispositivo supraglótico por risco de regurgitação?",
      "Hérnia de hiato, obesidade mórbida, obstrução intestinal, gastroparesia e jejum insuficiente",
      "Gestação acima de 14 semanas também entra nessa lista, pelo aumento da pressão intra-abdominal.",
      "medium", ["supraglotico", "contraindicacao"], SAESP67),

    card(D_TEC,
      "Qual é a complicação mais comum do dispositivo supraglótico?",
      "Dor hipofaríngea, em 10% a 20% dos casos",
      "Relaciona-se a pressões altas do balonete ou tamanho inadequado do dispositivo.",
      "medium", ["supraglotico", "complicacao"], SAESP67),

    card(D_TEC,
      "Qual a pressão-alvo do balonete de um dispositivo supraglótico?",
      "40 a 60 cmH2O, inflando com o volume mínimo eficaz",
      "Pressões maiores causam dor faríngea e podem comprometer a perfusão da mucosa.",
      "hard", ["supraglotico", "balonete"], MILLER40),

    card(D_TEC,
      "O que determina a técnica de inserção de um videolaringoscópio: a câmera ou a lâmina?",
      "A forma da lâmina",
      "Lâminas de geometria padrão permitem alternar laringoscopia direta e indireta; as hiperanguladas obrigam a visão na tela.",
      "medium", ["videolaringoscopia", "lamina"], SAESP67),

    card(D_TEC,
      "Que curvatura deve ter o estilete usado com lâminas hiperanguladas?",
      "Cerca de 60 graus, como o estilete rígido específico",
      "Sem essa curvatura o tubo não acompanha o trajeto da lâmina, e a boa visão da glote não se converte em intubação.",
      "hard", ["videolaringoscopia", "estilete"], SAESP67),

    card(D_TEC,
      "Por que a posição olfativa é menos crítica na videolaringoscopia?",
      "Porque a visão indireta dispensa o alinhamento dos eixos oral, faríngeo e laríngeo",
      "Na laringoscopia direta esse alinhamento é essencial, já que a visão depende de uma linha reta até a glote.",
      "medium", ["videolaringoscopia", "posicao"], SAESP67),

    card(D_TEC,
      "O que mostrou a revisão Cochrane sobre videolaringoscopia?",
      "Todos os tipos reduzem a falha de intubação e aumentam o sucesso na primeira tentativa",
      "Reduz muito a intubação esofágica acidental e exige menor força de suspensão que a laringoscopia direta.",
      "medium", ["videolaringoscopia", "evidencia"], SAESP67),

    // ───────────── VIA AÉREA DIFÍCIL ─────────────
    card(D_DIF,
      "Que ênfases a ASA acrescentou ao algoritmo de via aérea difícil de 2022?",
      "Limitar tentativas, atentar ao tempo, otimizar a oxigenação, despertar o paciente e pedir ajuda",
      "A definição de via aérea difícil passou a incluir também a extubação difícil e a via aérea invasiva.",
      "medium", ["asa", "algoritmo"], SAESP68),

    card(D_DIF,
      "Quantas tentativas de laringoscopia o plano A do algoritmo DAS permite?",
      "No máximo quatro, sendo a quarta apenas por profissional mais experiente",
      "E somente enquanto a oxigenação estiver mantida. A manipulação laríngea externa deve ser tentada em todas.",
      "medium", ["das", "plano-a"], SAESP68),

    card(D_DIF,
      "O que prevê o plano C do algoritmo DAS?",
      "Oxigenação por máscara facial, com administração de bloqueador se a ventilação estiver impossível",
      "Se possível, acordar o paciente; caso contrário, declarar a situação “não intubo, não oxigeno” e ir para o plano D.",
      "hard", ["das", "plano-c"], SAESP68),

    card(D_DIF,
      "Em que consiste o plano D do algoritmo DAS?",
      "Via aérea cirúrgica frontal: bisturi, bougie e tubo traqueal de 5,0 ou 5,5 mm",
      "A mão não dominante localiza a membrana cricotireóidea e estabiliza a traqueia durante todo o procedimento.",
      "medium", ["das", "fona", "cricotireoidostomia"], SAESP68,
      { reviewNotes: "Miller e a diretriz DAS citam tubo de 6,0 mm de diâmetro interno; o SAESP escreve 5,0-5,5 mm de “diâmetro externo”, provável erro de transcrição." }),

    card(D_DIF,
      "Qual é a lógica do modelo Vortex para via aérea difícil?",
      "Três dispositivos — máscara, tubo e supraglótico — com no máximo 2 minutos ou 3 tentativas cada",
      "A cada ciclo devem ser feitas otimizações: manipulação, adjuvantes, mudança de tamanho, aspiração e tônus muscular.",
      "hard", ["vortex", "algoritmo"], SAESP68),

    card(D_DIF,
      "Na emergência com falha de intubação e de ventilação, qual via cirúrgica escolher?",
      "A cricotireoidostomia, não a traqueostomia",
      "É mais rápida, mais superficial e sangra menos na urgência. A traqueostomia fica para o cenário eletivo.",
      "easy", ["cricotireoidostomia", "fona"], SAESP67),

    card(D_DIF,
      "Qual é a técnica de cricotireoidostomia de escolha?",
      "A técnica scalpel-bougie: bisturi, bougie e tubo traqueal",
      "Tem poucos passos, usa materiais de rotina e exige habilidade motora menos refinada que as técnicas por punção.",
      "medium", ["cricotireoidostomia", "tecnica"], SAESP68),

    card(D_DIF,
      "Por que a cricotireoidostomia é contraindicada em crianças menores de 6 anos?",
      "A cricoide é a porção mais estreita da via aérea e o istmo tireoidiano cobre a membrana",
      "Nessa faixa etária opta-se pela punção com ventilação transtraqueal ou pela traqueostomia.",
      "hard", ["cricotireoidostomia", "pediatria"], MILLER40),

    card(D_DIF,
      "Quando se deve identificar e marcar a membrana cricotireóidea?",
      "Rotineiramente, sempre que houver manipulação de via aérea em trauma ou risco previsto",
      "O ultrassom pode ajudar quando a anatomia não é palpável, como no obeso ou no pescoço irradiado.",
      "medium", ["membrana-cricotireoidea", "preparo"], SAESP68),

    card(D_DIF,
      "Qual é a principal indicação de intubação com o paciente acordado?",
      "Via aérea difícil antecipada, sobretudo com risco associado de aspiração",
      "A cooperação do paciente é fundamental, e o sucesso depende de anestesia tópica adequada de toda a via aérea.",
      "medium", ["intubacao-acordado", "indicacao"], SAESP67),

    card(D_DIF,
      "Qual é o princípio da sedação para intubação acordado?",
      "Sedação consciente titulada, sem depressão respiratória e com ventilação espontânea preservada",
      "Usam-se benzodiazepínicos, opioides e alfa-2 agonistas em doses pequenas, com oxigênio suplementar contínuo.",
      "medium", ["intubacao-acordado", "sedacao"], SAESP67),

    card(D_DIF,
      "Que nervo inerva o terço posterior da língua e a valécula?",
      "O nervo glossofaríngeo",
      "É a via aferente do reflexo de vômito; seu bloqueio é feito na base do pilar amigdaliano anterior.",
      "hard", ["glossofaringeo", "inervacao"], MILLER40),

    card(D_DIF,
      "Que nervo é responsável pela sensibilidade da laringe acima das pregas vocais?",
      "O ramo interno do nervo laríngeo superior",
      "Seu bloqueio é feito próximo ao corno superior do hioide ou da cartilagem tireoide, com 1,5 a 2 mL de lidocaína 2%.",
      "hard", ["laringeo-superior", "bloqueio"], MILLER40),

    card(D_DIF,
      "Qual nervo é motor de todos os músculos da laringe, exceto o cricotireóideo?",
      "O nervo laríngeo recorrente",
      "O cricotireóideo é inervado pelo ramo externo do laríngeo superior, o que explica a rouquidão em sua lesão isolada.",
      "medium", ["laringeo-recorrente", "inervacao"], SAESP23),

    card(D_DIF,
      "Como é feito o bloqueio translaríngeo (transtraqueal)?",
      "Punção da membrana cricotireóidea, aspiração de ar e injeção de cerca de 4 mL de lidocaína",
      "Provoca tosse, que ajuda a dispersar o anestésico na traqueia e nas pregas vocais.",
      "hard", ["bloqueio-translaringeo", "tecnica"], MILLER40),

    card(D_DIF,
      "Qual a dose máxima sugerida de lidocaína tópica na via aérea?",
      "Faixa de 4 a 9 mg/kg, sem consenso firme na literatura",
      "A absorção pela mucosa traqueobrônquica é rápida, aproximando-se da via venosa em velocidade.",
      "hard", ["lidocaina-topica", "dose"], MILLER40),

    card(D_DIF,
      "Por que se usam vasoconstritores antes da intubação nasotraqueal?",
      "O sangramento é a complicação mais frequente dessa via",
      "Usam-se fenilefrina, oximetazolina ou nafazolina tópicas antes da passagem do tubo.",
      "medium", ["nasotraqueal", "vasoconstritor"], SAESP67),

    card(D_DIF,
      "Por que a intubação nasotraqueal é evitada na fratura de base de crânio?",
      "Pelo risco de passagem intracraniana através da lâmina cribiforme",
      "Vale também para as fraturas de Le Fort II e III, classicamente citadas como contraindicação.",
      "medium", ["nasotraqueal", "contraindicacao"], SAESP67),

    // ───────────── COMPLICAÇÕES E EXTUBAÇÃO ─────────────
    card(D_COMP,
      "Qual é o padrão-ouro para confirmar a intubação traqueal?",
      "A presença de CO2 no gás expirado (capnografia)",
      "A visão direta do tubo passando pelas cordas é importante, mas não substitui a confirmação pelo CO2.",
      "easy", ["capnografia", "confirmacao"], SAESP67),

    card(D_COMP,
      "Qual é o nível de recomendação da capnografia na parada cardiorrespiratória?",
      "Classe I da American Heart Association",
      "É mais precisa que os detectores colorimétricos, que podem falhar em baixo débito.",
      "medium", ["capnografia", "rcp"], SAESP67),

    card(D_COMP,
      "Em que profundidade deve ficar a ponta do tubo traqueal?",
      "3 a 5 cm acima da carina",
      "No adulto, fixar em 21 a 22 cm nos molares ou 23 a 24 cm nos incisivos.",
      "medium", ["tubo", "profundidade"], SAESP67),

    card(D_COMP,
      "Como se calcula a profundidade de fixação do tubo em crianças?",
      "Idade dividida por 2 mais 12, ou peso dividido por 5 mais 12",
      "São regras práticas que devem ser sempre confirmadas por ausculta e capnografia.",
      "medium", ["pediatria", "tubo"], SAESP67),

    card(D_COMP,
      "Como se confirma a suspeita de intubação seletiva?",
      "Aumento do pico de pressão inspiratória com ausculta pulmonar assimétrica",
      "A conduta é desinsuflar o balonete, recuar o tubo e reconfirmar a ausculta antes de refixar.",
      "medium", ["intubacao-seletiva"], SAESP67),

    card(D_COMP,
      "Qual é o mecanismo do laringoespasmo?",
      "Contração sustentada dos músculos adutores por estímulo dos nervos laríngeos superiores",
      "É um reflexo protetor exagerado, tipicamente desencadeado por secreções ou manipulação em plano anestésico superficial.",
      "medium", ["laringoespasmo", "mecanismo"], SAESP222),

    card(D_COMP,
      "Qual é a sequência de tratamento do laringoespasmo?",
      "Remover o estímulo, CPAP com oxigênio a 100%, propofol e, se refratário, succinilcolina",
      "A pressão positiva combinada à elevação da mandíbula resolve a maioria dos casos.",
      "easy", ["laringoespasmo", "tratamento"], SAESP222),

    card(D_COMP,
      "Que dose de succinilcolina pode bastar para tratar laringoespasmo?",
      "0,1 mg/kg por via venosa",
      "Dose bem menor que a de intubação, suficiente para relaxar a musculatura adutora da laringe.",
      "hard", ["laringoespasmo", "succinilcolina"], SAESP222),

    card(D_COMP,
      "Qual fármaco é considerado de escolha no tratamento do laringoespasmo perioperatório?",
      "O propofol, em pequenas doses (cerca de 0,8 mg/kg)",
      "Aprofunda o plano anestésico e abole o reflexo sem necessidade de bloqueio neuromuscular na maioria dos casos.",
      "medium", ["laringoespasmo", "propofol"], MILLER40),

    card(D_COMP,
      "Abaixo de que PaO2 o laringoespasmo tende a ceder espontaneamente?",
      "Cerca de 50 mmHg",
      "A hipoxemia grave deprime a atividade adutora — mas esperar por isso não é conduta, e sim uma explicação fisiológica.",
      "hard", ["laringoespasmo", "hipoxemia"], SAESP222),

    card(D_COMP,
      "Qual é a pressão recomendada para o balonete do tubo traqueal?",
      "Cerca de 25 cmH2O, sem exceder 30 cmH2O",
      "A perfusão da mucosa traqueal é interrompida acima de 37 mmHg, o que causa isquemia e estenose tardia.",
      "easy", ["balonete", "pressao"], SAESP67,
      { reviewNotes: "Miller recomenda manter a pressão do balonete abaixo de 25 cmH2O; o SAESP aceita até 30 cmH2O." }),

    card(D_COMP,
      "Como o óxido nitroso afeta o balonete do tubo traqueal?",
      "Difunde para dentro do balonete, aumentando seu volume e sua pressão",
      "Exige medida periódica com manômetro durante anestesias longas com N2O.",
      "medium", ["balonete", "oxido-nitroso"], SAESP67),

    card(D_COMP,
      "Quais medidas previnem pneumonia associada à ventilação mecânica?",
      "Pressão do balonete entre 20 e 30 cmH2O, cabeceira elevada a 30-45 graus e aspiração subglótica",
      "A microaspiração de secreção subglótica ao redor do balonete é o principal mecanismo dessa pneumonia.",
      "medium", ["pav", "prevencao"], SAESP67),

    card(D_COMP,
      "Qual foi a posição dos problemas de extubação entre as complicações do NAP4?",
      "A terceira complicação mais frequente relatada",
      "A obstrução de via aérea foi o principal fator, por laringoespasmo, mordida do tubo, sangue ou edema.",
      "medium", ["extubacao", "nap4"], SAESP67),

    card(D_COMP,
      "Quais são as quatro etapas da estratégia de extubação da DAS?",
      "Planejamento, preparo, execução e cuidados pós-extubação",
      "O paciente é estratificado em baixo ou alto risco, e a estratégia muda conforme essa classificação.",
      "medium", ["extubacao", "das"], SAESP67),

    card(D_COMP,
      "Qual é a taxa de falha de extubação com necessidade de reintubação?",
      "0,1% a 0,45% em anestesia, chegando a 25% em terapia intensiva",
      "A diferença reflete a gravidade e a duração da ventilação nos dois cenários.",
      "hard", ["extubacao", "falha"], SAESP67),

    card(D_COMP,
      "O que avalia o teste de escape do balonete (cuff-leak test)?",
      "O grau de edema laríngeo subglótico e o risco de obstrução após a extubação",
      "Tem excelente especificidade, mas sensibilidade apenas moderada, e foi validado sobretudo em terapia intensiva.",
      "medium", ["cuff-leak", "extubacao"], SAESP67),

    card(D_COMP,
      "Com que antecedência o corticoide deve ser dado para reduzir edema pós-extubação?",
      "Pelo menos 4 horas antes da extubação",
      "O benefício se restringe a pacientes identificados como de risco pelo teste de escape do balonete.",
      "hard", ["corticoide", "extubacao"], SAESP67),

    card(D_COMP,
      "Que razão de TOF deve ser alcançada antes da extubação?",
      "T4/T1 igual ou maior que 0,9",
      "Abaixo disso a musculatura faríngea permanece comprometida, com risco de obstrução e aspiração.",
      "easy", ["extubacao", "tof"], SAESP67),

    card(D_COMP,
      "O que é a manobra de Bailey?",
      "Substituição do tubo traqueal por máscara laríngea antes do despertar",
      "Permite despertar suave, sem tosse, útil em cirurgias em que o aumento da pressão é indesejável.",
      "hard", ["bailey", "extubacao"], SAESP67),

    card(D_COMP,
      "A cânula de Guedel é protetor de mordida adequado?",
      "Não; a abertura entre as arcadas com ela é menor que o diâmetro do tubo",
      "Ainda assim o tubo pode ser ocluído. Prefere-se um bloqueador de mordida específico, colocado entre os molares.",
      "medium", ["mordida", "extubacao"], SAESP67),

    card(D_COMP,
      "O que é a extubação em dois tempos com cateter guia?",
      "Extubar mantendo um cateter trocador na traqueia, para reintubação rápida se necessário",
      "Indicada em pacientes de alto risco de falha, quando a reintubação seria previsivelmente difícil.",
      "hard", ["cateter-trocador", "extubacao"], SAESP67),
  ],
};
