-- Apologetics section
-- Run this in the Supabase SQL Editor.

CREATE TYPE apologetics_category AS ENUM (
  'existence_of_god',
  'gospel_reliability',
  'resurrection'
);

CREATE TABLE apologetics_arguments (
  id                  TEXT PRIMARY KEY,
  category            apologetics_category NOT NULL,
  order_in_category   SMALLINT NOT NULL DEFAULT 0,
  title_en            TEXT NOT NULL,
  title_pt            TEXT,
  subtitle_en         TEXT,
  subtitle_pt         TEXT,
  -- Logical form (premises + conclusion) — NULL for non-syllogistic arguments
  logical_form_en     JSONB,
  logical_form_pt     JSONB,
  explanation_en      TEXT NOT NULL,
  explanation_pt      TEXT,
  historical_origin   TEXT,
  license             TEXT NOT NULL DEFAULT 'original'
);

-- ============================================================
-- EXISTENCE OF GOD
-- ============================================================

INSERT INTO apologetics_arguments
  (id, category, order_in_category, title_en, title_pt, subtitle_en, subtitle_pt,
   logical_form_en, logical_form_pt, explanation_en, explanation_pt, historical_origin)
VALUES

('kalam', 'existence_of_god', 1,
 'The Kalam Cosmological Argument',
 'O Argumento Cosmológico Kalam',
 'Everything that begins to exist has a cause; the universe began to exist.',
 'Tudo o que começa a existir tem uma causa; o universo começou a existir.',
 '{"premises": ["Everything that begins to exist has a cause.", "The universe began to exist."], "conclusion": "Therefore, the universe has a cause."}',
 '{"premises": ["Tudo o que começa a existir tem uma causa.", "O universo começou a existir."], "conclusion": "Logo, o universo tem uma causa."}',
 'The Kalam Cosmological Argument, formulated in its classical form by the Islamic philosopher Al-Ghazali (c. 1095) and developed rigorously in contemporary analytic philosophy, argues that the universe''s existence requires a transcendent cause. The second premise is supported by two independent lines of evidence: philosophical arguments against the coherence of an actually infinite regress of past events, and scientific cosmology — the standard Big Bang model indicates that space, time, matter, and energy all had an absolute beginning at a finite point in the past. Whatever caused the universe must be uncaused (to avoid an infinite regress), timeless and spaceless (since it brought time and space into existence), immensely powerful (to produce the entire universe from nothing), and personal — since a timeless, impersonal cause cannot freely choose to produce a temporal effect unless it is an agent capable of volition.',
 'O Argumento Cosmológico Kalam, formulado na sua forma clássica pelo filósofo islâmico Al-Ghazali (c. 1095) e desenvolvido rigorosamente na filosofia analítica contemporânea, argumenta que a existência do universo requer uma causa transcendente. A segunda premissa é sustentada por duas linhas de evidência independentes: argumentos filosóficos contra a coerência de uma regressão infinita real de eventos passados, e a cosmologia científica — o modelo padrão do Big Bang indica que o espaço, o tempo, a matéria e a energia tiveram um começo absoluto num ponto finito no passado. Seja o que for que causou o universo deve ser incausado (para evitar uma regressão infinita), atemporal e aespacial (pois trouxe o tempo e o espaço à existência), imensamente poderoso (para produzir o universo inteiro do nada), e pessoal — dado que uma causa atemporal e impessoal não pode escolher livremente produzir um efeito temporal a não ser que seja um agente capaz de volição.',
 'Al-Ghazali, Incoherence of the Philosophers (c. 1095); developed in contemporary philosophy by William Lane Craig.'),

('fine_tuning', 'existence_of_god', 2,
 'The Fine-Tuning Argument',
 'O Argumento da Afinação Fina',
 'The universe''s physical constants are calibrated with extraordinary precision for life to exist.',
 'As constantes físicas do universo estão calibradas com precisão extraordinária para a vida existir.',
 '{"premises": ["The fine-tuning of the universe''s physical constants is either the result of physical necessity, chance, or design.", "It is not the result of physical necessity or chance."], "conclusion": "Therefore, the fine-tuning is the result of design."}',
 '{"premises": ["A afinação fina das constantes físicas do universo é resultado de necessidade física, acaso ou desígnio.", "Não é resultado de necessidade física nem de acaso."], "conclusion": "Logo, a afinação fina é resultado de desígnio."}',
 'The fundamental constants of physics — including the gravitational constant, the cosmological constant, the strong nuclear force, the weak nuclear force, and the ratio of matter to antimatter — are calibrated to extraordinary precision for complex, carbon-based life to be possible. Physicists have calculated that even minute alterations in many of these values would produce a universe incapable of sustaining any form of life: stars could not form, atoms could not bond, or the universe would collapse or expand too rapidly. Physical necessity would require an independent theory demonstrating why the constants must take their observed values — no such theory currently exists. The probability of all constants aligning by chance is, on most physical calculations, so vanishingly small as to be effectively impossible. The most parsimonious inference from the evidence is intentional fine-tuning by a rational cause.',
 'As constantes fundamentais da física — incluindo a constante gravitacional, a constante cosmológica, a força nuclear forte, a força nuclear fraca e a proporção entre matéria e antimatéria — estão calibradas com precisão extraordinária para que vida complexa de base carbónica seja possível. Os físicos calcularam que mesmo alterações ínfimas em muitos destes valores produziriam um universo incapaz de sustentar qualquer forma de vida: as estrelas não se formariam, os átomos não se ligariam, ou o universo colapsaria ou expandir-se-ia demasiado rapidamente. A necessidade física exigiria uma teoria independente que demonstrasse por que as constantes devem ter os valores observados — tal teoria não existe atualmente. A probabilidade de todas as constantes convergirem por acaso é, segundo a maioria dos cálculos físicos, tão ínfima que é efetivamente impossível. A inferência mais parcimoniosa a partir das evidências é um desígnio intencional por parte de uma causa racional.',
 'Fred Hoyle (1983); Robin Collins; developed as a formal argument by contemporary philosophers of science.'),

