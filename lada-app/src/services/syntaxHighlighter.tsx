import React from 'react';

const COMMON_ACTION_VERBS = new Set([
  'stehe', 'stehst', 'steht', 'stehen', 'aufstehen',
  'koche', 'kochst', 'kocht', 'kochen',
  'trinke', 'trinkst', 'trinkt', 'trinken',
  'arbeite', 'arbeitest', 'arbeitet', 'arbeiten',
  'gehe', 'gehst', 'geht', 'gehen',
  'fahre', 'fährst', 'fährt', 'fahren',
  'bestelle', 'bestellst', 'bestellt', 'bestellen',
  'bezahle', 'bezahlst', 'bezahlt', 'bezahlen',
  'lerne', 'lernst', 'lernt', 'lernen',
  'tippe', 'tippst', 'tippt', 'tippen',
  'frage', 'fragst', 'fragt', 'fragen',
  'sehe', 'siehst', 'sieht', 'sehen',
  'mache', 'machst', 'macht', 'machen',
  'schlafe', 'schläfst', 'schläft', 'schlafen',
  'träume', 'träumst', 'träumt', 'träumen'
]);

export function highlightGermanSyntax(text: string): React.ReactNode[] {
  if (!text) return [];

  // Tokenize by words and punctuation
  const tokens = text.split(/(\s+|[.,!?;:])/);

  return tokens.map((token, index) => {
    const cleanWord = token.trim().toLowerCase();
    if (!cleanWord) {
      return <span key={index}>{token}</span>;
    }

    // 1. Check Articles
    if (cleanWord === 'der' || cleanWord === 'den') {
      return (
        <span key={index} style={{ color: '#60a5fa', fontWeight: 800, textShadow: '0 0 10px rgba(96, 165, 250, 0.4)' }}>
          {token}
        </span>
      );
    }
    if (cleanWord === 'die') {
      return (
        <span key={index} style={{ color: '#f472b6', fontWeight: 800, textShadow: '0 0 10px rgba(244, 114, 182, 0.4)' }}>
          {token}
        </span>
      );
    }
    if (cleanWord === 'das') {
      return (
        <span key={index} style={{ color: '#34d399', fontWeight: 800, textShadow: '0 0 10px rgba(52, 211, 153, 0.4)' }}>
          {token}
        </span>
      );
    }

    // 2. Check Action Verbs
    if (COMMON_ACTION_VERBS.has(cleanWord)) {
      return (
        <span key={index} style={{ color: '#facc15', fontWeight: 700, textShadow: '0 0 8px rgba(250, 204, 21, 0.3)' }}>
          {token}
        </span>
      );
    }

    // Default Token
    return <span key={index}>{token}</span>;
  });
}
