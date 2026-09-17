import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface TutorialOverlayProps {
  isOpen: boolean;
  onComplete: () => void;
  petName: string;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  isOpen,
  onComplete,
  petName,
}) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: `Welcome to Pocket Pet!`,
      subtitle: `Meet your new best friend, ${petName}!`,
      icon: '🐾',
      desc: `${petName} is eager to play, eat delicious snacks, and cozy up with you. Tap them directly in the room anytime to give loving pats!`,
    },
    {
      title: 'Vitals & Care Meters',
      subtitle: 'Keep your pet healthy and smiling',
      icon: '📊',
      desc: 'Watch the 4 status meters at the top: Hunger 🍖, Happiness ❤️, Energy ⚡, and Cleanliness 🧼. When they get low, your pet will ask for attention!',
    },
    {
      title: 'Feed & Grooming',
      subtitle: 'Yummy meals and warm bubble baths',
      icon: '🍎',
      desc: 'Tap 🍎 Feed to open your pantry and serve nutritious treats. When dirt smudges appear, tap 🛁 Clean to lather soothing soap bubbles and rinse them off!',
    },
    {
      title: 'Mini-Games & Arcade',
      subtitle: 'Play together to earn shiny coins',
      icon: '🎮',
      desc: 'Tap 🎾 Play to challenge Food Catch, Memory Match, Bubble Pop, and Pet Runner. Earn gold coins and level up your pet!',
    },
    {
      title: 'Boutique & Wardrobe',
      subtitle: 'Style hats, glasses, and cozy beds',
      icon: '✨',
      desc: 'Visit the Shop and Closet to equip hats (like the lucky green sprout!), bows, cute outfits, comfy beds, and vibrant wallpapers. Enjoy your journey together!',
    },
  ];

  const handleNext = () => {
    soundManager.playPop();
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      soundManager.playLevelUp();
      onComplete();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="tutorial-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border-2 border-amber-300 flex flex-col items-center text-center relative"
          >
            {/* Step indicator dots */}
            <div className="flex gap-1.5 mb-4">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all ${
                    i === step ? 'w-6 bg-amber-500' : 'w-2 bg-stone-200'
                  }`}
                />
              ))}
            </div>

            {/* Icon Banner */}
            <div className="w-18 h-18 rounded-3xl bg-amber-100 border-2 border-amber-200 flex items-center justify-center text-4xl shadow-inner mb-3">
              {steps[step].icon}
            </div>

            <h3 className="font-bubble text-xl font-bold text-stone-800">
              {steps[step].title}
            </h3>

            <p className="text-xs font-bold text-amber-700 mt-0.5">
              {steps[step].subtitle}
            </p>

            <p className="text-xs text-stone-600 leading-relaxed mt-2.5 bg-amber-50/70 p-3 rounded-2xl border border-amber-100">
              {steps[step].desc}
            </p>

            {/* Next / Finish Button */}
            <div className="w-full mt-5 flex gap-2">
              {step < steps.length - 1 && (
                <button
                  id="btn-skip-tutorial"
                  onClick={() => {
                    soundManager.playClick();
                    onComplete();
                  }}
                  className="px-4 py-2.5 rounded-xl text-stone-400 hover:text-stone-600 font-bubble text-xs font-bold"
                >
                  Skip
                </button>
              )}

              <button
                id="btn-next-tutorial"
                onClick={handleNext}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bubble text-sm font-bold rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                {step === steps.length - 1 ? (
                  <>
                    <Sparkles size={16} /> Let's Play!
                  </>
                ) : (
                  <>
                    Next <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