('moral', 'existence_of_god', 3,
 'The Moral Argument',
 'O Argumento Moral',
 'Objective moral values exist and require a transcendent grounding.',
 'Os valores morais objetivos existem e requerem um fundamento transcendente.',
 '{"premises": ["If God does not exist, objective moral values and duties do not exist.", "Objective moral values and duties do exist."], "conclusion": "Therefore, God exists."}',
 '{"premises": ["Se Deus não existe, não existem valores e deveres morais objetivos.", "Existem valores e deveres morais objetivos."], "conclusion": "Logo, Deus existe."}',
 'The Moral Argument observes that if the universe is the product of purely impersonal, material processes, moral claims such as "torturing the innocent is wrong" cannot be objectively true — they would merely express evolutionary adaptations, cultural conditioning, or personal preference. Yet virtually all people act and reason as though some moral truths are objective and binding, independent of any individual''s or culture''s opinion. The best explanation for the existence of objective moral values is that they are grounded in the nature of a perfectly good, personal God who created rational beings in his image. The argument does not claim that atheists cannot behave morally — it claims that without God, moral statements lack the metaphysical grounding necessary to be objectively true rather than merely subjectively preferred.',
 'O Argumento Moral observa que, se o universo é produto de processos puramente impessoais e materiais, afirmações morais como "torturar inocentes é errado" não podem ser objetivamente verdadeiras — expressariam apenas adaptações evolutivas, condicionamento cultural ou preferência pessoal. No entanto, praticamente todas as pessoas agem e raciocinam como se algumas verdades morais fossem objetivas e vinculativas, independentemente da opinião de qualquer indivíduo ou cultura. A melhor explicação para a existência de valores morais objetivos é que estão fundamentados na natureza de um Deus pessoal e perfeitamente bom que criou seres racionais à sua imagem. O argumento não afirma que os ateus não podem comportar-se moralmente — afirma que sem Deus, as afirmações morais carecem do fundamento metafísico necessário para serem objetivamente verdadeiras em vez de meramente preferidas subjetivamente.',
 'Immanuel Kant (deontological form); popularized in contemporary philosophy by C.S. Lewis (Mere Christianity, 1952) and William Lane Craig.'),

('ontological', 'existence_of_god', 4,
 'The Ontological Argument',
 'O Argumento Ontológico',
 'The very concept of a maximally great being entails its existence in reality.',
 'O próprio conceito de um ser maximamente grandioso implica a sua existência na realidade.',
 '{"premises": ["God is, by definition, a maximally great being — one than which no greater can be conceived.", "A being that exists in reality is greater than one that exists only as a concept.", "If God existed only as a concept, a greater being — one that exists in reality — could be conceived."], "conclusion": "Therefore, God exists in reality."}',
 '{"premises": ["Deus é, por definição, um ser maximamente grandioso — aquele maior do qual nada pode ser concebido.", "Um ser que existe na realidade é maior do que um que existe apenas como conceito.", "Se Deus existisse apenas como conceito, poderia ser concebido um ser maior — um que existisse na realidade."], "conclusion": "Logo, Deus existe na realidade."}',
 'The Ontological Argument, first formulated by Anselm of Canterbury in his Proslogion (1078), argues from the very concept of God to his necessary existence. Anselm defined God as "that than which nothing greater can be conceived." If God existed only in the mind and not in reality, then a greater being — one that exists in reality — could be conceived. But then that being, and not the merely conceptual one, would be God. Therefore God must exist in reality. Alvin Plantinga''s contemporary modal version reformulates the argument using possible worlds semantics: if a maximally great being is even possible (i.e., exists in some possible world), then it necessarily exists in all possible worlds, including the actual one — since a being whose existence is merely contingent would not be maximally great.',
 'O Argumento Ontológico, formulado pela primeira vez por Anselmo de Cantuária no seu Proslogion (1078), argumenta a partir do próprio conceito de Deus para a sua existência necessária. Anselmo definiu Deus como "aquele maior do qual nada pode ser concebido." Se Deus existisse apenas na mente e não na realidade, então um ser maior — um que existisse na realidade — poderia ser concebido. Mas então esse ser, e não o meramente conceptual, seria Deus. Logo, Deus deve existir na realidade. A versão modal contemporânea de Alvin Plantinga reformula o argumento usando semântica de mundos possíveis: se um ser maximamente grandioso é sequer possível (ou seja, existe em algum mundo possível), então existe necessariamente em todos os mundos possíveis, incluindo o atual — uma vez que um ser cuja existência fosse meramente contingente não seria maximamente grandioso.',
 'Anselm of Canterbury, Proslogion (1078); modal form by Alvin Plantinga, The Nature of Necessity (1974).'),

