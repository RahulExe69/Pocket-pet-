import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mic, Volume2 } from 'lucide-react';
import { SupportedLanguage, LANGUAGE_CONFIGS } from '../utils/speechEngine';
import { soundManager } from '../utils/audio';

interface RepeatModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: SupportedLanguage;
  petName: string;
  onRepeat: (text: string) => void;
}

export const RepeatModal: React.FC<RepeatModalProps> = ({
  isOpen,
  onClose,
  lang,
  petName,
  onRepeat,
}) => {
  const [text, setText] = useState('');
  const config = LANGUAGE_CONFIGS[lang];

  const presets: Record<SupportedLanguage, string[]> = {
    BN: [
      'আমি একটা মিষ্টি গোলগাল হ্যামস্টার!',
      'সূর্যমুখী বীজ আমার খুব প্রিয়!',
      'চিঁ চিঁ চিঁ! আমি তোমাকে ভালোবাসি!',
      'আমার তুলতুলে গাল দুটো দেখো!',
    ],
    HI: [
      'मैं एक प्यारा गोलू-मोलू हैमस्टर हूँ!',
      'मुझे सूरजमुखी के बीज बहुत पसंद हैं!',
      'चीं चीं चीं! मैं आपसे बहुत प्यार करता हूँ!',
      'मेरे गाल कितने फूले हुए हैं!',
    ],
    EN: [
      'I am a cute chubby little hamster!',
      'Sunflower seeds are my favorite treat!',
      'Squeak squeak! I love you so much!',
      'Look at my round fluffy cheeks!',
    ],
  };

  const handleTrigger = (phraseToRepeat?: string) => {
    const val = (phraseToRepeat || text).trim();
    if (!val) return;
    soundManager.playPop();
    onRepeat(val);
    setText('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border-2 border-pink-200 p-4 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-pink-100">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎙️</span>
              <div>
                <h3 className="font-bubble font-bold text-stone-900 text-sm">
                  Repeat with {petName}
                </h3>
                <p className="text-[11px] text-pink-600 font-semibold">
                  High-pitch cute hamster voice (1.5x)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="py-3 space-y-3">
            <p className="text-xs text-stone-600 font-medium leading-relaxed">
              Type or pick what you want {petName} to say in cute squeaky voice:
            </p>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5">
              {(presets[lang] || presets.EN).map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTrigger(p)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-bubble font-bold bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 transition-all active:scale-95 text-left"
                >
                  "{p}"
                </button>
              ))}
            </div>

            {/* Input field */}
            <div className="relative">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTrigger();
                }}
                placeholder={config.placeholder}
                className="w-full py-2.5 pl-3 pr-10 bg-stone-50 rounded-2xl border border-pink-200 text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-pink-400/50"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-2xl border border-stone-200 text-stone-600 font-bubble text-xs font-bold hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleTrigger()}
              disabled={!text.trim()}
              className="flex-1 py-2 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 text-white font-bubble text-xs font-extrabold shadow-sm disabled:opacity-40 hover:brightness-105 active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Volume2 size={14} /> Repeat 🐹
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
