import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  Gift,
  Sparkles,
  ShoppingBag,
  Shirt,
  X,
  ChevronRight,
  Users,
  Gamepad2,
  Mic,
  MessageCircle,
  RotateCcw,
  Volume2,
  Bot,
  HelpCircle,
  Keyboard,
  Square,
} from 'lucide-react';
import { PetState, PetMood, FoodItem, MultiplayerRoom, MultiplayerPlayer, MultiplayerMiniGameType } from '../types';
import { PetScene3D } from './3d/PetScene3D';
import { SpeechBubble } from './SpeechBubble';
import { HamsterTalkModal } from './HamsterTalkModal';
import {
  TalkingLanguage,
  SUPPORTED_LANGUAGES,
  speakHamsterVoice,
  stopHamsterSpeech,
  listenUserSpeech,
  getCuteHamsterAnswer,
  isSpeechRecognitionSupported,
} from '../utils/speech';
import { askGeminiHamster, ChatHistoryItem } from '../services/gemini';
import { soundManager } from '../utils/audio';

interface HomeScreenProps {
  pet: PetState;
  mood: PetMood;
  onPetClick: () => void;
  onOpenFeed: () => void;
  onGiveWater: () => void;
  onOpenPlay: () => void;
  onOpenClean: () => void;
  onToggleSleep: () => void;
  onOpenShop: () => void;
  onOpenCustomization: () => void;
  onOpenProfile: () => void;
  onOpenDailyRewards: () => void;
  onOpenSettings: () => void;
  onFeedItem?: (food: FoodItem) => void;
  onDance?: () => void;
  onSing?: () => void;
  feedTriggerProp?: { foodId: string; timestamp: number } | null;
  waterTriggerProp?: { timestamp: number } | null;
  customSpeechMessage?: string | null;
  dailyRewardAvailable?: boolean;
  isCleanOpen?: boolean;
  onOpenMultiplayer?: () => void;
  onOpenMiniGames?: () => void;
  currentRoom?: MultiplayerRoom | null;
  friendPet?: MultiplayerPlayer | null;
  onTapFloorMove?: (pos: { x: number; z: number }) => void;
  activeGame?: MultiplayerMiniGameType | null;
}