('contingency', 'existence_of_god', 5,
 'The Contingency Argument',
 'O Argumento da Contingência',
 'The universe is contingent and therefore requires a necessary being as its ultimate explanation.',
 'O universo é contingente e requer um ser necessário como explicação última.',
 '{"premises": ["Everything that exists has an explanation of its existence, either in the necessity of its own nature or in an external cause.", "The universe exists.", "The universe does not exist by the necessity of its own nature — it could have not existed."], "conclusion": "Therefore, the universe has an external cause: a necessary being that exists by the necessity of its own nature."}',
 '{"premises": ["Tudo o que existe tem uma explicação da sua existência, seja na necessidade da sua própria natureza, seja numa causa externa.", "O universo existe.", "O universo não existe por necessidade da sua própria natureza — poderia não ter existido."], "conclusion": "Logo, o universo tem uma causa externa: um ser necessário que existe pela necessidade da sua própria natureza."}',
 'Leibniz''s Cosmological Argument from Contingency begins with the Principle of Sufficient Reason: everything that exists has an explanation of why it exists rather than not. The universe — all of physical, temporal, contingent reality — does not explain its own existence. There is no contradiction in imagining it had never existed. Therefore its existence requires an external cause. This cause cannot itself be contingent, for it would then require its own cause, generating an infinite regress or a vicious circle. The cause must therefore be a necessary being — one whose non-existence is impossible. This necessary being must further be non-physical (since it is the cause of all matter), timeless (since it is the cause of time), enormously powerful (since it is the cause of everything), and capable of producing contingent effects — which implies personal agency.',
 'O Argumento da Contingência de Leibniz parte do Princípio de Razão Suficiente: tudo o que existe tem uma explicação de por que existe em vez de não existir. O universo — toda a realidade física, temporal e contingente — não explica a sua própria existência. Não há contradição em imaginar que nunca tivesse existido. Logo, a sua existência requer uma causa externa. Esta causa não pode ser ela própria contingente, pois necessitaria então da sua própria causa, gerando uma regressão infinita ou um círculo vicioso. A causa deve portanto ser um ser necessário — aquele cuja não-existência é impossível. Este ser necessário deve ser ainda não-físico (pois é a causa de toda a matéria), atemporal (pois é a causa do tempo), imensamente poderoso (pois é a causa de tudo), e capaz de produzir efeitos contingentes — o que implica agência pessoal.',
 'Gottfried Wilhelm Leibniz, Principles of Nature and Grace (1714); developed by Alexander Pruss and Robert Koons.');

-- ============================================================
-- GOSPEL RELIABILITY
-- ============================================================

INSERT INTO apologetics_arguments
  (id, category, order_in_category, title_en, title_pt, subtitle_en, subtitle_pt,
   logical_form_en, logical_form_pt, explanation_en, explanation_pt, historical_origin)
VALUES

('multiple_attestation', 'gospel_reliability', 1,
 'Multiple Attestation',
 'Atestação Múltipla',
 'The same events and sayings appear in multiple independent sources.',
 'Os mesmos eventos e ditos aparecem em múltiplas fontes independentes.',
 NULL, NULL,
 'A tradition or event gains historical credibility when it is attested in multiple independent sources, since independent witnesses are unlikely to have fabricated the same details in coordination. The core events of Jesus''s life and ministry — his baptism by John, his proclamation of the Kingdom of God, his table fellowship with sinners, the Last Supper, his crucifixion under Pontius Pilate, and early reports of resurrection appearances — are attested independently in Mark, the Q source (reconstructed behind Matthew and Luke), the distinctive material in Luke (L), the distinctive material in Matthew (M), John, Paul''s letters, and non-Christian sources including Josephus (Antiquities 18.3.3; 20.9.1) and Tacitus (Annals 15.44). The convergence of these independent streams of testimony makes coordinated fabrication implausible.',
 'Uma tradição ou evento ganha credibilidade histórica quando é atestado em múltiplas fontes independentes, uma vez que testemunhas independentes dificilmente fabricariam os mesmos detalhes de forma coordenada. Os eventos centrais da vida e ministério de Jesus — o seu batismo por João, a sua proclamação do Reino de Deus, a sua comunhão à mesa com pecadores, a Última Ceia, a sua crucificação sob Pôncio Pilatos e os primeiros relatos de aparições da ressurreição — são atestados independentemente em Marcos, na fonte Q (reconstruída por trás de Mateus e Lucas), no material peculiar de Lucas (L), no material peculiar de Mateus (M), em João, nas cartas de Paulo, e em fontes não-cristãs incluindo Josefo (Antiguidades 18.3.3; 20.9.1) e Tácito (Anais 15.44). A convergência destas correntes independentes de testemunho torna a fabricação coordenada implausível.',
 'Developed in form criticism by Ernst Troeltsch and applied to New Testament studies by E.P. Sanders and others.'),

