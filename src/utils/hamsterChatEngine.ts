import { SupportedLanguage } from './speechEngine';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'hamster';
  text: string;
  timestamp: number;
}

export const SUGGESTED_QUESTIONS: Record<SupportedLanguage, string[]> = {
  BN: [
    'কেমন আছো?',
    'তোমার নাম কি?',
    'খাবার খাবে?',
    'একটি কৌতুক বলো!',
    'আমাকে একটি গান শোনাও',
    'তোমাকে ভালোবাসি!',
  ],
  HI: [
    'कैसे हो तुम?',
    'तुम्हारा नाम क्या है?',
    'भूख लगी है क्या?',
    'एक चुटकुला सुनाओ!',
    'गाना गाकर सुनाओ',
    'तुम बहुत प्यारे हो!',
  ],
  EN: [
    'How are you?',
    "What's your name?",
    'Are you hungry?',
    'Tell me a joke!',
    'Sing a song for me!',
    'I love you!',
  ],
};

// Response logic in Bengali (BN), Hindi (HI), English (EN)
export function getHamsterResponse(query: string, lang: SupportedLanguage, petName: string = 'Pip'): string {
  const q = query.toLowerCase().trim();

  if (lang === 'BN') {
    // Bengali Responses
    if (q.includes('নাম') || q.includes('nam') || q.includes('who are you') || q.includes('কে তুমি')) {
      return `আমার নাম ${petName}! আমি তোমার মিষ্টি গোলগাল হ্যামস্টার বন্ধু! 🐹💖`;
    }
    if (q.includes('কেমন') || q.includes('kemon') || q.includes('halo') || q.includes('ভালো')) {
      return `আমি খুব ভালো আর খুব আনন্দে আছি! আমার গাল দুটো দেখো কত তুলতুলে! হিহি! 🐹✨`;
    }
    if (q.includes('খাবার') || q.includes('খিদে') || q.includes('khide') || q.includes('eat') || q.includes('food') || q.includes('বীজ')) {
      return `হাঁ হাঁ! মচমচে সূর্যমুখী বীজ আমার সবচেয়ে প্রিয়! আমাকে এক বাটি বীজ দেবে প্লিজ? 🌻😋`;
    }
    if (q.includes('কৌতুক') || q.includes('joke') || q.includes('হাসাও')) {
      const jokes = [
        'হ্যামস্টাররা জিমে গিয়ে কী করে? কারণ তারা চাকা ঘোরাতে খুব ভালোবাসে! হিহিহি! 🎡😆',
        'এক হ্যামস্টার অন্য হ্যামস্টারকে বলল— "তোমার গাল এতো মোটা কেন?" সে বলল— "সব মিষ্টি কথা জমিয়ে রেখেছি!" 🐹🍬',
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    }
    if (q.includes('গান') || q.includes('song') || q.includes('sing') || q.includes('সুর')) {
      return `চিঁ চিঁ চিঁ~ সুরেলা গান গাই, তোমার কোলে বসে আনন্দে নাচি তাই! লা লা লা~ 🎶🐹`;
    }
    if (q.includes('ভালোবাসি') || q.includes('love') || q.includes('ador') || q.includes('প্রিয়')) {
      return `আমিও তোমাকে অনেক অনেক ভালোবাসি! তোমার জন্য ছোট্ট হ্যামস্টার চুমা! 🥰💖`;
    }
    if (q.includes('ঘুম') || q.includes('sleep') || q.includes('night') || q.includes('রাত')) {
      return `উমম... হাই উঠছে! আমার নরম বিছানায় শুয়ে মিষ্টি স্বপ্ন দেখব! শুভ রাত্রি! 😴💤`;
    }
    if (q.includes('খেলবে') || q.includes('play') || q.includes('খেলা')) {
      return `চলো খেলি! আমি আমার গোল বল আর খেলনা নিয়ে দৌড়াতে খুব ভালোবাসি! 🎾🐹`;
    }
    if (q.includes('হ্যালো') || q.includes('হাই') || q.includes('hello') || q.includes('hi')) {
      return `হ্যালো বন্ধু! তোমার সাথে কথা বলতে পেরে আমার খুব ভালো লাগছে! চিঁ চিঁ! 🐹👋`;
    }
    // Contextual fallback in Bengali
    const bnFallbacks = [
      `চিঁ চিঁ! তোমার কথা শুনে আমার কান দুটো খুশিতে দুলছে! 🐹✨`,
      `হিহি! আমি ছোট্ট হলেও তোমার সব কথা বুঝতে পারি! আরও বলো না! 💖`,
      `তোমার সাথে আড্ডা দিতে আমার খুব আনন্দ হয়! তুমি আমার সেরা বন্ধু! 🌻🥰`,
      `চিঁ চিঁ! আমার ছোট্ট হৃদয়টা তোমার মিষ্টি কথায় ভরে গেছে! 🐹🌸`,
    ];
    return bnFallbacks[Math.floor(Math.random() * bnFallbacks.length)];
  }

  if (lang === 'HI') {
    // Hindi Responses
    if (q.includes('नाम') || q.includes('naam') || q.includes('who are you') || q.includes('कौन')) {
      return `मेरा नाम ${petName} है! मैं आपका गोलू-मोलू और सबसे प्यारा हैमस्टर दोस्त हूँ! 🐹💖`;
    }
    if (q.includes('कैसे') || q.includes('kaise') || q.includes('haal') || q.includes('हाल')) {
      return `मैं एकदम मस्त और बहुत खुश हूँ! मेरे दोनों फूले हुए गाल खुशी से चमक रहे हैं! हीही! 🐹✨`;
    }
    if (q.includes('खाना') || q.includes('भूख') || q.includes('kha') || q.includes('food') || q.includes('बीज')) {
      return `हाँ जी! कुरकुरे सूरजमुखी के बीज मेरे सबसे पसंदीदा हैं! क्या मुझे एक ट्रीट मिलेगी? 🌻😋`;
    }
    if (q.includes('चुटकुला') || q.includes('joke') || q.includes('हंसाओ')) {
      const jokes = [
        'हैमस्टर पहिया क्यों दौड़ाता है? ताकि वह सुपर फिट और गोलू-मोलू रह सके! हाहाहा! 🎡😆',
        'एक हैमस्टर डॉक्टर के पास गया और बोला— "डॉक्टर साहब, मेरे गालों में बहुत सारा खाना क्यों आ जाता है?" डॉक्टर बोला— "क्योंकि तुम बहुत क्यूट हो!" 🐹🍬',
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    }
    if (q.includes('गाना') || q.includes('gaana') || q.includes('song') || q.includes('sing')) {
      return `चीं चीं चीं~ प्यारा सा गीत गाऊं, आपके संग नाचूं और खुशियां मनाऊं! ला ला ला~ 🎶🐹`;
    }
    if (q.includes('प्यार') || q.includes('love') || q.includes('dost') || q.includes('दोस्त')) {
      return `मैं भी आपसे बहुत-बहुत प्यार करता हूँ! ये लो ढेर सारी हैमस्टर किसियां! 🥰💖`;
    }
    if (q.includes('सो') || q.includes('नींद') || q.includes('sleep') || q.includes('night')) {
      return `हम्म्म... थोड़ी नींद आ रही है! अपने मुलायम बिस्तर में प्यारे सपने देखूंगा! शुभ रात्रि! 😴💤`;
    }
    if (q.includes('खेल') || q.includes('khel') || q.includes('play')) {
      return `चलो खेलते हैं! मुझे खिलौनों के साथ मस्ती करना बहुत पसंद है! 🎾🐹`;
    }
    if (q.includes('नमस्ते') || q.includes('हेलो') || q.includes('hello') || q.includes('hi')) {
      return `नमस्ते दोस्त! आपसे बात करके मेरा दिन बन गया! चीं चीं! 🐹👋`;
    }
    // Contextual fallback in Hindi
    const hiFallbacks = [
      `चीं चीं! आपकी मीठी बातें सुनकर मेरे छोटे-छोटे कान खुशी से हिलने लगे! 🐹✨`,
      `हीही! मैं छोटा सा हूँ, लेकिन आपकी हर बात समझता हूँ! कुछ और बताइए ना! 💖`,
      `आपके साथ बातें करने में बहुत मज़ा आता है! आप मेरे सबसे अच्छे दोस्त हो! 🌻🥰`,
      `चीं चीं! मेरा छोटा सा दिल आपकी बातों से खुश हो गया! 🐹🌸`,
    ];
    return hiFallbacks[Math.floor(Math.random() * hiFallbacks.length)];
  }

  // English Responses (EN)
  if (q.includes('name') || q.includes('who are you') || q.includes('what are you')) {
    return `My name is ${petName}! I'm your cuddly, chubby-cheeked little hamster friend! 🐹💖`;
  }
  if (q.includes('how are you') || q.includes('how do you do') || q.includes('doing today')) {
    return `I am doing wonderfully! My fluffy cheeks are stuffed with happiness today! Tee-hee! 🐹✨`;
  }
  if (q.includes('hungry') || q.includes('food') || q.includes('eat') || q.includes('seed') || q.includes('treat')) {
    return `Yes please! Crunchy sunflower seeds and apple slices are my favorite treats! Can I have one? 🌻😋`;
  }
  if (q.includes('joke') || q.includes('funny') || q.includes('laugh')) {
    const jokes = [
      'Why do hamsters go on the exercise wheel? Because they want to stay in *round* shape! Tee-hee! 🎡😆',
      'What is a hamster’s favorite school subject? Squeak-onomics! 🐹📚',
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }
  if (q.includes('sing') || q.includes('song') || q.includes('music')) {
    return `Squeak, squeak, squeak, tra-la-la! Nibbling yummy seeds and dancing all day! Tra-la-loo! 🎶🐹`;
  }
  if (q.includes('love') || q.includes('cute') || q.includes('adorable') || q.includes('sweet')) {
    return `Aww, I love you so much too! Sending you soft, warm hamster nose boops! 🥰💖`;
  }
  if (q.includes('sleep') || q.includes('tired') || q.includes('bed') || q.includes('night')) {
    return `*Yawn*... getting a tiny bit sleepy! Snuggling into my cozy bed for sweet dreams. Good night! 😴💤`;
  }
  if (q.includes('play') || q.includes('game') || q.includes('ball')) {
    return `Yay, let’s play! I love chasing my bouncy ball and doing happy waddles around the room! 🎾🐹`;
  }
  if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
    return `Hello bestie! I am so excited to talk with you! Squeak squeak! 🐹👋`;
  }

  // Contextual fallback in English
  const enFallbacks = [
    `*Squeak squeak!* My ears twitched with joy hearing that! Tell me more! 🐹✨`,
    `Tee-hee! You always say the sweetest things! I'm so glad we're friends! 💖`,
    `*Sniffs air happily* Talking with you is my absolute favorite part of the day! 🌻🥰`,
    `Squeak! My heart is doing little happy backflips right now! 🐹🌸`,
  ];
  return enFallbacks[Math.floor(Math.random() * enFallbacks.length)];
}
