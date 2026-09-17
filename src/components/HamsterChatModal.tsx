import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Mic, MicOff, Sparkles, Volume2 } from 'lucide-react';
import { SupportedLanguage, LANGUAGE_CONFIGS, startVoiceRecognition, stopVoiceRecognition, isSpeechRecognitionSupported } from '../utils/speechEngine';
import { SUGGESTED_QUESTIONS, getHamsterResponse, ChatMessage } from '../utils/hamsterChatEngine';
import { soundManager } from '../utils/audio';

interface HamsterChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: SupportedLanguage;
  petName: string;
  onHamsterSpeak: (text: string) => void;
  isHamsterSpeaking: boolean;
}

export const HamsterChatModal: React.FC<HamsterChatModalProps> = ({
  isOpen,
  onClose,
  lang,
  petName,
  onHamsterSpeak,
  isHamsterSpeaking,
}) => {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'hamster',
      text:
        lang === 'BN'
          ? `চিঁ চিঁ! হ্যালো! আমি ${petName}! আমাকে যেকোনো প্রশ্ন করো, আমি মিষ্টি করে উত্তর দেব! 🐹💖`
          : lang === 'HI'
          ? `चीं चीं! नमस्ते! मैं ${petName} हूँ! मुझसे कुछ भी पूछो, मैं प्यारा सा जवाब दूंगा! 🐹💖`
          : `Squeak squeak! Hi there! I'm ${petName}! Ask me anything, and I will answer cutely! 🐹💖`,
      timestamp: Date.now(),
    },
  ]);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const config = LANGUAGE_CONFIGS[lang];
  const suggestions = SUGGESTED_QUESTIONS[lang] || SUGGESTED_QUESTIONS.EN;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Update greeting when language changes if only welcome message
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === 'welcome') {
      setMessages([
        {
          id: 'welcome',
          sender: 'hamster',
          text:
            lang === 'BN'
              ? `চিঁ চিঁ! হ্যালো! আমি ${petName}! আমাকে যেকোনো প্রশ্ন করো, আমি মিষ্টি করে উত্তর দেব! 🐹💖`
              : lang === 'HI'
              ? `चीं चीं! नमस्ते! मैं ${petName} हूँ! मुझसे कुछ भी पूछो, मैं प्यारा सा जवाब दूंगा! 🐹💖`
              : `Squeak squeak! Hi there! I'm ${petName}! Ask me anything, and I will answer cutely! 🐹💖`,
          timestamp: Date.now(),
        },
      ]);
    }
  }, [lang, petName]);

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    soundManager.playPop();
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setSpeechError(null);

    // Hamster answers
    setTimeout(() => {
      const reply = getHamsterResponse(query, lang, petName);
      const hamsterMsg: ChatMessage = {
        id: `hamster-${Date.now()}`,
        sender: 'hamster',
        text: reply,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, hamsterMsg]);

      // Speak in cute voice with mouth animation and text bubble
      onHamsterSpeak(reply);
    }, 450);
  };

  const toggleMicListening = () => {
    if (!isSpeechRecognitionSupported()) {
      setSpeechError(
        lang === 'BN'
          ? 'এই ব্রাউজারে ভয়েস সাপোর্ট নেই, দয়া করে টাইপ করুন।'
          : lang === 'HI'
          ? 'इस ब्राउज़र में वॉइस सपोर्ट नहीं है, कृपया टाइप करें।'
          : 'Speech recognition not supported in this browser. Please type.'
      );
      return;
    }

    if (isListening) {
      stopVoiceRecognition();
      setIsListening(false);
      return;
    }

    setSpeechError(null);
    setIsListening(true);
    soundManager.playPop();

    startVoiceRecognition({
      lang,
      onResult: (transcript) => {
        setIsListening(false);
        setInputText(transcript);
        handleSendMessage(transcript);
      },
      onError: (err) => {
        setIsListening(false);
        if (err?.error === 'not-allowed') {
          setSpeechError(
            lang === 'BN'
              ? 'মাইক্রোফোনের অনুমতি দিন।'
              : lang === 'HI'
              ? 'माइक्रोफ़ोन की अनुमति दें।'
              : 'Microphone permission needed.'
          );
        } else if (err?.error !== 'no-speech') {
          setSpeechError(
            lang === 'BN'
              ? 'কথা বুঝতে পারিনি, আবার বলুন।'
              : lang === 'HI'
              ? 'आवाज़ समझ नहीं आई, फिर से कहें।'
              : 'Could not recognize speech, try again.'
          );
        }
      },
      onEnd: () => {
        setIsListening(false);
      },
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs">
        <motion.div
          initial={{ y: '100%', opacity: 0.8 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border-2 border-amber-200/80 flex flex-col max-h-[82vh] sm:max-h-[600px] overflow-hidden"
        >
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-amber-100/90 via-pink-100/90 to-amber-100/90 border-b border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white border border-amber-300 shadow-xs flex items-center justify-center text-xl overflow-hidden shrink-0">
                <img
                  src="/pocket_pet_icon.png"
                  alt={petName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bubble font-bold text-stone-900 text-sm">
                    Chat with {petName} 🐹
                  </h3>
                  <span className="px-1.5 py-0.5 rounded-md bg-pink-500 text-white font-bubble text-[10px] font-extrabold">
                    {lang}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 font-medium">
                  {isHamsterSpeaking ? (
                    <span className="text-pink-600 font-bold flex items-center gap-1 animate-pulse">
                      <Volume2 size={12} /> {config.speakingText}
                    </span>
                  ) : (
                    config.chatPrompt
                  )}
                </p>
              </div>
            </div>

            <button
              id="btn-close-chat-modal"
              onClick={() => {
                stopVoiceRecognition();
                setIsListening(false);
                onClose();
              }}
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-white/80 active:scale-95 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 bg-stone-50/50 min-h-[220px]">
            {messages.map((msg) => {
              const isHam = msg.sender === 'hamster';
              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-1.5 ${isHam ? 'justify-start' : 'justify-end'}`}
                >
                  {isHam && (
                    <div className="w-6 h-6 rounded-full bg-amber-200 border border-amber-300 overflow-hidden shrink-0 mb-1 flex items-center justify-center text-xs">
                      🐹
                    </div>
                  )}

                  <div
                    className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed shadow-xs ${
                      isHam
                        ? 'bg-white text-stone-800 border border-amber-200/80 rounded-bl-xs'
                        : 'bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-br-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions pills */}
          <div className="px-3 pt-2 pb-1 border-t border-stone-100 bg-white flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-bubble font-bold text-amber-800 shrink-0 flex items-center gap-1">
              <Sparkles size={12} className="text-amber-500" /> Ask:
            </span>
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(sug)}
                className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bubble font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 active:scale-95 transition-all"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Voice Listening indicator banner */}
          {isListening && (
            <div className="px-3 py-1.5 bg-pink-50 border-t border-pink-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bubble font-bold text-pink-700">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping" />
                <span>{config.listeningText}</span>
              </div>
              <button
                onClick={toggleMicListening}
                className="text-[11px] font-bold text-pink-600 underline hover:text-pink-800"
              >
                Cancel
              </button>
            </div>
          )}

          {speechError && (
            <div className="px-3 py-1 bg-rose-50 text-rose-600 text-[11px] font-medium border-t border-rose-200">
              {speechError}
            </div>
          )}

          {/* Input Toolbar */}
          <div className="p-2.5 bg-white border-t border-stone-200 flex items-center gap-1.5">
            {/* Mic button for speaking question directly */}
            <button
              id="btn-chat-modal-mic"
              onClick={toggleMicListening}
              className={`p-2.5 rounded-2xl border transition-all active:scale-95 ${
                isListening
                  ? 'bg-rose-500 border-rose-600 text-white animate-pulse shadow-md'
                  : 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-700'
              }`}
              title="Speak your question"
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* Text input */}
            <input
              id="chat-modal-text-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              placeholder={config.placeholder}
              className="flex-1 py-2 px-3 bg-stone-100/90 rounded-2xl border border-stone-200 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-pink-400/50"
            />

            {/* Send button */}
            <button
              id="btn-chat-modal-send"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              className="p-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-xs disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-105 active:scale-95 transition-all"
            >
              <Send size={18} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
