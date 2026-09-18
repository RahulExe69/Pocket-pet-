import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Send,
  X,
  Volume2,
  Sparkles,
  MessageCircle,
  RotateCcw,
  Trash2,
  Bot,
  User,
} from 'lucide-react';
import {
  TalkingLanguage,
  SUPPORTED_LANGUAGES,
  listenUserSpeech,
  getCuteHamsterAnswer,
  isSpeechRecognitionSupported,
} from '../utils/speech';
import { askGeminiHamster, ChatHistoryItem } from '../services/gemini';
import { soundManager } from '../utils/audio';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'hamster';
  text: string;
  timestamp: number;
  lang: TalkingLanguage;
}

export interface HamsterTalkModalProps {
  mode: 'repeat' | 'answer' | 'chat' | null;
  isOpen: boolean;
  onClose: () => void;
  petName: string;
  selectedLanguage: TalkingLanguage;
  onSelectLanguage: (lang: TalkingLanguage) => void;
  onHamsterSpeak: (text: string, lang: TalkingLanguage, userTextFirst?: string) => void;
}

const CHAT_STORAGE_KEY = 'pocketpet_chatgpt_history_v1';

export const HamsterTalkModal: React.FC<HamsterTalkModalProps> = ({
  mode,
  isOpen,
  onClose,
  petName,
  selectedLanguage,
  onSelectLanguage,
  onHamsterSpeak,
}) => {
  const [activeTab, setActiveTab] = useState<'repeat' | 'chat'>('repeat');

  // Tab 1 (Repeat) state
  const [isHolding, setIsHolding] = useState(false);
  const [repeatInterimText, setRepeatInterimText] = useState('');
  const [repeatManualText, setRepeatManualText] = useState('');
  const [repeatStatus, setRepeatStatus] = useState<string | null>(null);
  const [lastRepeatExchange, setLastRepeatExchange] = useState<{ user: string; pet: string } | null>(null);

  // Tab 2 (Chat GPT) state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignored
    }
    return [];
  });
  const [chatInputText, setChatInputText] = useState('');
  const [isChatListening, setIsChatListening] = useState(false);
  const [isChatTyping, setIsChatTyping] = useState(false);

  const speechControllerRef = useRef<{ stop: () => void; abort: () => void } | null>(null);
  const isPointerDownRef = useRef(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const langMeta = SUPPORTED_LANGUAGES[selectedLanguage];
  const speechSupported = isSpeechRecognitionSupported();

  // Sync active tab with opened mode
  useEffect(() => {
    if (mode === 'repeat') {
      setActiveTab('repeat');
    } else if (mode === 'answer' || mode === 'chat') {
      setActiveTab('chat');
    }
  }, [mode]);

  // Save chat history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatMessages));
    } catch {
      // Ignored
    }
  }, [chatMessages]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (activeTab === 'chat' && isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatTyping, activeTab, isOpen]);

  // Reset/stop listeners when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      stopAnyListening();
      setIsHolding(false);
      setRepeatInterimText('');
      setIsChatListening(false);
    } else {
      // Initialize greeting if chat is empty
      if (chatMessages.length === 0) {
        setChatMessages([
          {
            id: 'init-1',
            sender: 'hamster',
            text: langMeta.defaultGreeting,
            timestamp: Date.now(),
            lang: selectedLanguage,
          },
        ]);
      }
    }
    return () => {
      stopAnyListening();
    };
  }, [isOpen, selectedLanguage]);

  const stopAnyListening = () => {
    if (speechControllerRef.current) {
      speechControllerRef.current.abort();
      speechControllerRef.current = null;
    }
    setIsHolding(false);
    setIsChatListening(false);
  };

  // -------------------------------------------------------------
  // TAB 1: REPEAT (Voice Mimic with Big Mic Hold to Speak)
  // -------------------------------------------------------------
  const handleHoldStart = (e?: React.PointerEvent | React.TouchEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (isHolding) return;

    stopAnyListening();
    soundManager.playPop();
    setIsHolding(true);
    isPointerDownRef.current = true;
    setRepeatInterimText('');
    setRepeatStatus(
      selectedLanguage === 'BN'
        ? 'মাইকে ধরে রেখে কথা বলুন... ছাড়লে রিপিট করব! 🎙️'
        : selectedLanguage === 'HI'
        ? 'माइक दबाकर बोलिए... छोड़ते ही मैं दोहराऊँगा! 🎙️'
        : 'Hold and speak... Release to repeat! 🎙️'
    );

    const controller = listenUserSpeech(selectedLanguage, {
      onStart: () => {
        setIsHolding(true);
      },
      onInterim: (interim) => {
        setRepeatInterimText(interim);
      },
      onResult: (transcript) => {
        setIsHolding(false);
        setRepeatInterimText('');
        executeRepeat(transcript);
      },
      onError: (errMsg) => {
        setIsHolding(false);
        setRepeatStatus(errMsg);
      },
      onEnd: () => {
        setIsHolding(false);
      },
    });

    speechControllerRef.current = controller;
  };

  const handleHoldEnd = (e?: React.PointerEvent | React.TouchEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;

    if (speechControllerRef.current) {
      // Stop speech recognition gracefully to capture any buffered words
      speechControllerRef.current.stop();
      speechControllerRef.current = null;
    }

    setIsHolding(false);
  };

  const executeRepeat = (textToRepeat: string) => {
    const cleaned = textToRepeat.trim();
    if (!cleaned) return;

    setLastRepeatExchange({ user: cleaned, pet: cleaned });
        setRepeatStatus(
          selectedLanguage === 'BN'
            ? `"${cleaned}" কিউট গলায় রিপিট করছি! ✨`
            : selectedLanguage === 'HI'
            ? `"${cleaned}" प्यारी आवाज़ में दोहरा रहा हूँ! ✨`
            : `Repeating "${cleaned}" in cute 1.8x pitch! ✨`
        );
        soundManager.playSqueak();

        // Show user text in bubble first, then hamster repeats same in pitch 1.8 with mouth animation!
        onHamsterSpeak(cleaned, selectedLanguage, cleaned);
  };

  // -------------------------------------------------------------
  // TAB 2: CHAT GPT (AI Friend Chat with text, mic, and history)
  // -------------------------------------------------------------
  const handleChatVoiceToggle = () => {
    if (isChatListening) {
      if (speechControllerRef.current) {
        speechControllerRef.current.stop();
        speechControllerRef.current = null;
      }
      setIsChatListening(false);
      return;
    }

    stopAnyListening();
    soundManager.playPop();
    setIsChatListening(true);

    const controller = listenUserSpeech(selectedLanguage, {
      onStart: () => {
        setIsChatListening(true);
      },
      onInterim: (interim) => {
        setChatInputText(interim);
      },
      onResult: (transcript) => {
        setIsChatListening(false);
        setChatInputText('');
        executeChat(transcript);
      },
      onError: (err) => {
        setIsChatListening(false);
        console.warn('Chat voice error:', err);
      },
      onEnd: () => {
        setIsChatListening(false);
      },
    });

    speechControllerRef.current = controller;
  };

  const executeChat = async (questionText: string) => {
    const cleaned = questionText.trim();
    if (!cleaned) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: cleaned,
      timestamp: Date.now(),
      lang: selectedLanguage,
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInputText('');
    setIsChatTyping(true);
    soundManager.playPop();

    try {
      // Build context history for Gemini
      const history: ChatHistoryItem[] = chatMessages.slice(-8).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text,
      }));

      const answer = await askGeminiHamster(cleaned, history, selectedLanguage, petName);

      const hamsterMsg: ChatMessage = {
        id: `hamster-${Date.now()}`,
        sender: 'hamster',
        text: answer,
        timestamp: Date.now(),
        lang: selectedLanguage,
      };

      setIsChatTyping(false);
      setChatMessages((prev) => [...prev, hamsterMsg]);
      soundManager.playSqueak();

      // Speak answer with cute voice and show bubble above 3D hamster
      onHamsterSpeak(answer, selectedLanguage);
    } catch (err) {
      console.error('Chat error:', err);
      setIsChatTyping(false);
      const fallback = getCuteHamsterAnswer(cleaned, selectedLanguage, petName);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `hamster-${Date.now()}`,
          sender: 'hamster',
          text: fallback,
          timestamp: Date.now(),
          lang: selectedLanguage,
        },
      ]);
      onHamsterSpeak(fallback, selectedLanguage);
    }
  };

  const handleClearChat = () => {
    soundManager.playPop();
    const initial: ChatMessage = {
      id: `init-${Date.now()}`,
      sender: 'hamster',
      text: langMeta.defaultGreeting,
      timestamp: Date.now(),
      lang: selectedLanguage,
    };
    setChatMessages([initial]);
  };

  const quickPrompts: Record<TalkingLanguage, string[]> = {
    BN: [
      'কেমন আছো তুমি?',
      '১২ × ৫ কত হয়?',
      'আকাশ নীল কেন?',
      'একটা মজার কৌতুক বলো!',
      'তোমার খিদে পেয়েছে?',
    ],
    HI: [
      'तुम कैसे हो?',
      '१५ × ४ कितना होता है?',
      'आसमान नीला क्यों होता है?',
      'कोई प्यारा चुटकुला सुनाओ!',
      'क्या तुम्हें भूख लगी है?',
    ],
    EN: [
      'How are you feeling?',
      'What is 15 * 6?',
      'Why is the sky blue?',
      'Tell me a cute joke!',
      'Are you hungry for seeds?',
    ],
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border-2 border-pink-200 overflow-hidden flex flex-col h-[90vh] sm:h-[620px] max-h-[92vh]"
        >
          {/* Top Header with 2 Tabs & 3 Language Buttons */}
          <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white p-2.5 sm:p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              {/* 2 Primary Tabs: Tab 1 - REPEAT and Tab 2 - CHAT GPT */}
              <div className="flex items-center bg-black/20 p-1 rounded-2xl backdrop-blur-xs gap-1">
                {/* Tab 1: REPEAT */}
                <button
                  id="tab-btn-repeat"
                  onClick={() => {
                    stopAnyListening();
                    setActiveTab('repeat');
                    soundManager.playPop();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bubble font-bold text-xs transition-all cursor-pointer ${
                    activeTab === 'repeat'
                      ? 'bg-white text-pink-600 shadow-md scale-102'
                      : 'text-pink-100 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <RotateCcw size={14} />
                  <span>Button 1: REPEAT</span>
                </button>

                {/* Tab 2: ANSWER */}
                <button
                  id="tab-btn-chatgpt"
                  onClick={() => {
                    stopAnyListening();
                    setActiveTab('chat');
                    soundManager.playPop();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bubble font-bold text-xs transition-all cursor-pointer ${
                    activeTab === 'chat'
                      ? 'bg-white text-purple-700 shadow-md scale-102'
                      : 'text-pink-100 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Bot size={14} />
                  <span>Button 2: ANSWER</span>
                </button>
              </div>

              {/* Close Button */}
              <button
                id="btn-close-talking-modal"
                onClick={() => {
                  stopAnyListening();
                  onClose();
                }}
                className="p-1.5 rounded-full hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* 3 Language Switcher Buttons: [BN] [HI] [EN] */}
            <div className="flex items-center justify-between bg-white/15 px-2.5 py-1.5 rounded-xl backdrop-blur-xs">
              <span className="text-[11px] font-bubble font-medium flex items-center gap-1 text-pink-100">
                <Volume2 size={13} /> Language:
              </span>
              <div className="flex items-center gap-1">
                {(['BN', 'HI', 'EN'] as TalkingLanguage[]).map((lang) => (
                  <button
                    key={lang}
                    id={`btn-modal-lang-${lang.toLowerCase()}`}
                    onClick={() => {
                      onSelectLanguage(lang);
                      soundManager.playPop();
                    }}
                    className={`px-2 py-0.5 rounded-lg text-xs font-bubble font-bold transition-all cursor-pointer ${
                      selectedLanguage === lang
                        ? 'bg-white text-pink-600 shadow-xs scale-105'
                        : 'bg-black/15 text-pink-100 hover:bg-black/25'
                    }`}
                  >
                    [{lang}] {SUPPORTED_LANGUAGES[lang].nativeName}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* TAB 1: REPEAT VIEW (Big mic button Hold to Speak) */}
          {activeTab === 'repeat' && (
            <div className="flex-1 flex flex-col p-4 bg-gradient-to-b from-pink-50/40 via-white to-rose-50/30 overflow-y-auto">
              <div className="text-center mb-2">
                <h3 className="font-bubble font-bold text-stone-800 text-base">
                  Voice Mimic Studio
                </h3>
                <p className="text-xs text-stone-500 font-medium">
                  Hold the big mic, speak anything, and {petName} will repeat in a cute 1.8x high pitch!
                </p>
              </div>

              {/* Status or Error Banner */}
              {repeatStatus && (
                <div className="mb-3 p-2.5 rounded-2xl text-xs font-bubble text-center border bg-pink-100/70 border-pink-200 text-pink-900 flex items-center justify-center gap-1.5">
                  <Sparkles size={14} className="shrink-0 text-pink-600" />
                  <span>{repeatStatus}</span>
                </div>
              )}

              {/* Live transcript banner during hold */}
              {repeatInterimText && (
                <div className="mb-3 p-2 rounded-2xl bg-rose-500 text-white text-xs font-bubble text-center animate-pulse shadow-sm">
                  "{repeatInterimText}"
                </div>
              )}

              {/* CENTER: BIG MIC BUTTON HOLD TO SPEAK */}
              <div className="flex-1 flex flex-col items-center justify-center my-4 select-none">
                <div className="relative flex items-center justify-center">
                  {/* Expanding ripple pulse rings while holding */}
                  {isHolding && (
                    <>
                      <div className="absolute w-44 h-44 rounded-full bg-rose-400/30 animate-ping pointer-events-none" />
                      <div className="absolute w-52 h-52 rounded-full bg-pink-300/20 animate-pulse pointer-events-none" />
                    </>
                  )}

                  {/* Big Circular Microphone Button */}
                  <button
                    id="btn-hold-to-speak-mic"
                    onPointerDown={handleHoldStart}
                    onPointerUp={handleHoldEnd}
                    onPointerLeave={handleHoldEnd}
                    onPointerCancel={handleHoldEnd}
                    onTouchStart={handleHoldStart}
                    onTouchEnd={handleHoldEnd}
                    onMouseDown={handleHoldStart}
                    onMouseUp={handleHoldEnd}
                    className={`relative w-32 h-32 sm:w-36 sm:h-36 rounded-full flex flex-col items-center justify-center shadow-xl transition-all cursor-pointer select-none active:scale-95 ${
                      isHolding
                        ? 'bg-gradient-to-tr from-rose-600 via-pink-600 to-red-500 text-white scale-105 ring-8 ring-rose-300/60 shadow-2xl animate-pulse'
                        : 'bg-gradient-to-tr from-pink-500 via-rose-400 to-pink-500 text-white hover:scale-103 hover:shadow-2xl ring-4 ring-pink-200'
                    }`}
                  >
                    <Mic size={48} className={isHolding ? 'animate-bounce' : ''} />
                    <span className="mt-1 font-bubble font-bold text-xs sm:text-sm tracking-wide text-white drop-shadow-sm">
                      {isHolding ? 'LISTENING...' : 'HOLD TO SPEAK'}
                    </span>
                  </button>
                </div>

                <span className="mt-4 text-xs font-bubble font-bold text-pink-900 text-center">
                  {isHolding
                    ? 'Release button to repeat in cute voice 🎙️'
                    : 'Press & hold to speak (or tap on desktop)'}
                </span>
                <span className="text-[11px] text-stone-400 text-center mt-0.5">
                  Web Speech API • Pitch 1.6 • Animated 3D Mouth
                </span>
              </div>

              {/* Last Repeat Dialogue Preview */}
              {lastRepeatExchange && (
                <div className="mb-3 p-3 bg-white rounded-2xl border border-pink-200 shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-stone-500 font-bubble">
                      Last Repeat Exchange:
                    </span>
                    <button
                      onClick={() => executeRepeat(lastRepeatExchange.user)}
                      className="text-[11px] text-pink-600 font-bold font-bubble hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw size={12} /> Repeat Again
                    </button>
                  </div>
                  <p className="text-xs text-stone-700 italic">
                    You: "{lastRepeatExchange.user}"
                  </p>
                  <p className="text-xs text-pink-700 font-bubble font-bold flex items-center gap-1">
                    🐹 {petName}: "{lastRepeatExchange.pet}"
                  </p>
                </div>
              )}

              {/* Fallback Text Input Row */}
              <div className="pt-2 border-t border-pink-100 flex items-center gap-1.5">
                <input
                  id="input-repeat-manual"
                  type="text"
                  value={repeatManualText}
                  onChange={(e) => setRepeatManualText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && repeatManualText.trim()) {
                      executeRepeat(repeatManualText);
                      setRepeatManualText('');
                    }
                  }}
                  placeholder="Or type words to repeat in high pitch..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-400 font-medium text-stone-800"
                />
                <button
                  id="btn-repeat-manual-submit"
                  disabled={!repeatManualText.trim()}
                  onClick={() => {
                    executeRepeat(repeatManualText);
                    setRepeatManualText('');
                  }}
                  className={`p-2 rounded-xl text-xs font-bubble font-bold transition-all cursor-pointer ${
                    repeatManualText.trim()
                      ? 'bg-pink-600 text-white hover:bg-pink-700 active:scale-95'
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
                  title="Repeat typed text"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CHAT GPT VIEW (ChatGPT-like AI Friend with Chat History) */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col bg-stone-50/50 overflow-hidden">
              {/* Chat Sub-Header */}
              <div className="px-3 py-1.5 bg-white border-b border-stone-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                    🤖
                  </div>
                  <div>
                    <span className="font-bubble font-bold text-stone-800">
                      {petName} AI Friend
                    </span>
                    <span className="text-[10px] text-purple-600 block leading-tight font-medium">
                      Speaks cute answers in [{selectedLanguage}]
                    </span>
                  </div>
                </div>

                <button
                  id="btn-clear-chat-history"
                  onClick={handleClearChat}
                  className="text-[11px] text-stone-400 hover:text-rose-600 flex items-center gap-1 font-bubble px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Clear conversation history"
                >
                  <Trash2 size={12} /> Clear
                </button>
              </div>

              {/* Chat Message Thread (ChatGPT style) */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 ${
                      msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.sender === 'hamster' && (
                      <div className="w-7 h-7 rounded-full bg-pink-500 text-white flex items-center justify-center shrink-0 text-sm shadow-xs mt-0.5">
                        🐹
                      </div>
                    )}

                    <div
                      className={`max-w-[82%] px-3 py-2 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-stone-800 to-stone-900 text-white rounded-tr-xs font-medium'
                          : 'bg-white border border-pink-200 text-stone-800 rounded-tl-xs font-bubble font-medium shadow-xs'
                      }`}
                    >
                      <p>{msg.text}</p>
                      {msg.sender === 'hamster' && (
                        <div className="flex items-center justify-between mt-1 pt-1 border-t border-pink-100/60">
                          <span className="text-[9px] text-pink-500 font-mono">
                            [{msg.lang || selectedLanguage}]
                          </span>
                          <button
                            onClick={() => onHamsterSpeak(msg.text, msg.lang || selectedLanguage)}
                            className="text-[10px] text-pink-600 hover:text-pink-800 font-bold flex items-center gap-0.5 cursor-pointer"
                            title="Play cute voice"
                          >
                            <Volume2 size={11} /> Speak
                          </button>
                        </div>
                      )}
                    </div>

                    {msg.sender === 'user' && (
                      <div className="w-7 h-7 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center shrink-0 text-xs shadow-xs mt-0.5">
                        <User size={14} />
                      </div>
                    )}
                  </div>
                ))}

                {/* AI Thinking typing indicator */}
                {isChatTyping && (
                  <div className="flex items-center gap-2 justify-start">
                    <div className="w-7 h-7 rounded-full bg-pink-500 text-white flex items-center justify-center shrink-0 text-sm shadow-xs">
                      🐹
                    </div>
                    <div className="bg-white border border-pink-200 px-3 py-2 rounded-2xl rounded-tl-xs flex items-center gap-1.5 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" />
                      <span
                        className="w-2 h-2 rounded-full bg-pink-500 animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      />
                      <span
                        className="w-2 h-2 rounded-full bg-pink-500 animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      />
                    </div>
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Quick Prompts Chips */}
              <div className="px-3 py-1.5 bg-white/80 border-t border-stone-200/80 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
                <span className="text-[10px] font-bubble font-bold text-stone-400 shrink-0">
                  Ideas:
                </span>
                {quickPrompts[selectedLanguage].map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => executeChat(prompt)}
                    className="px-2.5 py-1 rounded-full bg-pink-50 hover:bg-pink-100 border border-pink-200 text-pink-800 text-[11px] font-bubble whitespace-nowrap active:scale-95 transition-all cursor-pointer shrink-0"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Bottom Input Area: Text input + Mic + Send */}
              <div className="p-2.5 bg-white border-t border-stone-200">
                <div className="flex items-center gap-1.5">
                  {/* Mic Button to ask questions via voice */}
                  <button
                    id="btn-chat-mic-voice"
                    onClick={handleChatVoiceToggle}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer shrink-0 ${
                      isChatListening
                        ? 'bg-rose-500 text-white border-rose-600 shadow-md animate-pulse'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-300 active:scale-95'
                    }`}
                    title={isChatListening ? 'Listening... Tap to send' : 'Ask question by voice'}
                  >
                    {isChatListening ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>

                  {/* Text Input Box */}
                  <input
                    id="input-chatgpt-text"
                    type="text"
                    value={chatInputText}
                    onChange={(e) => setChatInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        executeChat(chatInputText);
                      }
                    }}
                    placeholder={
                      isChatListening
                        ? 'Listening to your voice question...'
                        : langMeta.chatPlaceholder
                    }
                    className="flex-1 px-3 py-2 text-xs rounded-2xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium text-stone-800"
                  />

                  {/* Send Button */}
                  <button
                    id="btn-chatgpt-send"
                    disabled={!chatInputText.trim()}
                    onClick={() => executeChat(chatInputText)}
                    className={`p-2.5 rounded-2xl font-bubble font-bold text-xs flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                      chatInputText.trim()
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 active:scale-95 shadow-xs'
                        : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    }`}
                    title="Send Question"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
