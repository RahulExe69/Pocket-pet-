import { TalkingLanguage, getCuteHamsterAnswer } from '../utils/speech';

export interface ChatHistoryItem {
  role: 'user' | 'model';
  text: string;
}

/**
 * Sends the user's question to Gemini via server-side /api/chat endpoint.
 * Preserves multi-turn conversation context so follow-up questions work naturally.
 */
export async function askGeminiHamster(
  question: string,
  history: ChatHistoryItem[],
  language: TalkingLanguage,
  petName: string = 'Hammy'
): Promise<string> {
  const trimmed = question.trim();
  if (!trimmed) {
    return '';
  }

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: trimmed,
        history,
        language,
        petName,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.answer && typeof data.answer === 'string' && data.answer.trim()) {
        return data.answer.trim();
      }
    } else {
      console.warn('Gemini chat API returned non-OK status:', response.status);
    }
  } catch (error) {
    console.warn('Failed to contact Gemini chat API, using fallback:', error);
  }

  // Graceful fallback if Gemini API is temporarily unavailable
  return getCuteHamsterAnswer(trimmed, language, petName);
}
