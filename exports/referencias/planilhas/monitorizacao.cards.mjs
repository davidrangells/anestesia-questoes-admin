// Flashcards originais — Monitorização em anestesia.
// Conteúdo redigido a partir do mapa de conceitos dos capítulos citados
// (nada copiado/traduzido literalmente). Números conferidos no texto extraído.
//
// Gerar planilha:
//   node scripts/build-flashcards-xlsx.mjs \
//     --in=exports/referencias/planilhas/monitorizacao.cards.mjs \
//     --out=exports/referencias/planilhas/flashcards_monitorizacao_2026-09-08.xlsx

const SAESP85 = "Tratado de Anestesiologia SAESP, 10ª ed. — cap. 85, Princípios da Monitorização e Instrumentação Intraoperatória";
const SAESP86 = "Tratado de Anestesiologia SAESP, 10ª ed. — cap. 86, Monitorização do Sistema Nervoso";
const SAESP87 = "Tratado de Anestesiologia SAESP, 10ª ed. — cap. 87, Monitorização do Sistema Respiratório";
const SAESP88 = "Tratado de Anestesiologia SAESP, 10ª ed. — cap. 88, Monitorização do Sistema Cardiovascular";
const SAESP94 = "Tratado de Anestesiologia SAESP, 10ª ed. — cap. 94, Regulação e Monitorização da Temperatura";

const THEME = {
  themeId: "monitorizacao",
  themeName: "Monitorização",
  moduleId: "me",
  examType: "ME",
  level: "R1",
};

