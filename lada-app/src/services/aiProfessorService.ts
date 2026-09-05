import { unlockVault } from './cryptoVault';

let cachedApiKey: string | null = null;

/**
 * Silently retrieves an active Gemini API key from the encrypted vault
 * Uses the default system credential with zero user prompts
 */
export async function getOrUnlockGeminiKey(): Promise<string> {
  if (cachedApiKey) return cachedApiKey;

  try {
    const keys = await unlockVault('2026');
    if (keys && keys.length > 0) {
      // Pick a random key or the first valid one to distribute load
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      cachedApiKey = randomKey;
      return randomKey;
    }
  } catch (err) {
    console.warn('Silent key unlock error:', err);
  }

  // Fallback to process env if configured
  return (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
}

/**
 * Ask AI Professor LADA for an instant, deep Moroccan Darija explanation in Arabic script
 */
export async function askAiProfessor(
  germanWord: string,
  darijaTranslation: string,
  customQuestion?: string
): Promise<string> {
  const apiKey = await getOrUnlockGeminiKey();
  if (!apiKey) {
    return 'ما كاينش مفتاح API خدام حالياً، ولكن الأستاذ لادا كيقدّم ليك الشرح العادي من القاعدة.';
  }

  const systemPrompt = `أنت "الأستاذ لادا" (Professor LADA)، أستاذ ألماني-مغربي عبقري وخبير في تعليم اللغة الألمانية للمغاربة من الصفر حتى الاحتراف (A1-B1).
قواعد صارمة جداً:
1. اكتب كل شروحاتك بالدارجة المغربية الأصيلة مكتوبة بالحروف العربية فقط (ممنوع الفرانكو وممنوع الأرقام 3 و 7 و 9).
2. الشرح يكون حار، مشوق، مركز ومفيد بحال إلا كتهضر مع بلال (Bilal) مباشرة.
3. اشرح:
   - المعنى الحقيقي وسياق الاستعمال
   - سر النطق وموضع اللسان والشفتين مقارنة بالأصوات المغربية
   - الفخ اللي كيطيحو فيه المغاربة وكيفاش يتفاداه
   - مثال جملة حية في برلين
4. أسلوبك مرح وواعر ومباشر بدون إطالة فارغة.`;

  const userPrompt = customQuestion
    ? `الكلمة الألمانية: "${germanWord}" (الترجمة: ${darijaTranslation}).
سؤال بلال: ${customQuestion}
جاوب بالدارجة المغربية بالحروف العربية.`
    : `اشرح لبلال هاد الكلمة/الجملة الألمانية: "${germanWord}" (معناها بالدارجة: ${darijaTranslation}).
عطيه الشرح وسر النطق وفخ المغاربة ومثال في جملة، بالدارجة المغربية المكتوبة بالحروف العربية.`;

  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 600
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      }
    } catch (e) {
      console.warn(`Failed with model ${model}, trying next...`, e);
    }
  }

  return 'وقع مشكل خفيف في الاتصال بالذكاء الاصطناعي، عاود جرب مرة أخرى!';
}