('criterion_of_embarrassment', 'gospel_reliability', 2,
 'Criterion of Embarrassment',
 'Critério do Embaraço',
 'Details counterproductive for early Christians were retained — therefore they were not invented.',
 'Detalhes contraproducentes para os primeiros cristãos foram retidos — portanto não foram inventados.',
 NULL, NULL,
 'A detail that would have been embarrassing, counterproductive, or difficult to explain for early Christians is unlikely to have been invented by them — no author fabricates material that undermines their own credibility. Its presence in the sources therefore constitutes evidence of authenticity. Key examples include: Jesus being baptized by John the Baptist, which implied subordination to John and association with a baptism "for the repentance of sins" (difficult to explain if Jesus was sinless); Jesus''s cry of desolation from the cross, "My God, my God, why have you forsaken me?" (difficult to reconcile with a triumphant Messiah); and — most strikingly — women as the first and primary witnesses to the empty tomb. In first-century Jewish Palestine, women''s testimony was not accorded the same legal credibility as men''s. If the resurrection accounts had been invented, the authors would almost certainly have named male disciples as the primary witnesses. The retention of the women''s testimony is a strong indicator of authentic historical memory.',
 'Um detalhe que teria sido embaraçoso, contraproducente ou difícil de explicar para os primeiros cristãos dificilmente teria sido inventado por eles — nenhum autor fabrica material que prejudica a sua própria credibilidade. A sua presença nas fontes constitui, por isso, evidência de autenticidade. Exemplos fundamentais incluem: Jesus ser batizado por João Batista, o que implicava subordinação a João e associação com um batismo "para a remissão dos pecados" (difícil de explicar se Jesus era sem pecado); o grito de desolação de Jesus na cruz, "Deus meu, Deus meu, por que me abandonaste?" (difícil de conciliar com um Messias triunfante); e — de forma mais marcante — as mulheres como primeiras e principais testemunhas do túmulo vazio. Na Palestina judaica do século I, o testemunho das mulheres não tinha o mesmo peso jurídico que o dos homens. Se os relatos da ressurreição tivessem sido inventados, os autores teriam quase certamente nomeado discípulos masculinos como testemunhas principais. A retenção do testemunho das mulheres é um forte indicador de memória histórica autêntica.',
 'Applied to New Testament historiography by John P. Meier, A Marginal Jew (1991).'),

('enemy_attestation', 'gospel_reliability', 3,
 'Enemy Attestation',
 'Atestação Inimiga',
 'Even opponents of Christianity confirmed key facts about Jesus.',
 'Mesmo os opositores do cristianismo confirmaram factos fundamentais sobre Jesus.',
 NULL, NULL,
 'Details confirmed by opponents or critics of early Christianity carry exceptional evidential weight, since those sources had strong motivation to deny or disprove Christian claims if they could. The Roman historian Tacitus, writing around 116 AD, states in his Annals (15.44) that "Christus, from whom the name had its origin, suffered the extreme penalty during the reign of Tiberius at the hands of one of our procurators, Pontius Pilatus" — independently of any Christian source, and with the evident intention of explaining what he considered a harmful superstition. The Jewish historian Josephus (Antiquities 18.3.3; 20.9.1) refers to Jesus''s execution and to the martyrdom of "James the brother of Jesus who was called Christ." Crucially, Jewish authorities in the Gospel accounts do not deny the empty tomb — instead they circulate the claim that the disciples stole the body (Matthew 28:13), which presupposes and concedes the tomb was empty.',
 'Detalhes confirmados por opositores ou críticos do cristianismo primitivo têm um peso evidencial excecional, uma vez que essas fontes tinham forte motivação para negar ou refutar as afirmações cristãs, se pudessem. O historiador romano Tácito, escrevendo por volta de 116 d.C., afirma nos seus Anais (15.44) que "Cresto, de quem o nome tinha a sua origem, sofreu a pena extrema durante o reinado de Tibério pelas mãos de um dos nossos procuradores, Pôncio Pilatos" — independentemente de qualquer fonte cristã, e com a evidente intenção de explicar o que considerava uma superstição nociva. O historiador judeu Josefo (Antiguidades 18.3.3; 20.9.1) refere a execução de Jesus e o martírio de "Tiago, irmão de Jesus, chamado Cristo." De forma decisiva, as autoridades judaicas nos relatos dos Evangelhos não negam o túmulo vazio — em vez disso, fazem circular a afirmação de que os discípulos roubaram o corpo (Mateus 28:13), o que pressupõe e concede que o túmulo estava vazio.',
 'Tacitus, Annals 15.44 (c. 116 AD); Josephus, Antiquities 18.3.3; 20.9.1 (c. 93–94 AD).'),

