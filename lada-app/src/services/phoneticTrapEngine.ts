/**
 * 🇲🇦 PROJECT NEON-POLYGLOT: PHONETIC TRAP ENGINE & DARIJA LINGUISTIC GOVERNANCE
 * Targets unique Moroccan acoustic instincts when pronouncing German phonemes.
 * Enforces strict anti-MSA (Modern Standard Arabic) and dual-script presentation.
 */

export type TrapCategory =
  | 'CH_ICH_LAUT'
  | 'CH_ACH_LAUT'
  | 'UMLAUT_OE'
  | 'UMLAUT_UE'
  | 'VOICED_S'
  | 'UNVOICED_SS'
  | 'CLUSTER_PF'
  | 'CLUSTER_TS_Z'
  | 'CLUSTER_SP_ST';

export interface PhoneticTrapDetail {
  category: TrapCategory;
  name: string;
  trapLetter: string;
  moroccanPitfall: string;
  moroccanMouthHack: string;
  latinArabiziTip: string;
  arabicScriptTip: string;
  soundAnalogy: string;
}

export interface PhoneticAnalysisResult {
  hasTrap: boolean;
  traps: PhoneticTrapDetail[];
  primaryTrap: PhoneticTrapDetail | null;
  latinArabiziGuide: string;
  arabicScriptGuide: string;
  arcadeBadge: string;
}

