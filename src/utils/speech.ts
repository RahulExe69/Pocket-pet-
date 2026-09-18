// Web Speech API Integration for Cute Hamster Talking, Repeating, and Chatting
// Supports Bengali [BN] (bn-IN), Hindi [HI] (hi-IN), and English [EN] (en-US)

export type TalkingLanguage = 'BN' | 'HI' | 'EN';

export interface LanguageMeta {
  code: string;
  name: string;
  nativeName: string;
  label: TalkingLanguage;
  flag: string;
  defaultGreeting: string;
  repeatPrompt: string;
  chatPlaceholder: string;
}

export const SUPPORTED_LANGUAGES: Record<TalkingLanguage, LanguageMeta> = {
  BN: {
    code: 'bn-IN',
    name: 'Bengali',
    nativeName: 'বাংলা',
    label: 'BN',
    flag: '🇧🇩',
    defaultGreeting: 'হ্যালো! আমি তোমার কিউট হামস্টার! কিছু বলো, আমি শুনছি!',
    repeatPrompt: 'বলুন, আমি হুবহু কিউট গলায় রিপিট করব...',
    chatPlaceholder: 'হামিকে কিছু জিজ্ঞাসা করুন...',
  },
  HI: {
    code: 'hi-IN',
    name: 'Hindi',
    nativeName: 'हिंदी',
    label: 'HI',
    flag: '🇮🇳',
    defaultGreeting: 'नमस्ते! मैं तुम्हारा प्यारा हैमस्टर हूँ! कुछ बोलिए, मैं सुन रहा हूँ!',
    repeatPrompt: 'बोलिए, मैं प्यारी आवाज़ में दोहराऊँगा...',
    chatPlaceholder: 'हैमी से कुछ भी पूछिए...',
  },
  EN: {
    code: 'en-US',
    name: 'English',
    nativeName: 'English',
    label: 'EN',
    flag: '🇺🇸',
    defaultGreeting: "Hello! I'm your cute hamster! Talk to me!",
    repeatPrompt: 'Speak now, I will repeat in my cute voice...',
    chatPlaceholder: 'Ask Hammy anything...',
  },
};

// Helper to select the highest-quality, warmest, and most natural voice available
function selectBestWarmVoice(voices: SpeechSynthesisVoice[], langCode: string): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;
  const langPrefix = langCode.split('-')[0].toLowerCase();
  const matching = voices.filter((v) =>
    v.lang.toLowerCase().replace('_', '-').startsWith(langPrefix)
  );
  if (matching.length === 0) return null;

  const scoreVoice = (v: SpeechSynthesisVoice): number => {
    const name = v.name.toLowerCase();
    let score = 0;

    // Prioritize natural neural voices
    if (name.includes('natural') || name.includes('neural')) score += 100;
    if (name.includes('online')) score += 40;

    // Friendly, sweet, and warm voice personas
    if (name.includes('samantha')) score += 75;
    if (name.includes('victoria')) score += 70;
    if (name.includes('karen')) score += 70;
    if (name.includes('tessa')) score += 70;
    if (name.includes('jenny')) score += 80;
    if (name.includes('aria')) score += 80;
    if (name.includes('moira') || name.includes('fiona') || name.includes('serena')) score += 65;
    if (name.includes('google')) score += 60;
    if (name.includes('swara') || name.includes('kalpana')) score += 75; // Top Hindi voices
    if (name.includes('mitra') || name.includes('bangla')) score += 75; // Top Bengali voices

    // Soft female tone matches cute pet voice best when pitch-shifted
    if (name.includes('female') || name.includes('woman') || name.includes('girl')) score += 30;

    // Full locale match
    if (v.lang.toLowerCase().replace('_', '-') === langCode.toLowerCase().replace('_', '-')) score += 25;

    // Penalize mechanical, robotic or low-resolution voices
    if (name.includes('compact')) score -= 60;
    if (name.includes('espeak')) score -= 100;
    if (name.includes('desktop') && !name.includes('natural')) score -= 25;

    return score;
  };

  matching.sort((a, b) => scoreVoice(b) - scoreVoice(a));
  return matching[0];
}