('early_dating', 'gospel_reliability', 4,
 'Early Dating of Sources',
 'Datação Precoce das Fontes',
 'The Gospels and Paul''s letters were composed within the lifetime of eyewitnesses.',
 'Os Evangelhos e as cartas de Paulo foram compostos durante a vida das testemunhas oculares.',
 NULL, NULL,
 'The closer a document is in time to the events it describes, and the more direct access it has to eyewitnesses, the more credible it is as historical testimony. Paul''s first letter to the Corinthians (c. 53–54 AD) contains in 1 Corinthians 15:3–8 a pre-Pauline creed that most New Testament scholars date to within two to five years of the crucifixion (c. 30–35 AD). Paul explicitly notes that he received this tradition and passed it on, and that he had personally met Cephas (Peter) and James, brother of Jesus (Galatians 1:18–19) — direct contact with primary witnesses. The Gospel of Mark, widely held to be the earliest Gospel, is dated by most scholars to 65–70 AD — within forty years of the events, and within the lifetime of many eyewitnesses. All four Gospels were composed before the end of the first century, in an era when eyewitness testimony and living memory could still be consulted and challenged.',
 'Quanto mais próximo no tempo um documento está dos eventos que descreve, e quanto mais acesso direto tem a testemunhas oculares, mais credível é como testemunho histórico. A primeira carta de Paulo aos Coríntios (c. 53–54 d.C.) contém em 1 Coríntios 15:3–8 um credo pré-paulino que a maioria dos estudiosos do Novo Testamento data de dois a cinco anos após a crucificação (c. 30–35 d.C.). Paulo nota explicitamente que recebeu esta tradição e a transmitiu, e que conheceu pessoalmente Cefas (Pedro) e Tiago, irmão de Jesus (Gálatas 1:18–19) — contacto direto com testemunhas primárias. O Evangelho de Marcos, amplamente considerado o Evangelho mais antigo, é datado pela maioria dos estudiosos de 65–70 d.C. — dentro de quarenta anos dos eventos e durante a vida de muitas testemunhas oculares. Todos os quatro Evangelhos foram compostos antes do final do primeiro século, numa era em que o testemunho ocular e a memória viva podiam ainda ser consultados e contestados.',
 'Richard Bauckham, Jesus and the Eyewitnesses (2006); Martin Hengel, The Four Gospels and the One Gospel of Jesus Christ (2000).'),

('historical_coherence', 'gospel_reliability', 5,
 'Historical Coherence',
 'Coerência Histórica',
 'The Gospels accurately reflect the known details of first-century Palestine.',
 'Os Evangelhos refletem com precisão os detalhes conhecidos da Palestina do século I.',
 NULL, NULL,
 'A document''s historical credibility increases when its incidental details — geography, customs, political structures, linguistic usage, social norms — accurately reflect the known historical setting it claims to describe, without the anachronisms that would be expected in a later fabrication. The Gospels demonstrate consistent coherence with first-century Palestinian Jewish and Roman reality on multiple fronts: the personal names used for characters (James, Joseph, Mary, Simon, Judas, Salome) correspond precisely to the most common Jewish names of the period as documented in the ossuary record and other archaeological sources; the political and religious institutions mentioned (Sanhedrin, Pharisees, Sadducees, Roman procurators) match what is known from Josephus and archaeology; the geography of Galilee and Judea is accurately reflected; and the agricultural, economic, and social practices depicted align with first-century Jewish life. The incidental accuracy of these details, which would have required extraordinary knowledge for a later fabricator, supports the conclusion that the Gospels draw on authentic first-century sources.',
 'A credibilidade histórica de um documento aumenta quando os seus detalhes incidentais — geografia, costumes, estruturas políticas, uso linguístico, normas sociais — refletem com precisão o contexto histórico conhecido que afirma descrever, sem os anacronismos que seriam de esperar numa fabricação posterior. Os Evangelhos demonstram coerência consistente com a realidade judaica palestiniana e romana do século I em múltiplas frentes: os nomes pessoais usados para as personagens (Tiago, José, Maria, Simão, Judas, Salomé) correspondem precisamente aos nomes judaicos mais comuns do período, tal como documentados no registo de ossuários e outras fontes arqueológicas; as instituições políticas e religiosas mencionadas (Sinédrio, Fariseus, Saduceus, procuradores romanos) coincidem com o que se sabe de Josefo e da arqueologia; a geografia da Galileia e da Judeia está corretamente refletida; e as práticas agrícolas, económicas e sociais retratadas alinham-se com a vida judaica do século I. A precisão incidental destes detalhes, que exigiria um conhecimento extraordinário de um fabricador posterior, apoia a conclusão de que os Evangelhos se baseiam em fontes autênticas do século I.',
 'James D.G. Dunn, Jesus Remembered (2003); N.T. Wright, The New Testament and the People of God (1992).');

-- ============================================================
-- RESURRECTION — MAXIMUM FACTS
-- ============================================================

INSERT INTO apologetics_arguments
  (id, category, order_in_category, title_en, title_pt, subtitle_en, subtitle_pt,
   logical_form_en, logical_form_pt, explanation_en, explanation_pt, historical_origin)
VALUES

('death_by_crucifixion', 'resurrection', 1,
 'Death by Crucifixion',
 'Morte por Crucificação',
 'Jesus''s death by Roman crucifixion is among the best-attested facts of ancient history.',
 'A morte de Jesus por crucificação romana está entre os factos mais atestados da história antiga.',
 NULL, NULL,
 'That Jesus died by Roman crucifixion is attested by an unusually broad range of independent sources. It is confirmed by all four Gospels; by Paul (1 Corinthians 15:3: "Christ died for our sins"); by the Roman historian Tacitus, who states in his Annals (15.44) that Christ "suffered the extreme penalty during the reign of Tiberius at the hands of one of our procurators, Pontius Pilatus"; by Josephus (Antiquities 18.3.3); and by Lucian of Samosata. Roman crucifixion was designed by professionals specifically to ensure death, and soldiers who allowed a condemned prisoner to survive faced execution themselves. The proposal that Jesus merely fainted and was mistakenly pronounced dead (the "swoon theory") cannot account for the combined effects of flogging, crucifixion, and the lance wound to the side described in John 19:34, nor for the soldiers'' professional verification of death before releasing the body.',
 'Que Jesus morreu por crucificação romana é atestado por uma gama invulgarmente ampla de fontes independentes. É confirmado pelos quatro Evangelhos; por Paulo (1 Coríntios 15:3: "Cristo morreu pelos nossos pecados"); pelo historiador romano Tácito, que afirma nos seus Anais (15.44) que Cristo "sofreu a pena extrema durante o reinado de Tibério pelas mãos de um dos nossos procuradores, Pôncio Pilatos"; por Josefo (Antiguidades 18.3.3); e por Luciano de Samósata. A crucificação romana foi concebida por profissionais especificamente para garantir a morte, e os soldados que permitissem que um condenado sobrevivesse enfrentavam eles próprios a execução. A proposta de que Jesus simplesmente desmaiou e foi erroneamente declarado morto (a "teoria do desmaio") não pode explicar os efeitos combinados da flagelação, da crucificação e do golpe de lança no lado descrito em João 19:34, nem a verificação profissional da morte pelos soldados antes de libertar o corpo.',
 'Tacitus, Annals 15.44 (c. 116 AD); Josephus, Antiquities 18.3.3; all four Gospels; Paul, 1 Corinthians 15:3.'),

