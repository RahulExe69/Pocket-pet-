import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, Heart } from 'lucide-react';
import { PetType } from '../types';
import { PET_CONFIGS } from '../data/initialData';
import { PetPreview3D } from './3d/PetPreview3D';
import { soundManager } from '../utils/audio';

interface PetSelectionScreenProps {
  onAdoptPet: (type: PetType, name: string) => void;
}

export const PetSelectionScreen: React.FC<PetSelectionScreenProps> = ({
  onAdoptPet,
}) => {
  const [selectedType, setSelectedType] = useState<PetType>('hamster');
  const [petName, setPetName] = useState<string>('Hammy');
  const [step, setStep] = useState<'choose' | 'name'>('choose');

  const petOptions: { type: PetType; icon: string }[] = [
    { type: 'hamster', icon: '🐹' },
    { type: 'cat', icon: '🐱' },
    { type: 'dog', icon: '🐶' },
    { type: 'bunny', icon: '🐰' },
    { type: 'panda', icon: '🐼' },
  ];

  const handleSelectType = (type: PetType) => {
    soundManager.playPop();
    setSelectedType(type);
    setPetName(PET_CONFIGS[type].name);
  };

  const handleProceedToName = () => {
    soundManager.playPop();
    setStep('name');
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!petName.trim()) return;
    soundManager.playLevelUp();
    onAdoptPet(selectedType, petName.trim());
  };

  const currentConfig = PET_CONFIGS[selectedType];

  return (
    <div id="pet-selection-screen" className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-gradient-to-b from-amber-100 via-orange-50 to-pink-100 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border-2 border-amber-200/80 flex flex-col items-center text-center my-auto"
      >
        {step === 'choose' ? (
          <>
            <div className="flex items-center gap-1.5 text-xs font-bubble font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full mb-3">
              <Sparkles size={14} /> Step 1: Choose Your Companion
            </div>

            <h2 className="font-bubble text-2xl font-bold text-stone-800">
              Adopt a Pocket Pet!
            </h2>
            <p className="text-xs text-stone-500 mt-1 max-w-xs">
              Select your favorite cute digital buddy to begin your care adventure.
            </p>

            {/* Interactive 3D Pet Preview */}
            <div className="my-3 w-48 h-48 rounded-3xl bg-gradient-to-b from-amber-50 to-pink-100/70 border border-amber-200 shadow-inner flex items-center justify-center relative overflow-hidden">
              <PetPreview3D type={selectedType} />

              <div className="absolute bottom-2 bg-white/90 border border-amber-200 px-3 py-0.5 rounded-full text-xs font-bubble font-bold text-stone-700 shadow-xs z-10">
                {currentConfig.species}
              </div>
            </div>

            {/* Species Selector Carousel/Pills */}
            <div className="grid grid-cols-5 gap-2 w-full mb-4">
              {petOptions.map((opt) => {
                const isSelected = selectedType === opt.type;
                return (
                  <button
                    key={opt.type}
                    id={`btn-select-pet-${opt.type}`}
                    onClick={() => handleSelectType(opt.type)}
                    className={`p-2.5 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-amber-500 border-amber-600 text-white shadow-md scale-105'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-amber-50'
                    }`}
                  >
                    {opt.type === 'hamster' ? (
                      <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 border border-amber-300">
                        <img
                          src="/pocket_pet_icon.png"
                          alt="Hamster"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <span className="text-2xl">{opt.icon}</span>
                    )}
                    <span className="text-[10px] font-bubble font-bold capitalize truncate">
                      {opt.type}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bio description */}
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-stone-600 mb-5 text-left w-full flex items-start gap-2.5">
              <span className="text-lg">💖</span>
              <div>
                <span className="font-bold text-stone-800 font-bubble">{currentConfig.species}: </span>
                {currentConfig.description}
              </div>
            </div>

            <button
              id="btn-confirm-pet-type"
              onClick={handleProceedToName}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bubble text-sm font-bold rounded-2xl shadow-md hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              Choose {currentConfig.species} <ArrowRight size={16} />
            </button>
          </>
        ) : (
          <form onSubmit={handleFinish} className="w-full flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-xs font-bubble font-bold text-rose-700 bg-rose-100 px-3 py-1 rounded-full mb-3">
              <Heart size={14} /> Step 2: Name Your Pet
            </div>

            <h2 className="font-bubble text-2xl font-bold text-stone-800">
              Give Your Pet a Name!
            </h2>
            <p className="text-xs text-stone-500 mt-1 max-w-xs">
              Every special pet deserves a loving name. You can change this later!
            </p>

            {/* 3D Pet Preview */}
            <div className="my-4 w-40 h-40 rounded-3xl bg-gradient-to-b from-amber-50 to-pink-100/70 border border-amber-200 shadow-inner flex items-center justify-center relative overflow-hidden">
              <PetPreview3D type={selectedType} />
            </div>

            {/* Name Input */}
            <div className="w-full mb-4">
              <label htmlFor="input-initial-pet-name" className="block text-xs font-bold text-stone-600 mb-1.5 text-left">
                Pet Nickname
              </label>
              <input
                id="input-initial-pet-name"
                type="text"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                maxLength={16}
                placeholder="e.g. Mochi, Boba, Fluffy..."
                className="w-full px-4 py-3 bg-stone-50 border-2 border-amber-300 rounded-2xl font-bubble text-lg font-bold text-stone-800 text-center focus:outline-hidden focus:border-amber-500 focus:bg-white transition-all shadow-inner"
                autoFocus
              />
            </div>

            <div className="flex gap-2 w-full">
              <button
                type="button"
                id="btn-back-to-species"
                onClick={() => setStep('choose')}
                className="px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bubble text-xs font-bold rounded-2xl"
              >
                Back
              </button>
              <button
                type="submit"
                id="btn-finish-adoption"
                disabled={!petName.trim()}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bubble text-sm font-bold rounded-2xl shadow-md hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                Adopt {petName.trim() || 'Pet'}! 🏡
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
