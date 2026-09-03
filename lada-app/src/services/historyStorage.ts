import type { CallHistoryItem, ChatThread } from '../types';

const CALL_HISTORY_STORAGE_KEY = 'lada_call_history_v1';
const CHAT_THREADS_STORAGE_KEY = 'lada_chat_threads_v1';

export const INITIAL_CALL_HISTORY: CallHistoryItem[] = [
  {
    id: 'call_13',
    date: '2026-09-03T21:30:00Z',
    durationSeconds: 320,
    chapterTitle: 'Kapitel 3: Am Schreibtisch',
    turnsCount: 8,
    turns: [
      { role: 'model', text: 'Hey Bilal... still up? How is it going?', timestamp: '2026-09-03T21:30:05Z' },
      { role: 'user', text: 'Yeah, I am at my desk practicing German.', timestamp: '2026-09-03T21:30:15Z' },
      { role: 'model', text: 'I see your notebook with the alphabet written out and your mousepad! Which letter are you working on?', timestamp: '2026-09-03T21:30:30Z' }
    ],
    wordsAcquired: ['das Mauspad', 'die Teekanne', 'das Notizbuch'],
    summary: 'Discussion about late-night study spots in Casablanca and desk setup.'
  },
  {
    id: 'call_12',
    date: '2026-09-02T23:15:00Z',
    durationSeconds: 410,
    chapterTitle: 'Kapitel 5: Die späte Nacht',
    turnsCount: 12,
    turns: [
      { role: 'model', text: 'Salam Bilal! Ein heißer Tee am späten Abend?', timestamp: '2026-09-02T23:15:05Z' },
      { role: 'user', text: 'Genau, marokkanischer Minztee.', timestamp: '2026-09-02T23:15:20Z' }
    ],
    wordsAcquired: ['die Teekanne', 'der Minztee', 'ausruhen'],
    summary: 'Moroccan tea culture and compound word breakdown of die Teekanne.'
  }
];

export const INITIAL_CHAT_THREADS: ChatThread[] = [
  {
    id: 'thread_grammar_1',
    title: 'German Articles: der, die, das',
    updatedAt: '2026-09-03T20:00:00Z',
    messages: [
      { id: 'm1', role: 'user', text: 'How do I know if a compound word is der, die, or das?', timestamp: '2026-09-03T20:00:00Z' },
      { id: 'm2', role: 'model', text: 'In German, the gender is **always** determined by the last noun in the compound!\n\nFor example:\n- **der Tee** + **die Kanne** = **die Teekanne** (because Kanne is feminine!)\n- **die Zahn** + **die Bürste** = **die Zahnbürste**\n- **die Maus** + **das Pad** = **das Mauspad**', timestamp: '2026-09-03T20:00:05Z' }
    ]
  }
];

export function loadCallHistory(): CallHistoryItem[] {
  try {
    const raw = localStorage.getItem(CALL_HISTORY_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CALL_HISTORY_STORAGE_KEY, JSON.stringify(INITIAL_CALL_HISTORY));
      return INITIAL_CALL_HISTORY;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CALL_HISTORY;
  }
}

export function saveCallHistory(calls: CallHistoryItem[]): void {
  localStorage.setItem(CALL_HISTORY_STORAGE_KEY, JSON.stringify(calls));
}

export function addCallRecord(record: CallHistoryItem): void {
  const history = loadCallHistory();
  history.unshift(record);
  saveCallHistory(history);
}

export function loadChatThreads(): ChatThread[] {
  try {
    const raw = localStorage.getItem(CHAT_THREADS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CHAT_THREADS_STORAGE_KEY, JSON.stringify(INITIAL_CHAT_THREADS));
      return INITIAL_CHAT_THREADS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CHAT_THREADS;
  }
}

export function saveChatThreads(threads: ChatThread[]): void {
  localStorage.setItem(CHAT_THREADS_STORAGE_KEY, JSON.stringify(threads));
}

export function addChatThread(thread: ChatThread): void {
  const threads = loadChatThreads();
  threads.unshift(thread);
  saveChatThreads(threads);
}

export function updateChatThread(threadId: string, messages: ChatThread['messages']): void {
  const threads = loadChatThreads();
  const target = threads.find(t => t.id === threadId);
  if (target) {
    target.messages = messages;
    target.updatedAt = new Date().toISOString();
    saveChatThreads(threads);
  }
}
