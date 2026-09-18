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
    // Cancel any currently playing speech to avoid overlaps
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();

    const utterance = new SpeechSynthesisUtterance(text);
    const langMeta = SUPPORTED_LANGUAGES[lang];
    utterance.lang = langMeta.code;

    // Strict requirement: SpeechSynthesis with pitch 1.6 for cute high-pitched hamster voice!
    utterance.pitch = 1.6;
    utterance.rate = 1.15; // Energetic cute tempo
    utterance.volume = 1.0;

    // Pick best matching voice for the target language if available
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const langPrefix = langMeta.code.split('-')[0].toLowerCase();
      const matchingVoices = voices.filter((v) =>
        v.lang.toLowerCase().startsWith(langPrefix)
      );

      if (matchingVoices.length > 0) {
        // Prefer higher pitched / female / natural voice
        const cuteVoice =
          matchingVoices.find(
            (v) =>
              v.name.toLowerCase().includes('female') ||
              v.name.toLowerCase().includes('google') ||
              v.name.toLowerCase().includes('natural')
          ) || matchingVoices[0];
        utterance.voice = cuteVoice;
      }
    }

    let hasEnded = false;
    const finish = () => {
      if (!hasEnded) {
        hasEnded = true;
        options?.onEnd?.();
      }
    };

    utterance.onstart = () => {
      options?.onStart?.();
    };

    utterance.onend = () => {
      finish();
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis utterance error:', e);
      options?.onError?.(e);
      finish();
    };

    // Safety fallback: Some browsers (Chrome on Android/iOS) occasionally fail to fire onend
    const estimatedDurationMs = Math.max(2000, text.length * 90);
    setTimeout(() => {
      if (!hasEnded) {
        finish();
      }
    }, estimatedDurationMs + 1000);

    window.speechSynthesis.speak(utterance);
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

    recognition.onstart = () => {
      callbacks.onStart?.();
    };

    recognition.onresult = (event: any) => {
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
        if (trimmed) {
          receivedResult = true;
          callbacks.onResult(trimmed);
        }
      }
    };

    recognition.onerror = (event: any) => {
      // Don't warn on intentional abort or no-speech if we already have a transcript
      if (event.error === 'aborted' && latestTranscript) {
        if (!receivedResult) {
          receivedResult = true;
          callbacks.onResult(latestTranscript);
        }
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
      // If we got interim text but onend fired before isFinal, dispatch the latest transcript
      if (!receivedResult && latestTranscript) {
        receivedResult = true;
        callbacks.onResult(latestTranscript);
      }
      callbacks.onEnd?.();
    };

    recognition.start();

    const stopHandler = () => {
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
    if (/সূর্য|চাঁদ|আকাশ|বিজ্ঞান|কেন নীল|মহাকাশ|তারা|পৃথিবী/.test(q)) {
      return `মহাকাশের চমৎকার রহস্য! সূর্যের আলো বায়ুমণ্ডলের ক্ষুদ্র কণার সাথে ধাক্কা খেয়ে চারদিকে ছড়িয়ে পড়ে (রেলে স্ক্যাটারিং), তাই আকাশকে নীল দেখায়! কেমন লাগল তথ্যটি? 🌌🚀`;
    }
    if (/মন খারাপ|কষ্ট|ক্লান্ত|উদাস|সাহায্য|পরামর্শ/.test(q)) {
      return `একদম মন খারাপ করবে না বন্ধু! আমি তো সবসময় তোমার পাশে আছি! এক কাপ গরম চা বা জল খাও, গভীর শ্বাস নাও, আর আমার নরম গালটা স্পর্শ করো। সব ঠিক হয়ে যাবে! 🌸💕`;
    }
    if (/পড়াশোনা|পড়া|পরীক্ষা|টিপস|মোটিভেশন/.test(q)) {
      return `পড়াশোনার সিক্রেট ট্রিক হলো পোমোডোরো টেকনিক: ২৫ মিনিট পুরো মনোযোগ দিয়ে পড়বে আর ৫ মিনিট বিশ্রাম নেবে! তুমি অবশ্যই দারুণ ফলাফল করবে, আমার পূর্ণ বিশ্বাস আছে! 📚🏆`;
    }
    if (/নাচ|গান|নাচো|গাও|মজা/.test(q)) {
      return `আমি নাচতেও পারি আবার সুরেলা গানও গাইতে পারি! নিচের ড্যান্স বা সিং বোতামে চাপ দিয়ে আমার পারফরম্যান্স উপভোগ করো! 💃🎵`;
    }
    if (/ঘুম|ঘুমাও|বিছানা|ক্লান্ত/.test(q)) {
      return `উফফ একটু হাই তুলছি... গোলাপি নরম বিছানায় কম্বল জড়িয়ে একটু ঘুমিয়ে নিলে আবার নতুন শক্তিতে লাফাতে পারব! 😴🛌`;
    }

    // Default Smart AI Friend response in Bengali
    return `কিচমিচ! "${rawQ}"—দারুণ একটা কথা বললে! তোমার এআই বন্ধু হিসেবে আমি সবসময় তোমার সাথে ভাব বিনিময় করতে ভালোবাসি। চলো আরও নতুন বিষয় নিয়ে কথা বলি! 🐹💡💖`;
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
    if (/सूर्य|चांद|आकाश|विज्ञान|नीला|तारे|अंतरिक्ष|पृथ्वी/.test(q)) {
      return `शानदार विज्ञान तथ्य! सूरज की रोशनी जब हमारे वायुमंडल से टकराती है, तो नीली रोशनी सबसे ज्यादा बिखरती है (रेले प्रकीर्णन), इसलिए हमें आसमान नीला दिखाई देता है! 🌌✨`;
    }
    if (/उदास|दुखी|तनाव|थक|मदद|सलाह/.test(q)) {
      return `उदासी को कहो अलविदा दोस्त! मैं हमेशा तुम्हारे साथ हूँ। एक गहरी सांस लो, थोड़ा पानी पियो, और मुस्कुराओ। तुम बहुत खास और मजबूत इंसान हो! 🌸💕`;
    }
    if (/पढ़ाई|परीक्षा|एग्जाम|टिप्स|पढ़ना/.test(q)) {
      return `पढ़ाई का गोल्डन रूल: हर 25 मिनट पढ़ाई के बाद 5 मिनट का छोटा ब्रेक लो (पोमोडोरो तकनीक)! तुम परीक्षा में कमाल करोगे, मुझे पूरा यकीन है! 📚⭐`;
    }
    if (/नाच|गाना|नाचो|गाओ|डांस/.test(q)) {
      return `मुझे डांस करना और गाना गाना बहुत पसंद है! नीचे डांस या सिंग बटन दबाकर मेरी 360 डिग्री छलांग और मधुर गीत का आनंद लो! 💃🎵`;
    }
    if (/सोना|नींद|बिस्तर|सोओगे/.test(q)) {
      return `उबासी आ रही है... अपने प्यारे मुलायम बिस्तर पर मीठे सपनों में खो जाने का मन कर रहा है! 😴🛌`;
    }

    // Default Smart AI Friend response in Hindi
    return `चीं-चीं! "${rawQ}"—बहुत ही बढ़िया बात पूछी तुमने! तुम्हारा स्मार्ट एआई साथी होने के नाते मुझे तुमसे बातें करके बहुत खुशी होती है। और क्या जानना चाहते हो? 🐹💡💖`;
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
  if (/sky blue|why is the sky blue|science|space|sun|moon|stars|earth|gravity/.test(q)) {
    return `Here is a cool science fact! Sunlight scatters through gases in Earth's atmosphere. Because blue light travels in smaller, shorter waves, it scatters more than other colors, making the sky look blue! Isn't physics awesome? 🌌🔭`;
  }
  if (/capital of france|capital of india|capital of bangladesh|capital of usa|capital of japan/.test(q)) {
    if (/france/.test(q)) return `The capital of France is Paris, famous for the Eiffel Tower and delicious croissants! 🥐🗼`;
    if (/india/.test(q)) return `The capital of India is New Delhi, rich with incredible culture and heritage! 🇮🇳✨`;
    if (/bangladesh/.test(q)) return `The capital of Bangladesh is Dhaka, famous for its historic landmarks and vibrant life! 🇧🇩🏙️`;
    if (/usa|united states/.test(q)) return `The capital of the United States is Washington, D.C.! 🇺🇸🏛️`;
    if (/japan/.test(q)) return `The capital of Japan is Tokyo, known for futuristic technology and cherry blossoms! 🇯🇵🌸`;
  }
  if (/sad|lonely|depressed|stress|tired|advice|help me/.test(q)) {
    return `Hey, please remember you are never alone—I'm right here in your pocket cheering for you! Take a gentle deep breath, sip some fresh water, and give yourself credit for how hard you try. Everything will be okay! 🌸💕`;
  }
  if (/study|exam|focus|productivity|tip/.test(q)) {
    return `Pro productivity tip: Try the Pomodoro Technique! Study focused for 25 minutes, then take a 5-minute reward break. Hydrate and keep a positive mindset—you've got this! 📚🌟`;
  }
  if (/dance|sing|talent|music|song/.test(q)) {
    return `I'm a superstar performer! Tap my Dance button for 360-spin aerial flips or Sing for my synthesized melody! 💃🎵`;
  }
  if (/sleep|nap|bed|tired/.test(q)) {
    return `Yaaawn... A cozy nap in my fluffy pink bed sounds heavenly right now! Don't forget to get good sleep too! 😴🛌`;
  }

  // Open-domain Smart AI Friend fallback
  return `Squeak! That's a great thought: "${rawQ}"! As your smart AI hamster companion, I love exploring interesting ideas with you. What should we talk about or discover next? 🐹💡✨`;
}