const D_RESP = "monitorizacao-respiratoria";
const D_CV = "monitorizacao-cardiovascular";
const D_NEURO = "monitorizacao-neurologica";
const D_TEMP = "monitorizacao-temperatura";

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
    tema: "Monitorização",
    fontes: "SAESP 10ed caps. 85, 86, 87, 88 e 94",
    observacoes:
      "Cards originais. O Stoelting não tem capítulo de monitorização e o Miller 10ed não tem capítulo de temperatura. Alguns fatos clássicos (correspondência SpO2/PaO2, gradiente PaCO2-EtCO2, ondas da PVC em fibrilação atrial) não constam do texto extraído e foram deixados de fora.",
  },
  decks: [
    {
      deckId: D_RESP,
      title: "Monitorização — Respiratória",
      description: "Oximetria de pulso, causas de erro, capnografia e interpretação da curva de CO2.",
      moduleId: "me",
      themeId: THEME.themeId,
      order: 1,
    },
    {
      deckId: D_CV,
      title: "Monitorização — Cardiovascular",
      description: "Pressão arterial não invasiva e invasiva, PVC, débito cardíaco, responsividade a volume e eletrocardiografia.",
      moduleId: "me",
      themeId: THEME.themeId,
      order: 2,
    },
    {
      deckId: D_NEURO,
      title: "Monitorização — Profundidade anestésica",
      description: "BIS e EEG processado: parâmetros, interpretação, limitações e recomendações.",
      moduleId: "me",
      themeId: THEME.themeId,
      order: 3,
    },
    {
      deckId: D_TEMP,
      title: "Monitorização — Temperatura",
      description: "Termorregulação, fases da hipotermia perioperatória, consequências, sítios de medida e prevenção.",
      moduleId: "me",
      themeId: THEME.themeId,
      order: 4,
    },
  ],
  cards: [
    // ───────────── RESPIRATÓRIA ─────────────
    card(D_RESP,
      "Em que lei se baseia o cálculo da oximetria de pulso?",
      "Na lei de absorção de Beer-Lambert",
      "Relaciona a absorção de luz à concentração da substância absorvente no trajeto do feixe.",
      "medium", ["oximetria", "principio"], SAESP85),

    card(D_RESP,
      "Que comprimentos de onda o oxímetro de pulso convencional utiliza?",
      "660 nm (vermelho) e 940 nm (infravermelho)",
      "A oxi-hemoglobina absorve mais o infravermelho e a desoxi-hemoglobina absorve mais o vermelho.",
      "easy", ["oximetria", "comprimento-de-onda"], SAESP85),

    card(D_RESP,
      "Por que o oxímetro convencional não mede metemoglobina nem carboxi-hemoglobina?",
      "Porque usa apenas dois comprimentos de onda; seriam necessários pelo menos quatro",
      "É por isso que a suspeita de hemoglobina anômala exige co-oximetria para o diagnóstico.",
      "medium", ["oximetria", "dis-hemoglobinas"], SAESP85),

    card(D_RESP,
      "Qual a diferença entre saturação funcional e saturação fracional?",
      "A funcional considera só oxi e desoxi-hemoglobina; a fracional inclui todas as hemoglobinas",
      "O oxímetro de pulso mede a funcional, o que superestima a oxigenação quando há dis-hemoglobinas.",
      "hard", ["oximetria", "saturacao"], SAESP85),

    card(D_RESP,
      "Como a carboxi-hemoglobina afeta a leitura do oxímetro de pulso?",
      "Superestima a SpO2, porque absorve luz a 660 nm de modo semelhante à oxi-hemoglobina",
      "O intoxicado por monóxido de carbono pode ter SpO2 normal com hipoxemia tecidual grave.",
      "medium", ["oximetria", "carboxihemoglobina"], SAESP85),

    card(D_RESP,
      "Como a metemoglobina afeta a leitura do oxímetro de pulso?",
      "Empurra a leitura para um platô em torno de 85%, independentemente da saturação real",
      "Se a saturação verdadeira é maior que 85%, a leitura é falsamente baixa; se menor, é falsamente alta.",
      "hard", ["oximetria", "metemoglobina"], SAESP85),

    card(D_RESP,
      "A partir de que saturação a acurácia do oxímetro de pulso se torna insatisfatória?",
      "Abaixo de 80%",
      "Os aparelhos são calibrados com voluntários saudáveis, e a extrapolação para valores baixos é imprecisa.",
      "medium", ["oximetria", "acuracia"], SAESP87),

    card(D_RESP,
      "Quais fatores causam artefato na oximetria de pulso?",
      "Luz ambiente, movimento, deslocamento do sensor, baixa perfusão, azul de metileno e esmalte",
      "Estados de baixa perfusão incluem hipotensão, vasoconstrição, hipotermia e uso de vasopressor em dose alta.",
      "easy", ["oximetria", "artefato"], SAESP85),

    card(D_RESP,
      "Quanto o esmalte de unha altera a leitura da SpO2 e como contornar?",
      "Queda de até 2%, pior com preto e azul; basta lateralizar o sensor no dedo",
      "A luz atravessa o leito ungueal pela lateral do dedo, contornando a camada de esmalte.",
      "medium", ["oximetria", "esmalte"], SAESP87),

    card(D_RESP,
      "Qual sítio de medida tem a resposta mais rápida na oximetria de pulso?",
      "O lóbulo da orelha, seguido do dedo e por último o hálux",
      "No dedo o atraso pode ultrapassar 12 segundos em relação à orelha — relevante em situações de dessaturação rápida.",
      "hard", ["oximetria", "atraso"], SAESP87),

    card(D_RESP,
      "Por que a hiperoxia é mal avaliada pela oximetria de pulso?",
      "Porque valores altos caem na porção plana da curva de dissociação da hemoglobina",
      "Uma SpO2 de 100% pode corresponder a uma PaO2 de 100 ou de 400 mmHg — só a gasometria diferencia.",
      "medium", ["oximetria", "hiperoxia"], SAESP87),

    card(D_RESP,
      "Qual a diferença entre capnômetro e capnógrafo?",
      "O capnômetro mede o valor numérico; o capnógrafo também exibe a curva",
      "A curva é o que permite reconhecer padrões de obstrução, reinalação e problemas de posicionamento do tubo.",
      "easy", ["capnografia", "definicao"], SAESP85),

    card(D_RESP,
      "O que representa a fase 1 da curva de capnografia?",
      "A inspiração, com linha de base normalmente em zero",
      "Linha de base acima de zero indica reinalação de CO2, seja por válvula incompetente ou por cal sodada esgotada.",
      "medium", ["capnografia", "fases"], SAESP87),

    card(D_RESP,
      "O que representa a fase 2 da curva de capnografia?",
      "A subida rápida, com mistura do espaço morto anatômico e gás alveolar",
      "Sua inclinação depende da homogeneidade do esvaziamento pulmonar.",
      "medium", ["capnografia", "fases"], SAESP87),

    card(D_RESP,
      "O que representa a fase 3 da curva de capnografia?",
      "O platô alveolar; o EtCO2 é o valor no fim dessa fase",
      "Um platô inclinado, em vez de horizontal, indica esvaziamento pulmonar heterogêneo, como no broncoespasmo.",
      "medium", ["capnografia", "platô"], SAESP87),

    card(D_RESP,
      "O que sugere uma queda abrupta do EtCO2?",
      "Hiperventilação, embolia pulmonar ou desconexão do circuito",
      "A queda por embolia decorre do aumento súbito do espaço morto alveolar, com débito cardíaco caindo em paralelo.",
      "medium", ["capnografia", "queda-etco2"], SAESP87),

    card(D_RESP,
      "O que sugere uma curva de capnografia achatada, sem platô definido?",
      "Obstrução das vias aéreas ou aumento da resistência",
      "É o padrão do broncoespasmo e da obstrução parcial do tubo traqueal.",
      "medium", ["capnografia", "obstrucao"], SAESP87),

    card(D_RESP,
      "Como se calcula a fração de espaço morto pela equação de Bohr?",
      "VD/VT = (PaCO2 − EtCO2) / PaCO2",
      "Quanto maior a diferença entre o CO2 arterial e o expirado, maior a fração de espaço morto ventilada.",
      "hard", ["espaco-morto", "bohr"], SAESP87),

    card(D_RESP,
      "Qual é o valor normal do gradiente alvéolo-arterial de oxigênio em ar ambiente?",
      "5 a 10 mmHg",
      "Aumenta com a idade e em qualquer distúrbio de troca, como shunt ou alteração da relação ventilação-perfusão.",
      "medium", ["gradiente-a-a", "oxigenacao"], SAESP87),

    // ───────────── CARDIOVASCULAR ─────────────
    card(D_CV,
      "Qual é a dimensão correta do manguito de pressão não invasiva?",
      "Bexiga com comprimento de 80% e largura de pelo menos 40% da circunferência do braço",
      "É a relação aproximada de 2:1 entre comprimento e largura da bexiga insuflável.",
      "easy", ["pressao-arterial", "manguito"], SAESP88),

    card(D_CV,
      "Que erro produz um manguito estreito demais?",
      "Valores falsamente elevados",
      "Um manguito largo demais, ao contrário, subestima a pressão. Manguito frouxo também subestima.",
      "medium", ["pressao-arterial", "manguito", "erro"], SAESP88),

    card(D_CV,
      "Qual deve ser a velocidade de deflação do manguito?",
      "Cerca de 3 mmHg por segundo, ou 2 mmHg por batimento",
      "Deflação rápida subestima a pressão sistólica, por não permitir captar o primeiro batimento.",
      "hard", ["pressao-arterial", "deflacao"], SAESP85),

    card(D_CV,
      "Qual é a correção de pressão para cada 10 cm de diferença de altura em relação ao coração?",
      "Cerca de 7,3 mmHg",
      "Abaixo do coração deve-se subtrair; acima, somar. Fundamental na posição sentada e em cirurgia de ombro.",
      "hard", ["pressao-arterial", "altura"], SAESP85),

    card(D_CV,
      "Que valor de pressão arterial média é usado para definir hipotensão intraoperatória?",
      "PAM abaixo de 65 mmHg",
      "Valores entre 60 e 70 mmHg já se associam a lesão miocárdica, renal e a maior mortalidade.",
      "medium", ["hipotensao", "pam"], SAESP88),

    card(D_CV,
      "Onde deve ser nivelado o transdutor de pressão arterial invasiva?",
      "Na linha axilar média em decúbito dorsal, e ao nível do coração na posição sentada",
      "Para estimar a pressão de perfusão cerebral, nivelar na altura do polígono de Willis, aproximadamente o tragus.",
      "medium", ["pressao-invasiva", "nivelamento"], SAESP88),

    card(D_CV,
      "Como muda a curva de pressão arterial ao se afastar da aorta?",
      "A sistólica aumenta, a diastólica e a média diminuem, com maior amplitude do pulso",
      "Por isso a pressão radial não é idêntica à aórtica, o que é relevante em cirurgia cardíaca.",
      "hard", ["pressao-invasiva", "curva"], SAESP88),

    card(D_CV,
      "Qual é a limitação do teste de Allen antes da canulação radial?",
      "Não exclui isquemia distal, pois não avalia embolização digital",
      "Um teste alterado sugere procurar outro sítio, mas um teste normal não garante segurança.",
      "medium", ["teste-de-allen", "pressao-invasiva"], SAESP88),

    card(D_CV,
      "O que avalia o teste do flush (onda quadrada)?",
      "A resposta dinâmica do sistema de medida de pressão invasiva",
      "O esperado é uma onda quadrada seguida de até duas oscilações rápidas antes de retornar à linha de base.",
      "hard", ["teste-do-flush", "pressao-invasiva"], SAESP85),

    card(D_CV,
      "O que caracteriza o subamortecimento do sistema de pressão invasiva?",
      "Superestima a sistólica e subestima a diastólica, com muitas oscilações no teste do flush",
      "Ocorre com circuitos longos demais. A pressão média permanece confiável mesmo assim.",
      "hard", ["subamortecimento", "pressao-invasiva"], SAESP85),

    card(D_CV,
      "O que caracteriza o superamortecimento do sistema de pressão invasiva?",
      "Subestima a sistólica, com retorno lento e sem oscilações no teste do flush",
      "Causado por bolhas de ar ou coágulos no circuito; corrigir antes de tomar decisões com base no valor.",
      "hard", ["superamortecimento", "pressao-invasiva"], SAESP85),

    card(D_CV,
      "Qual é o valor normal da pressão venosa central?",
      "4 a 8 mmHg, ou 6 a 10 cmH2O, medidos na linha axilar média",
      "Valor isolado tem pouco valor para avaliar volemia, sobretudo em cardiopatas.",
      "easy", ["pvc", "valor-normal"], SAESP88),

    card(D_CV,
      "Quais são as ondas da curva de pressão venosa central?",
      "Três ascendentes (a, c, v) e duas descendentes (x e y)",
      "A onda a é a mais proeminente e corresponde à contração atrial, logo após a onda P do eletrocardiograma.",
      "medium", ["pvc", "curva"], SAESP88),

    card(D_CV,
      "O que gera a onda c da curva de pressão venosa central?",
      "A contração isovolumétrica do ventrículo direito, que abaula a tricúspide para o átrio",
      "Vem logo após a onda a, no início da sístole ventricular.",
      "hard", ["pvc", "onda-c"], SAESP88),

    card(D_CV,
      "O que representa a onda v da curva de pressão venosa central?",
      "O enchimento atrial pelo retorno venoso com a tricúspide ainda fechada",
      "É seguida pela descendente y, que corresponde ao esvaziamento atrial após a abertura da tricúspide.",
      "hard", ["pvc", "onda-v"], SAESP88),

    card(D_CV,
      "Como devem ser realizadas as punções venosas centrais?",
      "Guiadas por ultrassonografia",
      "É recomendação atual para todas as punções, por reduzir tentativas, punção arterial e pneumotórax.",
      "easy", ["puncao-central", "ultrassom"], SAESP88),

    card(D_CV,
      "A PVC e a pressão de oclusão da artéria pulmonar predizem resposta a volume?",
      "Não; medidas estáticas não devem ser usadas isoladamente para guiar a reposição",
      "Valores de 12 a 15 mmHg podem coexistir com hipovolemia, o que torna a decisão baseada nelas pouco confiável.",
      "medium", ["pvc", "responsividade-a-volume"], SAESP88),

    card(D_CV,
      "Como se calcula a variação da pressão de pulso (ΔPP)?",
      "100 × (PP máxima − PP mínima) dividido pela média das duas",
      "Reflete a interação coração-pulmão durante a ventilação com pressão positiva.",
      "hard", ["delta-pp", "formula"], SAESP88),

    card(D_CV,
      "Que valor de variação da pressão de pulso indica provável resposta a volume?",
      "Acima de 13%",
      "Abaixo de 13% é improvável que a infusão de volume adicional aumente o débito cardíaco.",
      "medium", ["delta-pp", "limiar"], SAESP88),

    card(D_CV,
      "Quais são os pré-requisitos para interpretar a variação da pressão de pulso?",
      "Ventilação controlada com volume de 8 mL/kg, ritmo sinusal e tórax fechado",
      "Também exige ausência de esforço respiratório, complacência pulmonar preservada e relação FC/FR abaixo de 3,6.",
      "hard", ["delta-pp", "pre-requisitos"], SAESP88),

    card(D_CV,
      "Qual é o valor normal da variação da pressão sistólica em ventilação mecânica?",
      "7 a 10 mmHg",
      "O componente delta-down (5 a 6 mmHg) é o mais acurado para identificar hipovolemia.",
      "hard", ["variacao-pressao-sistolica"], SAESP85),

    card(D_CV,
      "Qual derivação é mais sensível e específica para isquemia do ventrículo esquerdo?",
      "A derivação V5",
      "Para o ventrículo direito, a derivação de escolha é V4R. Monitorizar D2, V4 e V5 simultaneamente aumenta a detecção.",
      "medium", ["ecg", "isquemia", "v5"], SAESP88),

    card(D_CV,
      "Qual derivação é a melhor para avaliar a onda P e os ritmos?",
      "A derivação DII",
      "A onda P é mais bem observada em DII, aVF e V1, o que faz de DII a derivação padrão de monitorização de ritmo.",
      "easy", ["ecg", "dii", "ritmo"], SAESP88),

    card(D_CV,
      "Como se define isquemia subendocárdica no eletrocardiograma?",
      "Infradesnivelamento de pelo menos 1 mm até 80 ms após o ponto J",
      "O supradesnivelamento do segmento ST, por sua vez, indica isquemia transmural.",
      "medium", ["ecg", "isquemia", "segmento-st"], SAESP88),

    card(D_CV,
      "Qual filtro do monitor deve ser usado para avaliar o segmento ST?",
      "O modo diagnóstico, com banda de 0,05 a 150 Hz",
      "O modo monitor (0,5 a 40 Hz) atenua ruído, mas distorce o segmento ST e pode mascarar isquemia.",
      "hard", ["ecg", "filtro"], SAESP88),

    card(D_CV,
      "Quantas derivações são obtidas com um cabo de 5 eletrodos?",
      "Seis derivações do plano frontal mais uma precordial unipolar, em geral V5",
      "O cabo de 3 eletrodos oferece apenas derivações bipolares e é limitado para detectar isquemia.",
      "medium", ["ecg", "cabo"], SAESP85),

    card(D_CV,
      "A que corresponde 1 mm horizontal no papel de eletrocardiograma a 25 mm/s?",
      "0,04 segundo (o quadrado grande equivale a 0,20 segundo)",
      "Na vertical, 1 mm corresponde a 0,1 mV na calibração padrão.",
      "medium", ["ecg", "papel"], SAESP88),

    card(D_CV,
      "Qual é o limite superior do intervalo QT corrigido?",
      "440 ms em homens e 460 ms em mulheres",
      "Calculado pela fórmula de Bazett, dividindo o QT pela raiz quadrada do intervalo RR.",
      "medium", ["ecg", "qtc", "bazett"], SAESP88),

    // ───────────── PROFUNDIDADE ANESTÉSICA ─────────────
    card(D_NEURO,
      "Qual é a escala do índice bispectral (BIS)?",
      "De 0 a 100, sendo 100 o paciente completamente desperto",
      "Foi derivado de uma base de cerca de 1.500 pacientes e 5.000 horas de registro eletroencefalográfico.",
      "easy", ["bis", "escala"], SAESP85),

    card(D_NEURO,
      "Qual é o tempo de atraso do BIS em relação ao estado real do paciente?",
      "Cerca de 7,5 segundos, com atualização a cada segundo",
      "Esse atraso significa que o valor exibido reflete o passado recente, e não o instante presente.",
      "hard", ["bis", "delay"], SAESP85),

    card(D_NEURO,
      "Como se define a taxa de supressão no EEG processado?",
      "Percentual de intervalos maiores que 0,5 s com voltagem abaixo de ±5 microvolts nos últimos 60 s",
      "O valor normal em anestesia adequada é zero; taxa elevada indica anestesia excessivamente profunda.",
      "hard", ["taxa-de-supressao", "eeg"], SAESP85),

    card(D_NEURO,
      "Que valor de eletromiografia frontal é esperado durante anestesia geral?",
      "Abaixo de 30 dB",
      "Acima disso há atividade muscular frontal, que contamina o sinal e pode elevar falsamente o índice.",
      "hard", ["bis", "emg"], SAESP85),

    card(D_NEURO,
      "O que é a frequência de borda espectral (SEF 95%)?",
      "A frequência abaixo da qual está 95% da potência total do EEG até 30 Hz",
      "É um dos parâmetros derivados do processamento espectral e acompanha a profundidade anestésica.",
      "hard", ["sef", "eeg"], SAESP85),

    card(D_NEURO,
      "Que padrão de EEG caracteriza a profundidade anestésica adequada no adulto?",
      "Hipersincronização alfa e oscilações lentas",
      "Refletem, respectivamente, o acoplamento talamocortical e corticocortical característicos do estado anestésico.",
      "hard", ["eeg", "padrao"], SAESP85),

    card(D_NEURO,
      "Que padrão de EEG indica anestesia excessivamente profunda?",
      "O padrão de surto-supressão",
      "Alterna surtos de atividade com períodos isoelétricos e associa-se a desfechos piores em algumas populações.",
      "medium", ["eeg", "surto-supressao"], SAESP86),

    card(D_NEURO,
      "Quais fatores alteram a acurácia do EEG processado?",
      "Eletromiografia, eletrocautério, idade do paciente e doenças neurológicas prévias",
      "Por isso o valor deve ser interpretado junto aos demais parâmetros, nunca isoladamente.",
      "medium", ["bis", "limitacoes"], SAESP86),

    card(D_NEURO,
      "Que faixa do índice PSI (SedLine) corresponde à inconsciência?",
      "Entre 25 e 50",
      "É um índice concorrente do BIS, com escala também de 0 a 100 mas com faixas-alvo próprias.",
      "hard", ["psi", "sedline"], SAESP86),

    card(D_NEURO,
      "Em que situação o EEG processado é fortemente recomendado para prevenir despertar?",
      "Em pacientes sob anestesia venosa total (recomendação grau 1A)",
      "Na anestesia balanceada com halogenado, a recomendação é mais fraca, pois já existe a monitorização da concentração expirada.",
      "medium", ["bis", "despertar", "tiva"], SAESP85),

    card(D_NEURO,
      "O BIS abaixo de 60 exclui a possibilidade de despertar intraoperatório?",
      "Não; há relatos de consciência com valores considerados adequados",
      "O estudo BAG-RECALL não mostrou superioridade do EEG processado sobre a monitorização da concentração expirada.",
      "hard", ["bis", "despertar", "evidencia"], SAESP86),

    card(D_NEURO,
      "O EEG processado reduz o delirium pós-operatório?",
      "O estudo ENGAGES não demonstrou redução",
      "Já há evidência mais consistente de que reduz o consumo de anestésicos e acelera a recuperação.",
      "hard", ["eeg", "delirium", "engages"], SAESP86),

    card(D_NEURO,
      "Qual assimetria entre hemisférios é considerada normal no EEG processado?",
      "Até 20% no adulto",
      "Assimetrias maiores sugerem alteração de perfusão ou lesão estrutural em um dos hemisférios.",
      "hard", ["eeg", "assimetria"], SAESP85),

    // ───────────── TEMPERATURA ─────────────
    card(D_TEMP,
      "Qual é a faixa interlimiar de temperatura no indivíduo desperto?",
      "Cerca de 36,7 a 37,1 graus",
      "É a faixa em que não há resposta termorreguladora ativa. A anestesia alarga essa faixa em várias vezes.",
      "hard", ["termorregulacao", "interlimiar"], SAESP94),

    card(D_TEMP,
      "Qual é a primeira resposta termorreguladora deflagrada na hipotermia?",
      "A vasoconstrição",
      "O fluxo cutâneo pode cair até 100 vezes, reduzindo drasticamente a perda de calor pela superfície.",
      "medium", ["termorregulacao", "vasoconstricao"], SAESP94),

    card(D_TEMP,
      "Como os anestésicos alteram os limiares termorregulatórios?",
      "Propofol, opioides e alfa-2 os reduzem de forma linear; os halogenados, de forma não linear",
      "O resultado é o alargamento da faixa interlimiar, permitindo a queda da temperatura sem resposta compensatória.",
      "hard", ["termorregulacao", "anestesicos"], SAESP94),

    card(D_TEMP,
      "O que caracteriza a primeira fase da hipotermia perioperatória?",
      "Redistribuição interna de calor do centro para a periferia, na primeira hora",
      "É causada pela vasodilatação induzida pelos anestésicos, e não por perda de calor para o ambiente.",
      "medium", ["hipotermia", "redistribuicao"], SAESP94),

    card(D_TEMP,
      "O que caracteriza a segunda fase da hipotermia perioperatória?",
      "Queda quase linear da temperatura por 2 a 4 horas, por perda de calor para o ambiente",
      "Ocorre por convecção, irradiação, evaporação e condução, com a convecção respondendo por até 25% da perda.",
      "medium", ["hipotermia", "segunda-fase"], SAESP94),

    card(D_TEMP,
      "O que caracteriza a terceira fase da hipotermia perioperatória?",
      "O platô, em que a produção de calor se iguala à perda",
      "A vasoconstrição termorreguladora é o que estabelece esse equilíbrio, retendo calor no compartimento central.",
      "medium", ["hipotermia", "plato"], SAESP94),

    card(D_TEMP,
      "Por que os obesos sofrem menos redistribuição de calor?",
      "Dissipam menos calor metabólico, mantendo o gradiente centro-periferia menor",
      "A camada de gordura funciona como isolante e a periferia já está mais aquecida antes da indução.",
      "hard", ["hipotermia", "obesidade"], SAESP94),

    card(D_TEMP,
      "Por que a raquianestesia dificulta a percepção da hipotermia pelo paciente?",
      "O bloqueio simpático e sensitivo gera falsa sensação de aquecimento",
      "Além disso, a fase de platô não ocorre, pois a vasoconstrição está bloqueada abaixo do nível do bloqueio.",
      "hard", ["hipotermia", "raquianestesia"], SAESP94),

    card(D_TEMP,
      "Quanto uma hipotermia central de 1,5 grau afeta o sistema cardiovascular?",
      "Hipertensão, taquicardia, isquemia miocárdica e o triplo de arritmias ventriculares",
      "É uma das consequências mais graves da hipotermia não intencional, mediada por descarga adrenérgica.",
      "hard", ["hipotermia", "consequencias"], SAESP94),

    card(D_TEMP,
      "Como a hipotermia afeta a coagulação?",
      "Reduz a função plaquetária e a ativação da cascata, aumentando a perda sanguínea e a transfusão",
      "O efeito não aparece nos exames laboratoriais, que são realizados a 37 graus.",
      "medium", ["hipotermia", "coagulacao"], SAESP94),

    card(D_TEMP,
      "Qual efeito a hipotermia tem sobre a infecção de sítio cirúrgico?",
      "Aumenta a incidência, demonstrado em cirurgia de cólon",
      "A vasoconstrição reduz a oferta tecidual de oxigênio e prejudica a função dos neutrófilos.",
      "medium", ["hipotermia", "infeccao"], SAESP94),

    card(D_TEMP,
      "Quanto a CAM dos halogenados cai por grau de redução da temperatura?",
      "Cerca de 8% para cada grau centígrado",
      "Somado ao efeito prolongado dos bloqueadores neuromusculares, isso retarda o despertar do paciente hipotérmico.",
      "hard", ["hipotermia", "cam"], SAESP94),

    card(D_TEMP,
      "Quais são os sítios de medida que melhor estimam a temperatura cerebral?",
      "A membrana timpânica e a nasofaringe",
      "O esôfago distal e a artéria pulmonar aproximam-se mais da temperatura do miocárdio.",
      "medium", ["temperatura", "sitios"], SAESP94),

    card(D_TEMP,
      "Qual é o sítio de escolha para medir temperatura sob anestesia geral com intubação?",
      "O esôfago distal",
      "A sonda deve ficar no ponto de máxima ausculta dos batimentos cardíacos ou mais distalmente.",
      "medium", ["temperatura", "esofago"], SAESP94),

    card(D_TEMP,
      "A que profundidade se insere o sensor nasofaríngeo de temperatura?",
      "10 a 20 cm a partir das narinas",
      "É a alternativa quando se usa dispositivo supraglótico ou em bloqueio do neuroeixo com sedação.",
      "hard", ["temperatura", "nasofaringe"], SAESP94),

    card(D_TEMP,
      "Por que reto e bexiga são sítios menos precisos de temperatura?",
      "Por terem menor perfusão; a bexiga ainda depende do fluxo urinário",
      "Respondem com atraso às mudanças rápidas da temperatura central, o que limita seu uso intraoperatório.",
      "medium", ["temperatura", "reto", "bexiga"], SAESP94),

    card(D_TEMP,
      "Quais são os melhores sítios de medida de temperatura no pós-operatório?",
      "Sublingual e axilar",
      "Ambos estimam bem a temperatura central quando não há via aérea artificial nem acesso invasivo.",
      "medium", ["temperatura", "pos-operatorio"], SAESP94),

    card(D_TEMP,
      "Que percentual do calor metabólico é perdido pela superfície cutânea?",
      "Cerca de 90%",
      "É a razão pela qual o aquecimento da pele é a estratégia mais eficaz de prevenção da hipotermia.",
      "medium", ["hipotermia", "perda-de-calor"], SAESP94),

    card(D_TEMP,
      "Qual é o sistema de aquecimento mais efetivo na prevenção da hipotermia?",
      "O sistema de circulação de ar forçado aquecido",
      "Os melhores aparelhos transferem mais de 50 W através da pele, superando colchões e fluidos aquecidos.",
      "easy", ["hipotermia", "aquecimento"], SAESP94),

    card(D_TEMP,
      "A partir de que volume é necessário aquecer os fluidos infundidos?",
      "Acima de 2 L/h",
      "Abaixo disso o impacto térmico é pequeno. Os aquecedores trabalham em torno de 41 graus.",
      "hard", ["fluidos", "aquecimento"], SAESP94),

    card(D_TEMP,
      "Em que situações a temperatura central deve ser monitorizada?",
      "Em toda anestesia geral com duração acima de 30 minutos",
      "Também na raquianestesia quando se esperam alterações térmicas, como em cirurgias de médio e grande porte.",
      "easy", ["temperatura", "indicacao"], SAESP94),

    card(D_TEMP,
      "Por que o recém-nascido tem grande tendência à hipotermia?",
      "Dispõe apenas de termogênese sem tremor, com grande superfície corporal relativa",
      "A gordura marrom é a fonte de calor, e sua capacidade é limitada frente à perda pela superfície.",
      "medium", ["neonato", "hipotermia"], SAESP94),
  ],
};
