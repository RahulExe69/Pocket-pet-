import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Sparkles, Heart, ChevronLeft, Check } from 'lucide-react';
import { PetType } from '../types';
import { PET_CONFIGS } from '../data/initialData';
import { PetPreview3D } from './3d/PetPreview3D';
import { soundManager } from '../utils/audio';

interface PetSelectionScreenProps {
  onAdoptPet: (type: PetType, name: string) => void;
}

interface PetOptionMeta {
  type: PetType;
  icon: string;
  name: string;
  tagline: string;
  trait: string;
  personality: string;
}

const PET_OPTIONS: PetOptionMeta[] = [
  {
    type: 'hamster',
    icon: '🐹',
    name: 'Hamster',
    tagline: 'Chubby & curious seed lover',
    trait: 'Adventurous',
    personality: 'Loves sunflower seeds, running on wheels, and cozy beanies!',
  },
  {
    type: 'cat',
    icon: '🐱',
    name: 'Kitten',
    tagline: 'Gentle purrs & twitchy ears',
    trait: 'Playful',
    personality: 'Graceful, affectionate, and loves yarn balls and fish treats.',
  },
  {
    type: 'dog',
    icon: '🐶',
    name: 'Puppy',
    tagline: 'Loyal & energetic companion',
    trait: 'Friendly',
    personality: 'Always thrilled to fetch balls, learn tricks, and give warm cuddles.',
  },
  {
    type: 'bunny',
    icon: '🐰',
    name: 'Bunny',
    tagline: 'Joyful hops & velvety ears',
    trait: 'Gentle',
    personality: 'Enjoys fresh garden carrots, soft bedding, and acrobatic jumps.',
  },
  {
    type: 'panda',
    icon: '🐼',
    name: 'Panda',
    tagline: 'Cuddly & calm bamboo fan',
    trait: 'Relaxed',
    personality: 'Super soft, takes cozy afternoon naps, and loves sweet treats.',
  },
  {
    type: 'chinchilla',
    icon: '🐭',
    name: 'Chinchilla',
    tagline: 'Ultra-soft fur & high hops',
    trait: 'Acrobatic',
    personality: 'Silky soft, acrobatic leaps, and loves dust baths and fresh treats.',
  },
  {
    type: 'ferret',
    icon: '🦡',
    name: 'Ferret',
    tagline: 'Playful & curious burrower',
    trait: 'Curious',
    personality: 'Energetic explorer who loves tunnels, secret hideouts, and shiny objects.',
  },
  {
    type: 'hedgehog',
    icon: '🦔',
    name: 'Hedgehog',
    tagline: 'Tiny trotter & soft snuggler',
    trait: 'Cute & Shy',
    personality: 'Curls into a gentle ball when sleepy and loves apple slices and quiet corners.',
  },
  {
    type: 'gerbil',
    icon: '🐹',
    name: 'Gerbil',
    tagline: 'Speedy & cheerful explorer',
    trait: 'Energetic',
    personality: 'Always busy burrowing, leaping, and sharing crunchy seeds with friends.',
  },
];

const SUGGESTED_NAMES: Record<PetType, string[]> = {
  hamster: ['Hammy', 'Mochi', 'Pip', 'Peanut', 'Boba', 'Nugget'],
  cat: ['Milo', 'Luna', 'Cleo', 'Oreo', 'Oliver', 'Bella'],
  dog: ['Boba', 'Buddy', 'Charlie', 'Cooper', 'Teddy', 'Coco'],
  bunny: ['Snowy', 'Clover', 'Bunbun', 'Daisy', 'Marshmallow', 'Hazel'],
  panda: ['Bao', 'Bambam', 'Pebble', 'Dumpling', 'Panda', 'Mochi'],
  chinchilla: ['Puff', 'Dusty', 'Chilla', 'Silver', 'Pepper', 'Fluff'],
  ferret: ['Bandit', 'Noodle', 'Ziggy', 'Rascal', 'Weasel', 'Gizmo'],
  hedgehog: ['Spike', 'Sonic', 'Needles', 'Hazel', 'Prickles', 'Pip'],
  gerbil: ['Pip', 'Sandy', 'Cheerio', 'Twitch', 'Nibbles', 'Speedy'],
};

