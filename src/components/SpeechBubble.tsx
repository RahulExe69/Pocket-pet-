import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PetMood } from '../types';
import { MOOD_QUOTES } from '../data/initialData';

interface SpeechBubbleProps {
  mood: PetMood;
  customMessage?: string | null;
  onBubbleClick?: () => void;
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  mood,
  customMessage,
  onBubbleClick,
}) => {
  const [currentText, setCurrentText] = useState<string>('');

  useEffect(() => {
    if (customMessage) {
      setCurrentText(customMessage);
      return;
    }

    const quotes = MOOD_QUOTES[mood] || MOOD_QUOTES.happy;
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setCurrentText(randomQuote);

    // Periodically cycle through quotes of current mood
    const interval = setInterval(() => {
      const freshQuotes = MOOD_QUOTES[mood] || MOOD_QUOTES.happy;
      const nextQuote = freshQuotes[Math.floor(Math.random() * freshQuotes.length)];
      setCurrentText(nextQuote);
    }, 7000);

    return () => clearInterval(interval);
  }, [mood, customMessage]);

  return (
    <div id="pet-speech-bubble-wrapper" className="relative flex justify-center items-center my-2 h-14">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentText}
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -8 }}
          transition={{ type: 'spring', stiffness: 350, damping: 24 }}
          onClick={onBubbleClick}
          className="relative bg-white/95 backdrop-blur-sm border-2 border-stone-200/80 shadow-md px-4 py-2 rounded-2xl text-stone-800 text-sm font-semibold tracking-wide flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
        >
          <span>{currentText}</span>

          {/* Speech bubble pointy arrow at bottom */}
          <div
            className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[8px] border-t-white"
          />
          <div
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[9px] border-t-stone-200/80 -z-10"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
