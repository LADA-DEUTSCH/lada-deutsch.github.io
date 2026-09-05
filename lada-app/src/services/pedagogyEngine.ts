// محرك بيداغوجيا الأستاذ لادا للمغاربة (بالحروف العربية)
// Master Professor Moroccan-German Pedagogy Engine in Authentic Arabic Script

import type { SongLyricItem, RealDialogueSnippet } from '../types';

export interface MasterGuidanceData {
  explanation: string;       // شرح الأستاذ بالدارجة المغربية
  phoneticSecret: string;    // سر النطق وموضع اللسان والشفتين
  moroccanTrap: string;      // فخ المغاربة
  realDialogue: RealDialogueSnippet; // حوار في الواقع
  grammarBadge: {
    label: string;
    color: string;
    bg: string;
    border: string;
  };
  memoryHook: string;        // سر الحفظ السريع
}

// بنك الشروحات البيداغوجية الأصيلة بالدارجة المغربية المكتوبة بالحروف العربية
const CURATED_PEDAGOGY_ARABIC: Record<string, Partial<MasterGuidanceData>> = {
  // --- الأغنية 1: الأبجدية والأوملاوت (Das Alphabet & Die Umlaute) ---
  '1_1': {
    explanation: 'في اللغة الألمانية، الحروف A و B و C كيتنطقو بشكل صافي وواضح. ما كاينش داك التخلاط فحال الإنجليزية. فاش كتقرا الكلمة، كتنطق كل حرف بحقه وحقيقيته!',
    phoneticSecret: 'حل فمك مزيان فـ A بحال إلى كتقول "أهلاً". فـ B نطقها بنفخة خفيفة د الهواء، وحرف C كيتنطق دايماً "تسي" [Tseh] (حرف التاء والسين ملاصقين بزربة).',
    moroccanTrap: 'المغاربة بزاف كينطقو C بحال الإنجليزية (سي) أو الفرنسية (إس). في الألمانية راه دايماً مخبية فيها تاء في اللول: "تسي"!',
    realDialogue: {
      speakerA: 'الأستاذ (Lehrer):',
      germanA: 'Buchstabieren Sie bitte: A - B - C!',
      speakerB: 'بلال (Bilal):',
      germanB: 'A [Ah], B [Beh], C [Tseh]!',
      darijaContext: 'الأستاذ كيطلب منك تتهجى الحروف، وأنت كتنطقها بالنطق الألماني النقي.'
    },
    memoryHook: 'عقل: حرف C في الألمانية دايماً فيه تاء مخبية في اللول: [تسي]!'
  },
  '1_2': {
    explanation: 'حرف Ä [ae] هو حرف A وفوقو جوج نقاط (Umlaut). كيبدل الصوت من "آ" مفتوحة لـ "إي" محلولة بحال حرف "è" في الفرنسية (بحال فـ tête).',
    phoneticSecret: 'حل فمك بالجنب بحال إلا كتبتاكسم، وخرج صوت "إيه" من وسط الحلق بلا ما تزير على لسانك.',
    moroccanTrap: 'بزاف د المغاربة كيقراوها "آ" عادية بحال A بلا نقاط، أو "آي". هادا غلط كبير حيت كيبدل معنى الكلمة كاملة!',
    realDialogue: {
      speakerA: 'النادل (Kellner):',
      germanA: 'Möchten Sie frische Äpfel?',
      speakerB: 'بلال (Bilal):',
      germanB: 'Ja, zwei Äpfel bitte!',
      darijaContext: 'النادل كيسولك واش بغيتي تفاح (Äpfel)، وأنت كتنطق Ä بصوت [إيه] واضح.'
    },
    memoryHook: 'Ä = حل فمك وابتسم وقول: "إيه"!'
  },
  '1_3': {
    explanation: 'حرف Ö [oe] هو الحرف اللي كيخلع الناس في اللول، ولكن سرو ساهل بزاف! هو ملاقي بين صوت "O" وصوت "E". كيشبه لـ "eu" في الفرنسية (بحال "bleu" أو "deux").',
    phoneticSecret: 'دوّر شنايفك بحال إلا غادي تقول "أُو" (دائرة مدورة)، ولكن من الداخل لسانك كيقول "إي"! هاد الحركة كتخرج صوت ألماني 100%.',
    moroccanTrap: 'المغاربة كيخرجوه "أُو" عادية. إلى قلتي "schon" في بلاصة "schön"، بدلتي المعنى من "زوينة" لـ "ديجا / من قبل"!',
    realDialogue: {
      speakerA: 'الصديق (Freund):',
      germanA: 'Wie findest du Berlin?',
      speakerB: 'بلال (Bilal):',
      germanB: 'Berlin ist wunderschön!',
      darijaContext: 'صاحبك كيسولك على برلين، كتقول ليه "Wunderschön" (واعرة بزاف) بـ Ö نقية.'
    },
    memoryHook: 'Ö = شنايف مدورين بحال O + اللسان لداخل كيقول E!'
  },
  '1_4': {
    explanation: 'حرف Ü [ue] هو حرف U وفوقو جوج نقاط. هو بالضبط صوت "U" في الفرنسية (بحال "tu" أو "salut"). في الدارجة ما عندناش هاد الصوت ولكن المغاربة كيعرفوه من الفرنسية.',
    phoneticSecret: 'جمع شنايفك مزيان بحال إلا غادي تصفر (ثقبة صغيرة)، وقول "إيي" من الداخل. هاد التدفق كيخرج Ü نقية.',
    moroccanTrap: 'كيتنطق "أُو" غليظة عند المغاربة. مثلاً رقم 5 "fünf" كاين اللي كيقولها "فونف"، وهادا كيبين بلي نطقك ضعيف!',
    realDialogue: {
      speakerA: 'مول المخبزة (Verkäufer):',
      germanA: 'Wie viele Brötchen möchten Sie?',
      speakerB: 'بلال (Bilal):',
      germanB: 'Fünf Brötchen, bitte!',
      darijaContext: 'مول المخبزة كيسولك شحال د الخبيزات بغيتي، كتجاوبو: خمسة (fünf).'
    },
    memoryHook: 'Ü = شنايف كيصفرو + صوت "إيي" من الداخل!'
  },
  '1_6': {
    explanation: 'حرف das Eszett [ß] هو حرف خاص غير بالألمانية بوحدها. كيتسمى "scharfes S" (السين الحادة). كيتنطق دايماً "سْسْ" نقية وقاصحة، وكيجي غير من بعد حروف العلة الطويلة.',
    phoneticSecret: 'حط راس لسانك مورا سنانك التحتانيين وخرج صفير مجهد بحال الأفعى [سسسسس].',
    moroccanTrap: 'المغاربة كيخلطو بين ß وحرف B حيت كيشبه ليه في الشوفة! راه ماشي B، راه جوج سينات مجهدين (ss)!',
    realDialogue: {
      speakerA: 'عابر سبيل (Passant):',
      germanA: 'Entschuldigung, wo ist die Post?',
      speakerB: 'بلال (Bilal):',
      germanB: 'Die Post ist in dieser Straße!',
      darijaContext: 'واحد كيسولك فين البوسطة، كتنعت ليه الزنقة: "Straße" بـ ß حادة.'
    },
    memoryHook: 'ß ماشي حرف B! ß = سسسسس حادة بزاف!'
  },

  // --- الأغنية 2: الأرقام من 1 إلى 10 (Zahlen 1-10) ---
  '2_1': {
    explanation: '"eins" = واحد (1). الألمان كيخدموه في الحساب والأرقام. رد البال لقاعدة ذهبية: في الألمانية "ei" دايماً كتنطق "آي" (بحال night في الإنجليزية)!',
    phoneticSecret: 'نطقها [آينس]. كتبدا بـ آ مفتوحة وكتكمل بـ ينس خفيفة.',
    moroccanTrap: 'المغاربة كيقراو "ei" بحال "إي" أو "إي الفرنسية". القاعدة الصارمة: E موراها I = [آي] دايماً!',
    realDialogue: {
      speakerA: 'النادل (Kellner):',
      germanA: 'Für wie viele Personen?',
      speakerB: 'بلال (Bilal):',
      germanB: 'Nur eins, bitte!',
      darijaContext: 'النادل كيسولك شحال من واحد نتوما في الطبلة، كتقول ليه غير واحد عافاك.'
    },
    memoryHook: 'E موراها I = آي! (eins = آينس = 1)'
  },
  '2_2': {
    explanation: '"zwei" = جوج (2). حرف Z في الألمانية دايماً هو [تس]. ما كاينش صوت الزاي العادية في بداية الكلمة نهائياً!',
    phoneticSecret: 'دير صوت تاء خفيفة بسنانك الفوقانيين وتبعها بسين بزربة: [تس]! وكملها بـ [فاي]: [تسفاي].',
    moroccanTrap: 'الغلط رقم 1 ديال المغاربة: كيقولو "زفاي" بالزاي د الزيت! لا، دايماً نطقها [تسفاي]!',
    realDialogue: {
      speakerA: 'مول التذاكر (Kassierer):',
      germanA: 'Wie viele Tickets brauchen Sie?',
      speakerB: 'بلال (Bilal):',
      germanB: 'Zwei Tickets bitte!',
      darijaContext: 'كتطلب جوج تذاكر د الميترو بنطق ألماني صحيح: تسفاي!'
    },
    memoryHook: 'حرف Z في الألمانية = تس! (ZWEI = تسفاي = 2)'
  },
  '2_4': {
    explanation: '"vier" = أربعة (4). حرف V في الألمانية كيتنطق فاء [F] في أغلب الكلمات الألمانية الأصلية!',
    phoneticSecret: 'حط سنانك الفوقانيين على شفتك التحتانية وخرج فاء: [فير]، والراء خفيفة وسلسة في اللخر.',
    moroccanTrap: 'نطقها بـ [V] بحال voiture! الألماني إلى سمعك قلتي "فير بـ V" كيعرفك مبتدئ. نطقها دايماً بالفاء: [فير]!',
    realDialogue: {
      speakerA: 'الباطرون (Chef):',
      germanA: 'Wie viele Stunden arbeitest du heute?',
      speakerB: 'بلال (Bilal):',
      germanB: 'Ich arbeite heute vier Stunden.',
      darijaContext: 'الباطرون كيسولك شحال د السوايع غتخدم اليوم، كتقول ليه 4 د السوايع.'
    },
    memoryHook: 'حرف V في الألمانية = فاء! (VIER = فير = 4)'
  },
  '2_5': {
    explanation: '"fünf" = خمسة (5). هادا هو الامتحان الحقيقي ديال الأوملاوت Ü!',
    phoneticSecret: 'جمع شنايفك بحال كورة صغيرة وخرج صوت [فوينف] مع Ü نقية ومضبوطة.',
    moroccanTrap: 'المغاربة كيقولوها "فونف" بواو غليظة. دير المجهود في Ü باش تبان متمكن!',
    realDialogue: {
      speakerA: 'صاحبك (Freund):',
      germanA: 'Um wie viel Uhr treffen wir uns?',
      speakerB: 'بلال (Bilal):',
      germanB: 'Treffen wir uns um fünf Uhr!',
      darijaContext: 'كتفاهم مع صاحبك على الوقت: مع الخمسة نيشان!'
    },
    memoryHook: 'FÜNF = جمع شنايفك ونطق الخمسة بـ Ü نقية!'
  },
  '2_6': {
    explanation: '"sechs" = ستة (6). حرف S في أول الكلمة موراه حرف علة كيتنطق دايماً زاي [Z]! و"chs" كتنطق [كس]!',
    phoneticSecret: 'بداية بزاي سهلة [Z]، موراها E، موراها [كس]: [زِكْس]!',
    moroccanTrap: 'المغاربة كيقراوها "سِيخْس" بالخاء حيت كيشوفو ch! هنا chs كتنطق كاف وسين نيشان: [زِكْس]!',
    realDialogue: {
      speakerA: 'البوليسي (Polizist):',
      germanA: 'Welche Hausnummer suchen Sie?',
      speakerB: 'بلال (Bilal):',
      germanB: 'Ich suche Hausnummer sechs.',
      darijaContext: 'البوليسي كيسولك على نمرة الدار، كتقول ليه النمرة ستة.'
    },
    memoryHook: 'SECHS = [زكس] بحال Z + KS!'
  },
  '2_8': {
    explanation: '"acht" = ثمانية (8). هنا ch مورا حرف A، داكشي علاش كتنطق خاء (خ) حقيقية وقاصحة بحال في الدارجة!',
    phoneticSecret: 'حل فمك فـ A وخرج خاء صريحة من وسط الحلق وتبعها بالتاء: [أخْت]!',
    moroccanTrap: 'هنا مزيان تنطقها خاء! ولكن ما تنساش التاء في اللخر: Acht ماشي غير Ach!',
    realDialogue: {
      speakerA: 'الزبون (Kunde):',
      germanA: 'Was kostet das Brot?',
      speakerB: 'مول الحانوت (Verkäufer):',
      germanB: 'Das kostet acht Euro.',
      darijaContext: 'مول الحانوت كيقول ليك الثمن: 8 أورو.'
    },
    memoryHook: 'Acht = أ + خاء + تاء = 8!'
  },

  // --- الأغنية 4: التحيات والوداع (Begrüßungen) ---
  '4_1': {
    explanation: '"Hallo!" = سلام / أهلاً. هي التحية الأكثر انتشاراً في ألمانيا كاملة، كتستعمل مع صحابك، في المحلات، ومع الناس في الزنقة.',
    phoneticSecret: 'حرف H في الألمانية خاصو يتنطق بنَفَس صريح من الحلق (بحال الهاء د الهواء). نطقها [هالو] بلا تعقيد.',
    moroccanTrap: 'المغاربة اللي مولفين بالفرنسية كيهبطو على الهاء وكيقولو "ألو". الألماني خاصو يسمع الهاء واضحة: هالو!',
    realDialogue: {
      speakerA: 'الجار (Nachbar):',
      germanA: 'Hallo Bilal! Wie geht es dir?',
      speakerB: 'بلال (Bilal):',
      germanB: 'Hallo! Mir geht es super, danke!',
      darijaContext: 'جارك تلاقى معاك في العمارة وسلم عليك بـ Hallo.'
    },
    memoryHook: 'حرف H كيتنطق دايماً بالنفس: هـ-ـالو!'
  },
  '4_2': {
    explanation: '"Guten Morgen" = صباح الخير. كتقولها من الفجر حتى لـ 11:00 د الصباح. من موراها كتبدل لـ Guten Tag.',
    phoneticSecret: 'حرف R في Morgen كيجي خفيف بحال الغين الخفيفة أو همزة مسروطة: [غوتن مورغن].',
    moroccanTrap: 'تقول Guten Morgen مع 2 د العشية! الألمان دقيقين بزاف في أوقات التحيات.',
    realDialogue: {
      speakerA: 'الزميل (Kollege):',
      germanA: 'Guten Morgen! Hast du gut geschlafen?',
      speakerB: 'بلال (Bilal):',
      germanB: 'Guten Morgen! Ja, sehr gut danke.',
      darijaContext: 'دخلتي للخدمة في الصباح، أول كلمة كتقولها للزملاء.'
    },
    memoryHook: 'Morgen = الصباح (Guten Morgen = صباح الخير)'
  },
  '4_6': {
    explanation: '"Tschüss!" = بسلامة! هي أشهر كلمة كيقولوها الألمان فاش كيمشيو بحالهم. كتستعمل مع كلشي إلا في الإدارات الرسمية الكبيرة بزاف.',
    phoneticSecret: 'Tsch كتنطق [تْشْ] مجهدة بحال الشين المعجمة. موراها Ü مجموعة وسين حادة: [تْشُوسْ]!',
    moroccanTrap: 'ما تنساش الأوملاوت Ü! إلى قلتي "تشيس" أو "تشوس" غليظة كتبان ما ضابطش النطق.',
    realDialogue: {
      speakerA: 'صاحبك (Freund):',
      germanA: 'Ich muss jetzt zur Bahn. Tschüss!',
      speakerB: 'بلال (Bilal):',
      germanB: 'Tschüss! Machs gut und bis bald!',
      darijaContext: 'صاحبك غادي للمحطة، كتودعو بـ Tschüss حارة.'
    },
    memoryHook: 'Tsch = تش + üss = Tschüss (بسلامة)!'
  },

  // --- الأغنية 5: كلمات الأدب (Zauberwörter) ---
  '5_1': {
    explanation: '"Bitte" هي الجوكر ديال اللغة الألمانية! عندها 4 د الاستعمالات: 1) عافاك (من فضلك)، 2) تفضل (هاك)، 3) بلا جميل (العفو)، 4) pardon؟ (فاش ما كتسمعش مزيان).',
    phoneticSecret: 'I قصيرة ودوبل T حادة: [بِيتِّه]. ما تمددهاش بزاف.',
    moroccanTrap: 'المغاربة كيحساب ليهم Bitte كتعني غير "عافاك". دايماً رد البال للسياق فين تقالت في الجملة!',
    realDialogue: {
      speakerA: 'الزبون (Kunde):',
      germanA: 'Einen Kaffee, bitte!',
      speakerB: 'النادل (Kellner):',
      germanB: 'Hier ist Ihr Kaffee. Bitte sehr!',
      darijaContext: 'طلبتي قهوة بـ bitte، والنادل حطها ليك بـ bitte sehr (تفضل).'
    },
    memoryHook: 'Bitte = الساروت ديال كلشي في ألمانيا!'
  },
  '5_2': {
    explanation: '"Danke" = شكراً. كلمة مهمة بزاف في ثقافة الألمان. دايماً قولها لأي واحد عاونك أو عطاك شي حاجة.',
    phoneticSecret: 'A مفتوحة، NK كتجي بحال الإنجليزية (thank)، وE في اللخر خفيفة: [دانكه].',
    moroccanTrap: 'ما تقولش "دانكي" بحرف الياء في اللخر! E في الألمانية خفيفة: Danke.',
    realDialogue: {
      speakerA: 'واحد في الزنقة (Fremder):',
      germanA: 'Entschuldigung, hier ist deine Tasche!',
      speakerB: 'بلال (Bilal):',
      germanB: 'Vielen Dank! Das ist sehr nett.',
      darijaContext: 'واحد نبهك لصاكك نسيتيه، كتشكرو من قلبك.'
    },
    memoryHook: 'Danke = شكراً بكل احترام وتقدير.'
  },

  // --- الأغنية 6: السؤال عن الحال (Befinden) ---
  '6_1': {
    explanation: '"Wie geht\'s?" = كي داير؟ / لاباس؟ هي اختصار ديال "Wie geht es dir?" (كيفاش غادية معاك الأحوال؟). وW في الألمانية دايماً [V]!',
    phoneticSecret: 'في غيتس: W = [V]، وh فـ geht كتمدد E: [فِي غَيْتْسْ]؟',
    moroccanTrap: 'تسول شي واحد رسمي بـ "Wie geht\'s؟". مع الأساتذة والمسؤولين كتقول: "Wie geht es Ihnen؟"',
    realDialogue: {
      speakerA: 'سارة (Sarah):',
      germanA: 'Hallo Bilal! Wie geht\'s?',
      speakerB: 'بلال (Bilal):',
      germanB: 'Danke, super! Und dir?',
      darijaContext: 'سلام د الزنقة بين صحاب: لاباس وأنت لاباس.'
    },
    memoryHook: 'Wie geht\'s = كي دايرة الأمور معاك؟'
  },
  '6_2': {
    explanation: '"Mir geht es gut" = أنا بخير. رد البال لواحد الفخ خطير: في الألمانية ما كتقولش "Ich bin gut" (هادي كتعني أنا إنسان صالح وخيّر أخلاقياً!). كتقول "Mir geht es gut" (الحال غادي معايا مزيان)!',
    phoneticSecret: 'مير غيت إس غوت. R خفيفة والتاء واضحة.',
    moroccanTrap: 'تقول "Ich bin gut" باش تقول أنا لاباس! هادا أشهر فخ كيطيحو فيه الأجانب كاملين!',
    realDialogue: {
      speakerA: 'الطبيب (Arzt):',
      germanA: 'Wie geht es Ihnen heute?',
      speakerB: 'بلال (Bilal):',
      germanB: 'Mir geht es heute sehr gut, danke!',
      darijaContext: 'الطبيب كيسولك على صحتك، كتجاوبو بـ Mir geht es gut.'
    },
    memoryHook: 'MIR geht es gut (ماشي Ich bin gut)!'
  },

  // --- الأغنية 9: فعل الكينونة (Verb Sein) ---
  '9_1': {
    explanation: '"ich bin" = أنا أكون (I am / Je suis). في الألمانية ما يمكنش تقول "أنا في الدار" بلا فعل! خاصك ضروري تقول "Ich BIN zu Hause". هادا هو ساس الجملة.',
    phoneticSecret: 'Ich فيها صوت الـ ich-Laut (شين ناعمة خفيفة بحال فحيح القط)، ماشي خاء! و bin كتنطق عادية: [إيخ بِنْ].',
    moroccanTrap: 'المغاربة كينطقو "Ich" بخاء حرشة بزاف [إيخخخ]. الألمان كيضحكو عليها! خليها شين مسحوبة وخفيفة.',
    realDialogue: {
      speakerA: 'المسؤول (Chef):',
      germanA: 'Guten Tag, wer bist du?',
      speakerB: 'بلال (Bilal):',
      germanB: 'Ich bin Bilal und ich lerne Deutsch.',
      darijaContext: 'كتعرف براسك في المقابلة: "Ich bin Bilal".'
    },
    memoryHook: 'Ich bin = أنا أكون (ساس الجملة في الألمانية)!'
  },

  // --- الأغنية 11: أدوات التعريف - المذكر (Der) ---
  '11_1': {
    explanation: '"der Kaffee" = القهوة. في الألمانية القهوة مذكر (der)! هادا أول صدمة للمغاربة حيت في الدارجة والفرنسية القهوة مؤنثة! في الألمانية القهوة راجل: DER Kaffee.',
    phoneticSecret: 'Der كتنطق [دير] مع راء مرخوفة. و Kaffee النبرة على اللخر: [كافيه].',
    moroccanTrap: 'تقول "die Kaffee" حيت في بالك القهوة بنت! لا، دايماً DER Kaffee بالأزرق المذكر!',
    realDialogue: {
      speakerA: 'النادل (Kellner):',
      germanA: 'Was möchten Sie trinken?',
      speakerB: 'بلال (Bilal):',
      germanB: 'Der Kaffee bitte!',
      darijaContext: 'كتطلب قهوة في المقهى وأنت واثق من الأداة ديالها المذكرة.'
    },
    memoryHook: '🔵 DER Kaffee: دايماً زرق، دايماً مذكر!'
  },

  // --- الأغنية 13: أدوات التعريف - المحايد (Das) ---
  '13_1': {
    explanation: '"das Wasser" = الما. الألمانية فيها 3 ديال الأجناس: مذكر (der)، مؤنث (die)، ومحايد (das). الما في الألمانية محايد أخضر!',
    phoneticSecret: 'W كتنطق دايماً فاء مغربية [V]! و Wasser = [داس فاسَّر]. والراء في اللخر كتسلك بحال ألف خفيفة: فاسا.',
    moroccanTrap: 'الغلط الخطير ديال الإنجليزية: تنطق W بحال واو "واتر"! في الألمانية W دايماً كتنطق V بحال voiture!',
    realDialogue: {
      speakerA: 'النادل (Kellner):',
      germanA: 'Möchten Sie etwas trinken?',
      speakerB: 'بلال (Bilal):',
      germanB: 'Ein Wasser bitte!',
      darijaContext: 'كتطلب كاس د الما في المطعم بنطق ألماني نقي.'
    },
    memoryHook: '🟢 DAS Wasser: الما محايد لونو خضر (das)!'
  },

  // --- الأغنية 20: الحوار الختامي في المقهى ---
  '20_2': {
    explanation: '"Einen Kaffee, bitte!" = واحد القهوة عافاك! علاش قلنا "Einen" وما قلناش "Ein"؟ حيت القهوة مذكر (der Kaffee) وجات مفعول به (Akkusativ)! داكشي علاش der كتولي den و ein كتولي einen!',
    phoneticSecret: 'آينن كافيه، بيته. نطقها بسلاسة وبثقة كاملة.',
    moroccanTrap: 'تقول "Ein Kaffee bitte" بحال المبتدئين. فاش كتقول "Einen Kaffee"، الألمان كيعرفوك ضابط القواعد ومحترف!',
    realDialogue: {
      speakerA: 'النادل (Kellner):',
      germanA: 'Guten Tag! Was darf ich Ihnen bringen?',
      speakerB: 'بلال (Bilal):',
      germanB: 'Einen Kaffee bitte, schwarz und heiß.',
      darijaContext: 'كتطلب قهوة كحلة وسخونة في المقهى بـ Akkusativ مضبوطة.'
    },
    memoryHook: 'المذكر في المفعول به كياخد EN: Einen Kaffee bitte!'
  }
};

