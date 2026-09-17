import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, X } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface CleaningToolProps {
  onCleanProgress: (progress: number) => void;
  onFinishCleaning: () => void;
  onClose: () => void;
}

export const CleaningTool: React.FC<CleaningToolProps> = ({
  onCleanProgress,
  onFinishCleaning,
  onClose,
}) => {
  const [scrubCount, setScrubCount] = useState<number>(0);
  const targetScrubs = 8;
  const [bubbles, setBubbles] = useState<{ id: number; x: number; y: number }[]>([]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    soundManager.playClean();

    const newBubble = { id: Date.now() + Math.random(), x, y };
    setBubbles((prev) => [...prev.slice(-15), newBubble]);

    const newCount = scrubCount + 1;
    setScrubCount(newCount);
    onCleanProgress(Math.min(100, Math.round((newCount / targetScrubs) * 100)));

    if (newCount >= targetScrubs) {
      soundManager.playLevelUp();
      setTimeout(() => {
        onFinishCleaning();
      }, 500);
    }
  };

  return (
    <div
      id="cleaning-tool-overlay"
      className="absolute inset-0 z-30 flex flex-col justify-between p-4 bg-sky-900/30 backdrop-blur-[2px] rounded-3xl"
    >
      {/* Top instruction header */}
      <div className="flex items-center justify-between bg-white/90 shadow-md px-4 py-2.5 rounded-2xl border border-sky-200">
        <div className="flex items-center gap-2 text-sky-700">
          <div className="text-xl">🫧</div>
          <div>
            <div className="font-bubble text-sm font-bold">Bath Time!</div>
            <div className="text-xs text-stone-600">Tap or scrub your pet with soap</div>
          </div>
        </div>

        <button
          id="btn-close-cleaning"
          onClick={onClose}
          className="p-1.5 rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200"
        >
          <X size={18} />
        </button>
      </div>

      {/* Interactive Scrub Area */}
      <div
        id="cleaning-scrub-area"
        onPointerDown={handlePointerDown}
        className="flex-1 my-3 flex items-center justify-center relative cursor-crosshair touch-none"
      >
        {/* Render interactive soap bubbles */}
        {bubbles.map((b) => (
          <motion.div
            key={b.id}
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: [1, 1.4, 1.2], opacity: [0.8, 1, 0.7] }}
            className="absolute pointer-events-none rounded-full border-2 border-white/90 bg-sky-200/50 shadow-inner flex items-center justify-center text-xs"
            style={{ left: b.x - 20, top: b.y - 20, width: 42, height: 42 }}
          >
            🫧
          </motion.div>
        ))}

        {/* Floating guide message */}
        <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-sky-200 text-sky-800 text-xs font-bold pointer-events-none shadow-sm">
          Scrub to wash ({scrubCount}/{targetScrubs})
        </div>
      </div>

      {/* Bottom Progress Bar & Rinse Button */}
      <div className="bg-white/90 p-3 rounded-2xl shadow-md border border-sky-200 flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs font-bold text-sky-800">
          <span>Cleanliness Progress</span>
          <span>{Math.round((scrubCount / targetScrubs) * 100)}%</span>
        </div>

        <div className="w-full h-3.5 bg-sky-100 rounded-full overflow-hidden p-0.5 border border-sky-200">
          <motion.div
            className="h-full bg-gradient-to-r from-sky-400 to-teal-400 rounded-full"
            style={{ width: `${Math.min(100, (scrubCount / targetScrubs) * 100)}%` }}
            animate={{ width: `${Math.min(100, (scrubCount / targetScrubs) * 100)}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          />
        </div>

        {scrubCount >= targetScrubs && (
          <motion.button
            id="btn-rinse-sparkle"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={onFinishCleaning}
            className="w-full py-2.5 bg-gradient-to-r from-teal-400 to-sky-500 text-white font-bubble font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-1.5"
          >
            <Sparkles size={16} /> Rinse & Sparkle!
          </motion.button>
        )}
      </div>
    </div>
  );
};
