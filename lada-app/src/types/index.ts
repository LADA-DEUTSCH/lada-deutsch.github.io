export type VoiceName = 'Kore' | 'Aoede' | 'Fenrir' | 'Puck' | 'Charon';

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

export interface SessionRecap {
  sessionId: string;
  timestamp: string;
  summary: string;
  turnsCount: number;
}

export interface LearnerProfile {
  learnerName: string;
  targetLanguage: string;
  nativeLanguage: string;
  totalSessions: number;
  personalFacts: PersonalFact[];
  vocabulary: SRSItem[];
  sessionHistory: SessionRecap[];
}

export interface GeminiLiveConfig {
  apiKey: string;
  voiceName: VoiceName;
  systemPrompt: string;
}
