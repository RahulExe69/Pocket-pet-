import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  Gift,
  Sparkles,
  ShoppingBag,
  ShoppingCart,
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
  Smile,
  Utensils,
  Bath,
  Moon,
  Plane,
  Sun,
  Droplets,
  Music,
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
  modelStyle?: 'textured' | 'mochi';
  onToggleModelStyle?: (style: 'textured' | 'mochi') => void;
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
  modelStyle = 'textured',
  onToggleModelStyle,
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

      {/* TOP HEADER: Talking Tom 2 Style Header */}
      <header className="relative z-20 px-3 pt-2 pb-1 shrink-0 flex items-center justify-between gap-2">
        {/* Left: Talking Tom 2 Circular Level Badge with XP Progress Ring */}
        <button
          id="btn-open-profile"
          onClick={onOpenProfile}
          className="relative flex items-center justify-center p-1 active:scale-95 transition-transform cursor-pointer group"
          title="View Pet Profile & Passport"
        >
          {/* Circular SVG XP progress ring */}
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
              {/* Background ring */}
              <circle
                cx="22"
                cy="22"
                r="18"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="3.5"
              />
              {/* Animated Lime XP ring */}
              <circle
                cx="22"
                cy="22"
                r="18"
                fill="none"
                stroke="#4ade80"
                strokeWidth="3.5"
                strokeDasharray={113.1}
                strokeDashoffset={113.1 - (113.1 * Math.min(100, Math.max(10, (pet.experience || 0) % 100))) / 100}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            {/* Center Purple Level Circle */}
            <div className="absolute inset-1.5 rounded-full bg-gradient-to-br from-purple-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-bubble font-extrabold text-sm shadow-md border border-white/60 group-hover:scale-105 transition-transform">
              {pet.level}
            </div>
          </div>
        </button>

        {/* Center: Dark Capsule Coins Pill (Talking Tom 2 style) */}
        <div
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border-2 border-slate-700/80 shadow-lg font-bubble text-sm sm:text-base font-extrabold text-white"
          title="Your Pocket Coins"
        >
          <span className="tracking-wide">{pet.coins.toLocaleString()}</span>
          <span className="text-base sm:text-lg">🪙</span>
        </div>

        {/* Right Tools: Daily Gift & Settings (Talking Tom 2 style) */}
        <div className="flex items-center gap-1.5">
          {/* Daily reward gift button */}
          <button
            id="btn-open-daily-reward"
            onClick={onOpenDailyRewards}
            className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center border-2 border-white/70 shadow-md active:scale-95 transition-transform cursor-pointer"
            title="Claim Daily Login Gift"
          >
            <Gift size={20} />
            {dailyRewardAvailable && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white animate-ping" />
            )}
          </button>

          {/* Settings button */}
          <button
            id="btn-open-settings"
            onClick={onOpenSettings}
            className="w-10 h-10 rounded-2xl bg-white/95 text-stone-700 flex items-center justify-center border-2 border-stone-200 shadow-md active:scale-95 transition-transform cursor-pointer hover:bg-stone-50"
            title="Settings & Audio Options"
          >
            <Settings size={19} />
          </button>
        </div>
      </header>

      {/* SUB-RIBBON: Language Selector, Pet ID, Multiplayer (Compact Floating Game Pills) */}
      <div className="relative z-20 px-3 py-0.5 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar shrink-0 text-[11px]">
        {/* Unique Pet ID */}
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
          className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/80 backdrop-blur-xs border border-pink-200/80 shadow-2xs font-bubble text-[10px] cursor-pointer active:scale-95 transition-all text-pink-900"
          title="Tap to copy your Pet ID"
        >
          <span>🏷️</span>
          <span className="font-mono font-bold">
            {pet.id || 'HAM-8821'}
          </span>
          {petIdCopied && (
            <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded-full border border-emerald-200">
              Copied!
            </span>
          )}
        </button>

        {/* 3 Top Language Buttons: [BN] [HI] [EN] */}
        <div
          id="top-language-selector"
          className="shrink-0 flex items-center bg-white/85 backdrop-blur-xs rounded-lg border border-pink-200/80 p-0.5 shadow-2xs font-bubble text-[10px]"
          title="Select Talking Language"
        >
          {(['BN', 'HI', 'EN'] as TalkingLanguage[]).map((lang) => (
            <button
              key={lang}
              id={`btn-top-lang-${lang.toLowerCase()}`}
              onClick={() => handleLanguageSelect(lang)}
              className={`px-2 py-0.5 rounded font-bold text-[10px] transition-all cursor-pointer ${
                selectedLanguage === lang
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-pink-600 hover:bg-pink-50'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

        {/* Multiplayer Room Badge */}
        <button
          id="btn-open-multiplayer"
          onClick={onOpenMultiplayer}
          className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-lg border shadow-2xs transition-all active:scale-95 font-bubble text-[10px] font-bold cursor-pointer ${
            currentRoom
              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-pink-400'
              : 'bg-white/80 border-pink-200/80 text-pink-700 hover:bg-pink-50'
          }`}
          title="Play with a friend in Multiplayer"
        >
          <Users size={11} />
          <span>{currentRoom ? `#${currentRoom.code}` : 'Multiplayer'}</span>
          {currentRoom?.guest && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* MAIN PET ROOM INTERACTIVE 3D STAGE (Maximized Height like Talking Tom 2) */}
      <div
        id="pet-room-stage"
        className="relative flex-1 w-full min-h-[220px] flex flex-col items-center justify-center my-0.5 z-10 overflow-hidden"
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
          modelStyle={modelStyle}
        />

        {/* LEFT FLOATING BUTTONS: Shop & Closet & 3D Style (Talking Tom 2 Style) */}
        <div className="absolute top-2 left-2 z-20 flex flex-col gap-2 pointer-events-auto">
          {/* Shop / Boutique (Shopping Cart icon like Talking Tom 2) */}
          <button
            id="btn-quick-shop"
            onClick={onOpenShop}
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center border-2 border-white/80 shadow-md active:scale-95 transition-transform cursor-pointer"
            title="Open Boutique Shop"
          >
            <ShoppingCart size={20} />
          </button>

          {/* Closet / Wardrobe (Outfit / Chair icon like Talking Tom 2) */}
          <button
            id="btn-quick-closet"
            onClick={onOpenCustomization}
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center border-2 border-white/80 shadow-md active:scale-95 transition-transform cursor-pointer"
            title="Open Wardrobe & Closet"
          >
            <Shirt size={20} />
          </button>

          {/* Quick 3D Model Style Toggle (Real 3D GLB vs Mochi) */}
          <button
            id="btn-quick-model-style"
            onClick={() => {
              const nextStyle = modelStyle === 'textured' ? 'mochi' : 'textured';
              if (onToggleModelStyle) onToggleModelStyle(nextStyle);
            }}
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex flex-col items-center justify-center border-2 border-white/80 shadow-md active:scale-95 transition-transform cursor-pointer"
            title={`Current: ${modelStyle === 'textured' ? 'Real 3D GLB Model' : 'Stylized Mochi Model'}. Tap to switch!`}
          >
            <span className="text-base leading-none">{modelStyle === 'textured' ? '✨' : '🍡'}</span>
            <span className="text-[8px] font-black font-bubble leading-none mt-0.5">{modelStyle === 'textured' ? '3D' : 'Mochi'}</span>
          </button>
        </div>

        {/* RIGHT FLOATING BUTTONS: Dance, Sing, Water (Talking Tom 2 Room Activities) */}
        <div className="absolute top-2 right-2 z-20 flex flex-col gap-2 pointer-events-auto">
          {/* Dance Button */}
          <button
            id="btn-floating-dance"
            onClick={handleDanceClick}
            className={`w-11 h-11 rounded-2xl text-white flex items-center justify-center border-2 border-white/80 shadow-md active:scale-95 transition-transform cursor-pointer ${
              isDancing
                ? 'bg-gradient-to-br from-pink-500 to-rose-600 ring-2 ring-pink-300 animate-pulse'
                : 'bg-gradient-to-br from-fuchsia-500 to-purple-600'
            }`}
            title="Dance Routine"
          >
            <span className="text-xl">💃</span>
          </button>

          {/* Sing Button */}
          <button
            id="btn-floating-sing"
            onClick={handleSingClick}
            className={`w-11 h-11 rounded-2xl text-white flex items-center justify-center border-2 border-white/80 shadow-md active:scale-95 transition-transform cursor-pointer ${
              isSinging
                ? 'bg-gradient-to-br from-purple-500 to-indigo-600 ring-2 ring-purple-300 animate-pulse'
                : 'bg-gradient-to-br from-indigo-500 to-purple-600'
            }`}
            title="Sing Song"
          >
            <span className="text-xl">🎤</span>
          </button>

          {/* Fresh Water Button */}
          <button
            id="btn-floating-water"
            onClick={handleWaterClick}
            className={`w-11 h-11 rounded-2xl text-white flex items-center justify-center border-2 border-white/80 shadow-md active:scale-95 transition-transform cursor-pointer ${
              isDrinking
                ? 'bg-gradient-to-br from-sky-400 to-blue-600 ring-2 ring-sky-300'
                : 'bg-gradient-to-br from-sky-400 to-cyan-500'
            }`}
            title="Give Fresh Spring Water"
          >
            <span className="text-xl">💧</span>
          </button>
        </div>

        {/* Friend In-Room Presence Banner */}
        {friendPet && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full border border-pink-300 shadow-md pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-xs font-bubble font-bold text-pink-800 whitespace-nowrap">
              Friend <span className="text-pink-900 font-extrabold">{friendPet.petName}</span> is here! 💖
            </span>
            {activeGame && (
              <span className="text-[9px] bg-pink-100 text-pink-900 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {activeGame}
              </span>
            )}
          </div>
        )}

        {/* Floating Speech Bubble Above 3D Pet */}
        <div className="absolute top-2 left-0 right-0 pointer-events-none z-20 flex justify-center px-3">
          <div className="pointer-events-auto max-w-[320px] sm:max-w-[400px] w-full flex justify-center">
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

      {/* TALKING DOCK: REPEAT & ANSWER (Compact Talking Tom 2 Game Style Action Dock) */}
      <div className="relative z-20 px-3 pt-0.5 pb-1 flex items-center justify-center gap-1.5 shrink-0">
        {/* BUTTON 1 = REPEAT (Continuous Listening & High-Pitch Hamster Voice) */}
        <div className="flex-1 min-w-0 flex items-center gap-1">
          <button
            id="btn-action-repeat"
            onClick={handleDirectRepeat}
            className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl border-2 font-bubble font-extrabold text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer select-none h-11 ${
              isContinuousRepeat
                ? repeatPhase === 'speaking'
                  ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white border-white ring-2 ring-amber-300'
                  : 'bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white border-white ring-2 ring-pink-300 animate-pulse'
                : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-white/80 hover:from-pink-600 hover:to-rose-600'
            }`}
            title="Button 1: REPEAT - Tap once for Continuous Repeat Mode (auto listen & repeat)!"
          >
            {isContinuousRepeat ? (
              repeatPhase === 'speaking' ? (
                <Volume2 className="animate-bounce shrink-0" size={16} />
              ) : (
                <Mic className="animate-pulse shrink-0" size={16} />
              )
            ) : (
              <Mic size={16} className="shrink-0" />
            )}
            <span className="truncate">
              {isContinuousRepeat
                ? repeatPhase === 'speaking'
                  ? 'Speaking...'
                : 'Listening...'
                : 'Repeat'}
            </span>
            <span className="text-[9px] bg-black/20 text-white px-1.5 py-0.2 rounded-full font-mono font-bold shrink-0">
              {selectedLanguage}
            </span>
          </button>

          {/* Stop Control for Continuous Repeat Mode */}
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
                className="px-2 h-11 flex items-center justify-center gap-1 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bubble font-bold text-xs shadow-md border-2 border-white active:scale-90 transition-transform cursor-pointer select-none shrink-0"
                title="Stop Continuous Repeat Mode"
              >
                <Square size={10} fill="currentColor" />
                <span className="text-[10px] font-extrabold uppercase">Stop</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* BUTTON 2 = ANSWER (Gemini AI Smart Q&A) */}
        <div className="flex-1 min-w-0 flex items-center">
          <button
            id="btn-action-answer"
            onClick={handleDirectAnswer}
            className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl border-2 font-bubble font-extrabold text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer select-none h-11 ${
              (isDirectListening && directVoiceMode === 'answer') || isAnswerThinking
                ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white border-white ring-2 ring-purple-300 animate-pulse'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-white/80 hover:from-purple-700 hover:to-indigo-700'
            }`}
            title="Button 2: ANSWER - Tap to ask a question, hamster answers smartly in your language!"
          >
            {isDirectListening && directVoiceMode === 'answer' ? (
              <Mic className="animate-pulse shrink-0" size={16} />
            ) : isAnswerThinking ? (
              <Sparkles className="animate-spin shrink-0" size={16} />
            ) : (
              <Sparkles size={16} className="shrink-0 text-amber-300" />
            )}
            <span className="truncate">
              {isDirectListening && directVoiceMode === 'answer'
                ? 'Listening...'
                : isAnswerThinking
                ? 'Thinking...'
                : 'Ask AI'}
            </span>
            <span className="text-[9px] bg-black/20 text-white px-1.5 py-0.2 rounded-full font-mono font-bold shrink-0">
              {selectedLanguage}
            </span>
          </button>
        </div>

        {/* COMPACT KEYBOARD BUTTON (Quick Text Type for Repeat or Question) */}
        <button
          id="btn-quick-keyboard"
          onClick={handleChatClick}
          title="Type text or question instead of speaking"
          className="w-11 h-11 rounded-2xl bg-white/90 hover:bg-pink-50 text-purple-700 border-2 border-purple-200 shadow-md flex items-center justify-center cursor-pointer active:scale-95 transition-all shrink-0"
        >
          <Keyboard size={18} />
        </button>
      </div>

      {/* THE 5 ICONIC CIRCULAR BOTTOM STATUS & ACTION BUTTONS (EXACTLY LIKE TALKING TOM 2!) */}
      <footer className="relative z-20 px-3 pb-2 sm:pb-3 shrink-0">
        <div className="flex items-center justify-around px-2 py-2 bg-white/85 backdrop-blur-md rounded-3xl border-2 border-white/90 shadow-xl gap-1">
          {/* 1. SMILEY / HAPPINESS (PLAY & ENTERTAINMENT) */}
          <div className="relative flex flex-col items-center">
            {pet.stats.happiness < 30 && (
              <span className="absolute -top-5.5 z-30 font-bubble text-[10px] font-extrabold text-white bg-rose-500 px-1.5 py-0.2 rounded-full border border-white shadow-xs animate-bounce">
                {pet.stats.happiness}%
              </span>
            )}
            <button
              id="btn-dock-happy"
              onClick={onOpenPlay}
              className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-2 border-white shadow-lg active:scale-90 transition-all cursor-pointer group ${
                pet.stats.happiness < 30
                  ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white ring-2 ring-red-400'
                  : pet.stats.happiness < 60
                  ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white'
                  : 'bg-gradient-to-br from-lime-400 to-green-500 text-white'
              }`}
              title={`Happiness: ${pet.stats.happiness}% - Tap to Play`}
            >
              {/* Glossy top reflection */}
              <div className="absolute top-1 inset-x-2 h-3 rounded-t-full bg-white/30 pointer-events-none" />
              <Smile size={24} className="group-hover:scale-110 transition-transform drop-shadow-sm" strokeWidth={2.5} />
            </button>
          </div>

          {/* 2. FORK & SPOON / HUNGER (KITCHEN & MEALS) */}
          <div className="relative flex flex-col items-center">
            {pet.stats.hunger < 30 && (
              <span className="absolute -top-5.5 z-30 font-bubble text-[10px] font-extrabold text-white bg-rose-500 px-1.5 py-0.2 rounded-full border border-white shadow-xs animate-bounce">
                {pet.stats.hunger}%
              </span>
            )}
            <button
              id="btn-dock-food"
              onClick={() => {
                soundManager.playPop();
                setIsQuickFoodOpen((prev) => !prev);
              }}
              className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-2 border-white shadow-lg active:scale-90 transition-all cursor-pointer group ${
                isQuickFoodOpen
                  ? 'ring-4 ring-amber-400 scale-105'
                  : ''
              } ${
                pet.stats.hunger < 30
                  ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white ring-2 ring-red-400'
                  : pet.stats.hunger < 60
                  ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white'
                  : 'bg-gradient-to-br from-lime-400 to-green-500 text-white'
              }`}
              title={`Hunger: ${pet.stats.hunger}% - Tap to Feed`}
            >
              <div className="absolute top-1 inset-x-2 h-3 rounded-t-full bg-white/30 pointer-events-none" />
              <Utensils size={23} className="group-hover:scale-110 transition-transform drop-shadow-sm" strokeWidth={2.5} />
            </button>
          </div>

          {/* 3. BATH / TOILET / CLEANLINESS (BATHROOM) */}
          <div className="relative flex flex-col items-center">
            {pet.stats.cleanliness < 30 && (
              <span className="absolute -top-5.5 z-30 font-bubble text-[10px] font-extrabold text-white bg-rose-500 px-1.5 py-0.2 rounded-full border border-white shadow-xs animate-bounce">
                {pet.stats.cleanliness}%
              </span>
            )}
            <button
              id="btn-dock-clean"
              onClick={onOpenClean}
              className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-2 border-white shadow-lg active:scale-90 transition-all cursor-pointer group ${
                pet.stats.cleanliness < 30
                  ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white ring-2 ring-red-400'
                  : pet.stats.cleanliness < 60
                  ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white'
                  : 'bg-gradient-to-br from-lime-400 to-green-500 text-white'
              }`}
              title={`Cleanliness: ${pet.stats.cleanliness}% - Tap to Wash`}
            >
              <div className="absolute top-1 inset-x-2 h-3 rounded-t-full bg-white/30 pointer-events-none" />
              <Bath size={23} className="group-hover:scale-110 transition-transform drop-shadow-sm" strokeWidth={2.5} />
            </button>
          </div>

          {/* 4. MOON & STARS / ENERGY (BEDROOM & SLEEP) */}
          <div className="relative flex flex-col items-center">
            {pet.stats.energy < 30 && (
              <span className="absolute -top-5.5 z-30 font-bubble text-[10px] font-extrabold text-white bg-rose-500 px-1.5 py-0.2 rounded-full border border-white shadow-xs animate-bounce">
                {pet.stats.energy}%
              </span>
            )}
            <button
              id="btn-dock-sleep"
              onClick={onToggleSleep}
              className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-2 border-white shadow-lg active:scale-90 transition-all cursor-pointer group ${
                pet.isSleeping
                  ? 'bg-gradient-to-br from-indigo-800 to-slate-900 text-amber-300 ring-2 ring-indigo-400'
                  : pet.stats.energy < 30
                  ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white ring-2 ring-red-400'
                  : pet.stats.energy < 60
                  ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white'
                  : 'bg-gradient-to-br from-lime-400 to-green-500 text-white'
              }`}
              title={`Energy: ${pet.stats.energy}% - Tap to Sleep/Wake`}
            >
              <div className="absolute top-1 inset-x-2 h-3 rounded-t-full bg-white/30 pointer-events-none" />
              {pet.isSleeping ? (
                <Sun size={24} className="group-hover:scale-110 transition-transform drop-shadow-sm animate-spin-slow" strokeWidth={2.5} />
              ) : (
                <Moon size={23} className="group-hover:scale-110 transition-transform drop-shadow-sm" strokeWidth={2.5} />
              )}
            </button>
          </div>

          {/* 5. PLANE / GAMES / ACTIVITIES (TRAVEL & MINI-GAMES with Notification Badge!) */}
          <div className="relative flex flex-col items-center">
            <button
              id="btn-dock-games"
              onClick={onOpenMiniGames}
              className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-lime-400 to-emerald-500 text-white flex items-center justify-center border-2 border-white shadow-lg active:scale-90 transition-all cursor-pointer group"
              title="Mini-Games & Multiplayer Activities"
            >
              <div className="absolute top-1 inset-x-2 h-3 rounded-t-full bg-white/30 pointer-events-none" />
              <Plane size={24} className="group-hover:scale-110 transition-transform drop-shadow-sm" strokeWidth={2.5} />

              {/* Red Notification Badge (like '39' in Talking Tom 2 Screenshot 1!) */}
              <span className="absolute -top-1 -right-1 font-bubble text-[10px] font-extrabold text-white bg-rose-600 px-1.5 py-0.2 rounded-full border-2 border-white shadow-md">
                39
              </span>
            </button>
          </div>
        </div>
      </footer>

      {/* TOUCH-FRIENDLY 3-FOOD SELECTION BOTTOM SHEET */}
      <AnimatePresence>
        {isQuickFoodOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-stone-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.96 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              className="w-full max-w-md bg-white/98 backdrop-blur-md rounded-3xl border-2 border-amber-200 shadow-2xl p-4 flex flex-col gap-3"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🥣</span>
                  <div>
                    <h3 className="font-bubble font-bold text-stone-800 text-sm sm:text-base">
                      Feed {pet.name}
                    </h3>
                    <p className="text-[11px] text-stone-500 font-bubble">Select a meal for your pet</p>
                  </div>
                </div>
                <button
                  id="btn-close-quick-food"
                  onClick={() => setIsQuickFoodOpen(false)}
                  className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* 3 Food Cards */}
              <div className="grid grid-cols-3 gap-2">
                {THREE_FOODS.map((food) => {
                  const invCount = pet.inventory[food.id] || 0;
                  return (
                    <button
                      key={food.id}
                      id={`btn-feed-${food.id}`}
                      onClick={() => handleSelectFood(food)}
                      className={`flex flex-col items-center justify-between p-2.5 rounded-2xl border-2 ${food.borderColor} ${food.colorBg} active:scale-95 transition-all text-left shadow-xs cursor-pointer min-h-[114px]`}
                    >
                      <div className="w-full flex justify-between items-start">
                        <span className="text-2xl sm:text-3xl">{food.icon}</span>
                        <span className="text-[9px] font-bold font-bubble text-amber-900 bg-white/90 px-1.5 py-0.5 rounded-full border border-amber-200 shadow-xs">
                          {food.tag}
                        </span>
                      </div>
                      <div className="w-full mt-1.5">
                        <span className="block font-bubble font-bold text-stone-900 text-xs truncate">
                          {food.name}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-bold font-bubble text-emerald-700 mt-0.5">
                          <span>+{food.hungerBoost} 🍖</span>
                          <span className="text-amber-700">+{food.energyBoost} ⚡</span>
                        </div>
                      </div>
                      <div className="w-full flex justify-between items-center text-[10px] font-bubble font-bold text-stone-500 mt-1 pt-1 border-t border-stone-200/60">
                        <span>Owned: {invCount}</span>
                        <span className="text-amber-700 font-extrabold">Feed ➔</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer CTA to open full pantry */}
              <div className="flex justify-between items-center pt-2 border-t border-stone-100">
                <span className="text-[11px] text-stone-500 font-medium pl-1">
                  Want more variety?
                </span>
                <button
                  id="btn-open-full-pantry"
                  onClick={() => {
                    setIsQuickFoodOpen(false);
                    onOpenFeed();
                  }}
                  className="flex items-center gap-1 text-xs font-bubble font-bold text-amber-700 hover:text-amber-800 bg-amber-100/70 hover:bg-amber-100 px-3 py-1.5 rounded-full border border-amber-300/70 active:scale-95 transition-all cursor-pointer"
                >
                  <span>All Foods Pantry 🎒</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
