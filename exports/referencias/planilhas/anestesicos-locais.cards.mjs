// Flashcards originais — Anestésicos locais e sua toxicidade.
// Conteúdo redigido a partir do mapa de conceitos dos capítulos citados
// (nada copiado/traduzido literalmente). Números conferidos no texto extraído.
//
// Gerar planilha:
//   node scripts/build-flashcards-xlsx.mjs \
//     --in=exports/referencias/planilhas/anestesicos-locais.cards.mjs \
//     --out=exports/referencias/planilhas/flashcards_anestesicos-locais_2026-09-08.xlsx

const SAESP42 = "Tratado de Anestesiologia SAESP, 10ª ed. — cap. 42, Anestésicos Locais";
const SAESP111 = "Tratado de Anestesiologia SAESP, 10ª ed. — cap. 111, Bloqueios Periféricos dos Membros Superiores";
const SAESP113 = "Tratado de Anestesiologia SAESP, 10ª ed. — cap. 113, Anestesia Regional Intravenosa";
const SAESP114 = "Tratado de Anestesiologia SAESP, 10ª ed. — cap. 114, Complicações dos Bloqueios Regionais";
const SAESP143 = "Tratado de Anestesiologia SAESP, 10ª ed. — cap. 143, Anestesia Regional em Pediatria";
const MILLER25 = "Miller's Anesthesia, 10ª ed. (2025) — cap. 25, Local Anesthetics";
const STOELT10 = "Stoelting's Pharmacology & Physiology in Anesthetic Practice, 6ª ed. (2021) — cap. 10, Local Anesthetics";

const THEME = {
  themeId: "anestesicos-locais",
  themeName: "Anestésicos Locais",
  moduleId: "me",
  examType: "ME",
  level: "R1",
};