export const PetSelectionScreen: React.FC<PetSelectionScreenProps> = ({
  onAdoptPet,
}) => {
  const [selectedType, setSelectedType] = useState<PetType>('hamster');
  const [petName, setPetName] = useState<string>(PET_CONFIGS['hamster'].name);
  const [step, setStep] = useState<'choose' | 'name'>('choose');

  const handleSelectType = (type: PetType) => {
    soundManager.playPop();
    setSelectedType(type);
    setPetName(PET_CONFIGS[type].name);
  };

  const handleProceedToName = () => {
    soundManager.playPop();
    setStep('name');
  };

  const handleBackToChoose = () => {
    soundManager.playPop();
    setStep('choose');
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = petName.trim();
    if (!finalName) return;
    soundManager.playLevelUp();
    onAdoptPet(selectedType, finalName);
  };

  const currentOption = PET_OPTIONS.find((o) => o.type === selectedType) || PET_OPTIONS[0];
  const currentConfig = PET_CONFIGS[selectedType];

  return (
    <div
      id="pet-selection-screen"
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-5 bg-gradient-to-b from-amber-100 via-orange-50 to-pink-100 overflow-y-auto select-none"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-lg bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-xl border border-amber-200/80 flex flex-col items-center text-center my-auto"
      >
        {/* Progress Header */}
        <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐾</span>
            <div className="text-left">
              <h2 className="font-bubble text-base sm:text-lg font-bold text-stone-800 leading-tight">
                {step === 'choose' ? 'Choose Your Pet' : 'Name Your Pet'}
              </h2>
              <p className="text-[11px] text-stone-500 font-medium">
                {step === 'choose' ? 'Step 1 of 2 • Pick a companion' : 'Step 2 of 2 • Personalize nickname'}
              </p>
            </div>
          </div>

          {/* Step Pill */}
          <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 text-xs font-bubble font-bold text-amber-800">
            <span
              className={`w-2 h-2 rounded-full ${
                step === 'choose' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
              }`}
            />
            <span>{step === 'choose' ? '1 / 2' : '2 / 2'}</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'choose' ? (
            <motion.div
              key="step-choose"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full flex flex-col items-center"
            >
              {/* 3D Pet Showcase Stage */}
              <div className="w-full my-2 flex flex-col items-center">
                <div className="w-44 h-44 sm:w-48 sm:h-48 rounded-3xl bg-gradient-to-b from-amber-50 via-white to-pink-50 border-2 border-amber-200/80 shadow-inner flex items-center justify-center relative overflow-hidden">
                  <PetPreview3D type={selectedType} />

                  {/* Species Badge */}
                  <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-xs border border-amber-200/80 px-2.5 py-0.5 rounded-full text-[11px] font-bubble font-bold text-amber-900 shadow-xs flex items-center gap-1 z-10">
                    <Sparkles size={11} className="text-amber-500" />
                    <span>{currentConfig.species}</span>
                  </div>

                  {/* Personality Trait Badge */}
                  <div className="absolute bottom-2.5 left-2.5 bg-white/90 backdrop-blur-xs border border-pink-200 px-2.5 py-0.5 rounded-full text-[11px] font-bubble font-bold text-pink-700 shadow-xs z-10">
                    ✨ {currentOption.trait}
                  </div>
                </div>
              </div>

              {/* Species Selection Grid */}
              <div className="w-full my-2">
                <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5 text-left">
                  Select Species
                </label>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2 w-full">
                  {PET_OPTIONS.map((opt) => {
                    const isSelected = selectedType === opt.type;
                    return (
                      <button
                        key={opt.type}
                        id={`btn-select-pet-${opt.type}`}
                        type="button"
                        onClick={() => handleSelectType(opt.type)}
                        className={`p-2 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer min-h-[64px] ${
                          isSelected
                            ? 'bg-amber-500 border-amber-600 text-white shadow-md scale-102 ring-2 ring-amber-300'
                            : 'bg-stone-50 border-stone-200 hover:border-amber-300 text-stone-700 hover:bg-amber-50/60'
                        }`}
                      >
                        {opt.type === 'hamster' ? (
                          <div className="w-7 h-7 rounded-xl overflow-hidden shrink-0 border border-amber-300/60 shadow-2xs">
                            <img
                              src="/pocket_pet_icon.png"
                              alt="Hamster"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <span className="text-2xl leading-none">{opt.icon}</span>
                        )}
                        <span className="text-[11px] font-bubble font-bold capitalize truncate">
                          {opt.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pet Bio & Highlights */}
              <div className="w-full p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-left mb-4 flex items-start gap-2.5">
                <span className="text-xl shrink-0 mt-0.5">{currentOption.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bubble font-bold text-stone-800 text-xs sm:text-sm">
                      {currentConfig.species}
                    </span>
                    <span className="text-[10px] bg-amber-200/70 text-amber-900 px-1.5 py-0.2 rounded font-bubble font-bold">
                      {currentOption.tagline}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                    {currentOption.personality}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <button
                id="btn-confirm-pet-type"
                type="button"
                onClick={handleProceedToName}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white font-bubble text-sm sm:text-base font-bold rounded-2xl shadow-md hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
              >
                <span>Continue with {currentConfig.species}</span>
                <ArrowRight size={18} />
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="step-name"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleFinish}
              className="w-full flex flex-col items-center"
            >
              {/* Pet Avatar Preview */}
              <div className="my-2 flex flex-col items-center">
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-b from-amber-50 via-white to-pink-50 border-2 border-amber-200/80 shadow-inner flex items-center justify-center relative overflow-hidden">
                  <PetPreview3D type={selectedType} />
                  <div className="absolute bottom-2 bg-white/90 px-2 py-0.5 rounded-full border border-amber-200 text-[10px] font-bubble font-bold text-stone-700 shadow-xs">
                    {currentConfig.species}
                  </div>
                </div>
              </div>

              {/* Name Input */}
              <div className="w-full my-2">
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="input-initial-pet-name"
                    className="text-xs font-bold text-stone-700 font-bubble"
                  >
                    Give your {currentConfig.species} a nickname:
                  </label>
                  <span className="text-[10px] font-mono text-stone-400">
                    {petName.length}/16
                  </span>
                </div>
                <input
                  id="input-initial-pet-name"
                  type="text"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  maxLength={16}
                  placeholder={`e.g. ${currentConfig.name}`}
                  className="w-full px-4 py-3 bg-stone-50 border-2 border-amber-300 rounded-2xl font-bubble text-lg font-bold text-stone-800 text-center focus:outline-hidden focus:border-amber-500 focus:bg-white transition-all shadow-inner"
                  autoFocus
                />
              </div>

              {/* Name Suggestions Chips */}
              <div className="w-full mb-4">
                <span className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5 text-left">
                  Popular Ideas:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(SUGGESTED_NAMES[selectedType] || []).map((suggestion) => {
                    const isActive = petName === suggestion;
                    return (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          soundManager.playPop();
                          setPetName(suggestion);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-bubble font-bold border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-amber-500 border-amber-600 text-white shadow-xs'
                            : 'bg-stone-100 border-stone-200 text-stone-700 hover:bg-amber-100/70 hover:border-amber-300'
                        }`}
                      >
                        {suggestion}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Action Buttons */}
              <div className="flex items-center gap-2.5 w-full">
                <button
                  type="button"
                  id="btn-back-to-species"
                  onClick={handleBackToChoose}
                  className="px-4 py-3 bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 font-bubble text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-1 cursor-pointer min-h-[48px]"
                >
                  <ChevronLeft size={16} />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  id="btn-finish-adoption"
                  disabled={!petName.trim()}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bubble text-sm sm:text-base font-bold rounded-2xl shadow-md hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
                >
                  <Heart size={16} fill="currentColor" />
                  <span>Adopt {petName.trim() || 'Companion'}! 🏡</span>
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