('empty_tomb', 'resurrection', 2,
 'The Empty Tomb',
 'O Túmulo Vazio',
 'Multiple independent lines of evidence point to the tomb being empty on the third day.',
 'Múltiplas linhas de evidência independentes apontam para o túmulo estar vazio ao terceiro dia.',
 NULL, NULL,
 'The historical evidence for the empty tomb is substantial and multi-layered. First, all four Gospels report the empty tomb independently, representing at least two or three independent source traditions. Second, the proclamation of the resurrection in Jerusalem, beginning just weeks after the crucifixion (Acts 2), would have been immediately and decisively falsifiable had the tomb still contained a body — enemies of the movement had both the motivation and the proximity to produce it. Third, the earliest Jewish counter-argument — that the disciples stole the body (Matthew 28:13) — presupposes and implicitly concedes the tomb was empty, since it attempts to explain the absence of the body rather than deny it. Fourth, the primary witnesses were women, whose testimony carried less cultural weight in first-century Palestine: no fabricator seeking credibility would have chosen women as the lead witnesses. Most historians who study the question, including many who are not Christians, accept the empty tomb as a historical datum requiring explanation.',
 'A evidência histórica para o túmulo vazio é substancial e com múltiplas camadas. Em primeiro lugar, os quatro Evangelhos relatam o túmulo vazio independentemente, representando pelo menos duas ou três tradições de fontes independentes. Em segundo lugar, a proclamação da ressurreição em Jerusalém, começando apenas semanas após a crucificação (Atos 2), teria sido imediata e decisivamente falsificável se o túmulo ainda contivesse um corpo — os inimigos do movimento tinham tanto a motivação como a proximidade para o produzir. Em terceiro lugar, o primeiro contra-argumento judaico — que os discípulos roubaram o corpo (Mateus 28:13) — pressupõe e concede implicitamente que o túmulo estava vazio, uma vez que tenta explicar a ausência do corpo em vez de a negar. Em quarto lugar, as principais testemunhas eram mulheres, cujo testemunho tinha menos peso cultural na Palestina do século I: nenhum fabricador que procurasse credibilidade teria escolhido mulheres como testemunhas principais. A maioria dos historiadores que estudam a questão, incluindo muitos que não são cristãos, aceita o túmulo vazio como um dado histórico que requer explicação.',
 'All four Gospels; Acts 2; Matthew 28:13 (implicit enemy attestation).'),

('early_creed', 'resurrection', 3,
 'The Early Creed of 1 Corinthians 15',
 'O Credo Precoce de 1 Coríntios 15',
 'A pre-Pauline formula transmitted within years of the crucifixion names multiple eyewitnesses.',
 'Uma fórmula pré-paulina transmitida poucos anos após a crucificação nomeia múltiplas testemunhas oculares.',
 NULL, NULL,
 'The passage 1 Corinthians 15:3–8, in which Paul explicitly states "what I received I passed on to you as of first importance," contains a pre-Pauline creedal formula. Linguistic markers indicate it predates Paul''s letter (c. 53–54 AD) by decades: the parallelism of the structure, the formula language ("that he died... that he was buried... that he was raised... that he appeared"), the Aramaic name "Cephas" (rather than the Greek "Peter"), and the technical transmission terminology ("received"/"passed on") characteristic of formal Jewish oral tradition. Most New Testament scholars date this creed to within two to five years of the crucifixion — c. 30–35 AD. The creed explicitly names recipients of resurrection appearances: Cephas, the Twelve, more than five hundred people at once (most of whom Paul notes were still alive and could be questioned), James, all the apostles, and Paul himself. This is the earliest written testimony to the resurrection, and it is sourced from someone (Paul) who personally met Cephas and James within just a few years of the events (Galatians 1:18–19).',
 'A passagem 1 Coríntios 15:3–8, na qual Paulo afirma explicitamente "o que recebi, isso também vos transmiti como de primordial importância," contém uma fórmula credal pré-paulina. Marcadores linguísticos indicam que é anterior à carta de Paulo (c. 53–54 d.C.) por décadas: o paralelismo da estrutura, a linguagem de fórmula ("que morreu... que foi sepultado... que ressuscitou... que apareceu"), o nome aramaico "Cefas" (em vez do grego "Pedro"), e a terminologia técnica de transmissão ("recebeu"/"transmitiu") característica da tradição oral judaica formal. A maioria dos estudiosos do Novo Testamento data este credo de dois a cinco anos após a crucificação — c. 30–35 d.C. O credo nomeia explicitamente os destinatários das aparições da ressurreição: Cefas, os Doze, mais de quinhentas pessoas de uma vez (a maioria das quais Paulo nota que ainda estava viva e podia ser interrogada), Tiago, todos os apóstolos e o próprio Paulo. Este é o testemunho escrito mais antigo da ressurreição, e provém de alguém (Paulo) que conheceu pessoalmente Cefas e Tiago apenas alguns anos após os eventos (Gálatas 1:18–19).',
 'Paul, 1 Corinthians 15:3–8 (c. 53–54 AD); Galatians 1:18–19; analyzed by James D.G. Dunn and N.T. Wright.'),

