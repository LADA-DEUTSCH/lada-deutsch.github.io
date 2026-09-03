export type VoiceName = 'Kore' | 'Aoede' | 'Fenrir' | 'Puck' | 'Charon';

export type BridgeLanguageMode = 'german_only' | 'german_darija' | 'german_english';

export interface KeyStatus {
  index: number;
  maskedKey: string;
  isExhausted: boolean;
  cooldownUntil?: number;
}

export interface AuthVault {
  pinHash: string;
  salt: string;
  iv: string;
  encryptedKeys: string; // Base64 AES-GCM ciphertext
}

export interface CompoundBreakdown {
  word: string;
  article: string;
  gender: 'der' | 'die' | 'das';
  parts: { part: string; meaning: string; article?: string }[];
  rule: string;
}

export interface PhoneticCue {
  sound: string;
  targetWords: string[];
  mouthGuide: string;
  darijaBridge: string;
  audioExampleWord: string;
}

export interface BinaryChoice {
  question: string;
  optionA: string;
  optionB: string;
}

export type StageEventType = 'compound_card' | 'phonetic_cue' | 'choice_pills';

export interface StageEvent {
  id: string;
  type: StageEventType;
  data: CompoundBreakdown | PhoneticCue | BinaryChoice;
  timestamp: number;
}

export interface SRSItem {
  id: string;
  german: string;
  article: 'der' | 'die' | 'das' | '';
  english: string;
  category: 'noun' | 'verb' | 'adjective' | 'phrase';
  intervalDays: number;
  nextReviewDate: string; // ISO string
  timesReviewed: number;
  struggleCount: number;
}

export interface PersonalFact {
  id: string;
  category: string;
  fact: string;
  dateLearned: string;
}

export interface SessionTurn {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface TimelineVerb {
  german: string;
  english: string;
  darija: string;
  example: string;
}

export interface TimelineChapter {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  setting: string;
  scenarioPrompt: string;
  verbs: TimelineVerb[];
  completed: boolean;
}

export interface CallHistoryItem {
  id: string;
  date: string;
  durationSeconds: number;
  chapterTitle: string;
  turnsCount: number;
  turns: SessionTurn[];
  wordsAcquired: string[];
  summary: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface ChatThread {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
}

export interface LearnerProfile {
  learnerName: string;
  targetLanguage: string;
  nativeLanguage: string;
  totalSessions: number;
  bridgeMode: BridgeLanguageMode;
  activeChapterId: string;
  personalFacts: PersonalFact[];
  vocabulary: SRSItem[];
}
