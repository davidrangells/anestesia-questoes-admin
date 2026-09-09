// Flashcards originais — Bloqueios do neuroeixo (raquianestesia e peridural).
// Conteúdo redigido a partir do mapa de conceitos dos capítulos citados
// (nada copiado/traduzido literalmente). Números conferidos no texto extraído.
//
// Gerar planilha:
//   node scripts/build-flashcards-xlsx.mjs \
//     --in=exports/referencias/planilhas/bloqueios-neuroeixo.cards.mjs \
//     --out=exports/referencias/planilhas/flashcards_neuroeixo_2026-09-08.xlsx

const SAESP105 = "Tratado de Anestesiologia SAESP, 10ª ed. — cap. 105, Anestesia Subaracnóidea";
const SAESP106 = "Tratado de Anestesiologia SAESP, 10ª ed. — cap. 106, Anestesia Peridural";
const MILLER41 = "Miller's Anesthesia, 10ª ed. (2025) — cap. 41, Spinal, Epidural, and Caudal Anesthesia";

const THEME = {
  themeId: "bloqueios-do-neuroeixo",
  themeName: "Bloqueios do Neuroeixo",
  moduleId: "me",
  examType: "ME",
  level: "R1",
};

const D_ANAT = "neuroeixo-anatomia-niveis";
const D_FARM = "neuroeixo-farmacologia-dispersao";
const D_HEMO = "neuroeixo-repercussao-hemodinamica";
const D_COMP = "neuroeixo-complicacoes";

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
    tema: "Bloqueios do neuroeixo",
    fontes: "SAESP 10ed caps. 105 e 106; Miller 10ed cap. 41",
    observacoes:
      "Cards originais. Stoelting e NYSORA não têm capítulo de neuroeixo. Cards com reviewNotes marcam divergências entre SAESP e Miller (hipovolemia, hipertensão intracraniana, reparos anatômicos).",
  },
  decks: [
    {
      deckId: D_ANAT,
      title: "Neuroeixo — Anatomia e níveis",
      description: "Término da medula e do saco dural, ligamentos, reparos anatômicos, ordem de bloqueio das fibras e níveis metaméricos.",
      moduleId: "me",
      themeId: THEME.themeId,
      order: 1,
    },
    {
      deckId: D_FARM,
      title: "Neuroeixo — Farmacologia e dispersão",
      description: "Baricidade, fatores de dispersão, doses e duração, adjuvantes e diferenças entre raquianestesia e peridural.",
      moduleId: "me",
      themeId: THEME.themeId,
      order: 2,
    },
    {
      deckId: D_HEMO,
      title: "Neuroeixo — Repercussão hemodinâmica",
      description: "Hipotensão, bradicardia, reflexo de Bezold-Jarisch, parada cardíaca e seu tratamento.",
      moduleId: "me",
      themeId: THEME.themeId,
      order: 3,
    },
    {
      deckId: D_COMP,
      title: "Neuroeixo — Complicações e contraindicações",
      description: "Cefaleia pós-punção, raquianestesia total, hematoma e anticoagulação, infecção, cauda equina e contraindicações.",
      moduleId: "me",
      themeId: THEME.themeId,
      order: 4,
    },
  ],
  cards: [
    // ───────────── ANATOMIA E NÍVEIS ─────────────
    card(D_ANAT,
      "Em que nível termina a medula espinhal no adulto?",
      "Em L1 na maioria (60%), em T12 em 30% e em L3 em 10%",
      "Essa variabilidade é o motivo de se puncionar abaixo de L2, preferencialmente em L3-L4 ou L4-L5.",
      "easy", ["anatomia", "cone-medular"], SAESP105),

    card(D_ANAT,
      "Em que nível termina a medula espinhal ao nascimento?",
      "Em L3",
      "Atinge o nível do adulto por volta do fim do primeiro ano de vida, com o crescimento diferencial da coluna.",
      "medium", ["anatomia", "pediatria"], SAESP105),

    card(D_ANAT,
      "Em que nível termina o saco dural no adulto?",
      "Em S2",
      "No recém-nascido termina mais baixo, em S3 ou S4, o que muda as referências para o bloqueio caudal.",
      "easy", ["anatomia", "saco-dural"], SAESP105),

    card(D_ANAT,
      "Quais estruturas a agulha atravessa na punção mediana do neuroeixo?",
      "Pele, subcutâneo, ligamentos supraespinhoso, interespinhoso e amarelo, espaço peridural e dura-máter",
      "Na via paramediana a agulha desvia dos ligamentos supraespinhoso e interespinhoso, atravessando a musculatura paravertebral.",
      "medium", ["anatomia", "tecnica"], SAESP105),

    card(D_ANAT,
      "Como se realiza a punção paramediana?",
      "Agulha a 1,5 cm da linha média, angulada cerca de 25 graus",
      "É útil quando a flexão da coluna é limitada ou os espaços interespinhosos estão calcificados, como no idoso.",
      "medium", ["tecnica", "paramediana"], SAESP105),

    card(D_ANAT,
      "Que vértebra é atravessada pela linha de Tuffier?",
      "A quarta vértebra lombar (L4)",
      "É a linha que une as cristas ilíacas. Estudos com ultrassom mostram que sua confiabilidade é limitada.",
      "easy", ["tuffier", "reparo"], SAESP105,
      { reviewNotes: "Divergência interna do SAESP: um trecho do cap. 105 atribui a Tuffier a localização do espaço L3-L4, outros trechos indicam L4." }),

    card(D_ANAT,
      "Quais são os marcos metaméricos clássicos do tronco?",
      "T4 na linha intermamilar, T6 no apêndice xifoide, T8 no rebordo costal e T10 no umbigo",
      "Permitem estimar rapidamente o nível sensitivo alcançado à beira do leito.",
      "easy", ["dermatomos", "metameros"], SAESP105),

    card(D_ANAT,
      "Qual é a espessura do espaço peridural na região lombar?",
      "5 a 6 mm (3 a 5 mm na torácica e 1,5 a 2 mm na cervical)",
      "O espaço se estreita em sentido cefálico, o que torna a punção torácica e cervical tecnicamente mais exigente.",
      "medium", ["peridural", "anatomia"], SAESP106),

    card(D_ANAT,
      "Qual a distância média entre a pele e o espaço peridural no adulto?",
      "4,5 a 5,5 cm",
      "Em cerca de 80% dos pacientes a distância fica entre 3,5 e 6 cm; varia bastante com o índice de massa corporal.",
      "medium", ["peridural", "distancia"], SAESP106),

    card(D_ANAT,
      "Quantos centímetros de cateter devem ser deixados no espaço peridural?",
      "Cerca de 4 cm além da ponta da agulha",
      "Menos que isso favorece o deslocamento; muito mais aumenta o risco de saída lateral pelo forame ou canulação venosa.",
      "medium", ["cateter", "peridural"], SAESP106),

    card(D_ANAT,
      "O que é o plexo venoso de Batson?",
      "O plexo venoso avalvular do espaço peridural, de predomínio anterior",
      "Por ser avalvular, transmite variações de pressão abdominal e ingurgita na gestante e no obeso, elevando o risco de punção venosa.",
      "hard", ["batson", "anatomia"], SAESP106),

    card(D_ANAT,
      "De onde emerge habitualmente a artéria de Adamkiewicz?",
      "Entre T9 e T12",
      "É a principal artéria radicular de reforço da medula torácica baixa; sua lesão causa a síndrome da artéria espinhal anterior.",
      "hard", ["adamkiewicz", "vascularizacao"], SAESP106,
      { reviewNotes: "Miller descreve origem entre T7 e L4, mais frequentemente à esquerda." }),

    card(D_ANAT,
      "Qual é o volume total de liquor e quanto circula no canal espinhal?",
      "Cerca de 150 a 200 mL circulantes, dos quais 55% no canal espinhal",
      "São produzidos cerca de 500 mL por dia. O volume lombossacral é um dos principais determinantes da dispersão na raquianestesia.",
      "hard", ["liquor", "anatomia"], SAESP105),

    card(D_ANAT,
      "Qual é a ordem de instalação do bloqueio no neuroeixo?",
      "Fibras autonômicas primeiro, depois sensitivas, motoras e por fim proprioceptivas",
      "As fibras simpáticas pré-ganglionares tipo B são bem mais sensíveis que as fibras C da dor.",
      "easy", ["ordem-de-bloqueio", "fibras"], SAESP105),

    card(D_ANAT,
      "Quantos metâmeros o bloqueio simpático ultrapassa o sensitivo na raquianestesia?",
      "Pelo menos dois, podendo chegar a seis",
      "Na peridural, ao contrário, os níveis simpático e sensitivo tendem a coincidir.",
      "medium", ["bloqueio-simpatico", "raquianestesia"], SAESP105),

    card(D_ANAT,
      "Qual é a ordem de regressão do bloqueio do neuroeixo?",
      "Inversa à instalação: primeiro a função motora, depois tato, picada e por último a sensação térmica",
      "Por isso a avaliação pela sensibilidade ao frio superestima o nível remanescente em relação à dor.",
      "medium", ["regressao", "avaliacao"], MILLER41),

    card(D_ANAT,
      "A partir de que nível a raquianestesia é considerada alta?",
      "Acima de T4",
      "Nesse nível já há bloqueio das fibras cardioaceleradoras, com risco de bradicardia e queda importante do débito cardíaco.",
      "medium", ["nivel", "raquianestesia"], SAESP105),

    card(D_ANAT,
      "Em que níveis medulares emergem as fibras cardioaceleradoras?",
      "De T1 a T4",
      "O simpático periférico se estende de T1 a L2; bloquear acima de T4 elimina a resposta cronotrópica compensatória.",
      "medium", ["cardioaceleradoras", "simpatico"], MILLER41),

    card(D_ANAT,
      "Qual nível sensitivo é necessário para cesariana?",
      "T4",
      "Embora a incisão seja em T12, o manuseio e a tração do peritônio exigem nível mais alto para conforto adequado.",
      "easy", ["cesariana", "nivel"], SAESP105),

    card(D_ANAT,
      "Qual nível sensitivo é necessário para ressecção transuretral de próstata?",
      "T10",
      "Também é o nível adequado para cirurgia de quadril. Para cirurgia de pé basta L2.",
      "medium", ["rtu", "nivel"], MILLER41),

    card(D_ANAT,
      "O que avalia a escala de Bromage?",
      "O grau de bloqueio motor dos membros inferiores, de 0 a 3",
      "Grau 0 é ausência de bloqueio; grau 3 é incapacidade de mover o pé, indicando bloqueio motor completo.",
      "medium", ["bromage", "bloqueio-motor"], MILLER41),

    // ───────────── FARMACOLOGIA E DISPERSÃO ─────────────
    card(D_FARM,
      "O que é baricidade de uma solução anestésica?",
      "A relação entre a densidade da solução e a densidade do liquor",
      "Determina como a solução se comporta no liquor conforme a posição do paciente — é o fator mais importante da dispersão.",
      "easy", ["baricidade"], SAESP105),

    card(D_FARM,
      "Qual é a densidade média do liquor a 37 graus?",
      "Cerca de 1,00059",
      "Na gestante o liquor é menos denso (cerca de 1,00033), o que altera o comportamento das soluções ditas isobáricas.",
      "hard", ["liquor", "densidade"], SAESP105),

    card(D_FARM,
      "Como se torna hiperbárica uma solução de anestésico local?",
      "Pela adição de glicose, tipicamente entre 5% e 8%",
      "A glicose a 7,5% é o padrão para bupivacaína e lidocaína hiperbáricas.",
      "easy", ["hiperbarica", "glicose"], SAESP105),

    card(D_FARM,
      "A bupivacaína a 0,5% dita “isobárica” é realmente isobárica?",
      "Não; a 37 graus ela se comporta como levemente hipobárica",
      "É isobárica à temperatura ambiente, mas ao aquecer no liquor sua densidade fica abaixo da do liquor.",
      "hard", ["bupivacaina", "baricidade"], SAESP105),

    card(D_FARM,
      "Os opioides usados no neuroeixo são hiper ou hipobáricos?",
      "Hipobáricos: fentanil, sufentanil e morfina têm densidade menor que a do liquor",
      "Isso contribui para a migração cefálica, sobretudo da morfina, que permanece mais tempo no liquor.",
      "hard", ["opioides", "baricidade"], SAESP105),

    card(D_FARM,
      "Quais são as duas variáveis mais importantes na dispersão da raquianestesia?",
      "A baricidade da solução e a postura do paciente logo após a injeção",
      "Volume de liquor também é determinante, mas não é mensurável na prática clínica.",
      "medium", ["dispersao", "baricidade"], SAESP105),

    card(D_FARM,
      "A altura do paciente prediz o nível da raquianestesia?",
      "Não; a altura não se mostrou preditora do nível alcançado",
      "O peso só tem influência relevante nos obesos, pela redução do volume de liquor lombossacral.",
      "medium", ["dispersao", "altura"], SAESP105),

    card(D_FARM,
      "Como o idoso responde à bupivacaína hiperbárica na raquianestesia?",
      "O nível sobe 3 a 4 segmentos acima do esperado no jovem",
      "O bloqueio simpático fica 2 a 4 metâmeros acima do sensitivo, ampliando a repercussão hemodinâmica.",
      "hard", ["idoso", "dispersao"], SAESP105),

    card(D_FARM,
      "Quanto tempo em decúbito lateral é necessário para obter raquianestesia unilateral?",
      "No mínimo 6 minutos",
      "Combinado a dose baixa de bupivacaína hiperbárica (4 a 5 mg), é a técnica usada em artroscopia de joelho ambulatorial.",
      "hard", ["unilateral", "tecnica"], SAESP105),

    card(D_FARM,
      "Quanto tempo leva o nível máximo da raquianestesia com bupivacaína?",
      "Mais de 20 minutos (a lidocaína leva 10 a 15 minutos)",
      "Por isso a avaliação do nível deve ser repetida — o bloqueio pode subir depois de o paciente já estar posicionado.",
      "medium", ["latencia", "bupivacaina"], SAESP105),

    card(D_FARM,
      "Qual é a faixa de dose de bupivacaína na raquianestesia e sua duração?",
      "5 a 20 mg, com regressão completa em 240 a 380 minutos",
      "A regressão de dois dermátomos ocorre entre 90 e 140 minutos, sendo esse o parâmetro usado para reforço em cateter.",
      "medium", ["bupivacaina", "dose", "duracao"], SAESP105),

    card(D_FARM,
      "Compare a potência de bupivacaína, levobupivacaína e ropivacaína na raquianestesia.",
      "Bupivacaína é a mais potente; a ropivacaína, a menos (DE50 motora de 3,44, 4,83 e 5,79 mg)",
      "A menor potência da ropivacaína precisa ser compensada com dose maior, o que reduz sua vantagem em segurança.",
      "hard", ["potencia", "comparacao"], SAESP105),

    card(D_FARM,
      "Quanto volume de anestésico é necessário por segmento na peridural?",
      "1 a 2 mL por segmento a ser bloqueado",
      "É a regra prática mais útil da peridural; o nível de injeção é o fator relacionado à técnica que mais influencia o resultado.",
      "medium", ["peridural", "volume"], MILLER41),

    card(D_FARM,
      "Quanto se reduz o volume da peridural torácica no idoso?",
      "Cerca de 40% menos volume",
      "A menor complacência do espaço e as alterações dos forames favorecem a dispersão, exigindo doses menores.",
      "hard", ["peridural", "idoso"], MILLER41),

    card(D_FARM,
      "Por que a gestante precisa de doses menores no neuroeixo?",
      "O espaço peridural é menos complacente e há maior sensibilidade neuronal ao anestésico",
      "A ingurgitação do plexo de Batson reduz o volume disponível, e a progesterona aumenta a sensibilidade das fibras.",
      "medium", ["gestante", "dose"], SAESP106),

    card(D_FARM,
      "Qual é a composição clássica da dose-teste peridural?",
      "15 microgramas de adrenalina em 3 mL de anestésico local",
      "Positiva se houver elevação de mais de 15 mmHg na sistólica ou mais de 10 bpm na frequência cardíaca.",
      "medium", ["dose-teste", "peridural"], MILLER41,
      { reviewNotes: "O texto do SAESP cap. 106 registra “15 mg de epinefrina”, erro de unidade; o correto é 15 microgramas." }),

    card(D_FARM,
      "A velocidade de injeção e a direção do bisel alteram a dispersão peridural?",
      "Não; nenhuma das duas influencia de forma relevante",
      "O que determina a dispersão é sobretudo o nível de injeção, o volume e as características do paciente.",
      "medium", ["peridural", "dispersao"], MILLER41),

    card(D_FARM,
      "Em que princípio se baseia a técnica da perda de resistência?",
      "Na baixa resistência do espaço peridural após vencer o ligamento amarelo",
      "A técnica da gota pendente explora a pressão subatmosférica do espaço, mais evidente na região torácica.",
      "medium", ["perda-de-resistencia", "tecnica"], SAESP106),

    card(D_FARM,
      "Qual é a dose de morfina no espaço subaracnóideo e sua duração?",
      "50 a 100 microgramas, com analgesia de até 24 horas",
      "Por ser hidrofílica, permanece no liquor e migra em sentido rostral, exigindo vigilância respiratória prolongada.",
      "medium", ["morfina", "raquianestesia", "dose"], SAESP105),

    card(D_FARM,
      "Qual é a dose de fentanil como adjuvante na raquianestesia e sua duração?",
      "Até cerca de 25 microgramas, com analgesia de 4 a 6 horas",
      "Por ser lipofílico, tem ação segmentar e menor risco de depressão respiratória tardia que a morfina.",
      "medium", ["fentanil", "raquianestesia", "dose"], SAESP105),

    card(D_FARM,
      "Onde os opioides atuam quando administrados no neuroeixo?",
      "Nos receptores opioides das lâminas II e V do corno dorsal da medula",
      "Não bloqueiam fibras simpáticas, motoras nem proprioceptivas — daí a analgesia sem bloqueio motor.",
      "medium", ["opioides", "neuroeixo", "mecanismo"], SAESP105),

    card(D_FARM,
      "Qual é a dose de clonidina como adjuvante peridural?",
      "75 a 150 microgramas (cerca de 1 micrograma/kg)",
      "Prolonga a analgesia ao custo de sedação, bradicardia e hipotensão dose-dependentes.",
      "medium", ["clonidina", "peridural", "dose"], SAESP106),

    card(D_FARM,
      "Que anestésico local tem a maior ligação proteica e a maior duração no neuroeixo?",
      "A bupivacaína, com cerca de 97%",
      "Ropivacaína, levobupivacaína e tetracaína ficam em torno de 94%, com duração ligeiramente menor.",
      "hard", ["ligacao-proteica", "duracao"], SAESP106),

    card(D_FARM,
      "Qual é a diferença fundamental de massa entre raquianestesia e peridural?",
      "Raqui usa massa pequena sem efeito sistêmico; peridural usa massa grande e atinge níveis plasmáticos",
      "Por isso o risco de toxicidade sistêmica é praticamente restrito à peridural e aos bloqueios periféricos.",
      "medium", ["raqui-vs-peridural", "massa"], MILLER41),

    // ───────────── REPERCUSSÃO HEMODINÂMICA ─────────────
    card(D_HEMO,
      "Como varia a queda da pressão arterial conforme o nível da raquianestesia?",
      "Cerca de 5% em T10, 11% em T8, 15% em T6 e mais de 20% em T3",
      "A magnitude acompanha diretamente a extensão do território simpático bloqueado.",
      "medium", ["hipotensao", "nivel"], SAESP105),

    card(D_HEMO,
      "Quais são os dois componentes da hipotensão na raquianestesia e seu peso relativo?",
      "Vasodilatação periférica (cerca de 80%) e queda do débito cardíaco (cerca de 20%)",
      "Por isso o vasopressor costuma ser mais eficaz que a expansão volêmica isolada.",
      "medium", ["hipotensao", "mecanismo"], SAESP105),

    card(D_HEMO,
      "Quanto pode cair o débito cardíaco na raquianestesia alta?",
      "Até 40% dos valores iniciais, com queda máxima por volta dos 20 minutos",
      "A pré-carga pode cair até 53% no bloqueio alto, contra 36% quando o nível fica abaixo de T4.",
      "hard", ["debito-cardiaco", "raquianestesia"], SAESP105),

    card(D_HEMO,
      "O que é o reflexo de Bezold-Jarisch e qual sua relevância no neuroeixo?",
      "Mecanorreceptores ventriculares que, com volume telessistólico baixo, disparam bradicardia",
      "Explica a bradicardia paradoxal e o colapso circulatório súbito em pacientes hipovolêmicos sob bloqueio.",
      "hard", ["bezold-jarisch", "bradicardia"], SAESP105),

    card(D_HEMO,
      "Quais são os fatores de risco para bradicardia grave durante raquianestesia?",
      "Frequência cardíaca basal abaixo de 60 bpm, idade jovem, sexo masculino e uso de betabloqueador",
      "A vagotonia está presente em cerca de 7% da população e amplifica o risco.",
      "hard", ["bradicardia", "fatores-de-risco"], MILLER41),

    card(D_HEMO,
      "Qual é a incidência de parada cardíaca após raquianestesia?",
      "Cerca de 1,3 a 18 casos para cada 10 mil anestesias",
      "É uma das complicações mais temidas; costuma ser precedida de bradicardia progressiva, nem sempre valorizada.",
      "hard", ["parada-cardiaca", "incidencia"], SAESP105),

    card(D_HEMO,
      "A expansão volêmica prévia previne a hipotensão da raquianestesia?",
      "Não; a pré-carga volêmica de rotina não é recomendada para esse fim",
      "O vasopressor precoce é mais eficaz. A hidratação simultânea ao bloqueio (co-carga) tem resultado melhor que a pré-carga.",
      "medium", ["hipotensao", "prevencao", "volume"], MILLER41),

    card(D_HEMO,
      "Com que frequência a pressão arterial deve ser medida após a raquianestesia?",
      "A cada 1 minuto nos primeiros 10 minutos",
      "É o período de instalação do bloqueio simpático, quando ocorre a maior parte das quedas pressóricas graves.",
      "medium", ["monitorizacao", "hipotensao"], SAESP105),

    card(D_HEMO,
      "Que fármacos e doses se usam na parada cardíaca durante raquianestesia?",
      "Atropina 0,4 a 0,6 mg, efedrina 25 a 50 mg e adrenalina 0,2 a 0,3 mg",
      "A escalada deve ser rápida: a bradicardia progressiva sob bloqueio alto pode evoluir para assistolia em poucos minutos.",
      "hard", ["parada-cardiaca", "tratamento"], SAESP105),

    card(D_HEMO,
      "Quais são os fatores de risco para hipotensão na raquianestesia, segundo o Miller?",
      "Nível igual ou acima de T5, idade a partir de 40 anos, sistólica abaixo de 120 e punção alta",
      "Reconhecê-los antecipadamente permite preparar vasopressor antes de instalar o bloqueio.",
      "hard", ["hipotensao", "fatores-de-risco"], MILLER41),

    card(D_HEMO,
      "Como o bloqueio do neuroeixo afeta a função ventilatória?",
      "O volume de reserva expiratório pode zerar e a capacidade inspiratória cai cerca de 80% acima de T5",
      "A ventilação em repouso costuma ser preservada, mas a tosse fica prejudicada pelo bloqueio da musculatura expiratória.",
      "hard", ["ventilacao", "bloqueio-alto"], SAESP105),

    // ───────────── COMPLICAÇÕES ─────────────
    card(D_COMP,
      "Qual é o mecanismo da cefaleia pós-punção dural?",
      "Perda liquórica com hipotensão liquórica, tração de estruturas sensíveis e vasodilatação reflexa",
      "Explica o caráter postural: em pé a tração aumenta, em decúbito ela cede.",
      "easy", ["cppd", "mecanismo"], SAESP105),

    card(D_COMP,
      "Qual é a característica clínica que define a cefaleia pós-punção dural?",
      "Piora na posição sentada ou em pé e alívio em decúbito",
      "Localiza-se em região frontal, occipital ou temporal, podendo vir com náusea, fotofobia e zumbido.",
      "easy", ["cppd", "clinica"], SAESP105),

    card(D_COMP,
      "Quando começa e quanto dura a cefaleia pós-punção dural?",
      "Geralmente entre 24 e 48 horas, com cerca de 70% resolvendo em até 7 dias",
      "Mais de 90% dos casos se iniciam nos primeiros 3 dias após a punção.",
      "medium", ["cppd", "evolucao"], SAESP105),

    card(D_COMP,
      "Quais são os fatores de risco para cefaleia pós-punção dural?",
      "Idade jovem, sexo feminino, gestação, agulha calibrosa, bisel cortante e múltiplas punções",
      "A incidência é maior entre 18 e 50 anos e torna-se desprezível no idoso.",
      "medium", ["cppd", "fatores-de-risco"], SAESP105),

    card(D_COMP,
      "Por que as agulhas de ponta não cortante reduzem a cefaleia pós-punção?",
      "Divulsionam as fibras da dura em vez de seccioná-las",
      "Com agulha Whitacre 27G a incidência em gestantes foi de apenas 0,4%.",
      "medium", ["cppd", "agulha"], SAESP105),

    card(D_COMP,
      "Como orientar o bisel da agulha cortante para reduzir a cefaleia pós-punção?",
      "Paralelo ao eixo longitudinal da coluna",
      "A orientação paralela às fibras da dura reduz o tamanho efetivo do orifício residual.",
      "medium", ["cppd", "bisel"], MILLER41),

    card(D_COMP,
      "Qual é o tratamento mais eficaz da cefaleia pós-punção dural?",
      "Tampão sanguíneo peridural, com 10 a 20 mL de sangue autólogo",
      "A eficácia inicial chega a 90%, com resolução persistente em 61% a 75% dos casos.",
      "medium", ["cppd", "tampao-sanguineo"], SAESP105),

    card(D_COMP,
      "Qual é o mecanismo do tampão sanguíneo peridural?",
      "Oclui o orifício dural, comprime o saco dural e eleva a pressão liquórica",
      "O efeito imediato vem da compressão; o efeito duradouro, da vedação do orifício pelo coágulo.",
      "hard", ["tampao-sanguineo", "mecanismo"], SAESP105),

    card(D_COMP,
      "Quais são as contraindicações ao tampão sanguíneo peridural?",
      "Sepse e coagulopatias",
      "O tampão profilático, feito antes do surgimento da cefaleia, não tem suporte de evidência.",
      "medium", ["tampao-sanguineo", "contraindicacao"], SAESP105),

    card(D_COMP,
      "Que complicação ocular pode acompanhar a cefaleia pós-punção dural?",
      "Estrabismo convergente por paresia do sexto nervo craniano",
      "Pode surgir até o sétimo dia e persistir por meses, decorrendo da tração do nervo abducente.",
      "hard", ["cppd", "estrabismo"], SAESP105),

    card(D_COMP,
      "Quais são os sinais da raquianestesia total?",
      "Bradicardia, hipotensão grave, midríase e apneia",
      "O que a distingue do bloqueio alto é a dispersão intracraniana do anestésico, com perda de consciência.",
      "medium", ["raquianestesia-total", "clinica"], SAESP106),

    card(D_COMP,
      "Qual é o tratamento da raquianestesia total?",
      "Suporte ventilatório e hemodinâmico até o fim do efeito do anestésico",
      "Não há indicação de amnésicos de rotina, já que o paciente está inconsciente pela própria dispersão intracraniana.",
      "medium", ["raquianestesia-total", "tratamento"], SAESP106),

    card(D_COMP,
      "O que caracteriza o bloqueio subdural acidental?",
      "Nível alto e desproporcional que aparece após 15 a 30 minutos, com bloqueio motor modesto",
      "O atraso na instalação é o que o distingue da raquianestesia total, cujo efeito é imediato.",
      "hard", ["bloqueio-subdural"], MILLER41),

    card(D_COMP,
      "Qual é a incidência de hematoma peridural?",
      "Cerca de 1 caso para cada 150 mil procedimentos peridurais",
      "Após punção atraumática sem anticoagulante, a estimativa cai para cerca de 1:320.000.",
      "medium", ["hematoma", "incidencia"], SAESP106),

    card(D_COMP,
      "Quais sintomas sugerem hematoma peridural?",
      "Dor radicular, bloqueio mais prolongado que o esperado e disfunção vesical ou intestinal",
      "Diante da suspeita, ressonância magnética de urgência — a demora custa a função neurológica.",
      "medium", ["hematoma", "diagnostico"], MILLER41),

    card(D_COMP,
      "Qual é o prazo máximo para descompressão cirúrgica de um hematoma peridural?",
      "6 horas do início dos sintomas",
      "Além desse intervalo, o prognóstico de recuperação neurológica torna-se muito ruim.",
      "hard", ["hematoma", "laminectomia"], SAESP105),

    card(D_COMP,
      "Qual o intervalo de segurança para bloqueio do neuroeixo após heparina de baixo peso molecular profilática?",
      "No mínimo 12 horas após a última dose",
      "A reintrodução só deve ocorrer 4 a 6 horas após o bloqueio; em dose terapêutica, o intervalo sobe para 24 horas.",
      "medium", ["hbpm", "anticoagulacao"], SAESP106),

    card(D_COMP,
      "Qual o intervalo de suspensão do clopidogrel antes do bloqueio do neuroeixo?",
      "7 dias (5 dias em situações de alto risco)",
      "Ticagrelor exige 5 dias e prasugrel, 7 a 10 dias. O ácido acetilsalicílico isolado não contraindica o bloqueio.",
      "medium", ["clopidogrel", "anticoagulacao"], SAESP106),

    card(D_COMP,
      "Qual valor de RNI é aceito para realizar bloqueio do neuroeixo em uso de varfarina?",
      "RNI abaixo de 1,5",
      "Alternativamente faz-se ponte com heparina, suspendendo a varfarina cerca de 5 dias antes.",
      "medium", ["varfarina", "rni"], SAESP106),

    card(D_COMP,
      "Pode-se realizar bloqueio do neuroeixo em paciente que recebeu trombolítico?",
      "Não; o uso nos últimos 10 dias contraindica o bloqueio",
      "Se for imperativo, o intervalo mínimo descrito é de 48 horas após a suspensão, com monitorização neurológica rigorosa.",
      "hard", ["tromboliticos", "contraindicacao"], SAESP105),

    card(D_COMP,
      "Por quanto tempo não se deve suspender a antiagregação após implante de stent farmacológico?",
      "Por 1 ano (60 dias no caso de stent metálico convencional)",
      "A suspensão precoce implica risco de trombose de stent, geralmente maior que o benefício do bloqueio.",
      "hard", ["stent", "antiagregacao"], SAESP105),

    card(D_COMP,
      "Que germe está associado à meningite após raquianestesia e o que isso implica?",
      "Estreptococo do grupo viridans, da orofaringe do profissional",
      "É a razão do uso obrigatório de máscara facial durante a punção do neuroeixo.",
      "medium", ["meningite", "mascara"], MILLER41),

    card(D_COMP,
      "Quais são os fatores de risco para abscesso peridural?",
      "Diabetes, corticoterapia, imunossupressão, infecção por retrovírus e sepse",
      "Somam-se falhas de antissepsia e cateteres mantidos por tempo prolongado.",
      "medium", ["abscesso", "fatores-de-risco"], SAESP106),

    card(D_COMP,
      "Por que a clorexidina alcoólica deve secar completamente antes da punção?",
      "Porque a clorexidina residual pode ser neurotóxica e causar aracnoidite",
      "O tempo de secagem também é o que garante a eficácia antisséptica do produto.",
      "medium", ["clorexidina", "antissepsia"], MILLER41),

    card(D_COMP,
      "O que caracteriza a síndrome da cauda equina após bloqueio do neuroeixo?",
      "Anestesia perineal em sela, paraparesia e disfunção vesical e retal",
      "Decorre de lesão das raízes abaixo de L2, por concentração excessiva de anestésico na região lombossacral.",
      "medium", ["cauda-equina", "clinica"], SAESP105),

    card(D_COMP,
      "Que proporção de pacientes desenvolve retenção urinária após bloqueio do neuroeixo?",
      "Até um terço dos pacientes",
      "Decorre do bloqueio das raízes S2 a S4; a função retorna quando o nível regride abaixo de S2-S3.",
      "medium", ["retencao-urinaria", "incidencia"], MILLER41),

    card(D_COMP,
      "Qual é a incidência de prurido com opioide no neuroeixo?",
      "Entre 30% e 100%",
      "É o efeito adverso mais frequente dos opioides neuraxiais, com mecanismo não histaminérgico.",
      "medium", ["prurido", "opioide"], MILLER41),

    card(D_COMP,
      "Quais são os fatores associados à lombalgia após bloqueio do neuroeixo?",
      "Litotomia, cirurgia acima de 2,5 horas, IMC acima de 32, múltiplas punções e lombalgia prévia",
      "Até 25% dos pacientes cirúrgicos referem lombalgia, chegando a 50% em cirurgias de 4 a 5 horas — inclusive sob anestesia geral.",
      "hard", ["lombalgia", "fatores-de-risco"], SAESP106),

    card(D_COMP,
      "Quais são as contraindicações absolutas ao bloqueio do neuroeixo?",
      "Recusa do paciente, infecção no local da punção e choque",
      "Coagulopatia e hipertensão intracraniana também impedem o bloqueio na maioria das situações.",
      "easy", ["contraindicacao"], SAESP106,
      { reviewNotes: "Divergência: o SAESP classifica hipovolemia como absoluta e hipertensão intracraniana como relativa; o Miller faz o inverso." }),

    card(D_COMP,
      "Por que a hipertensão intracraniana contraindica o bloqueio do neuroeixo?",
      "Pelo risco de herniação cerebral após a perda de liquor",
      "A queda súbita de pressão no compartimento espinhal cria gradiente que favorece a herniação das estruturas encefálicas.",
      "medium", ["hipertensao-intracraniana", "contraindicacao"], SAESP105),

    card(D_COMP,
      "A lombalgia crônica sem déficit neurológico contraindica o bloqueio do neuroeixo?",
      "Não",
      "O registro pré-operatório detalhado do quadro neurológico é essencial para documentar o estado prévio.",
      "medium", ["lombalgia", "contraindicacao"], MILLER41),
  ],
};