// Trap Definitions engineered for Moroccan native phonetics
export const MOROCCAN_TRAP_RULES: Record<TrapCategory, PhoneticTrapDetail> = {
  CH_ICH_LAUT: {
    category: 'CH_ICH_LAUT',
    name: 'Soft Ich-Laut [ç]',
    trapLetter: 'ch (soft)',
    moroccanPitfall: 'المغاربة كينطقوها "خ" قاصحة (أخ) بحال إذا باغي يتنحنح، وهذا غلط فادح بالألمانية!',
    moroccanMouthHack: 'ابتسم عريض بحال فالتصويرة، وخلي لسانك لاصق فالسنان التحتانيين وخرج "ش" رطبة.',
    latinArabiziTip: '3andak dirha "kh"! Dir "ch" m3a btissama sghira.',
    arabicScriptTip: 'عندك ديرها "خ"! دير "ش" خفيفة مع ابتسامة.',
    soundAnalogy: 'بحال الشين اللي كتقول للدراري الصغار باش يسكتو ولكن بابتسامة [ç].'
  },
  CH_ACH_LAUT: {
    category: 'CH_ACH_LAUT',
    name: 'Hard Ach-Laut [x]',
    trapLetter: 'ch (hard)',
    moroccanPitfall: 'الخلط بينها وبين الشين بعد حروف العلة الثقيلة (a, o, u, au).',
    moroccanMouthHack: 'هنا نيت نطق "خ" المغربية القاصحة من قاع الحلق بحال كلمة "خوخ".',
    latinArabiziTip: 'Hna nite dreb "kh" maghribiya s7i7a dialna!',
    arabicScriptTip: 'هنا نيت ضرب "خ" مغربية صحيحة ديالنا بحال "خوخ"!',
    soundAnalogy: 'حرف "الخاء" المغربي الصافي والمميز.'
  },
  UMLAUT_OE: {
    category: 'UMLAUT_OE',
    name: 'Umlaut Ö [ø / œ]',
    trapLetter: 'ö / Ö',
    moroccanPitfall: 'المغاربة كيردوها "أو" (O) عادية، والمعنى كيتغير 180 درجة (schon != schön)!',
    moroccanMouthHack: 'دور شفايفك فدائرة مزيرة بحال باغي تصفر، ومن لداخل قول "إي" (i).',
    latinArabiziTip: 'Dawwer fmmek b7al baghi tsseffer, o nte9 "i" mn dakhil.',
    arabicScriptTip: 'دوّر فمك بحال باغي تصفر، ومن لداخل نطق "إي".',
    soundAnalogy: 'الصوت اللي كيديرو الفرنساويين فـ "bleu" أو "feu".'
  },
  UMLAUT_UE: {
    category: 'UMLAUT_UE',
    name: 'Umlaut Ü [y / ʏ]',
    trapLetter: 'ü / Ü',
    moroccanPitfall: 'نطقها "أو" (U) ثقيلة بحال الضمة، وهذا كيبين لكنة قوية بزاف.',
    moroccanMouthHack: 'جمع شفايفك لقدام مزيان بحال بوسة صامتة، وخرج صوت "إي" حاد.',
    latinArabiziTip: 'Jme3 chfayfek l9ddam b7al boussa, o khrrej "ii" 7adda!',
    arabicScriptTip: 'جمع شفايفك لقدام بحال بوسة، وخرّج "إيي" حادة!',
    soundAnalogy: 'بحال "tu" أو "vu" فالفرنسية تماماً.'
  },
  VOICED_S: {
    category: 'VOICED_S',
    name: 'Voiced S [z]',
    trapLetter: 'S- (beginning)',
    moroccanPitfall: 'نطق "S" كحرف سين فبداية الكلمة (بحال sein كينطقوها sain).',
    moroccanMouthHack: 'أي حرف S قبل منو حرف علة كيتنطق "Z" صريح بحال صوت النحلة (ززز).',
    latinArabiziTip: 'S f l-bedya kate3ni "Z" dial "Zitoun" machi "Sin".',
    arabicScriptTip: 'حرف S فالبدية راه كيتنطق "ز" بحال "زيتون" ماشي "سين".',
    soundAnalogy: 'حرف "الزاي" (Z) المغربي.'
  },
  UNVOICED_SS: {
    category: 'UNVOICED_SS',
    name: 'Unvoiced S / Eszett [s]',
    trapLetter: 'ss / ß',
    moroccanPitfall: 'نطق ß بحال حرف B بسبب الشكل ديالها الشبيه بحرف بي اللاتيني.',
    moroccanMouthHack: 'هاد الحرف (ß) راه سين مشددة (ss)، ما عندو حتى علاقة مع حرف B!',
    latinArabiziTip: 'Hada ra machi B! Hada "SS" mcheddada dial "Chems".',
    arabicScriptTip: 'هاد الرمز (ß) راه ماشي B! راه "سّ" مشددة بحال "شمسّ".',
    soundAnalogy: 'سين مشددة وحادة بحال صفير الحية.'
  },
  CLUSTER_PF: {
    category: 'CLUSTER_PF',
    name: 'Consonant Cluster PF [pf]',
    trapLetter: 'pf',
    moroccanPitfall: 'أكل حرف P ونطق F بوحدها حيت المورفولوجيا المغربية معندهاش هاد المزيج.',
    moroccanMouthHack: 'سد الشفايف فـ P وحل فالبلاصة فـ F بحال انفجار صغير ديال النفس.',
    latinArabiziTip: 'Sed chfayfek f P o tle9 f l-blasa f F f de99a we7da!',
    arabicScriptTip: 'سد شفايفك فـ P وطلق فالبلاصة فـ F فدقة وحدة بحال انفجار صغيور!',
    soundAnalogy: 'انفجار هوائي متصل: p-f.'
  },
  CLUSTER_TS_Z: {
    category: 'CLUSTER_TS_Z',
    name: 'Affricate Z [ts]',
    trapLetter: 'z / tz',
    moroccanPitfall: 'نطق Z كحرف زاي عادي! فالألمانية Z ديما كتساوي "تْسْ" (ts).',
    moroccanMouthHack: 'حط لسانك مورا سنانك الفوقانيين ونطق "T" وتبّعها "S" بسرعة فائقة.',
    latinArabiziTip: 'Z f l-Almaniya = "TS" b7al Pizza machi "Z" dialna.',
    arabicScriptTip: 'حرف Z فالألمانية كيساوي ديما "تْسْ" (ts) بحال بيتزا ماشي "ز"!',
    soundAnalogy: 'الصوت ديال "تْسْ" فـ "بيتزا" أو "Tsunami".'
  },
  CLUSTER_SP_ST: {
    category: 'CLUSTER_SP_ST',
    name: 'Cluster SP / ST [ʃp / ʃt]',
    trapLetter: 'sp / st (start)',
    moroccanPitfall: 'نطق السين الصافية عوض الشين فالأول ديال الكلمة.',
    moroccanMouthHack: 'فأول الكلمة، SP كتولي "شْبْ" (schp) و ST كتولي "شْتْ" (scht).',
    latinArabiziTip: 'F l-bedya: sp = chp, st = cht. Machi s-p ola s-t!',
    arabicScriptTip: 'فالبداية: sp كتنطق "شْبْ" و st كتنطق "شْتْ" بلا تردد!',
    soundAnalogy: 'نطق الشين متبوعة بالباء أو التاء.'
  }
};

