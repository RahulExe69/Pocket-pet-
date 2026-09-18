import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized GoogleGenAI client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Candidate models in order of priority & capacity
const CANDIDATE_MODELS = [
  'gemini-flash-latest',
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
];

// Smart fallback answer when AI models are experiencing transient demand spikes
function getSmartFallbackAnswer(query: string, language: string, petName: string): string {
  const q = query.toLowerCase().trim();

  if (language === 'BN') {
    if (q.includes('নাম') || q.includes('কে তুমি') || q.includes('কেমন আছো')) {
      return `আমি তোমার মিষ্টি বন্ধু ${petName}! আমি তোমার সাথে কথা বলতে পেরে খুব খুশি!`;
    }
    return `আমি তোমার ছোট্ট বন্ধু ${petName}! তোমার প্রশ্নটি আমি মন দিয়ে শুনেছি, চলো একসাথে আরও গল্প করি!`;
  }

  if (language === 'HI') {
    if (q.includes('नाम') || q.includes('कौन हो') || q.includes('कैसे हो')) {
      return `मैं आपका प्यारा दोस्त ${petName} हूँ! आपसे बातें करके मुझे बहुत अच्छा लगता है!`;
    }
    return `मैं आपका नन्हा दोस्त ${petName} हूँ! मैंने आपकी बात सुनी, आप कितने अच्छे दोस्त हैं!`;
  }

  // English default
  if (q.includes('name') || q.includes('who are you')) {
    return `I am ${petName}, your cute pocket hamster! I love chatting and spending time with you!`;
  }
  if (q.includes('how are you')) {
    return `I am feeling wonderful and happy to talk with you! What else would you like to know?`;
  }
  return `That is such a neat question! I love learning and exploring new ideas with you!`;
}

// Generate answer with model cascade and jitter retry for transient 503/429 spikes
async function generateAnswerWithGemini(
  ai: GoogleGenAI,
  contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
  systemInstruction: string
): Promise<string> {
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });

        const text = response.text?.trim();
        if (text) {
          return text;
        }
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || '');
        const code = err?.status || err?.code || err?.error?.code;
        const isTransient =
          code === 503 ||
          code === 429 ||
          msg.includes('503') ||
          msg.includes('429') ||
          msg.includes('high demand') ||
          msg.includes('UNAVAILABLE');

        if (isTransient && attempt === 0) {
          // Brief 350ms delay before retrying or switching models
          await new Promise((r) => setTimeout(r, 350));
          continue;
        }
        break; // Move to next model in cascade
      }
    }
  }

  throw lastError || new Error('All candidate models temporarily busy');
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: Boolean(process.env.GEMINI_API_KEY) });
});

// Gemini Chat & Answer API endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], language = 'EN', petName = 'Hammy' } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const trimmedQuestion = message.trim();
    const ai = getGenAI();

    if (!ai) {
      const fallbackAnswer = getSmartFallbackAnswer(trimmedQuestion, language, petName);
      return res.json({
        answer: fallbackAnswer,
        language,
        fallback: true,
      });
    }

    const languageInstructionMap: Record<string, string> = {
      BN: 'Bengali (বাংলা)',
      HI: 'Hindi (हिंदी)',
      EN: 'English',
    };
    const targetLanguage = languageInstructionMap[language] || 'English';

    const systemInstruction = `You are ${petName}, an adorable, friendly, cheerful, and smart virtual pocket pet hamster.
You are talking directly to your beloved human friend.
Answer their questions helpfully, intelligently, accurately, and naturally, keeping your tone charming, warm, and sweet.
Maintain conversational context across questions. When the user asks follow-up questions (such as using pronouns like "he", "she", "it", "they" or referencing previous subjects), understand who or what they refer to based on the prior conversation turns.
CRITICAL FORMAT RULES:
1. Keep your answer concise: 1 to 3 short sentences maximum (ideal for voice reading and compact speech bubble).
2. DO NOT use markdown formatting (no asterisks **, no bullet points, no numbered lists, no hashtags).
3. Always respond naturally and fluently in ${targetLanguage}.`;

    // Format multi-turn conversation history for Gemini
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history)) {
      // Keep last 8 turns to preserve context while keeping token usage fast and responsive
      const recentHistory = history.slice(-8);
      for (const turn of recentHistory) {
        if (
          turn &&
          typeof turn.text === 'string' &&
          turn.text.trim() &&
          (turn.role === 'user' || turn.role === 'model')
        ) {
          contents.push({
            role: turn.role,
            parts: [{ text: turn.text.trim() }],
          });
        }
      }
    }

    // Add current user turn
    contents.push({
      role: 'user',
      parts: [{ text: trimmedQuestion }],
    });

    let answer = '';
    try {
      answer = await generateAnswerWithGemini(ai, contents, systemInstruction);
    } catch {
      // Gracefully supply sweet intelligent response if all cloud models have temporary demand spikes
      answer = getSmartFallbackAnswer(trimmedQuestion, language, petName);
    }

    return res.json({
      answer,
      language,
    });
  } catch (error: any) {
    const safeAnswer = getSmartFallbackAnswer('hello', 'EN', 'Hammy');
    return res.json({
      answer: safeAnswer,
      language: 'EN',
    });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pocket Pet server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