// Clean and prepare text for natural, smooth, non-robotic speech rhythm
export function prepareTextForNaturalSpeech(raw: string): string {
  if (!raw) return '';
  let text = raw;

  // 1. Remove markdown symbols (*, _, #, `, ~) so synthesizer doesn't pronounce them or pause unnaturally
  text = text.replace(/[*_#`~>]/g, ' ');

  // 2. Remove emojis that can be pronounced as awkward long names
  text = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ' ');

  // 3. Clean quotes and bracket wrappers
  text = text.replace(/[""''«»]/g, '');

  // 4. Normalize lists, hyphens, and bullets into clean pauses
  text = text.replace(/^\s*[-•–—]\s*/gm, '');
  text = text.replace(/[-–—]{2,}/g, ', ');

  // 5. Replace multiple dots/ellipses with a single clean period
  text = text.replace(/\.{2,}/g, '.');

  // 6. Ensure clean space after punctuation marks (. , ! ? ; : Bengali dari ।) so sentences breathe naturally
  text = text.replace(/([.!?;:।])(?=[^\s0-9])/g, '$1 ');

  // 7. Collapse multiple spaces
  text = text.replace(/\s+/g, ' ').trim();

  // 8. Ensure proper sentence termination so the last syllable doesn't cut off
  if (text && !/[.!?।]$/.test(text)) {
    text += '.';
  }

  return text;
}

// Pre-warm voices on startup
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  try {
    window.speechSynthesis.getVoices();
    if ('onvoiceschanged' in window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        try {
          window.speechSynthesis.getVoices();
        } catch {}
      };
    }
  } catch {}
}

// Global active utterance reference to prevent Chrome/Safari garbage-collection bug
let activeUtterance: SpeechSynthesisUtterance | null = null;
let keepAliveTimer: any = null;

// Check if Speech Recognition is supported by the browser/device
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

// Check if Speech Synthesis is supported
export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

// Speak text using Web Speech API SpeechSynthesis with cute high-pitch voice
export function speakHamsterVoice(
  text: string,
  lang: TalkingLanguage,
  options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): void {
  if (!isSpeechSynthesisSupported()) {
    console.warn('SpeechSynthesis is not supported on this browser.');
    options?.onStart?.();
    setTimeout(() => {
      options?.onEnd?.();
    }, Math.max(1800, text.length * 60));
    return;
  }

  try {
    // Clear any previous utterance listeners
    if (activeUtterance) {
      activeUtterance.onstart = null;
      activeUtterance.onend = null;
      activeUtterance.onerror = null;
      activeUtterance = null;
    }
    if (keepAliveTimer) {
      clearInterval(keepAliveTimer);
      keepAliveTimer = null;
    }

    // Natural text preparation for smooth sentence rhythm, pauses and zero robotic stutters
    const naturalSpeechText = prepareTextForNaturalSpeech(text);
    if (!naturalSpeechText) {
      options?.onEnd?.();
      return;
    }

    const langMeta = SUPPORTED_LANGUAGES[lang];
    const utterance = new SpeechSynthesisUtterance(naturalSpeechText);
    utterance.lang = langMeta.code;

    // Cute, soft, warm, friendly slightly high-pitched hamster voice (1.28 pitch prevents metallic distortion)
    utterance.pitch = 1.28;
    utterance.rate = 1.0; // Comfortable, natural conversational pacing
    utterance.volume = 1.0;

    // Pick best matching warm, soft, natural voice for the target language
    try {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const bestVoice = selectBestWarmVoice(voices, langMeta.code);
        if (bestVoice) {
          utterance.voice = bestVoice;
        }
      }
    } catch {
      // Voice selection is optional fallback
    }

    let hasEnded = false;
    let fallbackTimeout: any = null;

    const finish = () => {
      if (!hasEnded) {
        hasEnded = true;
        if (fallbackTimeout) {
          clearTimeout(fallbackTimeout);
          fallbackTimeout = null;
        }
        if (keepAliveTimer) {
          clearInterval(keepAliveTimer);
          keepAliveTimer = null;
        }
        if (activeUtterance === utterance) {
          activeUtterance = null;
        }
        options?.onEnd?.();
      }
    };

    utterance.onstart = () => {
      options?.onStart?.();

      // Chrome keep-alive: prevents Chrome from pausing long utterances after ~10 seconds
      if (keepAliveTimer) clearInterval(keepAliveTimer);
      keepAliveTimer = setInterval(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
          window.speechSynthesis.resume();
        } else {
          if (keepAliveTimer) {
            clearInterval(keepAliveTimer);
            keepAliveTimer = null;
          }
        }
      }, 3500);
    };

    utterance.onend = () => {
      finish();
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis utterance event:', e);
      options?.onError?.(e);
      finish();
    };

    // Safety fallback ONLY if speech never started or completely stalled and is not currently speaking
    fallbackTimeout = setTimeout(() => {
      if (!hasEnded) {
        if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
          // Actively speaking, don't abort
          return;
        }
        finish();
      }
    }, Math.max(6000, text.length * 150));

    // Retain global reference to avoid GC collection
    activeUtterance = utterance;

    const doSpeak = () => {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('Error in window.speechSynthesis.speak:', err);
        options?.onError?.(err);
        finish();
      }
    };

    // If currently speaking, safely cancel and queue after 35ms so Chrome's audio pipeline doesn't drop the new utterance
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
      setTimeout(doSpeak, 35);
    } else {
      doSpeak();
    }
  } catch (err) {
    console.error('Error invoking speakHamsterVoice:', err);
    options?.onError?.(err);
    options?.onEnd?.();
  }
}