('post_mortem_appearances', 'resurrection', 4,
 'Post-Mortem Appearances',
 'Aparições Pós-Morte',
 'Jesus appeared to multiple individuals and groups after his death, attested across independent sources.',
 'Jesus apareceu a múltiplos indivíduos e grupos após a sua morte, atestado em fontes independentes.',
 NULL, NULL,
 'The post-mortem appearances of Jesus are reported across multiple independent sources. The early creed of 1 Corinthians 15:3–8 (c. 30–35 AD) lists appearances to Peter, the Twelve, more than five hundred at once, James, all the apostles, and Paul. The Gospel accounts, which represent at least two or three independent traditions, add appearances to Mary Magdalene, to two disciples on the road to Emmaus, and to the disciples gathered as a group. These appearances are characterized by features that distinguish them from the grief hallucinations or visions that sceptics sometimes propose: they occurred to multiple people simultaneously (including the five hundred), to individuals who were not expecting a resurrection (Mary Magdalene, the disciples on the road to Emmaus, James), and to someone who was actively hostile to the Christian movement (Paul). The variety of recipients, settings, and circumstances across independent sources makes a purely psychological explanation difficult to sustain.',
 'As aparições pós-morte de Jesus são relatadas em múltiplas fontes independentes. O credo precoce de 1 Coríntios 15:3–8 (c. 30–35 d.C.) lista aparições a Pedro, aos Doze, a mais de quinhentas pessoas de uma vez, a Tiago, a todos os apóstolos e a Paulo. Os relatos dos Evangelhos, que representam pelo menos duas ou três tradições independentes, acrescentam aparições a Maria Madalena, a dois discípulos no caminho para Emaús e aos discípulos reunidos em grupo. Estas aparições caracterizam-se por traços que as distinguem das alucinações de luto ou visões que os céticos por vezes propõem: ocorreram a múltiplas pessoas simultaneamente (incluindo as quinhentas), a indivíduos que não esperavam uma ressurreição (Maria Madalena, os discípulos no caminho para Emaús, Tiago) e a alguém que era ativamente hostil ao movimento cristão (Paulo). A variedade de destinatários, contextos e circunstâncias em fontes independentes torna difícil sustentar uma explicação puramente psicológica.',
 '1 Corinthians 15:3–8; all four Gospels; Acts 1:3.'),

('conversion_of_paul', 'resurrection', 5,
 'Conversion of Paul',
 'Conversão de Paulo',
 'A persecutor of Christians became its most prolific theologian after a claimed encounter with the risen Jesus.',
 'Um perseguidor dos cristãos tornou-se o seu mais prolífico teólogo após um encontro alegado com o Jesus ressuscitado.',
 NULL, NULL,
 'Saul of Tarsus was an active and zealous persecutor of early Christians — a fact he himself acknowledges in multiple letters (Galatians 1:13: "I persecuted the church of God violently and tried to destroy it"; 1 Corinthians 15:9; Philippians 3:6). He had neither psychological nor social motivation to fabricate a resurrection appearance: conversion meant abandoning his respected position in Pharisaic Judaism, accepting social ostracism, enduring physical persecution (2 Corinthians 11:23–27 lists beatings, stonings, imprisonments, and shipwrecks), and ultimately martyrdom (traditionally in Rome under Nero). He reports a direct encounter with the risen Jesus (1 Corinthians 15:8; Galatians 1:15–16) and immediately began proclaiming the resurrection he had been trying to stamp out. His dramatic and costly transformation — from persecutor to the most prolific theological writer of early Christianity — requires a sufficient cause. The resurrection appearance he describes is the most historically plausible explanation.',
 'Saulo de Tarso era um perseguidor ativo e zeloso dos primeiros cristãos — facto que ele próprio reconhece em múltiplas cartas (Gálatas 1:13: "persegui violentamente a Igreja de Deus e procurei destruí-la"; 1 Coríntios 15:9; Filipenses 3:6). Não tinha motivação psicológica nem social para fabricar uma aparição da ressurreição: a conversão significava abandonar a sua posição respeitada no judaísmo farisaico, aceitar o ostracismo social, suportar perseguição física (2 Coríntios 11:23–27 lista espancamentos, apedrejamentos, prisões e naufrágios) e, por fim, o martírio (tradicionalmente em Roma sob Nero). Relata um encontro direto com o Jesus ressuscitado (1 Coríntios 15:8; Gálatas 1:15–16) e começou imediatamente a proclamar a ressurreição que tinha estado a tentar eliminar. A sua dramática e dispendiosa transformação — de perseguidor para o escritor teológico mais prolífico do cristianismo primitivo — requer uma causa suficiente. A aparição da ressurreição que descreve é a explicação historicamente mais plausível.',
 'Galatians 1:13–16; 1 Corinthians 15:8–9; Philippians 3:6; 2 Corinthians 11:23–27.'),