/**
 * Heuristic German Phonetic Detector with Moroccan bias correction
 */
export function detectGermanPhoneticTraps(germanText: string): PhoneticAnalysisResult {
  const normalized = germanText.toLowerCase();
  const detectedTraps: PhoneticTrapDetail[] = [];

  // 1. Detect 'ch' type (Ach-Laut vs Ich-Laut)
  if (normalized.includes('ch')) {
    // Ach-Laut follows a, o, u, au
    const achRegex = /(a|o|u|au)ch/i;
    if (achRegex.test(normalized)) {
      detectedTraps.push(MOROCCAN_TRAP_RULES.CH_ACH_LAUT);
    } else {
      detectedTraps.push(MOROCCAN_TRAP_RULES.CH_ICH_LAUT);
    }
  }

  // 2. Detect Umlauts
  if (normalized.includes('ö')) {
    detectedTraps.push(MOROCCAN_TRAP_RULES.UMLAUT_OE);
  }
  if (normalized.includes('ü')) {
    detectedTraps.push(MOROCCAN_TRAP_RULES.UMLAUT_UE);
  }

  // 3. Detect Z / TZ as [ts]
  if (/\b[z]|tz|[a-z]z[a-z]/i.test(normalized)) {
    detectedTraps.push(MOROCCAN_TRAP_RULES.CLUSTER_TS_Z);
  }

  // 4. Detect Sp / St at word start
  if (/\b(sp|st)/i.test(normalized)) {
    detectedTraps.push(MOROCCAN_TRAP_RULES.CLUSTER_SP_ST);
  }

  // 5. Detect Pf cluster
  if (/pf/i.test(normalized)) {
    detectedTraps.push(MOROCCAN_TRAP_RULES.CLUSTER_PF);
  }

  // 6. Detect ss or ß
  if (normalized.includes('ß') || normalized.includes('ss')) {
    detectedTraps.push(MOROCCAN_TRAP_RULES.UNVOICED_SS);
  } else if (/\bs[aeiouäöü]/i.test(normalized)) {
    // Initial S before vowel -> Voiced Z
    detectedTraps.push(MOROCCAN_TRAP_RULES.VOICED_S);
  }

  const primaryTrap = detectedTraps.length > 0 ? detectedTraps[0] : null;

  const arcadeBadge = primaryTrap
    ? `⚠️ ${primaryTrap.trapLetter.toUpperCase()}`
    : '🎯 CLEAN';

  const latinArabiziGuide = primaryTrap
    ? primaryTrap.latinArabiziTip
    : 'Nte9ha 3adi o rkezz m3a l-rythme!';

  const arabicScriptGuide = primaryTrap
    ? primaryTrap.arabicScriptTip
    : 'نطقها عادي وركّز مع الرّيتم والإيقاع!';

  return {
    hasTrap: detectedTraps.length > 0,
    traps: detectedTraps,
    primaryTrap,
    latinArabiziGuide,
    arabicScriptGuide,
    arcadeBadge
  };
}

/**
 * Format dual-script Darija text for UI components
 * Ensures Latin Arabizi for fast arcade readability and Arabic Script for studio inspection
 */
export function formatDualScript(arabizi: string, arabicScript: string) {
  return {
    arcade: arabizi,
    studio: {
      arabizi,
      arabic: arabicScript,
      combined: `${arabizi} (${arabicScript})`
    }
  };
}

/**
 * Strict Anti-MSA Validator
 * Replaces or warns about Modern Standard Arabic phrases creeping into pedagogical outputs
 */
const MSA_FORBIDDEN_WORDS = [
  'يجب عليك',
  'هذا يعني أن',
  'باللغة العربية الفصحى',
  'الرجاء',
  'تذكر دائماً أن',
  'كذلك',
  'حيث أن'
];

export function sanitizeAntiMsa(text: string): string {
  let cleaned = text;
  for (const msa of MSA_FORBIDDEN_WORDS) {
    if (cleaned.includes(msa)) {
      cleaned = cleaned.replace(new RegExp(msa, 'g'), '');
    }
  }
  return cleaned.trim();
}