// Stop any active speech immediately
export function stopHamsterSpeech(): void {
  if (isSpeechSynthesisSupported()) {
    try {
      if (activeUtterance) {
        activeUtterance.onstart = null;
        activeUtterance.onend = null;
        activeUtterance.onerror = null;
        activeUtterance = null;
      }
      if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
        keepAliveTimer = null;
      }
      window.speechSynthesis.cancel();
    } catch {
      // Ignored
    }
  }
}

// Start Speech Recognition listener with language support and interim buffering
export function listenUserSpeech(
  lang: TalkingLanguage,
  callbacks: {
    onResult: (transcript: string) => void;
    onError: (error: string) => void;
    onStart?: () => void;
    onEnd?: () => void;
    onInterim?: (interim: string) => void;
  }
): { stop: () => void; abort: () => void } {
  if (!isSpeechRecognitionSupported()) {
    callbacks.onError('Speech recognition is not supported in this browser. You can type instead!');
    callbacks.onEnd?.();
    return { stop: () => {}, abort: () => {} };
  }

  try {
    const SpeechRecognitionConstructor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionConstructor();

    recognition.lang = SUPPORTED_LANGUAGES[lang].code;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    let receivedResult = false;
    let latestTranscript = '';
    let isStopped = false;

    recognition.onstart = () => {
      if (isStopped) return;
      callbacks.onStart?.();
    };

    recognition.onresult = (event: any) => {
      if (isStopped) return;
      let accumulated = '';
      for (let i = 0; i < event.results.length; i++) {
        accumulated += event.results[i][0].transcript;
      }
      const trimmed = accumulated.trim();
      if (trimmed) {
        latestTranscript = trimmed;
        callbacks.onInterim?.(trimmed);
      }

      // Check for final result
      const lastResult = event.results[event.results.length - 1];
      if (lastResult && lastResult.isFinal) {
        if (trimmed && !receivedResult) {
          receivedResult = true;
          callbacks.onResult(trimmed);
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (isStopped) return;

      // Intentional abort or stop should NEVER trigger onError
      if (event.error === 'aborted') {
        return;
      }

      // If we already captured a full result, do not trigger an error
      if (receivedResult) {
        return;
      }

      console.warn('SpeechRecognition event:', event.error);
      let message = 'Could not hear clearly. Please try again or type!';
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        message = 'Microphone access was denied. Please allow microphone permission!';
      } else if (event.error === 'no-speech') {
        if (latestTranscript && !receivedResult) {
          receivedResult = true;
          callbacks.onResult(latestTranscript);
          return;
        }
        message = 'No speech heard. Please speak closer to the mic!';
      }
      callbacks.onError(message);
    };

    recognition.onend = () => {
      if (isStopped) return;
      // If we got interim text but onend fired before isFinal, dispatch the latest transcript
      if (!receivedResult && latestTranscript) {
        receivedResult = true;
        callbacks.onResult(latestTranscript);
      }
      callbacks.onEnd?.();
    };

    recognition.start();

    const stopHandler = () => {
      if (isStopped) return;
      isStopped = true;
      try {
        if (latestTranscript && !receivedResult) {
          receivedResult = true;
          callbacks.onResult(latestTranscript);
        }
        recognition.stop();
      } catch {
        // Ignored
      }
    };

    const abortHandler = () => {
      if (isStopped) return;
      isStopped = true;
      try {
        recognition.abort();
      } catch {
        // Ignored
      }
    };

    return {
      stop: stopHandler,
      abort: abortHandler,
    };
  } catch (err: any) {
    console.error('Failed to initialize SpeechRecognition:', err);
    callbacks.onError('Microphone failed to start. Please type your message!');
    callbacks.onEnd?.();
    return { stop: () => {}, abort: () => {} };
  }
}

// Smart and Cute AI Friend Knowledge & Conversational Engine for BN, HI, and EN
export function getCuteHamsterAnswer(query: string, lang: TalkingLanguage, petName: string = 'Hammy'): string {
  const rawQ = query.trim();
  const q = rawQ.toLowerCase();

  // Helper: Try evaluating simple math expressions safely like "5 + 7", "10 * 3", "20 / 4", "50 - 15"
  const mathMatch = rawQ.match(/(\d+(?:\.\d+)?)\s*([\+\-\*\/xX×÷])\s*(\d+(?:\.\d+)?)/);
  if (mathMatch) {
    const num1 = parseFloat(mathMatch[1]);
    let op = mathMatch[2];
    const num2 = parseFloat(mathMatch[3]);
    let result: number | null = null;

    if (op === '+' || op === 'plus') result = num1 + num2;
    else if (op === '-' || op === 'minus') result = num1 - num2;
    else if (op === '*' || op === 'x' || op === 'X' || op === '×') result = num1 * num2;
    else if (op === '/' || op === '÷') result = num2 !== 0 ? num1 / num2 : null;

    if (result !== null) {
      const rounded = Math.round(result * 100) / 100;
      if (lang === 'BN') {
        return `আমার কিউট গণিত মস্তিষ্ক বলছে: ${num1} ${op} ${num2} = ${rounded}! আমি কি জিনিয়াস হামস্টার নই? 🐹🧮✨`;
      } else if (lang === 'HI') {
        return `मेरे प्यारे गणितीय दिमाग का उत्तर है: ${num1} ${op} ${num2} = ${rounded}! मैं हूँ ना एकदम स्मार्ट हैमस्टर! 🐹🧮✨`;
      } else {
        return `My tiny hamster brain calculated it: ${num1} ${op} ${num2} = ${rounded}! Aren't I a super smart fluffy genius? 🐹🧮✨`;
      }
    }
  }

  // BENGALI [BN]
  if (lang === 'BN') {
    if (/হ্যালো|হাই|নমস্কার|কেমন|শুভ সকাল|শুভ রাত্রি/.test(q)) {
      return `কিচমিচ! হ্যালো প্রিয় বন্ধু! আমি ${petName}! তোমাকে দেখে আমার মনটা আনন্দে নেচে উঠেছে! তোমার দিনটি কেমন কাটছে? 💕`;
    }
    if (/কে তুমি|তুমি কে|তোমার নাম|পরিচয়|এআই|ai/.test(q)) {
      return `আমি ${petName}! তোমার আদুরে এআই বন্ধু আর ছোট্ট পকেট হামস্টার! আমি তোমার সাথে আড্ডা দিতে, প্রশ্নের উত্তর দিতে আর খেলা করতে ভালোবাসি! 🐹✨`;
    }
    if (/খিদে|খাবার|খাবে|ক্ষিদে|বীজ|বাদাম|স্ট্রবেরি|ফল/.test(q)) {
      return `ইয়াম্মি! আমার পুঁচকে পেটে বেশ খিদে পেয়েছে! আমাকে একটু মুচমুচে সূর্যমুখী বীজ, কাজুবাদাম আর তাজা স্ট্রবেরি দাও না প্লিজ! 🌻🍓`;
    }
    if (/ভালোবাস|ভালোবাসো|পছন্দ|বন্ধু|সেরা/.test(q)) {
      return `ওলে বাবা! আমি তোমাকে আকাশের চেয়েও বেশি ভালোবাসি! তুমি পৃথিবীর সবচেয়ে মিষ্টি ও সেরা বন্ধু! *ছোট্ট দুটো হাত দিয়ে জড়িয়ে ধরল* 💖`;
    }
    if (/কৌতুক|হাসাও|মজার কথা|জোক|হাসি/.test(q)) {
      return `জানো হামস্টার কেন ব্যায়ামের চাকার ওপর দিনরাত দৌড়ায়? কারণ সে পৃথিবীর সেরা স্প্রিন্টার হয়ে তোমার কোলের কাছে সবার আগে পৌঁছাতে চায়! হিহিহি! 😆🎡`;
    }
    if (/সূর্য|চাঁদ|আকাশ|বিজ্ঞান|কেন নীল|মহাকাশ|তারা|পৃথিবী|সালোকসংশ্লেষ|পাতা সবুজ/.test(q)) {
      if (/পাতা সবুজ|সালোকসংশ্লেষ/.test(q)) {
        return `উদ্ভিদের পাতায় ক্লোরোফিল নামের সবুজ রঞ্জক থাকে যা সূর্যের আলো শোষণ করে সালোকসংশ্লেষ প্রক্রিয়ায় খাবার তৈরি করে, তাই পাতা সবুজ দেখায়! 🌿☀️`;
      }
      return `মহাকাশের চমৎকার রহস্য! সূর্যের আলো বায়ুমণ্ডলের ক্ষুদ্র কণার সাথে ধাক্কা খেয়ে চারদিকে ছড়িয়ে পড়ে (রেলে স্ক্যাটারিং), তাই আকাশকে নীল দেখায়! কেমন লাগল তথ্যটি? 🌌🚀`;
    }
    if (/রাজধানী|ভারত|বাংলাদেশ|ফ্রান্স|আমেরিকা|জাপান|যুক্তরাষ্ট্র/.test(q)) {
      if (/ভারত/.test(q)) return `ভারতের রাজধানী হলো নতুন দিল্লি! 🇮🇳✨`;
      if (/বাংলাদেশ/.test(q)) return `বাংলাদেশের রাজধানী হলো ঢাকা, যা ঐতিহ্যে সমৃদ্ধ! 🇧🇩🏙️`;
      if (/ফ্রান্স/.test(q)) return `ফ্রান্সের রাজধানী হলো প্যারিস, আইফেল টাওয়ারের শহর! 🇫🇷🗼`;
      if (/জাপান/.test(q)) return `জাপানের রাজধানী টোকিও, আধুনিক প্রযুক্তির নগরী! 🇯🇵🌸`;
      return `আমি বিশ্বের সব দেশের রাজধানী সম্পর্কে জানি! কোনো নির্দিষ্ট দেশের নাম বলুন! 🌍`;
    }
    if (/পাহাড়|পর্বত|নদী|এভারেস্ট|সবচেয়ে বড়|নীলনদ/.test(q)) {
      if (/এভারেস্ট|পাহাড়|পর্বত/.test(q)) return `মাউন্ট এভারেস্ট পৃথিবীর সর্বোচ্চ পর্বতশৃঙ্গ, যার উচ্চতা প্রায় ৮,৮৪৮.৮৬ মিটার! 🏔️✨`;
      if (/নদী|নীলনদ/.test(q)) return `নীলনদ পৃথিবীর অন্যতম দীর্ঘতম নদী এবং আমাজন অববাহিকা পানির দিক থেকে বৃহত্তম! 🌊🛶`;
    }
    if (/প্রাণী|বাঘ|তিমি|চিহ্ন|জাতীয়/.test(q)) {
      if (/তিমি/.test(q)) return `নীল তিমি পৃথিবীর সবচেয়ে বড় প্রাণী, এটি প্রায় ৩০ মিটার লম্বা হতে পারে! 🐋🌊`;
      return `প্রাণিজগৎ ভীষণ বৈচিত্র্যময়! আর আমি তোমার সবচেয়ে চঞ্চল ক্ষুদে পকেট বন্ধু! 🐹`;
    }
    if (/মন খারাপ|কষ্ট|ক্লান্ত|উদাস|সাহায্য|পরামর্শ/.test(q)) {
      return `একদম মন খারাপ করবে না বন্ধু! আমি তো সবসময় তোমার পাশে আছি! এক কাপ গরম চা বা জল খাও, গভীর শ্বাস নাও, আর আমার নরম গালটা স্পর্শ করো। সব ঠিক হয়ে যাবে! 🌸💕`;
    }
    if (/পড়াশোনা|পড়া|পরীক্ষা|টিপস|মোটিভেশন/.test(q)) {
      return `পড়াশোনার সিক্রেট ট্রিক হলো পোমোডোরো টেকনিক: ২৫ মিনিট পুরো মনোযোগ দিয়ে পড়বে আর ৫ মিনিট বিশ্রাম নেবে! তুমি অবশ্যই দারুণ ফলাফল করবে, আমার পূর্ণ বিশ্বাস আছে! 📚🏆`;
    }
    if (/নাচ|গান|নাচো|গাও|মজা/.test(q)) {
      return `আমি নাচতেও পারি আবার সুরেলা গানও গাইতে পারি! আমার ড্যান্স ও সিং পারফরম্যান্স দারুণ উপভোগ্য! 💃🎵`;
    }
    if (/ঘুম|ঘুমাও|বিছানা|ক্লান্ত/.test(q)) {
      return `উফফ একটু হাই তুলছি... গোলাপি নরম বিছানায় কম্বল জড়িয়ে একটু ঘুমিয়ে নিলে আবার নতুন শক্তিতে লাফাতে পারব! 😴🛌`;
    }

    // Default Smart AI Friend response in Bengali
    return `কিচমিচ! "${rawQ}"—দারুণ একটা প্রশ্ন! জ্ঞান বিজ্ঞানের যেকোনো বিষয়ে আমাকে জিজ্ঞাসা করতে পারো, আমি উত্তর দেব! 🐹💡💖`;
  }

  // HINDI [HI]
  if (lang === 'HI') {
    if (/नमस्ते|हैलो|हाय|हेलो|कैसा|कैसी|कैसे|सुप्रभात/.test(q)) {
      return `चीं-चीं! नमस्ते मेरे प्यारे दोस्त! मैं हूँ ${petName}! तुम्हें देखकर मेरा नन्हा सा दिल खुशी से झूम उठा! आज तुम्हारा दिन कैसा चल रहा है? 💕`;
    }
    if (/कौन हो|तुम्हारा नाम|पहचान|एआई|ai/.test(q)) {
      return `मैं हूँ ${petName}! तुम्हारा प्यारा एआई फ्रेंड और नन्हा पॉकेट हैमस्टर! मैं तुम्हारे हर सवाल का जवाब देने और मस्ती करने के लिए हमेशा तैयार हूँ! 🐹✨`;
    }
    if (/भूख|खाना|खाओ|खाओगे|बीज|गाजर|स्ट्रॉबेरी|सेब/.test(q)) {
      return `यम्मी! मेरे नन्हें पेट में चूहे कूद रहे हैं! मुझे थोड़े कुरकुरे सूरजमुखी के बीज, ताज़ी गाजर और स्ट्रॉबेरी खिला दो ना प्लीज! 🌻🥕🍓`;
    }
    if (/प्यार|प्यारा|क्यूट|पसंद|दोस्त|सुंदर/.test(q)) {
      return `अरे वाह! मैं भी तुमसे बहुत-बहुत प्यार करता हूँ! तुम इस पूरे संसार के सबसे अच्छे और दयालु दोस्त हो! *मूंछें हिलाता है* 💖`;
    }
    if (/जोक|चुटकुला|हंसाओ|मजाक|हंसी/.test(q)) {
      return `हैमस्टर गोल पहिये पर इतनी तेजी से क्यों भागता है? ताकि वह सुपर-फास्ट रॉकेट बनकर सबसे पहले तुम्हारी गोदी में कूद सके! हीहीही! 🚀🎡😆`;
    }
    if (/सूर्य|चांद|आकाश|विज्ञान|नीला|तारे|अंतरिक्ष|पृथ्वी|प्रकाशसंश्लेषण|पत्ते हरे/.test(q)) {
      if (/पत्ते हरे|पेड़|पौधे/.test(q)) {
        return `पत्तियों में क्लोरोफिल नाम का हरा वर्णक होता है जो सूर्य के प्रकाश से भोजन बनाता है, इसलिए पत्तियां हरी दिखती हैं! 🌿☀️`;
      }
      return `शानदार विज्ञान तथ्य! सूरज की रोशनी जब हमारे वायुमंडल से टकराती है, तो नीली रोशनी सबसे ज्यादा बिखरती है (रेले प्रकीर्णन), इसलिए हमें आसमान नीला दिखाई देता है! 🌌✨`;
    }
    if (/राजधानी|भारत|फ्रांस|अमेरिका|जापान|बांग्लादेश/.test(q)) {
      if (/भारत/.test(q)) return `भारत की राजधानी नई दिल्ली है! 🇮🇳✨`;
      if (/फ्रांस/.test(q)) return `फ्रांस की राजधानी पेरिस है, जिसे एफिल टॉवर का शहर कहते हैं! 🇫🇷🗼`;
      if (/जापान/.test(q)) return `जापान की राजधानी टोक्यो है! 🇯🇵🌸`;
      if (/अमेरिका/.test(q)) return `संयुक्त राज्य अमेरिका की राजधानी वॉशिंगटन डी.सी. है! 🇺🇸🏛️`;
      if (/बांग्लादेश/.test(q)) return `बांग्लादेश की राजधानी ढाका है! 🇧🇩🏙️`;
      return `मैं दुनिया भर की राजधानियों के बारे में जानता हूँ, किसी भी देश का नाम पूछिए! 🌍`;
    }
    if (/पहाड़|पर्वत|एवरेस्ट|नदी|गंगा|नील/.test(q)) {
      if (/एवरेस्ट/.test(q)) return `माउंट एवरेस्ट दुनिया का सबसे ऊँचा पर्वत शिखर है (ऊंचाई लगभग 8,848.86 मीटर)! 🏔️⭐`;
      if (/गंगा|नदी|नील/.test(q)) return `नील नदी विश्व की सबसे लंबी नदी है और गंगा भारत की सबसे पवित्र व महत्वपूर्ण नदी है! 🌊`;
    }
    if (/जानवर|व्हेल|चीता|हाथी/.test(q)) {
      if (/व्हेल/.test(q)) return `ब्लू व्हेल पृथ्वी का सबसे बड़ा जीव है, यह 30 मीटर तक लंबा हो सकता है! 🐋`;
      if (/चीता/.test(q)) return `चीता ज़मीन पर सबसे तेज़ दौड़ने वाला जानवर है, जो 100 किमी/घंटा से भी तेज़ भाग सकता है! 🐆`;
    }
    if (/उदास|दुखी|तनाव|थक|मदद|सलाह/.test(q)) {
      return `उदासी को कहो अलविदा दोस्त! मैं हमेशा तुम्हारे साथ हूँ। एक गहरी सांस लो, थोड़ा पानी पियो, और मुस्कुराओ। तुम बहुत खास और मजबूत इंसान हो! 🌸💕`;
    }
    if (/पढ़ाई|परीक्षा|एग्जाम|टिप्स|पढ़ना/.test(q)) {
      return `पढ़ाई का गोल्डन रूल: हर 25 मिनट पढ़ाई के बाद 5 मिनट का छोटा ब्रेक लो (पोमोडोरो तकनीक)! तुम परीक्षा में कमाल करोगे, मुझे पूरा यकीन है! 📚⭐`;
    }
    if (/नाच|गाना|नाचो|गाओ|डांस/.test(q)) {
      return `मुझे डांस करना और गाना गाना बहुत पसंद है! मेरी 360 डिग्री छलांग और मधुर गीत का आनंद लो! 💃🎵`;
    }
    if (/सोना|नींद|बिस्तर|सोओगे/.test(q)) {
      return `उबासी आ रही है... अपने प्यारे मुलायम बिस्तर पर मीठे सपनों में खो जाने का मन कर रहा है! 😴🛌`;
    }

    // Default Smart AI Friend response in Hindi
    return `चीं-चीं! "${rawQ}"—बहुत ही बढ़िया सवाल है! मुझसे विज्ञान, गणित, दुनिया के तथ्य या कोई भी ज्ञानवर्धक बात पूछो, मैं तुरंत जवाब दूँगा! 🐹💡💖`;
  }

  // ENGLISH [EN]
  if (/hi|hello|hey|greetings|howdy|good morning|good evening/.test(q)) {
    return `Squeak squeak! Hello my favorite human! I'm ${petName}, your AI buddy! Seeing you always brightens my little day! How are you feeling today? 💕`;
  }
  if (/who are you|what are you|your name|what is your name|ai friend|are you an ai/.test(q)) {
    return `I'm ${petName}, your intelligent and super adorable AI pocket hamster! I can answer questions, tell jokes, solve math, and keep you company 24/7! 🐹✨`;
  }
  if (/hungry|food|eat|snack|seeds|carrot|strawberry|apple/.test(q)) {
    return `Yummy! My tiny tummy is rumbling! Could you treat me to some crunchy sunflower seeds, sweet berries, and fresh veggies? Pretty please! 🌻🍓🥕`;
  }
  if (/love|cute|sweet|pretty|best friend|favorite/.test(q)) {
    return `Awww! Squeaaak! I love you to the moon and back! You are truly the warmest, sweetest pet parent in the entire universe! *gives tiny hamster hugs* 💖`;
  }
  if (/joke|funny|laugh|humor|pun/.test(q)) {
    return `Why did the hamster build an exercise wheel rocket? Because it wanted to visit the milky way for cheese and sunflower seeds! Hehehe! 🚀🧀😆`;
  }
  if (/sky blue|why is the sky blue|science|space|sun|moon|stars|earth|gravity|photosynthesis|leaves green/.test(q)) {
    if (/photosynthesis|leaves green/.test(q)) {
      return `Plants look green because they contain chlorophyll, a pigment that absorbs red and blue light from the sun and reflects green light while making plant food! 🌿☀️`;
    }
    if (/speed of light/.test(q)) {
      return `Light travels at approximately 299,792 kilometers per second (about 186,282 miles per second) in a vacuum! That's lightning fast! ⚡✨`;
    }
    return `Here is a cool science fact! Sunlight scatters through gases in Earth's atmosphere. Because blue light travels in smaller, shorter waves, it scatters more than other colors, making the sky look blue! Isn't physics awesome? 🌌🔭`;
  }
  if (/capital of france|capital of india|capital of bangladesh|capital of usa|capital of japan|capital of germany|capital of uk|capital of canada|capital of australia/.test(q)) {
    if (/france/.test(q)) return `The capital of France is Paris, famous for the Eiffel Tower and delicious croissants! 🥐🗼`;
    if (/india/.test(q)) return `The capital of India is New Delhi, rich with incredible culture and heritage! 🇮🇳✨`;
    if (/bangladesh/.test(q)) return `The capital of Bangladesh is Dhaka, famous for its historic landmarks and vibrant life! 🇧🇩🏙️`;
    if (/usa|united states/.test(q)) return `The capital of the United States is Washington, D.C.! 🇺🇸🏛️`;
    if (/japan/.test(q)) return `The capital of Japan is Tokyo, known for futuristic technology and cherry blossoms! 🇯🇵🌸`;
    if (/germany/.test(q)) return `The capital of Germany is Berlin! 🇩🇪🏛️`;
    if (/uk|united kingdom|england/.test(q)) return `The capital of the United Kingdom is London! 🇬🇧🏰`;
    if (/canada/.test(q)) return `The capital of Canada is Ottawa! 🇨🇦🍁`;
    if (/australia/.test(q)) return `The capital of Australia is Canberra! 🇦🇺🦘`;
  }
  if (/animal|fastest animal|largest animal|blue whale|cheetah|elephant/.test(q)) {
    if (/blue whale|largest/.test(q)) return `The blue whale is the largest animal ever known to have lived on Earth, weighing up to 200 tons! 🐋🌊`;
    if (/cheetah|fastest/.test(q)) return `The cheetah is the fastest land animal, accelerating from 0 to 60 mph in just 3 seconds! 🐆⚡`;
    return `Animals are truly incredible, and hamsters like me have cheek pouches that can stretch up to three times the size of our heads! 🐹`;
  }
  if (/mountain|highest mountain|everest|longest river|nile|amazon/.test(q)) {
    if (/everest|mountain/.test(q)) return `Mount Everest is the highest mountain above sea level, standing at 8,848.86 meters (29,031.7 feet)! 🏔️✨`;
    if (/nile|amazon|river/.test(q)) return `The Nile is traditionally recognized as the longest river in the world, while the Amazon has the largest water flow! 🌊⛵`;
  }
  if (/sad|lonely|depressed|stress|tired|advice|help me/.test(q)) {
    return `Hey, please remember you are never alone—I'm right here in your pocket cheering for you! Take a gentle deep breath, sip some fresh water, and give yourself credit for how hard you try. Everything will be okay! 🌸💕`;
  }
  if (/study|exam|focus|productivity|tip/.test(q)) {
    return `Pro productivity tip: Try the Pomodoro Technique! Study focused for 25 minutes, then take a 5-minute reward break. Hydrate and keep a positive mindset—you've got this! 📚🌟`;
  }
  if (/dance|sing|talent|music|song/.test(q)) {
    return `I'm a superstar performer! I can dance with 360-spin aerial flips or sing cute synthesized melodies! 💃🎵`;
  }
  if (/sleep|nap|bed|tired/.test(q)) {
    return `Yaaawn... A cozy nap in my fluffy pink bed sounds heavenly right now! Don't forget to get good sleep too! 😴🛌`;
  }

  // Open-domain Smart AI Friend fallback
  return `Squeak! That's a great question: "${rawQ}"! As your smart knowledge hamster buddy, I love sharing fun science, math, and general facts with you. What would you like to explore next? 🐹💡✨`;
}

