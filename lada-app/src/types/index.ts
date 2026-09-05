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

export interface ScribeAnalysis {
  a1ProgressPercent: number;
  wordsAcquired: string[];
  struggledWith: string[];
  pronunciationFeedback: string;
  cleanSummary: string;
  nextSuggestedVerb: string;
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
  analysis?: ScribeAnalysis;
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
  a1ProgressPercent: number;
  personalFacts: PersonalFact[];
  vocabulary: SRSItem[];
}

// --- 3D Beat Deutsch Game Models ---
export type InstrumentType = 'piano' | 'acoustic_guitar' | 'synthwave' | 'chillhop' | 'funk_bass' | 'moroccan_beat' | 'synth_lead';

export interface RealDialogueSnippet {
  speakerA: string;
  germanA: string;
  speakerB: string;
  germanB: string;
  darijaContext: string;
}

export interface SongLyricItem {
  id: string;
  german: string;
  phoneticGuide: string;
  darijaCorrect: string;
  darijaDistractor: string;
  timingSec: number;
  durationSec?: number;
  profExplanation?: string;
  phoneticSecret?: string;
  moroccanTrap?: string;
  realDialogue?: RealDialogueSnippet;
  darija?: string;
  darijaArabic?: string;
}


export interface SongDefinition {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  theme: string;
  tier: string;
  bpm: number;
  instrument: InstrumentType;
  lyrics: SongLyricItem[];
}

export interface SongProgressRecord {
  songId: string;
  level1Completed: boolean;
  level2Plays: number;
  level2PerfectCount: number; // Target: 10 to unlock Level 3
  level2HighScore: number;
  level3Plays: number;
  level3PerfectCount: number; // Target: 10 to certify Mastery
  level3HighScore: number;
  isMastered: boolean;
}

export type GameDifficultyLevel = 1 | 2 | 3;