const D_MEC = "locais-mecanismo-estrutura";
const D_CLIN = "locais-agentes-doses";
const D_LAST = "locais-toxicidade-sistemica";
const D_NEURO = "locais-neurotoxicidade-metemoglobinemia";

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
    tema: "Anestésicos locais e toxicidade",
    fontes: "SAESP 10ed caps. 42, 111, 113, 114 e 143; Miller 10ed cap. 25; Stoelting 6ed cap. 10",
    observacoes:
      "Cards originais. Metemoglobinemia e a tabela de doses/duração por agente não constam do cap. 42 do SAESP — vieram de Miller e Stoelting. Cards com reviewNotes marcam divergências entre as três fontes.",
  },
  decks: [
    {
      deckId: D_MEC,
      title: "Locais — Mecanismo e estrutura-atividade",
      description: "Canal de sódio, forma ionizada, pKa e latência, lipossolubilidade e potência, ésteres versus amidas.",
      moduleId: "me",
      themeId: THEME.themeId,
      order: 1,
    },
    {
      deckId: D_CLIN,
      title: "Locais — Agentes, doses e adjuvantes",
      description: "Doses máximas, latência e duração por agente, vasoconstritor, adjuvantes e absorção sistêmica.",
      moduleId: "me",
      themeId: THEME.themeId,
      order: 2,
    },
    {
      deckId: D_LAST,
      title: "Locais — Toxicidade sistêmica (LAST)",
      description: "Quadro clínico, cardiotoxicidade da bupivacaína, prevenção e tratamento com emulsão lipídica.",
      moduleId: "me",
      themeId: THEME.themeId,
      order: 3,
    },
    {
      deckId: D_NEURO,
      title: "Locais — Neurotoxicidade e metemoglobinemia",
      description: "Sintomas neurológicos transitórios, síndrome da cauda equina e metemoglobinemia.",
      moduleId: "me",
      themeId: THEME.themeId,
      order: 4,
    },
  ],
  cards: [
    // ───────────── MECANISMO E ESTRUTURA ─────────────
    card(D_MEC,
      "Qual é o mecanismo de ação dos anestésicos locais?",
      "Bloqueio reversível dos canais de sódio voltagem-dependentes, pelo lado interno da membrana",
      "Sem influxo de sódio não há despolarização nem propagação do potencial de ação. O sítio de ligação é intracelular.",
      "easy", ["mecanismo", "canal-de-sodio"], SAESP42),

    card(D_MEC,
      "A qual estado do canal de sódio o anestésico local se liga preferencialmente?",
      "Ao estado inativado",
      "O canal alterna entre repouso, aberto e inativado. A preferência pelo inativado explica o bloqueio uso-dependente.",
      "medium", ["mecanismo", "canal-de-sodio"], SAESP42),

    card(D_MEC,
      "Qual forma do anestésico local atravessa a membrana e qual exerce o bloqueio?",
      "A não ionizada atravessa a membrana; a ionizada (catiônica) bloqueia o canal",
      "Por isso o fármaco precisa das duas formas: lipossolubilidade para chegar e carga para agir no sítio interno.",
      "medium", ["mecanismo", "ionizacao"], SAESP42),

    card(D_MEC,
      "O que é o bloqueio uso-dependente (frequência-dependente)?",
      "Quanto mais o nervo é estimulado, maior o bloqueio acumulado",
      "Cada abertura do canal permite mais ligação do anestésico ao estado inativado, então fibras muito ativas são bloqueadas com mais facilidade.",
      "hard", ["mecanismo", "uso-dependente"], SAESP42),

    card(D_MEC,
      "Quais são as três partes da molécula de um anestésico local?",
      "Anel aromático lipofílico, cadeia intermediária (éster ou amida) e amina terciária hidrofílica",
      "A cadeia intermediária define a classe e a via de metabolismo; o anel aromático responde pela lipossolubilidade.",
      "easy", ["estrutura", "molecula"], SAESP42),

    card(D_MEC,
      "Qual propriedade físico-química determina a potência de um anestésico local?",
      "A lipossolubilidade",
      "Quanto mais lipofílico, mais o fármaco penetra na membrana e menor a concentração necessária para o bloqueio.",
      "easy", ["potencia", "lipossolubilidade"], SAESP42),

    card(D_MEC,
      "Qual propriedade determina a latência (velocidade de início) de um anestésico local?",
      "O pKa: quanto mais próximo de 7,4, maior a fração não ionizada e mais rápido o início",
      "A lidocaína tem pKa 7,8, com mais de 50% na forma catiônica em pH fisiológico. A bupivacaína, com pKa 8,1, é mais lenta.",
      "medium", ["pka", "latencia"], SAESP42,
      { reviewNotes: "SAESP traz pKa da lidocaína 7,8; a Tabela 10.1 do Stoelting traz 7,9." }),

    card(D_MEC,
      "Qual propriedade determina a duração de ação de um anestésico local?",
      "A ligação às proteínas plasmáticas",
      "A ligação à alfa-1-glicoproteína ácida e à albumina prolonga o efeito. Bupivacaína e ropivacaína ligam-se cerca de 94%.",
      "medium", ["duracao", "ligacao-proteica"], SAESP42),

    card(D_MEC,
      "O que é a concentração mínima (Cm) de um anestésico local?",
      "A menor concentração que bloqueia a condução de um nervo — análoga à CAM dos inalatórios",
      "Permite comparar potências entre agentes. É maior em nervos de maior calibre e em fibras mielinizadas.",
      "hard", ["cm", "potencia"], SAESP42),

    card(D_MEC,
      "Por que o anestésico local falha com frequência em tecido infectado?",
      "O pH ácido do meio aumenta a fração ionizada, que não atravessa a membrana",
      "Hipocalemia e hipercalcemia também reduzem a eficácia, assim como a alta frequência de estímulo do nervo.",
      "medium", ["falha", "ph", "infeccao"], SAESP42),

    card(D_MEC,
      "Como são metabolizados os anestésicos locais do tipo éster e do tipo amida?",
      "Ésteres pela colinesterase plasmática; amidas pelos microssomos hepáticos",
      "Por isso hepatopatas acumulam amidas, e a deficiência de colinesterase prolonga os ésteres.",
      "easy", ["metabolismo", "ester", "amida"], SAESP42),

    card(D_MEC,
      "Qual é o truque para diferenciar amidas de ésteres pelo nome?",
      "As amidas têm dois “i” no nome (lidocaína, bupivacaína, ropivacaína)",
      "Os ésteres têm apenas um (procaína, tetracaína, cloroprocaína, benzocaína).",
      "easy", ["mnemonico", "ester", "amida"], MILLER25),

    card(D_MEC,
      "Quais são as exceções à regra de metabolismo dos anestésicos locais?",
      "A cocaína (éster) é metabolizada no fígado; a articaína (amida) por carboxilesterase plasmática",
      "A articaína é a amida com metabolismo mais rápido, o que reduz seu potencial de acúmulo sistêmico.",
      "hard", ["metabolismo", "excecao", "articaina"], MILLER25),

    card(D_MEC,
      "Por que os anestésicos locais do tipo éster causam mais reações alérgicas?",
      "Porque são hidrolisados em ácido para-aminobenzoico (PABA), potencialmente alergênico",
      "O metilparabeno, conservante de algumas amidas, tem estrutura semelhante e pode causar reação em quem é sensível ao PABA.",
      "medium", ["alergia", "paba", "ester"], MILLER25),

    card(D_MEC,
      "Como e por que se alcaliniza a solução de anestésico local?",
      "1 mL de bicarbonato a 8,4% para cada 10 mL de lidocaína",
      "Aumenta a fração não ionizada, encurtando a latência, e reduz a dor da infiltração. Cuidado com precipitação em excesso.",
      "medium", ["bicarbonato", "latencia"], SAESP42),

    card(D_MEC,
      "Por que a solução industrializada com epinefrina tem latência maior?",
      "O bissulfito que estabiliza a epinefrina acidifica a solução, reduzindo a fração não ionizada",
      "Adicionar a epinefrina no momento do uso, em solução com pH mais alto, encurta a latência.",
      "hard", ["epinefrina", "bissulfito", "latencia"], SAESP42),

    card(D_MEC,
      "Qual é o pH das soluções comerciais de anestésico local?",
      "Ácido: cerca de 3,5 a 5,5 (e 3 a 5 nas que contêm epinefrina)",
      "O meio ácido garante estabilidade e maior prazo de validade, ao custo de latência mais longa.",
      "medium", ["ph", "formulacao"], SAESP42),

    card(D_MEC,
      "A que se atribui a taquifilaxia aos anestésicos locais em uso repetido?",
      "Ao consumo do tampão tecidual, com acidificação progressiva do local",
      "O meio mais ácido reduz a fração não ionizada disponível a cada nova dose, exigindo doses crescentes.",
      "hard", ["taquifilaxia"], SAESP42),

    card(D_MEC,
      "Qual estrutura é a principal barreira à difusão do anestésico local até o axônio?",
      "O perineuro",
      "Boa parte da secção transversal de um nervo periférico é tecido não neural, o que explica a latência dos bloqueios.",
      "hard", ["perineuro", "anatomia"], MILLER25),

    card(D_MEC,
      "Como é a potência da ropivacaína em relação à da bupivacaína?",
      "Cerca de 20 a 30% menor",
      "A menor lipossolubilidade explica tanto a menor potência quanto a menor cardiotoxicidade da ropivacaína.",
      "medium", ["ropivacaina", "bupivacaina", "potencia"], SAESP42),

    card(D_MEC,
      "Qual a diferença físico-química entre levobupivacaína e bupivacaína?",
      "Praticamente nenhuma: são enantiômeros da mesma molécula",
      "A levobupivacaína é o isômero S(-) puro; a diferença clínica está na menor cardiotoxicidade, não nas propriedades físico-químicas.",
      "medium", ["levobupivacaina", "enantiomero"], SAESP42),

    card(D_MEC,
      "Que vantagens os isômeros levógiros (S) dos anestésicos locais apresentam?",
      "Maior vasoconstrição e menor toxicidade sistêmica",
      "É a base do desenvolvimento da ropivacaína, da levobupivacaína e da mistura enantiomérica S75-R25.",
      "medium", ["enantiomero", "toxicidade"], SAESP42),

    card(D_MEC,
      "Qual é a ordem de bloqueio das fibras nervosas pelo anestésico local?",
      "Fibras finas primeiro: autonômicas e C, depois dor e temperatura, tato e por último as motoras",
      "As fibras A-alfa mielinizadas e calibrosas são as mais resistentes, o que explica o bloqueio sensitivo sem bloqueio motor completo.",
      "medium", ["fibras", "bloqueio-diferencial"], SAESP42,
      { reviewNotes: "Miller 10ed diverge: descreve as fibras A-gama/A-delta como as mais suscetíveis e as C amielínicas como as menos." }),

    card(D_MEC,
      "Qual anestésico local é vasoconstritor em todas as concentrações?",
      "A cocaína, por inibir a recaptação de noradrenalina",
      "Os demais têm efeito bifásico: vasoconstrição em baixas concentrações e vasodilatação nas altas.",
      "medium", ["cocaina", "vascular"], MILLER25),

    card(D_MEC,
      "Como a hepatopatia altera a meia-vida da lidocaína?",
      "Sobe de cerca de 1,5 hora para cerca de 5 horas",
      "As amidas dependem do metabolismo hepático e do fluxo sanguíneo do fígado — reduzir dose e evitar infusões prolongadas.",
      "medium", ["lidocaina", "hepatopatia", "meia-vida"], MILLER25),

    card(D_MEC,
      "Qual anestésico local tem a meia-vida plasmática mais curta?",
      "A cloroprocaína, com cerca de 0,12 hora (7 minutos)",
      "É hidrolisada muito rapidamente pela colinesterase plasmática, o que a torna atraente em obstetrícia.",
      "hard", ["cloroprocaina", "meia-vida"], SAESP42),

    // ───────────── AGENTES, DOSES E ADJUVANTES ─────────────
    card(D_CLIN,
      "Qual é a dose máxima de lidocaína com e sem vasoconstritor?",
      "3 a 4 mg/kg sem adrenalina e 5 a 7 mg/kg com adrenalina",
      "A adrenalina reduz a absorção sistêmica e permite dose maior. Valores citados para bloqueios periféricos.",
      "easy", ["lidocaina", "dose-maxima"], SAESP111),

    card(D_CLIN,
      "Por que o SAESP alerta contra decorar “dose máxima” de anestésico local?",
      "Porque o risco depende do sítio do bloqueio, não só da dose por quilo",
      "A mesma dose é muito mais perigosa em bloqueio intercostal do que em infiltração subcutânea, pela diferença de absorção.",
      "hard", ["dose-maxima", "seguranca"], SAESP42),

    card(D_CLIN,
      "Qual é a ordem decrescente de absorção sistêmica do anestésico local por sítio de bloqueio?",
      "Intercostal, depois peridural (caudal e lombar), depois plexo braquial",
      "Quanto mais vascularizado o território, maior o pico plasmático e maior o risco de toxicidade com a mesma dose.",
      "medium", ["absorcao", "sitio", "toxicidade"], STOELT10),

    card(D_CLIN,
      "A que concentração corresponde a adrenalina 1:200.000 e qual seu efeito?",
      "5 microgramas/mL; reduz a absorção sistêmica em cerca de um terço",
      "Além de prolongar o bloqueio, serve como marcador de injeção intravascular pela resposta cronotrópica.",
      "medium", ["adrenalina", "vasoconstritor"], STOELT10),

    card(D_CLIN,
      "Quais são as doses máximas de anestésico local em pediatria?",
      "Lidocaína 5 mg/kg (10 com adrenalina), bupivacaína 2 mg/kg (3) e levobupivacaína 3,5 mg/kg",
      "Valores da tabela de anestesia regional pediátrica. A margem é menor pela imaturidade do metabolismo e da ligação proteica.",
      "hard", ["pediatria", "dose-maxima"], SAESP143,
      { reviewNotes: "Divergência interna do SAESP: o texto do cap. 143 traz ropivacaína 3,5 mg/kg e a Tabela 143.2 traz 3 mg/kg." }),

    card(D_CLIN,
      "Qual o limite de infusão contínua de bupivacaína em crianças?",
      "0,4 mg/kg/h, reduzido para 0,2 mg/kg/h em neonatos e lactentes",
      "O clearance reduzido e a menor concentração de alfa-1-glicoproteína ácida favorecem o acúmulo nessa faixa etária.",
      "hard", ["pediatria", "infusao", "bupivacaina"], MILLER25),

    card(D_CLIN,
      "Qual anestésico local é o de escolha na anestesia regional intravenosa?",
      "A lidocaína, em 3 a 4 mg/kg",
      "A bupivacaína é proscrita nessa técnica pelo risco de parada cardíaca refratária se o garrote falhar.",
      "medium", ["ariv", "lidocaina"], SAESP113),

    card(D_CLIN,
      "Que dose de lidocaína é usada na técnica tumescente para lipoaspiração?",
      "Até 35 a 40 mg/kg",
      "A absorção é muito lenta pela diluição extrema, pela adrenalina e pela vasoconstrição do tecido adiposo infiltrado.",
      "hard", ["tumescente", "lidocaina", "dose"], SAESP42),

    card(D_CLIN,
      "Qual o efeito da clonidina como adjuvante perineural?",
      "Prolonga o bloqueio em cerca de 2 horas, em doses de 0,5 a 1 microgramas/kg",
      "Doses maiores aumentam sedação, bradicardia e hipotensão sem ganho proporcional de duração.",
      "medium", ["clonidina", "adjuvante"], MILLER25),

    card(D_CLIN,
      "Qual adjuvante perineural prolonga mais o bloqueio periférico?",
      "A dexmedetomidina, com cerca de 4 horas adicionais",
      "Supera a clonidina em duração, com os mesmos cuidados quanto a bradicardia e sedação.",
      "medium", ["dexmedetomidina", "adjuvante"], MILLER25),

    card(D_CLIN,
      "A dexametasona perineural é superior à dexametasona venosa?",
      "Não; o benefício é semelhante pelas duas vias",
      "Como a via venosa não tem risco de neurotoxicidade e é off-label em menor grau, costuma ser preferida.",
      "medium", ["dexametasona", "adjuvante"], SAESP42),

    card(D_CLIN,
      "Qual é a duração aproximada do bloqueio com bupivacaína?",
      "240 a 480 minutos",
      "É um dos agentes de ação mais longa, junto com levobupivacaína e ropivacaína. A lidocaína dura 60 a 120 minutos.",
      "easy", ["bupivacaina", "duracao"], STOELT10),

    card(D_CLIN,
      "Qual é a ordem de velocidade de hidrólise dos anestésicos locais tipo éster?",
      "Cloroprocaína mais rápida, depois procaína e por último tetracaína",
      "A halogenação da procaína, que origina a cloroprocaína, acelera a hidrólise em 3 a 4 vezes.",
      "hard", ["ester", "hidrolise"], STOELT10),

    card(D_CLIN,
      "Por que a cloroprocaína é atraente em obstetrícia?",
      "Hidrólise plasmática muito rápida, com mínima transferência ao feto",
      "Mesmo com a queda de até 40% da atividade da colinesterase a termo, a hidrólise permanece suficiente.",
      "hard", ["cloroprocaina", "obstetricia"], STOELT10),

    card(D_CLIN,
      "Que fração da lidocaína está na forma não ionizada em pH 7,4?",
      "Cerca de 25% (contra apenas 17% da bupivacaína e da ropivacaína)",
      "Essa fração maior explica a menor latência da lidocaína em relação aos agentes de pKa mais alto.",
      "hard", ["lidocaina", "ionizacao", "ph"], STOELT10),

    card(D_CLIN,
      "Ao misturar dois anestésicos locais, como se comporta a toxicidade?",
      "É aditiva",
      "Misturar lidocaína e bupivacaína não reduz o risco: as frações de dose máxima de cada um se somam.",
      "medium", ["mistura", "toxicidade"], MILLER25),

    // ───────────── TOXICIDADE SISTÊMICA ─────────────
    card(D_LAST,
      "Quais são os sinais precoces de toxicidade sistêmica por anestésico local?",
      "Gosto metálico, dormência peribucal, zumbido, alterações visuais e agitação",
      "São manifestações de excitação do SNC. Reconhecê-las permite interromper a injeção antes das convulsões.",
      "easy", ["last", "sinais-precoces"], SAESP42),

    card(D_LAST,
      "Qual é a sequência clássica da toxicidade sistêmica por anestésico local?",
      "Excitação do SNC, depois depressão do SNC e por fim colapso cardiovascular",
      "A fase excitatória decorre do bloqueio inicial das vias inibitórias corticais, antes da depressão global.",
      "medium", ["last", "sequencia"], SAESP42),

    card(D_LAST,
      "Que proporção dos casos de LAST foge da apresentação clássica?",
      "Cerca de 43% dos casos, segundo revisão de 93 casos publicados",
      "Muitos abrem o quadro direto por colapso cardiovascular ou por sintomas neurológicos atípicos, sem os pródromos.",
      "hard", ["last", "apresentacao-atipica"], SAESP42,
      { reviewNotes: "A mesma revisão é citada pelo Miller como “apenas 60% exibem a sequência clássica” — números compatíveis, redações diferentes." }),

    card(D_LAST,
      "Qual a incidência de LAST em bloqueios periféricos guiados por ultrassom?",
      "Cerca de 1:1.600 (contra 1:1.000 com neuroestimulador)",
      "O ultrassom reduz, mas não elimina o risco: a visão direta da agulha não garante ausência de injeção intravascular.",
      "hard", ["last", "incidencia", "ultrassom"], MILLER25),

    card(D_LAST,
      "O que sugere uma reação tóxica que ocorre em menos de 60 segundos após a injeção?",
      "Injeção intravascular direta",
      "Reações que aparecem por volta de 15 minutos sugerem absorção progressiva. Observar o paciente por 30 minutos após a dose.",
      "medium", ["last", "diagnostico"], SAESP42),

    card(D_LAST,
      "O que expressa a razão cardiovascular/SNC (CC/SNC) de um anestésico local?",
      "Quantas vezes a dose que causa colapso cardiovascular supera a que causa convulsão",
      "Razão baixa significa menor margem de segurança: o coração pode parar quase junto com a convulsão, como na bupivacaína.",
      "hard", ["last", "razao-cc-snc"], SAESP42),

    card(D_LAST,
      "O que significa o conceito “fast in, slow out” aplicado à bupivacaína?",
      "Liga-se rapidamente ao canal de sódio cardíaco e se dissocia muito lentamente",
      "É a base da sua cardiotoxicidade: o bloqueio persiste entre os batimentos, favorecendo arritmias reentrantes.",
      "hard", ["bupivacaina", "cardiotoxicidade"], SAESP42),

    card(D_LAST,
      "Qual é a ordem decrescente de cardiotoxicidade dos anestésicos locais?",
      "Bupivacaína, etidocaína, ropivacaína e isômeros S",
      "Quanto à indução de arritmias, a ordem crescente é ropivacaína, levobupivacaína e bupivacaína.",
      "medium", ["cardiotoxicidade", "comparacao"], SAESP42),

    card(D_LAST,
      "Qual enantiômero da bupivacaína é o mais cardiotóxico?",
      "O R(+), por maior afinidade pelo canal de sódio cardíaco",
      "É a razão de existirem a levobupivacaína (S puro) e a mistura enantiomérica S75-R25.",
      "medium", ["bupivacaina", "enantiomero"], SAESP42),

    card(D_LAST,
      "Como diferem os padrões de cardiotoxicidade da bupivacaína e da lidocaína?",
      "Bupivacaína causa arritmias graves; lidocaína causa depressão contrátil sem arritmia",
      "Por isso a parada por bupivacaína é caracteristicamente refratária, enquanto a por lidocaína responde melhor a suporte inotrópico.",
      "hard", ["cardiotoxicidade", "comparacao"], SAESP42),

    card(D_LAST,
      "Em que concentração plasmática de anestésico local costumam ocorrer convulsões?",
      "Cerca de 10 a 15 microgramas/mL",
      "Entre 5 e 10 aparecem dormência peribucal, zumbido e mioclonias; acima de 25, depressão cardiovascular franca.",
      "hard", ["last", "concentracao-plasmatica"], STOELT10),

    card(D_LAST,
      "Em que concentração plasmática a bupivacaína provoca convulsão?",
      "Cerca de 4,5 a 5,5 microgramas/mL",
      "É bem menor que a da lidocaína (5 a 10), refletindo sua maior potência e menor margem de segurança.",
      "hard", ["bupivacaina", "convulsao"], STOELT10),

    card(D_LAST,
      "Por que a bupivacaína a 0,75% foi retirada do uso obstétrico?",
      "Por casos de parada cardíaca refratária após injeção peridural inadvertidamente intravascular",
      "A gestação aumenta a sensibilidade à cardiotoxicidade. Hoje a concentração peridural é limitada por prudência a 0,5%.",
      "medium", ["bupivacaina", "obstetricia", "seguranca"], SAESP42),

    card(D_LAST,
      "Qual é o esquema de emulsão lipídica a 20% no tratamento da LAST?",
      "Bolus de 1,5 mL/kg, seguido de infusão de 0,25 mL/kg/min por pelo menos 10 minutos",
      "Sem estabilidade, repetir o bolus e dobrar a infusão para 0,5 mL/kg/min. Limite em torno de 10 mL/kg em 30 minutos.",
      "medium", ["last", "emulsao-lipidica", "tratamento"], SAESP42,
      { reviewNotes: "Miller expressa o teto em volume absoluto (bolus até 100 mL e infusão até 200-250 mL) em vez de mL/kg." }),

    card(D_LAST,
      "Como se usa a adrenalina na parada cardíaca por anestésico local?",
      "Em doses pequenas, de 10 a 100 microgramas",
      "Doses altas pioram a arritmia e prejudicam a eficácia da emulsão lipídica — é uma exceção ao protocolo habitual de RCP.",
      "hard", ["last", "adrenalina", "rcp"], SAESP42),

    card(D_LAST,
      "Quais fármacos devem ser evitados no tratamento da LAST?",
      "Vasopressina, bloqueadores de canal de cálcio, betabloqueadores, lidocaína e procainamida",
      "Lidocaína e procainamida agravariam o próprio bloqueio de canais de sódio que causa o quadro.",
      "medium", ["last", "tratamento", "contraindicacao"], SAESP42),

    card(D_LAST,
      "Qual é o antiarrítmico de eleição nas arritmias da LAST?",
      "A amiodarona",
      "Substitui a lidocaína, que está contraindicada por somar bloqueio de canais de sódio ao já existente.",
      "medium", ["last", "amiodarona"], SAESP42),

    card(D_LAST,
      "Como tratar a convulsão causada por anestésico local?",
      "Benzodiazepínico como primeira escolha",
      "Propofol só em pequenas doses e nunca como substituto da emulsão lipídica, pelo risco de piorar a depressão miocárdica.",
      "medium", ["last", "convulsao", "tratamento"], SAESP42),

    card(D_LAST,
      "Por quanto tempo se deve manter a RCP na parada por anestésico local?",
      "Pode ser necessário mais de 1 hora; considerar circulação extracorpórea",
      "O quadro é potencialmente reversível quando o fármaco se redistribui, o que justifica prolongar as manobras.",
      "hard", ["last", "rcp", "cec"], SAESP42),

    card(D_LAST,
      "Qual é o mecanismo principal proposto para a emulsão lipídica na LAST?",
      "O “lipid sink”: uma fase lipídica que sequestra o anestésico do plasma e do tecido",
      "Há ainda efeitos metabólico, inotrópico e de membrana. O Miller ressalta que a emulsão não deve ser vista como antídoto.",
      "hard", ["last", "emulsao-lipidica", "mecanismo"], SAESP42),

    card(D_LAST,
      "Como a ASRA recomenda injetar o anestésico local para prevenir a LAST?",
      "Em alíquotas de 3 a 5 mL, com pausas de 15 a 30 segundos entre elas",
      "As pausas permitem detectar sintomas antes da dose total, considerando o tempo de circulação de 30 a 45 segundos.",
      "medium", ["last", "prevencao", "asra"], SAESP42),

    card(D_LAST,
      "Qual a confiabilidade da aspiração negativa antes de injetar o anestésico local?",
      "Baixa: há cerca de 2% de falsos-negativos",
      "Por isso a aspiração não substitui a injeção fracionada nem a dose-teste com marcador intravascular.",
      "medium", ["last", "aspiracao", "prevencao"], SAESP42),

    card(D_LAST,
      "Como a epinefrina funciona como marcador de injeção intravascular?",
      "Aumento de 10 a 15 bpm na frequência ou de 15 mmHg na pressão sistólica",
      "Na criança usa-se 0,5 micrograma/kg com elevação de 15 mmHg como critério. Betabloqueio pode mascarar a resposta.",
      "hard", ["last", "dose-teste", "epinefrina"], SAESP42),

    card(D_LAST,
      "Que alterações metabólicas agravam a cardiotoxicidade por anestésico local?",
      "Hipóxia, acidose, hipercapnia e hipercalemia",
      "A acidose aumenta a fração ionizada intracelular e favorece o aprisionamento do fármaco no miócito. A hipocalemia é protetora.",
      "hard", ["last", "acidose", "cardiotoxicidade"], MILLER25),

    // ───────────── NEUROTOXICIDADE E METEMOGLOBINEMIA ─────────────
    card(D_NEURO,
      "O que são os sintomas neurológicos transitórios (SNT) após raquianestesia?",
      "Dor lombar irradiada para nádegas e face dorsolateral das pernas, sem déficit neurológico",
      "Restrita ao território L5-S1, com reflexos e função vesical normais — é o que a distingue da síndrome da cauda equina.",
      "medium", ["snt", "raquianestesia"], SAESP114),

    card(D_NEURO,
      "Quando começam e quanto duram os sintomas neurológicos transitórios?",
      "Começam nas primeiras 24 horas após a regressão do bloqueio e duram de 6 horas a alguns dias",
      "A resolução é completa e espontânea, geralmente em 5 a 7 dias, sem sequela neurológica documentada.",
      "medium", ["snt", "evolucao"], SAESP114),

    card(D_NEURO,
      "Qual anestésico local está mais associado aos sintomas neurológicos transitórios?",
      "A lidocaína, com risco cerca de 6,7 vezes maior que o da bupivacaína",
      "O risco também supera em cerca de 5,5 vezes o da prilocaína. Diluir a lidocaína não reduz a incidência.",
      "medium", ["snt", "lidocaina"], MILLER25),

    card(D_NEURO,
      "Que posição cirúrgica o SAESP associa a maior incidência de sintomas neurológicos transitórios?",
      "A litotomia, com 30 a 36% dos casos",
      "Seguida por joelho fletido em artroscopia (18 a 22%) e pela posição supina (4 a 8%).",
      "hard", ["snt", "litotomia", "posicao"], SAESP114,
      { reviewNotes: "Stoelting contesta: afirma que a litotomia e a deambulação precoce não influenciam a incidência de SNT." }),

    card(D_NEURO,
      "Por que os SNT são considerados um fenômeno distinto da síndrome da cauda equina?",
      "Ocorrem mesmo com lidocaína a 0,5% e não deixam déficit neurológico",
      "A cauda equina envolve lesão estrutural com déficit motor, sensitivo e esfincteriano persistente.",
      "hard", ["snt", "cauda-equina"], SAESP114),

    card(D_NEURO,
      "Qual combinação clássica se associa à síndrome da cauda equina?",
      "Lidocaína a 5% hiperbárica administrada por microcateteres subaracnóideos",
      "O cateter fino produz distribuição em bolo, com concentração neurotóxica sobre as raízes sacrais dependentes.",
      "hard", ["cauda-equina", "microcateter"], STOELT10),

    card(D_NEURO,
      "A neurotoxicidade do anestésico local depende do bloqueio da condução?",
      "Não; toxinas que bloqueiam o canal de sódio não causam lesão neuronal",
      "A saxitoxina e a tetrodotoxina bloqueiam o canal de sódio sem neurotoxicidade, mostrando que o dano tem outro mecanismo.",
      "hard", ["neurotoxicidade", "mecanismo"], MILLER25),

    card(D_NEURO,
      "Qual anestésico local é a principal causa de metemoglobinemia e em que dose?",
      "A prilocaína, a partir de cerca de 600 mg no adulto",
      "O responsável é a o-toluidina, metabólito hepático que oxida o ferro da hemoglobina de ferroso para férrico.",
      "medium", ["metemoglobinemia", "prilocaina"], MILLER25),

    card(D_NEURO,
      "Além da prilocaína, que agentes podem causar metemoglobinemia?",
      "Benzocaína, lidocaína em altas doses, nitroglicerina, fenitoína e sulfonamidas",
      "Com a benzocaína o risco aparece já a partir de 200 a 300 mg, sobretudo em aplicação tópica em mucosa.",
      "medium", ["metemoglobinemia", "benzocaina"], STOELT10),

    card(D_NEURO,
      "A partir de que percentual de metemoglobina surge cianose central?",
      "Acima de cerca de 15% (o valor normal é menor que 1%)",
      "A cianose não melhora com oxigênio e há discrepância entre a saturação do oxímetro e a calculada pela gasometria.",
      "hard", ["metemoglobinemia", "cianose"], STOELT10),

    card(D_NEURO,
      "Qual é o tratamento da metemoglobinemia e sua dose?",
      "Azul de metileno, 1 a 2 mg/kg IV em 5 minutos, sem ultrapassar 7 a 8 mg/kg no total",
      "A normalização ocorre em 20 a 60 minutos. Evitar em deficiência de G6PD pelo risco de hemólise.",
      "medium", ["metemoglobinemia", "azul-de-metileno"], STOELT10),

    card(D_NEURO,
      "Por que neonatos têm maior risco de metemoglobinemia?",
      "A hemoglobina fetal é mais suscetível à oxidação e a metemoglobina redutase é imatura",
      "Ainda assim, o creme EMLA em doses adequadas é considerado seguro nessa faixa etária.",
      "hard", ["metemoglobinemia", "neonato", "emla"], MILLER25),

    card(D_NEURO,
      "Qual anestésico local causa mais toxicidade muscular esquelética?",
      "A bupivacaína (e a etidocaína), com lesão reversível",
      "A regeneração muscular é completa em algumas semanas, sem sequela funcional na maioria dos casos.",
      "hard", ["miotoxicidade", "bupivacaina"], MILLER25),
  ],
};
