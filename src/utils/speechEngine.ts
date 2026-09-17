// Web Speech API wrapper for Hamster Talking & Voice Synthesis
export type SupportedLanguage = 'BN' | 'HI' | 'EN';

export interface SpeechLangConfig {
  code: string;
  speechCode: string;
  synthCode: string;
  name: string;
  nativeName: string;
  repeatPrompt: string;
  chatPrompt: string;
  listeningText: string;
  speakingText: string;
  placeholder: string;
}

export const LANGUAGE_CONFIGS: Record<SupportedLanguage, SpeechLangConfig> = {
  BN: {
    code: 'BN',
    speechCode: 'bn-BD',
    synthCode: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    repeatPrompt: 'বলো শুনি (Repeat)',
    chatPrompt: 'আড্ডা দাও (Chat)',
    listeningText: 'শুনছি... কিছু বলো! 🎙️',
    speakingText: 'বলছি শোনো... 🐹',
    placeholder: 'হ্যামস্টারকে কিছু জিজ্ঞাসা করো...',
  },
  HI: {
    code: 'HI',
    speechCode: 'hi-IN',
    synthCode: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    repeatPrompt: 'दोहराओ (Repeat)',
    chatPrompt: 'बात करो (Chat)',
    listeningText: 'सुन रहा हूँ... कुछ बोलो! 🎙️',
    speakingText: 'बोल रहा हूँ... 🐹',
    placeholder: 'हैमस्टर से कुछ पूछो...',
  },
  EN: {
    code: 'EN',
    speechCode: 'en-US',
    synthCode: 'en',
    name: 'English',
    nativeName: 'English',
    repeatPrompt: 'Repeat',
    chatPrompt: 'Chat',
    listeningText: 'Listening... speak now! 🎙️',
    speakingText: 'Speaking... 🐹',
    placeholder: 'Ask the hamster anything...',
  },
};

// Check if Speech Recognition is supported
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
}

// Check if Speech Synthesis is supported
export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window;
}

let activeRecognition: any = null;

// Start voice recognition
export function startVoiceRecognition({
  lang,
  onResult,
  onError,
  onEnd,
}: {
  lang: SupportedLanguage;
  onResult: (transcript: string) => void;
  onError?: (err: any) => void;
  onEnd?: () => void;
}): () => void {
  const SpeechRec =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRec) {
    if (onError) onError(new Error('Speech recognition not supported on this browser.'));
    return () => {};
  }

  // Stop any active recognition
  if (activeRecognition) {
    try {
      activeRecognition.abort();
    } catch {}
    activeRecognition = null;
  }

  try {
    const recognition = new SpeechRec();
    recognition.lang = LANGUAGE_CONFIGS[lang].speechCode;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let receivedResult = false;

    recognition.onresult = (event: any) => {
      receivedResult = true;
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript && transcript.trim()) {
        onResult(transcript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      // Ignore routine aborts
      if (event.error === 'aborted') return;
      if (onError) onError(event);
    };

    recognition.onend = () => {
      activeRecognition = null;
      if (onEnd) onEnd();
    };

    recognition.start();
    activeRecognition = recognition;

    return () => {
      try {
        recognition.abort();
      } catch {}
      activeRecognition = null;
    };
  } catch (err) {
    if (onError) onError(err);
    return () => {};
  }
}

export function stopVoiceRecognition() {
  if (activeRecognition) {
    try {
      activeRecognition.abort();
    } catch {}
    activeRecognition = null;
  }
}

// Hamster Voice Speech Synthesis (Pitch = 1.5)
let activeUtterance: SpeechSynthesisUtterance | null = null;
let speechTimeoutId: any = null;

export function speakHamsterVoice({
  text,
  lang,
  onStart,
  onEnd,
}: {
  text: string;
  lang: SupportedLanguage;
  onStart?: () => void;
  onEnd?: () => void;
}): void {
  if (!isSpeechSynthesisSupported()) {
    // If not supported, simulate short talking animation then call onEnd
    if (onStart) onStart();
    setTimeout(() => {
      if (onEnd) onEnd();
    }, Math.min(4000, Math.max(1500, text.length * 70)));
    return;
  }

  // Cancel any ongoing speech
  try {
    window.speechSynthesis.cancel();
  } catch {}

  if (speechTimeoutId) {
    clearTimeout(speechTimeoutId);
    speechTimeoutId = null;
  }

  // Strip emojis for speech synthesis so it doesn't try reading emoji names awkwardly
  const cleanSpeechText = text
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[✨💖🌻🥕🍎💧⚡🧼🪙🛍️😴☀️🎾🛁🎒⭐]/g, '')
    .trim();

  const textToSpeak = cleanSpeechText || text;

  const utterance = new SpeechSynthesisUtterance(textToSpeak);

  // USER REQUIREMENT: SpeechSynthesis with pitch 1.5 for cute hamster voice
  utterance.pitch = 1.5;
  utterance.rate = 1.15; // Slightly fast & cute squeaky cadence
  utterance.volume = 1.0;

  const config = LANGUAGE_CONFIGS[lang];
  utterance.lang = config.speechCode;

  // Best-effort find a voice that matches target language
  const voices = window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    const matchingVoice =
      voices.find(
        (v) =>
          v.lang.toLowerCase() === config.speechCode.toLowerCase() ||
          v.lang.toLowerCase().startsWith(config.synthCode.toLowerCase())
      ) ||
      voices.find((v) => v.lang.toLowerCase().includes(config.synthCode.toLowerCase()));

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }
  }

  let hasEnded = false;
  const finish = () => {
    if (hasEnded) return;
    hasEnded = true;
    if (speechTimeoutId) {
      clearTimeout(speechTimeoutId);
      speechTimeoutId = null;
    }
    activeUtterance = null;
    if (onEnd) onEnd();
  };

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    finish();
  };

  utterance.onerror = (e) => {
    finish();
  };

  activeUtterance = utterance;

  // Safety fallback timeout in case browser gets stuck or fails to fire onend
  const approxDurationMs = Math.max(1800, textToSpeak.length * 90);
  speechTimeoutId = setTimeout(() => {
    finish();
  }, approxDurationMs + 1000);

  try {
    window.speechSynthesis.speak(utterance);
  } catch {
    finish();
  }
}

export function stopHamsterVoice() {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
  if (speechTimeoutId) {
    clearTimeout(speechTimeoutId);
    speechTimeoutId = null;
  }
  activeUtterance = null;
}