// 3 Distinct Foods for Feeding the Hamster
const THREE_FOODS: (FoodItem & { colorBg: string; borderColor: string; tag: string })[] = [
  {
    id: 'seeds',
    name: 'Sunflower Seeds',
    icon: '🌻',
    price: 20,
    hungerBoost: 25,
    happinessBoost: 22,
    energyBoost: 16,
    description: 'Crispy striped seeds. Hamster’s favorite treat!',
    levelRequired: 1,
    favoriteFor: ['hamster'],
    colorBg: 'bg-amber-50 hover:bg-amber-100/80',
    borderColor: 'border-amber-300',
    tag: '⭐ Favorite',
  },
  {
    id: 'carrot',
    name: 'Crunchy Carrot',
    icon: '🥕',
    price: 18,
    hungerBoost: 30,
    happinessBoost: 15,
    energyBoost: 14,
    description: 'Fresh, juicy garden carrot packed with vitamins!',
    levelRequired: 1,
    favoriteFor: ['bunny'],
    colorBg: 'bg-orange-50 hover:bg-orange-100/80',
    borderColor: 'border-orange-300',
    tag: '🥕 Garden Fresh',
  },
  {
    id: 'apple',
    name: 'Sweet Apple',
    icon: '🍎',
    price: 15,
    hungerBoost: 22,
    happinessBoost: 18,
    energyBoost: 18,
    description: 'Crisp red apple slices rich in refreshing energy!',
    levelRequired: 1,
    colorBg: 'bg-rose-50 hover:bg-rose-100/80',
    borderColor: 'border-rose-300',
    tag: '🍏 Orchard Crisp',
  },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  pet,
  mood,
  onPetClick,
  onOpenFeed,
  onGiveWater,
  onOpenPlay,
  onOpenClean,
  onToggleSleep,
  onOpenShop,
  onOpenCustomization,
  onOpenProfile,
  onOpenDailyRewards,
  onOpenSettings,
  onFeedItem,
  onDance,
  onSing,
  feedTriggerProp,
  waterTriggerProp,
  customSpeechMessage,
  dailyRewardAvailable = false,
  isCleanOpen = false,
  onOpenMultiplayer,
  onOpenMiniGames,
  currentRoom = null,
  friendPet = null,
  onTapFloorMove,
  activeGame = null,
}) => {
  const [isDrinking, setIsDrinking] = useState<boolean>(false);
  const [isDancing, setIsDancing] = useState<boolean>(false);
  const [isSinging, setIsSinging] = useState<boolean>(false);
  const [isQuickFoodOpen, setIsQuickFoodOpen] = useState<boolean>(false);
  const [feedTrigger, setFeedTrigger] = useState<{ foodId: string; timestamp: number } | null>(null);
  const [waterTrigger, setWaterTrigger] = useState<{ timestamp: number } | null>(null);
  const [danceTrigger, setDanceTrigger] = useState<{ timestamp: number } | null>(null);
  const [singTrigger, setSingTrigger] = useState<{ timestamp: number } | null>(null);
  const [petIdCopied, setPetIdCopied] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<TalkingLanguage>('EN');
  const [talkingModalMode, setTalkingModalMode] = useState<'repeat' | 'answer' | 'chat' | null>(null);
  const [isTalking, setIsTalking] = useState<boolean>(false);
  const [localSpeechMessage, setLocalSpeechMessage] = useState<string | null>(null);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Direct Voice Interaction States for Button 1 (REPEAT) & Button 2 (ANSWER)
  const [directVoiceMode, setDirectVoiceMode] = useState<'repeat' | 'answer' | null>(null);
  const [isDirectListening, setIsDirectListening] = useState<boolean>(false);
  const [isAnswerThinking, setIsAnswerThinking] = useState<boolean>(false);
  const directSpeechControllerRef = useRef<{ stop: () => void; abort: () => void } | null>(null);
  const geminiHistoryRef = useRef<ChatHistoryItem[]>([]);

  // Continuous Repeat Mode states (listen -> repeat -> listen automatically until Stop is pressed)
  const [isContinuousRepeat, setIsContinuousRepeat] = useState<boolean>(false);
  const [repeatPhase, setRepeatPhase] = useState<'idle' | 'listening' | 'speaking'>('idle');
  const repeatPhaseRef = useRef<'idle' | 'listening' | 'speaking'>('idle');
  const isContinuousRepeatRef = useRef<boolean>(false);
  const repeatCycleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateRepeatPhase = (phase: 'idle' | 'listening' | 'speaking') => {
    repeatPhaseRef.current = phase;
    setRepeatPhase(phase);
  };

  const stopDirectSpeech = () => {
    if (directSpeechControllerRef.current) {
      directSpeechControllerRef.current.abort();
      directSpeechControllerRef.current = null;
    }
    setIsDirectListening(false);
    setDirectVoiceMode(null);
    setIsAnswerThinking(false);
  };

  // Stop Continuous Repeat Mode immediately
  const stopContinuousRepeat = () => {
    isContinuousRepeatRef.current = false;
    setIsContinuousRepeat(false);
    updateRepeatPhase('idle');

    if (repeatCycleTimeoutRef.current) {
      clearTimeout(repeatCycleTimeoutRef.current);
      repeatCycleTimeoutRef.current = null;
    }

    if (directSpeechControllerRef.current) {
      directSpeechControllerRef.current.abort();
      directSpeechControllerRef.current = null;
    }

    stopHamsterSpeech();
    setIsDirectListening(false);
    setIsTalking(false);
    setDirectVoiceMode(null);
    setLocalSpeechMessage(null);
    soundManager.playPop();
  };

  // Continuous Repeat Cycle: strictly avoids mic and speech overlap
  const startContinuousListeningCycle = () => {
    if (!isContinuousRepeatRef.current) return;
    if (repeatPhaseRef.current === 'speaking') return; // NEVER interrupt active speaking!

    if (repeatCycleTimeoutRef.current) {
      clearTimeout(repeatCycleTimeoutRef.current);
      repeatCycleTimeoutRef.current = null;
    }

    // 1. Strictly stop any playing speech or previous mic before listening
    stopHamsterSpeech();
    if (directSpeechControllerRef.current) {
      directSpeechControllerRef.current.abort();
      directSpeechControllerRef.current = null;
    }

    setIsTalking(false);
    updateRepeatPhase('listening');
    setIsDirectListening(true);
    setDirectVoiceMode('repeat');
    setLocalSpeechMessage('Listening...');

    const controller = listenUserSpeech(selectedLanguage, {
      onStart: () => {
        if (!isContinuousRepeatRef.current) {
          controller.abort();
          return;
        }
        setIsDirectListening(true);
        setDirectVoiceMode('repeat');
        updateRepeatPhase('listening');
        setLocalSpeechMessage('Listening...');
      },
      onInterim: (interim) => {
        if (!isContinuousRepeatRef.current) return;
        setLocalSpeechMessage(`Listening... "${interim}"`);
      },
      onResult: (finalText) => {
        if (!isContinuousRepeatRef.current) return;
        const cleaned = finalText.trim();

        if (!cleaned) {
          // If silence or empty result, continue listening
          if (isContinuousRepeatRef.current && repeatPhaseRef.current !== 'speaking') {
            repeatCycleTimeoutRef.current = setTimeout(() => {
              if (isContinuousRepeatRef.current && repeatPhaseRef.current !== 'speaking') {
                startContinuousListeningCycle();
              }
            }, 300);
          }
          return;
        }

        // 2. Automatically detect end of speech -> Immediately close mic to PREVENT ANY OVERLAP!
        if (directSpeechControllerRef.current) {
          directSpeechControllerRef.current.abort();
          directSpeechControllerRef.current = null;
        }
        setIsDirectListening(false);
        setDirectVoiceMode(null);

        // 3. Transition to Speaking phase: hamster repeats exact words without modification
        updateRepeatPhase('speaking');
        setLocalSpeechMessage(`Speaking... "${cleaned}"`);
        setIsTalking(true);

        speakHamsterVoice(cleaned, selectedLanguage, {
          onStart: () => {
            setIsTalking(true);
            updateRepeatPhase('speaking');
            setLocalSpeechMessage(`Speaking... "${cleaned}"`);
          },
          onEnd: () => {
            setIsTalking(false);
            // 4. After hamster finishes speaking, automatically start listening again!
            if (isContinuousRepeatRef.current) {
              updateRepeatPhase('listening');
              setLocalSpeechMessage('Listening...');
              // Small cooldown so speaker sound doesn't echo into mic
              repeatCycleTimeoutRef.current = setTimeout(() => {
                if (isContinuousRepeatRef.current && repeatPhaseRef.current !== 'speaking') {
                  startContinuousListeningCycle();
                }
              }, 400);
            }
          },
          onError: () => {
            setIsTalking(false);
            if (isContinuousRepeatRef.current) {
              updateRepeatPhase('listening');
              repeatCycleTimeoutRef.current = setTimeout(() => {
                if (isContinuousRepeatRef.current && repeatPhaseRef.current !== 'speaking') {
                  startContinuousListeningCycle();
                }
              }, 450);
            }
          },
        });
      },
      onError: (errMsg) => {
        setIsDirectListening(false);
        setDirectVoiceMode(null);
        directSpeechControllerRef.current = null;

        if (!isContinuousRepeatRef.current) return;
        // If hamster is already in speaking phase, do NOT interrupt TTS or restart listening!
        if (repeatPhaseRef.current === 'speaking') return;

        if (errMsg.includes('Microphone access was denied') || errMsg.includes('not-allowed')) {
          setLocalSpeechMessage('Microphone access denied. Please allow mic in browser!');
          stopContinuousRepeat();
          setTalkingModalMode('repeat');
          return;
        }

        // On transient silence/no-speech or timeout, seamlessly resume listening
        repeatCycleTimeoutRef.current = setTimeout(() => {
          if (isContinuousRepeatRef.current && repeatPhaseRef.current !== 'speaking') {
            startContinuousListeningCycle();
          }
        }, 400);
      },
      onEnd: () => {
        setIsDirectListening(false);
        directSpeechControllerRef.current = null;

        // If recognition ended without speaking, resume listening
        if (isContinuousRepeatRef.current && repeatPhaseRef.current !== 'speaking') {
          repeatCycleTimeoutRef.current = setTimeout(() => {
            if (isContinuousRepeatRef.current && repeatPhaseRef.current !== 'speaking') {
              startContinuousListeningCycle();
            }
          }, 350);
        }
      },
    });

    directSpeechControllerRef.current = controller;
  };

  // Hamster high-pitched voice speech handler with animated mouth & bubble (pitch 1.8)
  const handleHamsterSpeak = (text: string, lang: TalkingLanguage, userTextFirst?: string) => {
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }

    if (userTextFirst) {
      // 1) Show user text in speech bubble first!
      setLocalSpeechMessage(`You: "${userTextFirst}"`);
      speechTimeoutRef.current = setTimeout(() => {
        // 2) Hamster repeats or answers in cute high pitch 1.8 with mouth open animation and speechSynthesis
        setLocalSpeechMessage(`"${text}"`);
        setIsTalking(true);

        speakHamsterVoice(text, lang, {
          onStart: () => {
            setIsTalking(true);
          },
          onEnd: () => {
            setIsTalking(false);
            speechTimeoutRef.current = setTimeout(() => {
              setLocalSpeechMessage(null);
            }, 6000);
          },
          onError: () => {
            setIsTalking(false);
          },
        });
      }, 1000);
    } else {
      setLocalSpeechMessage(text);
      setIsTalking(true);

      speakHamsterVoice(text, lang, {
        onStart: () => {
          setIsTalking(true);
        },
        onEnd: () => {
          setIsTalking(false);
          speechTimeoutRef.current = setTimeout(() => {
            setLocalSpeechMessage(null);
          }, 6000);
        },
        onError: () => {
          setIsTalking(false);
        },
      });
    }
  };

  const handleLanguageSelect = (lang: TalkingLanguage) => {
    if (isContinuousRepeatRef.current) {
      stopContinuousRepeat();
    }
    setSelectedLanguage(lang);
    soundManager.playPop();
    const greeting = SUPPORTED_LANGUAGES[lang].defaultGreeting;
    handleHamsterSpeak(greeting, lang);
  };

  // Button 1 = REPEAT: One tap activates Continuous Repeat Mode!
  const handleDirectRepeat = () => {
    soundManager.playPop();

    if (isContinuousRepeat) {
      // Tap again toggles/stops Continuous Repeat Mode
      stopContinuousRepeat();
      return;
    }

    // Stop answer mode if active
    stopDirectSpeech();

    // Activate Continuous Repeat Mode
    isContinuousRepeatRef.current = true;
    setIsContinuousRepeat(true);
    startContinuousListeningCycle();
  };

  // Button 2 = ANSWER: User speaks question, automatically detects when speech finishes, sends to Gemini, answers smartly with context in BN/HI/EN!
  const handleDirectAnswer = () => {
    soundManager.playPop();

    // 1. If Continuous Repeat Mode is active, stop it cleanly
    if (isContinuousRepeatRef.current) {
      stopContinuousRepeat();
    }

    // 2. If user taps Answer while already listening or thinking, toggle/cancel
    if ((isDirectListening && directVoiceMode === 'answer') || isAnswerThinking) {
      if (directSpeechControllerRef.current) {
        directSpeechControllerRef.current.abort();
        directSpeechControllerRef.current = null;
      }
      setIsDirectListening(false);
      setDirectVoiceMode(null);
      setIsAnswerThinking(false);
      setLocalSpeechMessage(null);
      return;
    }

    stopDirectSpeech();
    stopHamsterSpeech();
    setIsTalking(false);

    const promptText =
      selectedLanguage === 'BN'
        ? '❓ শুনছি... যেকোনো প্রশ্ন করুন!'
        : selectedLanguage === 'HI'
        ? '❓ सुन रहा हूँ... कोई भी सवाल पूछिए!'
        : '❓ Listening... Ask your question!';
    setLocalSpeechMessage(promptText);
    setIsDirectListening(true);
    setDirectVoiceMode('answer');
    setIsAnswerThinking(false);

    const controller = listenUserSpeech(selectedLanguage, {
      onStart: () => {
        setIsDirectListening(true);
        setDirectVoiceMode('answer');
        setIsAnswerThinking(false);
      },
      onInterim: (interim) => {
        setLocalSpeechMessage(`Listening: "${interim}"`);
      },
      onResult: async (finalQuestion) => {
        // Automatically detected end of user speech!
        // Immediately shut off microphone recognition to prevent any overlap
        if (directSpeechControllerRef.current) {
          directSpeechControllerRef.current.stop();
          directSpeechControllerRef.current = null;
        }
        setIsDirectListening(false);
        setDirectVoiceMode(null);

        const cleaned = finalQuestion.trim();
        if (!cleaned) {
          setLocalSpeechMessage(null);
          return;
        }

        // Show question and thinking state in speech bubble
        const thinkingLabel =
          selectedLanguage === 'BN'
            ? '🐹 ভাবছি...'
            : selectedLanguage === 'HI'
            ? '🐹 सोच रहा हूँ...'
            : '🐹 Thinking...';
        setLocalSpeechMessage(`You: "${cleaned}"\n${thinkingLabel}`);
        setIsAnswerThinking(true);

        try {
          // Send complete question to Gemini with conversation context
          const geminiAnswer = await askGeminiHamster(
            cleaned,
            geminiHistoryRef.current,
            selectedLanguage,
            pet.name
          );

          // Maintain conversation context so follow-up questions work naturally
          geminiHistoryRef.current.push({ role: 'user', text: cleaned });
          geminiHistoryRef.current.push({ role: 'model', text: geminiAnswer });
          if (geminiHistoryRef.current.length > 16) {
            geminiHistoryRef.current = geminiHistoryRef.current.slice(-16);
          }

          setIsAnswerThinking(false);

          // Show question and answer in the speech bubble
          const displayBubbleText = `You: "${cleaned}"\n🐹: ${geminiAnswer}`;
          setLocalSpeechMessage(displayBubbleText);

          // Make the hamster speak the answer automatically (no second tap required)
          if (speechTimeoutRef.current) {
            clearTimeout(speechTimeoutRef.current);
            speechTimeoutRef.current = null;
          }

          setIsTalking(true);
          speakHamsterVoice(geminiAnswer, selectedLanguage, {
            onStart: () => {
              setIsTalking(true);
            },
            onEnd: () => {
              setIsTalking(false);
              // Keep question & answer visible in speech bubble for easy reading
              speechTimeoutRef.current = setTimeout(() => {
                setLocalSpeechMessage(null);
              }, 12000);
            },
            onError: () => {
              setIsTalking(false);
            },
          });
        } catch (err) {
          console.error('Failed to generate answer from Gemini:', err);
          setIsAnswerThinking(false);
          const fallbackAnswer = getCuteHamsterAnswer(cleaned, selectedLanguage, pet.name);
          setLocalSpeechMessage(`You: "${cleaned}"\n🐹: ${fallbackAnswer}`);
          setIsTalking(true);
          speakHamsterVoice(fallbackAnswer, selectedLanguage, {
            onStart: () => {
              setIsTalking(true);
            },
            onEnd: () => {
              setIsTalking(false);
              speechTimeoutRef.current = setTimeout(() => {
                setLocalSpeechMessage(null);
              }, 10000);
            },
            onError: () => {
              setIsTalking(false);
            },
          });
        }
      },
      onError: () => {
        setIsDirectListening(false);
        setDirectVoiceMode(null);
        setIsAnswerThinking(false);
        directSpeechControllerRef.current = null;
        // Fallback: open modal for typing if mic is blocked/unsupported
        setTalkingModalMode('answer');
      },
      onEnd: () => {
        setIsDirectListening(false);
        setDirectVoiceMode(null);
        directSpeechControllerRef.current = null;
      },
    });

    directSpeechControllerRef.current = controller;
  };

  const handleRepeatClick = () => {
    if (isContinuousRepeatRef.current) {
      stopContinuousRepeat();
    }
    soundManager.playPop();
    setTalkingModalMode('repeat');
  };

  const handleChatClick = () => {
    if (isContinuousRepeatRef.current) {
      stopContinuousRepeat();
    }
    soundManager.playPop();
    setTalkingModalMode('answer');
  };

  // Cleanup continuous repeat and audio on unmount
  React.useEffect(() => {
    return () => {
      isContinuousRepeatRef.current = false;
      if (repeatCycleTimeoutRef.current) {
        clearTimeout(repeatCycleTimeoutRef.current);
      }
      if (directSpeechControllerRef.current) {
        directSpeechControllerRef.current.abort();
      }
      stopHamsterSpeech();
    };
  }, []);

  const [statNotice, setStatNotice] = useState<{
    text: string;
    hunger: number;
    energy: number;
    icon: string;
  } | null>(null);

  // Sync external feed/water triggers from App level
  React.useEffect(() => {
    if (feedTriggerProp) {
      setFeedTrigger(feedTriggerProp);
      const food = THREE_FOODS.find((f) => f.id === feedTriggerProp.foodId);
      if (food) {
        const isFav = food.favoriteFor?.includes(pet.type);
        setStatNotice({
          icon: food.icon,
          text: isFav ? `${pet.name}'s Favorite! 💖` : `Ate ${food.name}!`,
          hunger: food.hungerBoost,
          energy: food.energyBoost || 12,
        });
        setTimeout(() => setStatNotice(null), 2500);
      }
    }
  }, [feedTriggerProp, pet.name, pet.type]);

  React.useEffect(() => {
    if (waterTriggerProp) {
      setWaterTrigger(waterTriggerProp);
      setIsDrinking(true);
      setStatNotice({
        icon: '💧',
        text: 'Cool Spring Water!',
        hunger: 8,
        energy: 18,
      });
      setTimeout(() => setIsDrinking(false), 2200);
      setTimeout(() => setStatNotice(null), 2500);
    }
  }, [waterTriggerProp]);

  // Handle Feeding one of the 3 foods
  const handleSelectFood = (food: FoodItem) => {
    soundManager.playPop();
    setFeedTrigger({ foodId: food.id, timestamp: Date.now() });
    setIsQuickFoodOpen(false);

    if (onFeedItem) {
      onFeedItem(food);
    }

    const isFav = food.favoriteFor?.includes(pet.type);
    setStatNotice({
      icon: food.icon,
      text: isFav ? `${pet.name}'s Favorite! 💖` : `Ate ${food.name}!`,
      hunger: food.hungerBoost,
      energy: food.energyBoost || 12,
    });

    setTimeout(() => setStatNotice(null), 2500);
  };

  // Handle Giving Water
  const handleWaterClick = () => {
    soundManager.playDrink();
    setWaterTrigger({ timestamp: Date.now() });
    setIsDrinking(true);
    onGiveWater();

    setStatNotice({
      icon: '💧',
      text: 'Cool Spring Water!',
      hunger: 8,
      energy: 18,
    });

    setTimeout(() => setIsDrinking(false), 2200);
    setTimeout(() => setStatNotice(null), 2500);
  };

  // Handle Dance Action
  const handleDanceClick = () => {
    if (pet.isSleeping && onToggleSleep) {
      onToggleSleep();
    }
    const trigger = { timestamp: Date.now() };
    setDanceTrigger(trigger);
    setIsDancing(true);
    setIsSinging(false);
    if (onDance) onDance();
    setStatNotice({
      icon: '💃',
      text: `${pet.name} is dancing with music & spins! 🎶`,
      hunger: 0,
      energy: 15,
    });
    setTimeout(() => setStatNotice(null), 3000);
  };

  // Handle Sing Action
  const handleSingClick = () => {
    if (pet.isSleeping && onToggleSleep) {
      onToggleSleep();
    }
    const trigger = { timestamp: Date.now() };
    setSingTrigger(trigger);
    setIsSinging(true);
    setIsDancing(false);
    if (onSing) onSing();
    setStatNotice({
      icon: '🎤',
      text: `${pet.name} is singing a cute song! 🎵`,
      hunger: 0,
      energy: 15,
    });
    setTimeout(() => setStatNotice(null), 3000);
  };

  // Wallpapers style map for framing backdrop
  const getWallpaperBackground = (wp: string, isSleeping: boolean) => {
    if (isSleeping) {
      return 'bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 text-white';
    }
    switch (wp) {
      case 'wall-pink-polka':
        return 'bg-gradient-to-b from-[#FFE9F0] via-[#FFF0F5] to-[#FFD6E0] text-pink-950';
      case 'wall-starry-night':
        return 'bg-gradient-to-b from-slate-900 via-indigo-950 to-purple-950';
      case 'wall-mint-forest':
        return 'bg-gradient-to-b from-emerald-100 via-teal-50 to-emerald-100';
      case 'wall-sakura-blossom':
        return 'bg-gradient-to-b from-[#FFE9F0] via-[#FFD6E0] to-[#FFE9F0] text-pink-950';
      default:
        // Bright Pink Cute House: Soft pastel pink #FFD6E0 & #FFE9F0
        return 'bg-gradient-to-b from-[#FFE9F0] via-[#FFF5F8] to-[#FFD6E0] text-pink-950';
    }
  };

  return (
    <div
      id="pet-home-screen"
      className={`relative w-full h-full max-w-md mx-auto flex flex-col justify-between select-none overflow-hidden transition-colors duration-700 ${getWallpaperBackground(
        pet.room?.wallpaper || 'wall-pink-polka',
        pet.isSleeping
      )}`}
    >
      {/* Night mode soft lamp glow overlay */}
      {pet.isSleeping && (
        <div className="absolute inset-0 bg-indigo-950/70 backdrop-blur-[0.5px] pointer-events-none z-10" />
      )}

      {/* TOP HEADER: Level, Coins, Navigation icons */}
      <header className="relative z-20 p-2.5 sm:p-3 flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Left: App Logo & Pet Passport */}
        <div className="flex items-center gap-1.5">
          {/* Official Pocket Pet App Header Logo */}
          <div
            id="app-header-brand-logo"
            className={`flex items-center gap-1.5 px-2 py-1 rounded-2xl border shadow-xs select-none ${
              pet.isSleeping
                ? 'bg-slate-800/90 border-slate-700 text-white'
                : 'bg-white/95 border-amber-200 text-stone-800'
            }`}
          >
            <div className="w-7 h-7 rounded-xl overflow-hidden border border-amber-300 shadow-xs shrink-0 bg-amber-50">
              <img
                src="/pocket_pet_icon.png"
                alt="Pocket Pet Logo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="font-bubble text-xs font-extrabold tracking-tight text-amber-900 hidden xs:inline">
              Pocket <span className="text-amber-600">Pet</span>
            </span>
          </div>

          {/* Pet Passport / Level */}
          <button
            id="btn-open-profile"
            onClick={onOpenProfile}
            className={`flex items-center gap-1.5 p-1 pr-2.5 rounded-2xl border shadow-xs transition-all active:scale-95 ${
              pet.isSleeping
                ? 'bg-slate-800/90 border-slate-700 text-white'
                : 'bg-white/90 border-amber-200 text-stone-800'
            }`}
          >
            <div className="w-7 h-7 rounded-xl bg-amber-400/20 flex items-center justify-center text-sm overflow-hidden shrink-0">
              {pet.type === 'hamster' ? (
                <img
                  src="/pocket_pet_icon.png"
                  alt={pet.name}
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <>
                  {pet.type === 'cat' && '🐱'}
                  {pet.type === 'dog' && '🐶'}
                  {pet.type === 'bunny' && '🐰'}
                  {pet.type === 'panda' && '🐼'}
                </>
              )}
            </div>
            <div className="text-left">
              <div className="font-bubble text-xs font-bold leading-tight flex items-center gap-1">
                <span className="truncate max-w-[65px]">{pet.name}</span>
                <span className="text-[9px] bg-amber-500 text-white px-1 rounded-sm font-bold">
                  L{pet.level}
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Right tools: Coins, Daily Reward, Settings */}
        <div className="flex items-center gap-1.5">
          {/* Coins badge */}
          <div
            className={`flex items-center gap-1 px-3 py-1.5 rounded-2xl border shadow-xs font-bubble text-xs font-bold ${
              pet.isSleeping
                ? 'bg-slate-800/90 border-slate-700 text-amber-300'
                : 'bg-white/90 border-amber-200 text-amber-800'
            }`}
          >
            <span className="text-sm">🪙</span>
            <span>{pet.coins}</span>
          </div>

          {/* Daily reward gift button */}
          <button
            id="btn-open-daily-reward"
            onClick={onOpenDailyRewards}
            className="relative p-2 rounded-2xl bg-white/90 border border-amber-200 shadow-xs text-amber-700 hover:bg-amber-50 active:scale-95 transition-transform"
          >
            <Gift size={18} />
            {dailyRewardAvailable && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white animate-ping" />
            )}
          </button>

          {/* Settings button */}
          <button
            id="btn-open-settings"
            onClick={onOpenSettings}
            className="p-2 rounded-2xl bg-white/90 border border-stone-200 shadow-xs text-stone-600 hover:bg-stone-50 active:scale-95 transition-transform"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* MULTIPLAYER & UNIQUE PET ID BAR (Top) */}
      <div className="relative z-20 px-2.5 sm:px-3 -mt-1 mb-1.5 flex items-center justify-between gap-1.5 flex-wrap">
        {/* Unique Pet ID for Each User (Shown at top) */}
        <button
          id="pet-id-top-display"
          onClick={() => {
            if (navigator.clipboard && pet.id) {
              navigator.clipboard.writeText(pet.id);
              setPetIdCopied(true);
              soundManager.playPop();
              setTimeout(() => setPetIdCopied(false), 2000);
            }
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-2xl border shadow-xs font-bubble text-xs cursor-pointer active:scale-95 transition-all ${
            pet.isSleeping
              ? 'bg-slate-800/90 border-slate-700 text-pink-300 hover:bg-slate-700/90'
              : 'bg-white/95 border-pink-200 text-pink-800 hover:bg-pink-50'
          }`}
          title="Click to copy your Unique Pet ID"
        >
          <span className="text-xs">🏷️</span>
          <span className="font-bold">Pet ID:</span>
          <span className="font-mono font-extrabold text-pink-950 bg-pink-50 px-1.5 py-0.5 rounded-lg border border-pink-200 text-[11px] tracking-wider">
            {pet.id || 'HAM-8821'}
          </span>
          {petIdCopied && (
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200 animate-fade-in">
              Copied! ✨
            </span>
          )}
        </button>

        {/* 3 Top Language Buttons: [BN] [HI] [EN] */}
        <div
          id="top-language-selector"
          className="flex items-center bg-white/95 backdrop-blur-xs rounded-2xl border border-pink-200 p-0.5 shadow-xs font-bubble text-xs"
          title="Select Talking Language"
        >
          {(['BN', 'HI', 'EN'] as TalkingLanguage[]).map((lang) => (
            <button
              key={lang}
              id={`btn-top-lang-${lang.toLowerCase()}`}
              onClick={() => handleLanguageSelect(lang)}
              className={`px-2 py-0.5 rounded-xl font-bold transition-all cursor-pointer ${
                selectedLanguage === lang
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xs scale-105'
                  : 'text-stone-600 hover:text-pink-600 hover:bg-pink-50'
              }`}
            >
              [{lang}]
            </button>
          ))}
        </div>

        {/* Multiplayer & Mini-Games Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Multiplayer Room Button */}
          <button
            id="btn-open-multiplayer"
            onClick={onOpenMultiplayer}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-2xl border shadow-xs transition-all active:scale-95 font-bubble text-xs font-bold cursor-pointer ${
              currentRoom
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-pink-400 ring-2 ring-pink-300 shadow-md'
                : 'bg-white/95 border-pink-300 text-pink-700 hover:bg-pink-50'
            }`}
          >
            <Users size={13} />
            <span>{currentRoom ? `Room #${currentRoom.code}` : 'Multiplayer'}</span>
            {currentRoom?.guest && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            )}
          </button>

          {/* Mini-Games Button (Race, Hide & Seek, Ball Play) */}
          <button
            id="btn-open-multiplayer-minigames"
            onClick={onOpenMiniGames}
            className="flex items-center gap-1 px-2.5 py-1 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white border border-purple-400 shadow-xs font-bubble text-xs font-bold hover:brightness-105 active:scale-95 transition-all cursor-pointer"
            title="Mini-Games: Race, Hide & Seek, Ball Play"
          >
            <Gamepad2 size={13} />
            <span>Mini-Games</span>
          </button>
        </div>
      </div>

      {/* METERS STATUS BAR */}
      <div className="relative z-20 px-3">
        <div
          className={`grid grid-cols-4 gap-2 p-2.5 rounded-2xl border shadow-xs transition-colors ${
            pet.isSleeping
              ? 'bg-slate-900/80 border-slate-700 text-white'
              : 'bg-white/85 backdrop-blur-xs border-amber-200/80 text-stone-700'
          }`}
        >
          {/* Hunger Meter */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] font-bold">
              <span>🍖 Hunger</span>
              <span>{pet.stats.hunger}%</span>
            </div>
            <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  pet.stats.hunger < 30
                    ? 'bg-rose-500'
                    : pet.stats.hunger < 60
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                animate={{ width: `${pet.stats.hunger}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Happiness Meter */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] font-bold">
              <span>❤️ Happy</span>
              <span>{pet.stats.happiness}%</span>
            </div>
            <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  pet.stats.happiness < 30
                    ? 'bg-rose-500'
                    : pet.stats.happiness < 60
                    ? 'bg-amber-500'
                    : 'bg-pink-500'
                }`}
                animate={{ width: `${pet.stats.happiness}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Energy Meter */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] font-bold">
              <span>⚡ Energy</span>
              <span>{pet.stats.energy}%</span>
            </div>
            <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  pet.stats.energy < 30
                    ? 'bg-rose-500'
                    : pet.stats.energy < 60
                    ? 'bg-amber-500'
                    : 'bg-yellow-400'
                }`}
                animate={{ width: `${pet.stats.energy}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Cleanliness Meter */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] font-bold">
              <span>🧼 Clean</span>
              <span>{pet.stats.cleanliness}%</span>
            </div>
            <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  pet.stats.cleanliness < 30
                    ? 'bg-rose-500'
                    : pet.stats.cleanliness < 60
                    ? 'bg-amber-500'
                    : 'bg-sky-400'
                }`}
                animate={{ width: `${pet.stats.cleanliness}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* MAIN PET ROOM INTERACTIVE 3D STAGE */}
      <div
        id="pet-room-stage"
        className="relative flex-1 w-full h-full min-h-[340px] flex flex-col items-center justify-center my-1 z-10 overflow-hidden"
      >
        {/* Full 3D Interactive WebGL Scene */}
        <PetScene3D
          pet={pet}
          mood={mood}
          onPetClick={onPetClick}
          onOpenFeed={() => setIsQuickFoodOpen(true)}
          onGiveWater={handleWaterClick}
          onToggleSleep={onToggleSleep}
          feedTrigger={feedTrigger}
          waterTrigger={waterTrigger}
          danceTrigger={danceTrigger}
          singTrigger={singTrigger}
          onDanceComplete={() => setIsDancing(false)}
          onSingComplete={() => setIsSinging(false)}
          isBathing={isCleanOpen}
          interactive={!pet.isSleeping}
          friendPet={friendPet}
          onTapFloorMove={onTapFloorMove}
          activeGame={activeGame}
          isTalking={isTalking}
        />

        {/* Friend In-Room Presence Banner */}
        {friendPet && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3.5 py-1 rounded-full border border-pink-300 shadow-md pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-xs font-bubble font-bold text-pink-800 whitespace-nowrap">
              Friend <span className="text-pink-900 font-extrabold">{friendPet.petName}</span> is in the room! 💖
            </span>
            {activeGame && (
              <span className="text-[10px] bg-pink-100 text-pink-900 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {activeGame}
              </span>
            )}
          </div>
        )}

        {/* Floating Speech Bubble Above 3D Pet */}
        <div className="absolute top-2 left-0 right-0 pointer-events-none z-20 flex justify-center px-3">
          <div className="pointer-events-auto max-w-[340px] sm:max-w-[420px] w-full flex justify-center">
            <SpeechBubble
              mood={mood}
              customMessage={localSpeechMessage || customSpeechMessage}
              onBubbleClick={onPetClick}
            />
          </div>
        </div>

        {/* Floating Stat Boost Toast Banner */}
        <AnimatePresence>
          {statNotice && (
            <motion.div
              initial={{ scale: 0.8, y: -20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: -15, opacity: 0 }}
              className="absolute top-16 z-30 pointer-events-none flex flex-col items-center gap-1 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl border-2 border-amber-300 shadow-lg"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{statNotice.icon}</span>
                <span className="font-bubble font-bold text-stone-800 text-sm">
                  {statNotice.text}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold font-bubble">
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  +{statNotice.hunger} 🍖 Hunger
                </span>
                <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  +{statNotice.energy} ⚡ Energy
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drinking water animation splash banner */}
        <AnimatePresence>
          {isDrinking && !statNotice && (
            <motion.div
              initial={{ scale: 0.5, y: -10, opacity: 0 }}
              animate={{ scale: 1.1, y: -20, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-1/3 z-30 pointer-events-none font-bubble text-base font-bold text-sky-700 bg-white/95 px-4 py-1.5 rounded-full border-2 border-sky-300 shadow-md flex items-center gap-1.5"
            >
              <span>💧</span>
              <span>Refreshing Spring Water!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* QUICK WARDROBE & BOUTIQUE SHORTCUT CHIPS */}
      <div className="relative z-20 px-4 py-1 flex justify-center gap-2">
        <button
          id="btn-quick-closet"
          onClick={onOpenCustomization}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/90 border border-pink-200 shadow-xs text-xs font-bubble font-bold text-pink-700 hover:bg-pink-50 active:scale-95 transition-all"
        >
          <Shirt size={14} /> Closet & Style
        </button>
        <button
          id="btn-quick-shop"
          onClick={onOpenShop}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/90 border border-amber-200 shadow-xs text-xs font-bubble font-bold text-amber-800 hover:bg-amber-50 active:scale-95 transition-all"
        >
          <ShoppingBag size={14} /> Boutique 🪙
        </button>
      </div>

      {/* TOUCH-FRIENDLY 3-FOOD SELECTION TRAY */}
      <AnimatePresence>
        {isQuickFoodOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-30 px-3 pb-2"
          >
            <div className="bg-white/95 backdrop-blur-md rounded-3xl border-2 border-amber-200 shadow-xl p-3 flex flex-col gap-2.5">
              {/* Header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">🥣</span>
                  <h3 className="font-bubble font-bold text-stone-800 text-sm">
                    Feed {pet.name} — Choose a Meal
                  </h3>
                </div>
                <button
                  id="btn-close-quick-food"
                  onClick={() => setIsQuickFoodOpen(false)}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* 3 Distinct Touch-Friendly Food Cards */}
              <div className="grid grid-cols-3 gap-2">
                {THREE_FOODS.map((food) => {
                  const invCount = pet.inventory[food.id] || 0;
                  return (
                    <button
                      key={food.id}
                      id={`btn-feed-${food.id}`}
                      onClick={() => handleSelectFood(food)}
                      className={`flex flex-col items-center justify-between p-2.5 rounded-2xl border-2 ${food.borderColor} ${food.colorBg} active:scale-95 transition-all text-left shadow-xs group min-h-[110px]`}
                    >
                      <div className="w-full flex justify-between items-start">
                        <span className="text-3xl group-hover:scale-110 transition-transform">
                          {food.icon}
                        </span>
                        <span className="text-[10px] font-bold font-bubble text-amber-900 bg-white/90 px-1.5 py-0.5 rounded-full border border-amber-200 shadow-xs">
                          {food.tag}
                        </span>
                      </div>

                      <div className="w-full mt-1.5">
                        <span className="block font-bubble font-bold text-stone-900 text-xs truncate">
                          {food.name}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-bold font-bubble mt-0.5">
                          <span className="text-emerald-700">+{food.hungerBoost} 🍖</span>
                          <span className="text-amber-700">+{food.energyBoost} ⚡</span>
                        </div>
                      </div>

                      <div className="w-full flex justify-between items-center text-[10px] font-bubble font-bold text-stone-500 mt-1 pt-1 border-t border-stone-200/60">
                        <span>Owned: {invCount}</span>
                        <span className="text-amber-600 font-bold">Feed ➔</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Browse Pantry button */}
              <div className="flex justify-between items-center pt-1 border-t border-stone-100">
                <span className="text-[11px] text-stone-500 font-medium pl-1">
                  Hamster will waddle to 3D bowl to eat!
                </span>
                <button
                  id="btn-open-full-pantry"
                  onClick={() => {
                    setIsQuickFoodOpen(false);
                    onOpenFeed();
                  }}
                  className="flex items-center gap-1 text-xs font-bubble font-bold text-amber-700 hover:text-amber-800 bg-amber-100/60 hover:bg-amber-100 px-3 py-1 rounded-full border border-amber-300/60 active:scale-95 transition-all"
                >
                  <span>All Foods 🎒</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2 MAIN ACTION BUTTONS: BUTTON 1 = REPEAT & BUTTON 2 = ANSWER */}
      <div className="relative z-20 px-3 pt-0 pb-1.5 flex items-stretch justify-center gap-2">
        {/* BUTTON 1 = REPEAT */}
        <div className="flex-1 flex items-stretch">
          <button
            id="btn-action-repeat"
            onClick={handleDirectRepeat}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border font-bubble font-bold transition-all shadow-md active:scale-95 cursor-pointer select-none ${
              isContinuousRepeat
                ? repeatPhase === 'speaking'
                  ? 'bg-gradient-to-r from-amber-500 via-pink-500 to-rose-500 text-white border-pink-400 ring-4 ring-pink-300/80 shadow-lg scale-[1.01]'
                  : 'bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white border-pink-400 ring-4 ring-pink-300/80 shadow-lg scale-[1.01] animate-pulse'
                : 'bg-gradient-to-r from-pink-50 via-white to-rose-50 hover:from-pink-100 hover:to-rose-100 text-stone-800 border-pink-300 hover:border-pink-400 hover:shadow-lg'
            }`}
            title={
              isContinuousRepeat
                ? 'Continuous Repeat Active - Tap to Stop'
                : 'Button 1: REPEAT - Tap once for Continuous Repeat Mode (auto listen & repeat)!'
            }
          >
            <div
              className={`p-2 rounded-xl transition-transform shrink-0 ${
                isContinuousRepeat
                  ? 'bg-white text-pink-600 shadow-md scale-110'
                  : 'bg-pink-500 text-white shadow-xs'
              }`}
            >
              {isContinuousRepeat ? (
                repeatPhase === 'speaking' ? (
                  <Volume2 className="animate-bounce" size={17} />
                ) : (
                  <Mic className="animate-bounce" size={17} />
                )
              ) : (
                <RotateCcw size={17} />
              )}
            </div>
            <div className="flex flex-col text-left leading-tight min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs sm:text-sm font-extrabold font-bubble tracking-wide whitespace-nowrap">
                  {isContinuousRepeat
                    ? repeatPhase === 'speaking'
                      ? 'Speaking...'
                      : 'Listening...'
                    : 'Button 1: REPEAT'}
                </span>
                <span className="text-[9px] bg-pink-100/90 text-pink-700 px-1 py-0.5 rounded font-mono font-bold">
                  [{selectedLanguage}]
                </span>
              </div>
              <span
                className={`text-[10px] sm:text-[11px] font-bubble truncate ${
                  isContinuousRepeat ? 'text-pink-100 font-bold' : 'text-pink-600'
                }`}
              >
                {isContinuousRepeat
                  ? repeatPhase === 'speaking'
                    ? 'Hamster repeating 🐹'
                    : 'Speak anytime 🎙️'
                  : 'Continuous Voice 🎙️'}
              </span>
            </div>
          </button>

          {/* Small Stop Control (appears while Continuous Repeat Mode is active) */}
          <AnimatePresence>
            {isContinuousRepeat && (
              <motion.button
                id="btn-stop-repeat"
                initial={{ scale: 0.7, opacity: 0, width: 0 }}
                animate={{ scale: 1, opacity: 1, width: 'auto' }}
                exit={{ scale: 0.7, opacity: 0, width: 0 }}
                onClick={(e) => {
                  e.stopPropagation();
                  stopContinuousRepeat();
                }}
                className="ml-1 px-2.5 flex items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bubble font-bold text-xs shadow-md border border-red-400 active:scale-90 transition-transform cursor-pointer select-none"
                title="Stop Continuous Repeat Mode"
              >
                <Square size={11} fill="currentColor" />
                <span className="text-[10px] uppercase tracking-wider font-extrabold whitespace-nowrap">Stop</span>
              </motion.button>
            )}
          </AnimatePresence>

          <button
            onClick={handleRepeatClick}
            title="Type text for hamster to repeat"
            className="ml-1 px-2 flex items-center justify-center rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-700 border border-pink-300 shadow-xs cursor-pointer active:scale-95 transition-transform"
          >
            <Keyboard size={14} />
          </button>
        </div>

        {/* BUTTON 2 = ANSWER */}
        <div className="flex-1 flex items-stretch">
          <button
            id="btn-action-answer"
            onClick={handleDirectAnswer}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border font-bubble font-bold transition-all shadow-md active:scale-95 cursor-pointer select-none ${
              (isDirectListening && directVoiceMode === 'answer') || isAnswerThinking
                ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white border-purple-400 ring-4 ring-purple-300/80 shadow-lg scale-[1.02] animate-pulse'
                : 'bg-gradient-to-r from-purple-50 via-white to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-stone-800 border-purple-300 hover:border-purple-400 hover:shadow-lg'
            }`}
            title="Button 2: ANSWER - Tap to ask question, hamster answers smartly with knowledge in BN/HI/EN!"
          >
            <div
              className={`p-2 rounded-xl transition-transform shrink-0 ${
                (isDirectListening && directVoiceMode === 'answer') || isAnswerThinking
                  ? 'bg-white text-purple-700 shadow-md scale-110'
                  : 'bg-purple-600 text-white shadow-xs'
              }`}
            >
              {isDirectListening && directVoiceMode === 'answer' ? (
                <Mic className="animate-bounce" size={17} />
              ) : isAnswerThinking ? (
                <Sparkles className="animate-spin" size={17} />
              ) : (
                <Bot size={17} />
              )}
            </div>
            <div className="flex flex-col text-left leading-tight min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs sm:text-sm font-extrabold font-bubble tracking-wide whitespace-nowrap">
                  {isDirectListening && directVoiceMode === 'answer'
                    ? 'Listening...'
                    : isAnswerThinking
                    ? 'Thinking...'
                    : 'Button 2: ANSWER'}
                </span>
                <span className="text-[9px] bg-purple-100/90 text-purple-700 px-1 py-0.5 rounded font-mono font-bold">
                  [{selectedLanguage}]
                </span>
              </div>
              <span
                className={`text-[10px] sm:text-[11px] font-bubble truncate ${
                  (isDirectListening && directVoiceMode === 'answer') || isAnswerThinking
                    ? 'text-purple-100 font-bold'
                    : 'text-purple-600'
                }`}
              >
                {isDirectListening && directVoiceMode === 'answer'
                  ? 'Ask question ❓'
                  : isAnswerThinking
                  ? 'Gemini AI 🐹✨'
                  : 'Smart Q&A (BN/HI/EN) 💡'}
              </span>
            </div>
          </button>
          <button
            onClick={handleChatClick}
            title="Type question for smart answer"
            className="ml-1 px-2 flex items-center justify-center rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-300 shadow-xs cursor-pointer active:scale-95 transition-transform"
          >
            <Keyboard size={14} />
          </button>
        </div>
      </div>

      {/* BOTTOM PET CARE & ACTIONS TOOLBAR (KEEP ALL FEATURES SAME) */}
      <footer className="relative z-20 p-3 pt-0">
        <div className="grid grid-cols-8 gap-1 bg-white/95 backdrop-blur-md p-1.5 rounded-3xl border border-stone-200 shadow-lg">
          {/* 1. Feed */}
          <button
            id="btn-action-feed"
            onClick={() => {
              soundManager.playPop();
              setIsQuickFoodOpen((prev) => !prev);
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl active:scale-90 transition-all cursor-pointer group ${
              isQuickFoodOpen ? 'bg-amber-100 ring-2 ring-amber-400' : 'hover:bg-amber-50'
            }`}
            title="Feed Hamster"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">🥣</span>
            <span className="text-[10px] font-bubble font-bold text-stone-700 mt-0.5">Feed</span>
          </button>

          {/* 2. Water */}
          <button
            id="btn-action-water"
            onClick={handleWaterClick}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl active:scale-90 transition-all cursor-pointer group ${
              isDrinking ? 'bg-sky-100 ring-2 ring-sky-400' : 'hover:bg-sky-50'
            }`}
            title="Give Fresh Water"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">💧</span>
            <span className="text-[10px] font-bubble font-bold text-stone-700 mt-0.5">Water</span>
          </button>

          {/* 3. Play */}
          <button
            id="btn-action-play"
            onClick={onOpenPlay}
            className="flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl hover:bg-emerald-50 active:scale-90 transition-transform cursor-pointer group"
            title="Play Ball / Mini-Games"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">🎾</span>
            <span className="text-[10px] font-bubble font-bold text-stone-700 mt-0.5">Play</span>
          </button>

          {/* 4. Clean */}
          <button
            id="btn-action-clean"
            onClick={onOpenClean}
            className="flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl hover:bg-teal-50 active:scale-90 transition-transform cursor-pointer group"
            title="Bath & Sponge Clean"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">🛁</span>
            <span className="text-[10px] font-bubble font-bold text-stone-700 mt-0.5">Clean</span>
          </button>

          {/* 5. Sleep */}
          <button
            id="btn-action-sleep"
            onClick={onToggleSleep}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl active:scale-90 transition-all cursor-pointer group ${
              pet.isSleeping ? 'bg-indigo-100 text-indigo-900 font-bold' : 'hover:bg-indigo-50'
            }`}
            title="Sleep & Rest"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">
              {pet.isSleeping ? '☀️' : '😴'}
            </span>
            <span className="text-[10px] font-bubble font-bold text-stone-700 mt-0.5">
              {pet.isSleeping ? 'Wake' : 'Sleep'}
            </span>
          </button>

          {/* 6. Dance */}
          <button
            id="btn-action-dance"
            onClick={handleDanceClick}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl active:scale-90 transition-all cursor-pointer group ${
              isDancing ? 'bg-pink-100 text-pink-900 font-bold animate-pulse' : 'hover:bg-pink-50'
            }`}
            title="Dance Routine"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">💃</span>
            <span className="text-[10px] font-bubble font-bold text-stone-700 mt-0.5">Dance</span>
          </button>

          {/* 7. Sing */}
          <button
            id="btn-action-sing"
            onClick={handleSingClick}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl active:scale-90 transition-all cursor-pointer group ${
              isSinging ? 'bg-purple-100 text-purple-900 font-bold animate-pulse' : 'hover:bg-purple-50'
            }`}
            title="Sing Cute Song"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">🎤</span>
            <span className="text-[10px] font-bubble font-bold text-stone-700 mt-0.5">Sing</span>
          </button>

          {/* 8. Shop */}
          <button
            id="btn-action-shop"
            onClick={onOpenShop}
            className="flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl hover:bg-orange-50 active:scale-90 transition-transform cursor-pointer group"
            title="Pet Boutique Shop"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">🛍️</span>
            <span className="text-[10px] font-bubble font-bold text-stone-700 mt-0.5">Shop</span>
          </button>
        </div>
      </footer>

      {/* Hamster Talking (Repeat & Chat) Modal */}
      <HamsterTalkModal
        mode={talkingModalMode}
        isOpen={talkingModalMode !== null}
        onClose={() => setTalkingModalMode(null)}
        petName={pet.name}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={(lang) => {
          setSelectedLanguage(lang);
        }}
        onHamsterSpeak={handleHamsterSpeak}
      />
    </div>
  );
};
