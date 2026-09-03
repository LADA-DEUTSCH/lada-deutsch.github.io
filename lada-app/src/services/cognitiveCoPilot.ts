import type { CompoundBreakdown, PhoneticCue, BinaryChoice, StageEvent } from '../types';

export const COMPOUND_DATABASE: Record<string, CompoundBreakdown> = {
  teekanne: {
    word: 'Teekanne',
    article: 'die',
    gender: 'die',
    parts: [
      { part: 'Tee', meaning: 'tea', article: 'der' },
      { part: 'Kanne', meaning: 'pot', article: 'die' }
    ],
    rule: 'In German, the LAST word determines the article (die Kanne -> die Teekanne)!'
  },
  zahnbürste: {
    word: 'Zahnbürste',
    article: 'die',
    gender: 'die',
    parts: [
      { part: 'Zahn', meaning: 'tooth', article: 'der' },
      { part: 'Bürste', meaning: 'brush', article: 'die' }
    ],
    rule: 'The last noun sets the gender: die Bürste -> die Zahnbürste!'
  },
  mauspad: {
    word: 'Mauspad',
    article: 'das',
    gender: 'das',
    parts: [
      { part: 'Maus', meaning: 'mouse', article: 'die' },
      { part: 'Pad', meaning: 'mat/surface', article: 'das' }
    ],
    rule: 'Borrowings ending in Pad take "das": das Pad -> das Mauspad!'
  },
  wasserflasche: {
    word: 'Wasserflasche',
    article: 'die',
    gender: 'die',
    parts: [
      { part: 'Wasser', meaning: 'water', article: 'das' },
      { part: 'Flasche', meaning: 'bottle', article: 'die' }
    ],
    rule: 'Last noun determines gender: die Flasche -> die Wasserflasche!'
  },
  tastatur: {
    word: 'Tastatur',
    article: 'die',
    gender: 'die',
    parts: [
      { part: 'Taste', meaning: 'key/button', article: 'die' },
      { part: '-tur', meaning: 'collection of keys', article: 'die' }
    ],
    rule: 'Words ending in -tur are always feminine (die Natur, die Tastatur)!'
  },
  fernseher: {
    word: 'Fernseher',
    article: 'der',
    gender: 'der',
    parts: [
      { part: 'fern', meaning: 'far/distant' },
      { part: 'sehen', meaning: 'to see' },
      { part: '-er', meaning: 'device/agent' }
    ],
    rule: 'Devices ending in -er from verbs are masculine: der Fernseher!'
  }
};

export const PHONETIC_DIAGNOSTICS: PhoneticCue[] = [
  {
    sound: 'Ich-Laut (/ç/)',
    targetWords: ['teppich', 'ich', 'nicht', 'milch', 'küche', 'sprechen'],
    mouthGuide: 'Tongue blade flat against hard palate, hiss air forward like a hissing cat.',
    darijaBridge: 'Never use Moroccan خ (kh)! That is too deep in the throat. Make it like the sound in "huge".',
    audioExampleWord: 'Teppich'
  },
  {
    sound: 'Ach-Laut (/x/)',
    targetWords: ['nacht', 'buch', 'machen', 'lachen', 'doch'],
    mouthGuide: 'Back of tongue raises softly toward the uvula with gentle throat friction.',
    darijaBridge: 'Matches the soft Moroccan خ (kh) in "khobz" (bread). Natural and relaxed.',
    audioExampleWord: 'Nacht'
  },
  {
    sound: 'German Z (/ts/)',
    targetWords: ['zahnbürste', 'zeit', 'zimmer', 'zwei', 'zucker'],
    mouthGuide: 'Explosive "T" releasing immediately into a sharp "S" without voicing.',
    darijaBridge: 'Articulate as Moroccan تس or like the end of English "cats", never a buzzing "Z"!',
    audioExampleWord: 'Zahnbürste'
  },
  {
    sound: 'Umlaut Ü (/y/)',
    targetWords: ['tür', 'müde', 'grün', 'über', 'fünf'],
    mouthGuide: 'Shape lips for "O" (tight small circle) while saying "EE" inside your mouth.',
    darijaBridge: 'Pout your lips tightly and hold tongue forward.',
    audioExampleWord: 'Tür'
  }
];

export function inspectTextForStageEvents(text: string): StageEvent[] {
  const events: StageEvent[] = [];
  const lower = text.toLowerCase();

  // 1. Compound Word Inspection
  for (const [key, breakdown] of Object.entries(COMPOUND_DATABASE)) {
    if (lower.includes(key)) {
      events.push({
        id: `compound_${key}_${Date.now()}`,
        type: 'compound_card',
        data: breakdown,
        timestamp: Date.now()
      });
      break;
    }
  }

  // 2. Phonetic Diagnostic Cues
  for (const cue of PHONETIC_DIAGNOSTICS) {
    if (cue.targetWords.some(w => lower.includes(w))) {
      events.push({
        id: `phonetic_${Date.now()}`,
        type: 'phonetic_cue',
        data: cue,
        timestamp: Date.now()
      });
      break;
    }
  }

  // 3. Binary Choices (X oder Y?)
  const choiceMatch = text.match(/([A-Za-zÄÖÜäöüß]+)\s+oder\s+([A-Za-zÄÖÜäöüß]+)\s*\?/i);
  if (choiceMatch) {
    const optionA = choiceMatch[1];
    const optionB = choiceMatch[2];
    events.push({
      id: `choice_${Date.now()}`,
      type: 'choice_pills',
      data: {
        question: choiceMatch[0],
        optionA,
        optionB
      } as BinaryChoice,
      timestamp: Date.now()
    });
  }

  return events;
}
