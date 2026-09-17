import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Play } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface SplashScreenProps {
  onStartGame: () => void;
  hasExistingPet: boolean;
  petName?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onStartGame,
  hasExistingPet,
  petName,
}) => {
  const handleStart = () => {
    soundManager.playPop();
    onStartGame();
  };

  return (
    <div id="splash-screen" className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-gradient-to-b from-amber-200 via-orange-100 to-pink-200 select-none overflow-hidden">
      {/* Background cute decorative floating bubbles */}
      <div className="absolute top-10 left-8 text-4xl opacity-40 animate-float-slow">🌸</div>
      <div className="absolute top-24 right-10 text-3xl opacity-40 animate-float-slow" style={{ animationDelay: '1s' }}>✨</div>
      <div className="absolute bottom-24 left-12 text-3xl opacity-40 animate-float-slow" style={{ animationDelay: '1.5s' }}>🌱</div>
      <div className="absolute bottom-32 right-8 text-4xl opacity-40 animate-float-slow" style={{ animationDelay: '2s' }}>🍎</div>

      {/* Top Tagline */}
      <div className="pt-8 text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/80 border border-amber-300 text-amber-900 text-xs font-bubble font-bold shadow-xs"
        >
          <Sparkles size={14} className="text-amber-500" /> Your Pocket Virtual Companion
        </motion.div>
      </div>

      {/* Center Mascot & Big Title */}
      <div className="flex flex-col items-center z-10">
        {/* Animated Pet Visual */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="relative mb-3"
        >
          <div className="w-44 h-44 rounded-[36px] bg-white border-4 border-amber-300 shadow-2xl flex items-center justify-center relative overflow-hidden p-1 bg-gradient-to-b from-amber-50 to-white">
            <img
              src="/pocket_pet_icon.png"
              alt="Pocket Pet Official Icon"
              className="w-full h-full object-cover rounded-[28px]"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-2xl shadow-md border-2 border-white text-lg">
            🌱
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="font-bubble text-4xl sm:text-5xl font-extrabold text-stone-800 tracking-tight drop-shadow-xs"
        >
          Pocket <span className="text-amber-600">Pet</span>
        </motion.h1>

        <p className="text-xs text-stone-600 font-medium max-w-xs text-center mt-1">
          Adopt, feed, play mini-games, and cuddle your very own digital companion!
        </p>
      </div>

      {/* Start Button & Footer */}
      <div className="w-full max-w-xs flex flex-col items-center gap-3 z-10 pb-6">
        <motion.button
          id="btn-splash-start"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleStart}
          className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white font-bubble text-lg font-bold rounded-2xl shadow-xl border-2 border-amber-300 flex items-center justify-center gap-2"
        >
          <Play size={20} fill="currentColor" />
          {hasExistingPet ? `Continue with ${petName || 'Pet'}` : 'Start Playing'}
        </motion.button>

        <div className="text-[11px] text-stone-500 font-semibold flex items-center gap-1">
          <span>🐾 No sign-up required • 100% Free & Offline-Ready</span>
        </div>
      </div>
    </div>
  );
};
