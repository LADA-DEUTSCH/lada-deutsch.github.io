import type { SessionTurn, TimelineChapter, ScribeAnalysis } from '../types';

export async function analyzeSessionWithNeuralScribe(
  scribeApiKey: string,
  turns: SessionTurn[],
  activeChapter: TimelineChapter,
  currentA1Progress = 14
): Promise<ScribeAnalysis> {
  if (!turns || turns.length === 0) {
    return {
      a1ProgressPercent: currentA1Progress,
      wordsAcquired: activeChapter.verbs.slice(0, 2).map(v => v.german),
      struggledWith: [],
      pronunciationFeedback: 'Ready for next vocal practice.',
      cleanSummary: `Brief interaction in ${activeChapter.title}.`,
      nextSuggestedVerb: activeChapter.verbs[0]?.german || 'aufstehen'
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${scribeApiKey}`;

  const conversationText = turns
    .map(t => `${t.role === 'user' ? 'Bilal' : 'LADA'}: ${t.text}`)
    .join('\n');

  const systemInstruction = `You are the LADA Neural Scribe.
Your mission is to perform deep cognitive analysis of a spoken German learning session for an A0/A1 absolute beginner (Bilal).
Filter out all conversational filler, technical testing ("can you hear me"), and noise.
Extract ONLY the real "sauce":
1. Words acquired or practiced.
2. Sounds or words he struggled with.
3. Pronunciation coaching feedback.
4. Calculate his updated A1 progression percentage (currently around ${currentA1Progress}%, increase by 1-4% if he practiced words).
5. A clean 1-2 sentence executive debrief.
6. The next recommended action verb.

You MUST respond strictly in valid JSON format matching this schema:
{
  "a1ProgressPercent": number,
  "wordsAcquired": string[],
  "struggledWith": string[],
  "pronunciationFeedback": string,
  "cleanSummary": string,
  "nextSuggestedVerb": string
}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Chapter: ${activeChapter.title} (${activeChapter.subtitle})\nConversation Transcript:\n${conversationText}\n\nAnalyze this session and return the JSON analysis.`
              }
            ]
          }
        ],
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Scribe API error ${response.status}`);
    }

    const data = await response.json();
    const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawJson) throw new Error('Empty scribe response');

    const parsed = JSON.parse(rawJson) as ScribeAnalysis;
    return {
      a1ProgressPercent: Math.min(100, Math.max(currentA1Progress, parsed.a1ProgressPercent || currentA1Progress + 2)),
      wordsAcquired: parsed.wordsAcquired || [],
      struggledWith: parsed.struggledWith || [],
      pronunciationFeedback: parsed.pronunciationFeedback || 'Good effort on German pronunciation.',
      cleanSummary: parsed.cleanSummary || `Practiced spoken German in ${activeChapter.title}.`,
      nextSuggestedVerb: parsed.nextSuggestedVerb || activeChapter.verbs[0]?.german || 'aufstehen'
    };
  } catch (err) {
    console.warn('Neural scribe fallback:', err);
    return {
      a1ProgressPercent: Math.min(100, currentA1Progress + 2),
      wordsAcquired: activeChapter.verbs.slice(0, 2).map(v => v.german),
      struggledWith: [],
      pronunciationFeedback: 'Continue practicing German micro-bursts and Darija sound bridges.',
      cleanSummary: `Spoken dialogue practice in ${activeChapter.title}.`,
      nextSuggestedVerb: activeChapter.verbs[1]?.german || 'Kaffee kochen'
    };
  }
}