/**
 * تحديد بطاقة الجنس والقواعد النحوية
 */
function getGrammarBadge(german: string): { label: string; color: string; bg: string; border: string } {
  const lower = german.toLowerCase().trim();
  if (lower.startsWith('der ')) {
    return {
      label: '🔵 اسم مذكر (DER)',
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.15)',
      border: 'rgba(56, 189, 248, 0.4)'
    };
  }
  if (lower.startsWith('die ')) {
    return {
      label: '🌸 اسم مؤنث (DIE)',
      color: '#f472b6',
      bg: 'rgba(244, 114, 182, 0.15)',
      border: 'rgba(244, 114, 182, 0.4)'
    };
  }
  if (lower.startsWith('das ')) {
    return {
      label: '🟢 اسم محايد (DAS)',
      color: '#34d399',
      bg: 'rgba(52, 211, 153, 0.15)',
      border: 'rgba(52, 211, 153, 0.4)'
    };
  }
  if (
    lower.endsWith('en') &&
    !lower.includes(' ') &&
    !lower.startsWith('guten')
  ) {
    return {
      label: '⚡ فعل حركة (VERB)',
      color: '#fbbf24',
      bg: 'rgba(251, 191, 36, 0.15)',
      border: 'rgba(251, 191, 36, 0.4)'
    };
  }
  return {
    label: '💬 جملة وعبارة شائعة',
    color: '#a78bfa',
    bg: 'rgba(167, 139, 250, 0.15)',
    border: 'rgba(167, 139, 250, 0.4)'
  };
}