('conversion_of_james', 'resurrection', 6,
 'Conversion of James',
 'Conversão de Tiago',
 'A skeptical brother of Jesus became leader of the Jerusalem church and a martyr.',
 'Um irmão cético de Jesus tornou-se líder da Igreja de Jerusalém e mártir.',
 NULL, NULL,
 'James, the brother of Jesus, is reported in the Gospels as skeptical of Jesus''s ministry during his lifetime — along with other members of his family (John 7:5: "even his own brothers did not believe in him"; Mark 3:21, where the family goes to take Jesus away, thinking he is "out of his mind"). After the crucifixion, James not only became a believer but emerged as one of the central leaders of the Jerusalem church: Paul describes him as one of the "pillars" of the church (Galatians 2:9) and met with him personally (Galatians 1:19). Paul''s early creed includes an appearance of the risen Jesus specifically to James (1 Corinthians 15:7). James''s martyrdom — around 62 AD — is independently reported by the Jewish historian Josephus (Antiquities 20.9.1), who describes how the high priest Ananus had James stoned. The transformation of a skeptical family member into a pillar and martyr of the movement is most parsimoniously explained by an actual encounter with the risen Jesus.',
 'Tiago, irmão de Jesus, é descrito nos Evangelhos como cético em relação ao ministério de Jesus durante a sua vida — juntamente com outros membros da sua família (João 7:5: "nem sequer os seus irmãos criam nele"; Marcos 3:21, onde a família vai buscar Jesus, pensando que "está fora de si"). Após a crucificação, Tiago não só se tornou crente como emergiu como um dos líderes centrais da Igreja de Jerusalém: Paulo descreve-o como um dos "pilares" da Igreja (Gálatas 2:9) e reuniu-se pessoalmente com ele (Gálatas 1:19). O credo precoce de Paulo inclui uma aparição do Jesus ressuscitado especificamente a Tiago (1 Coríntios 15:7). O martírio de Tiago — por volta de 62 d.C. — é relatado independentemente pelo historiador judeu Josefo (Antiguidades 20.9.1), que descreve como o sumo sacerdote Ananias mandou apedrejar Tiago. A transformação de um familiar cético num pilar e mártir do movimento é mais parcimoniosamente explicada por um encontro real com o Jesus ressuscitado.',
 'John 7:5; Mark 3:21; Galatians 1:19; 2:9; 1 Corinthians 15:7; Josephus, Antiquities 20.9.1.'),

('disciples_willingness', 'resurrection', 7,
 'The Disciples'' Willingness to Die',
 'A Disponibilidade dos Discípulos para Morrer',
 'Those who would have known best whether the resurrection was fabricated died for their testimony.',
 'Aqueles que melhor saberiam se a ressurreição foi fabricada morreram pelo seu testemunho.',
 NULL, NULL,
 'The original disciples — who, if the resurrection was a fabrication, would have known this with certainty — faced sustained persecution, imprisonment, and death for their proclamation that Jesus had risen. The martyrdom of James the son of Zebedee is recorded in Acts 12:2. Paul lists the sufferings he endured for his proclamation in 2 Corinthians 11:23–27. The martyrdom of Peter is attested in early church tradition and referenced obliquely in John 21:18–19. This is historically significant because it distinguishes the disciples'' case from that of religious believers who die for sincerely held but potentially mistaken beliefs: the disciples were not merely sincerely convinced of something they had heard from others — they were the claimed primary witnesses. If they had fabricated the resurrection, they would have known it was a fabrication. People do not willingly endure sustained torture and execution for something they know to be a deliberate lie, especially when recantation would have offered immediate relief. The willingness of the original witnesses to die for their specific testimony is powerful evidence that they genuinely believed what they proclaimed.',
 'Os discípulos originais — que, se a ressurreição fosse uma fabricação, o saberiam com certeza — enfrentaram perseguição sustentada, prisão e morte pela sua proclamação de que Jesus tinha ressuscitado. O martírio de Tiago, filho de Zebedeu, está registado em Atos 12:2. Paulo lista os sofrimentos que suportou pela sua proclamação em 2 Coríntios 11:23–27. O martírio de Pedro é atestado na tradição primitiva da Igreja e referenciado obliquamente em João 21:18–19. Isto é historicamente significativo porque distingue o caso dos discípulos do dos crentes religiosos que morrem por convicções sinceras mas potencialmente erradas: os discípulos não estavam simplesmente convencidos de algo que tinham ouvido de outros — eram as alegadas testemunhas primárias. Se tivessem fabricado a ressurreição, saberiam que era uma fabricação. As pessoas não suportam voluntariamente tortura sustentada e execução por algo que sabem ser uma mentira deliberada, especialmente quando a retratação teria oferecido alívio imediato. A disponibilidade das testemunhas originais para morrer pelo seu testemunho específico é uma evidência poderosa de que acreditavam genuinamente no que proclamavam.',
 'Acts 12:2; 2 Corinthians 11:23–27; John 21:18–19; Eusebius, Ecclesiastical History (c. 313 AD).');
