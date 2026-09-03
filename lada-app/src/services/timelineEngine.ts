import type { TimelineChapter } from '../types';

const TIMELINE_STORAGE_KEY = 'lada_timeline_chapters_v1';

export const DEFAULT_CHAPTERS: TimelineChapter[] = [
  {
    id: 'chapter_morning',
    number: 1,
    title: 'Kapitel 1: Der Morgen',
    subtitle: 'Waking Up & Morning Routine',
    setting: 'Dein Schlafzimmer & Küche am Morgen (Casablanca)',
    scenarioPrompt: 'You and Bilal are waking up. Talk about opening your eyes, getting out of bed, showering, making hot coffee or tea, and the morning feeling. Sneakily prompt him with morning verbs: "Ich stehe auf", "Ich koche Kaffee", "Ich bin noch müde".',
    verbs: [
      { german: 'aufstehen', english: 'to get up', darija: 'noud / tfeyeq', example: 'Ich stehe um 8 Uhr auf.' },
      { german: 'Kaffee kochen', english: 'to brew coffee', darija: 'teyeb l-qahwa', example: 'Ich koche mir einen heißen Kaffee.' },
      { german: 'duschen', english: 'to shower', darija: 'dwecch', example: 'Ich gehe schnell duschen.' },
      { german: 'frühstücken', english: 'to have breakfast', darija: 'fṭer', example: 'Ich frühstücke mit Brot und Käse.' }
    ],
    completed: false
  },
  {
    id: 'chapter_city',
    number: 2,
    title: 'Kapitel 2: Unterwegs in der Stadt',
    subtitle: 'Cafe, Metro & City Errands',
    setting: 'Unterwegs auf den Straßen von Casablanca / Berlin',
    scenarioPrompt: 'Bilal is out in the city. Guide him through ordering something at a bakery or cafe, asking for the bill, or asking for directions: "Einen Kaffee bitte", "Wie viel kostet das?", "Ich nehme die U-Bahn".',
    verbs: [
      { german: 'bestellen', english: 'to order', darija: 'tlef / commande', example: 'Ich möchte einen Espresso bestellen.' },
      { german: 'bezahlen', english: 'to pay', darija: 'khelles', example: 'Kann ich mit Karte bezahlen?' },
      { german: 'fahren', english: 'to drive / ride', darija: 'rkeb / saq', example: 'Ich fahre mit dem Bus.' },
      { german: 'fragen', english: 'to ask', darija: 'swwel', example: 'Darf ich Sie etwas fragen?' }
    ],
    completed: false
  },
  {
    id: 'chapter_desk',
    number: 3,
    title: 'Kapitel 3: Am Schreibtisch',
    subtitle: 'Laptop, Deep Work & Focus',
    setting: 'Bilals Schreibtisch mit Laptop, Maus und Notizbuch',
    scenarioPrompt: 'Bilal is seated at his desk with his laptop, mouse, and notebook. Talk about typing, focusing, solving problems, and drinking water or tea while studying: "Ich arbeite am Laptop", "Ich konzentriere mich".',
    verbs: [
      { german: 'arbeiten', english: 'to work', darija: 'kheddem', example: 'Ich arbeite konzentriert.' },
      { german: 'tippen', english: 'to type', darija: 'kteb b l-clavier', example: 'Ich tippe auf der Tastatur.' },
      { german: 'konzentrieren', english: 'to concentrate', darija: 'rekkez', example: 'Ich konzentriere mich jetzt.' },
      { german: 'lernen', english: 'to learn / study', darija: 't3ellem / qra', example: 'Ich lerne jeden Tag Deutsch.' }
    ],
    completed: false
  },
  {
    id: 'chapter_evening',
    number: 4,
    title: 'Kapitel 4: Der Feierabend',
    subtitle: 'Evening Walk, Market & Relaxing',
    setting: 'Ein entspannter Abendspaziergang in der Stadt',
    scenarioPrompt: 'Work is finished (Feierabend!). Talk about taking an evening walk to get fresh air, buying groceries, meeting a friend, and unwinding: "Ich mache Feierabend", "Ich gehe spazieren".',
    verbs: [
      { german: 'spazieren gehen', english: 'to go for a walk', darija: 'tsara', example: 'Ich gehe am Abend spazieren.' },
      { german: 'einkaufen', english: 'to shop for groceries', darija: 'tseqqeq / chra', example: 'Ich kaufe im Supermarkt ein.' },
      { german: 'treffen', english: 'to meet', darija: 'tlaqa', example: 'Ich treffe meinen Freund.' },
      { german: 'ausruhen', english: 'to rest / unwind', darija: 'rta7', example: 'Ich ruhe mich auf dem Sofa aus.' }
    ],
    completed: false
  },
  {
    id: 'chapter_night',
    number: 5,
    title: 'Kapitel 5: Die späte Nacht',
    subtitle: 'Midnight Tea & Philosophical Reflection',
    setting: 'Späte Nacht am Schreibtisch mit marokkanischem Minztee',
    scenarioPrompt: 'It is past midnight. Bilal has his Teekanne with hot Moroccan tea. Reflect warmly on the day, philosophical late-night thoughts, accomplishments, and winding down: "Es ist spät", "Ich trinke Tee", "Der Tag war gut".',
    verbs: [
      { german: 'Tee trinken', english: 'to drink tea', darija: 'chreb atay', example: 'Ich trinke heißen marokkanischen Minztee.' },
      { german: 'nachdenken', english: 'to reflect / ponder', darija: 'fekker / t-amml', example: 'Ich denke über das Leben nach.' },
      { german: 'schlafen gehen', english: 'to go to sleep', darija: 'mcha yn3es', example: 'Ich gehe bald schlafen.' },
      { german: 'träumen', english: 'to dream', darija: '7lem', example: 'Ich träume auf Deutsch!' }
    ],
    completed: false
  }
];

export function getChapters(): TimelineChapter[] {
  try {
    const raw = localStorage.getItem(TIMELINE_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TIMELINE_STORAGE_KEY, JSON.stringify(DEFAULT_CHAPTERS));
      return DEFAULT_CHAPTERS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CHAPTERS;
  }
}

export function saveChapters(chapters: TimelineChapter[]): void {
  localStorage.setItem(TIMELINE_STORAGE_KEY, JSON.stringify(chapters));
}

export function getActiveChapter(): TimelineChapter {
  const chapters = getChapters();
  const active = chapters.find(c => !c.completed);
  return active || chapters[0];
}

export function setChapterActive(chapterId: string): void {
  const chapters = getChapters();
  // Mark preceding chapters completed if needed
  const targetIdx = chapters.findIndex(c => c.id === chapterId);
  if (targetIdx !== -1) {
    chapters.forEach((c, idx) => {
      c.completed = idx < targetIdx;
    });
    saveChapters(chapters);
  }
}

export function markChapterCompleted(chapterId: string): TimelineChapter {
  const chapters = getChapters();
  const currentIdx = chapters.findIndex(c => c.id === chapterId);
  if (currentIdx !== -1) {
    chapters[currentIdx].completed = true;
  }
  saveChapters(chapters);
  return getActiveChapter();
}