/**
 * توليد الملف البيداغوجي للأستاذ لادا بالحروف العربية
 */
export function getMasterProfessorGuidance(item: SongLyricItem): MasterGuidanceData {
  const custom = CURATED_PEDAGOGY_ARABIC[item.id];
  const grammar = getGrammarBadge(item.german);

  if (custom) {
    return {
      explanation: custom.explanation || `هاد العبارة "${item.german}" كتعني "${item.darijaCorrect}" وكتستعمل بزاف في الحياة اليومية في ألمانيا.`,
      phoneticSecret: custom.phoneticSecret || `نطقها دقة بدقة بحال هكا: [${item.phoneticGuide}]. خرج الحروف بوضوح وبلا زربة.`,
      moroccanTrap: custom.moroccanTrap || `رد البال من التخلاط بين نطق الفرنسية والإنجليزية ونطق الألمانية! احفظها بالنطق الصافي: [${item.phoneticGuide}].`,
      realDialogue: custom.realDialogue || {
        speakerA: 'المتحدث الأول:',
        germanA: `${item.german}!`,
        speakerB: 'بلال:',
        germanB: `Ja, genau: ${item.german}!`,
        darijaContext: `استعمال مباشر في الواقع: ${item.darijaCorrect}.`
      },
      grammarBadge: grammar,
      memoryHook: custom.memoryHook || `عقل عليها مزيان: "${item.german}" = "${item.darijaCorrect}"!`
    };
  }

  // التوليد التلقائي بالحروف العربية للكلمات الأخرى
  const german = item.german;
  const darija = item.darijaCorrect;
  const phonetic = item.phoneticGuide;

  let dynamicSecret = `نطقها دقة بدقة بحال: [${phonetic}]. `;
  let dynamicTrap = `الغلط الشائع هو الزربة في النطق وتخلاط الحروف. `;
  let memoryMnemonic = `اربط هاد الكلمة "${german}" بالمعنى ديالها بالدارجة "${darija}".`;

  if (german.includes('ch')) {
    dynamicSecret += 'فيها "ch": إلى كان قبلها a/o/u كتنطق خاء حقيقية، وإلى كان قبلها e/i كتنطق شين ناعمة وخفيفة بحال فحيح القط.';
    dynamicTrap += 'ما تخرجش دايماً خاء حرشة بزاف! ديما شوف حرف العلة اللي قبل ch.';
  } else if (german.includes('w') || german.includes('W')) {
    dynamicSecret += 'فيها حرف W: في الألمانية W دايماً كتنطق بحال حرف V في الفرنسية (بحال valise).';
    dynamicTrap += 'فخ الإنجليزية: ما تنطقش W بحال الواو الإنجليزية water، دايماً V!';
  } else if (german.includes('v') || german.includes('V')) {
    dynamicSecret += 'فيها حرف V: في أغلب الكلمات الألمانية كيتنطق فاء صريحة [F] بحال Vater أو Vier.';
    dynamicTrap += 'فخ: ما تنطقهاش V، الألماني كيسمعها فاء!';
  } else if (german.includes('z') || german.includes('Z')) {
    dynamicSecret += 'فيها حرف Z: حرف Z في الألمانية دايماً هو [تس] مجهدة بالسنان.';
    dynamicTrap += 'فخ: ما تنطقهاش زاي ديال الزيت! دايماً [تس]!';
  } else if (german.includes('ä') || german.includes('ö') || german.includes('ü')) {
    dynamicSecret += 'فيها أوملاوت (..): دوّر شنايفك وخرج الصوت من وسط الحلق بثبات وبلا خوف.';
    dynamicTrap += 'فخ: ما تبدلش الأوملاوت بحرف علة عادي حيت المعنى كيتبدل كامل!';
  }

  return {
    explanation: `هاد العبارة "${german}" كتعني بالدارجة "${darija}". هادي من الروافد الأساسية في اللغة الألمانية اللي خاصك تضبطها مزيان. في الألمانية، دقة الكلمة هي كلشي!`,
    phoneticSecret: dynamicSecret,
    moroccanTrap: dynamicTrap,
    realDialogue: {
      speakerA: 'المتحدث:',
      germanA: `${german}, oder?`,
      speakerB: 'بلال:',
      germanB: `Ja, ${german}!`,
      darijaContext: `حوار يومي كيبين كيفاش كتخدم هاد الكلمة في الواقع: "${darija}".`
    },
    grammarBadge: grammar,
    memoryHook: memoryMnemonic
  };
}
