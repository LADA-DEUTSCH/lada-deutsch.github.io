import type { LearnerProfile, SRSItem } from '../types';

const PROFILE_STORAGE_KEY = 'lada_learner_profile_v1';

export const INITIAL_BILAL_PROFILE: LearnerProfile = {
  learnerName: 'Bilal',
  targetLanguage: 'German',
  nativeLanguage: 'Moroccan Darija / English',
  totalSessions: 13,
  bridgeMode: 'german_darija',
  activeChapterId: 'chapter_morning',
  a1ProgressPercent: 14,
  personalFacts: [
    { id: 'f1', category: 'Environment', fact: 'Has a desk setup with laptop, mouse, and mousepad', dateLearned: '2026-08-27' },
    { id: 'f2', category: 'Routine', fact: 'Loves Moroccan tea (berrad / die Teekanne)', dateLearned: '2026-08-27' },
    { id: 'f3', category: 'Time', fact: 'Often studies late at night past midnight in Morocco', dateLearned: '2026-09-02' },
    { id: 'f4', category: 'Study', fact: 'Keeps a handwritten notebook for German alphabet and Umlaute', dateLearned: '2026-09-03' }
  ],
  vocabulary: [
    { id: 'v1', german: 'Teekanne', article: 'die', english: 'teapot', category: 'noun', intervalDays: 3, nextReviewDate: new Date().toISOString(), timesReviewed: 4, struggleCount: 0 },
    { id: 'v2', german: 'Zahnbürste', article: 'die', english: 'toothbrush', category: 'noun', intervalDays: 1, nextReviewDate: new Date().toISOString(), timesReviewed: 2, struggleCount: 1 },
    { id: 'v3', german: 'Mauspad', article: 'das', english: 'mousepad', category: 'noun', intervalDays: 7, nextReviewDate: new Date().toISOString(), timesReviewed: 5, struggleCount: 0 },
    { id: 'v4', german: 'Tastatur', article: 'die', english: 'keyboard', category: 'noun', intervalDays: 3, nextReviewDate: new Date().toISOString(), timesReviewed: 3, struggleCount: 0 },
    { id: 'v5', german: 'Wasserflasche', article: 'die', english: 'water bottle', category: 'noun', intervalDays: 1, nextReviewDate: new Date().toISOString(), timesReviewed: 2, struggleCount: 0 },
    { id: 'v6', german: 'Fernseher', article: 'der', english: 'TV', category: 'noun', intervalDays: 7, nextReviewDate: new Date().toISOString(), timesReviewed: 3, struggleCount: 0 }
  ]
};

export function loadProfile(): LearnerProfile {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) {
      saveProfile(INITIAL_BILAL_PROFILE);
      return INITIAL_BILAL_PROFILE;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_BILAL_PROFILE;
  }
}

export function saveProfile(profile: LearnerProfile): void {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function getDueSrsItems(profile: LearnerProfile, limit = 3): SRSItem[] {
  const now = new Date();
  return profile.vocabulary
    .filter(item => new Date(item.nextReviewDate) <= now)
    .sort((a, b) => a.intervalDays - b.intervalDays)
    .slice(0, limit);
}

export function recordWordReview(wordId: string, remembered: boolean): void {
  const profile = loadProfile();
  const item = profile.vocabulary.find(v => v.id === wordId);
  if (!item) return;

  item.timesReviewed += 1;
  if (remembered) {
    if (item.intervalDays === 1) item.intervalDays = 3;
    else if (item.intervalDays === 3) item.intervalDays = 7;
    else if (item.intervalDays === 7) item.intervalDays = 16;
    else item.intervalDays = 30;
  } else {
    item.struggleCount += 1;
    item.intervalDays = 1;
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + item.intervalDays);
  item.nextReviewDate = nextDate.toISOString();

  saveProfile(profile);
}
