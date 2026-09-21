import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Award, Sparkles, Edit2, Check, RefreshCw } from 'lucide-react';
import { PetState, PetType } from '../types';
import { PET_CONFIGS } from '../data/initialData';
import { getRequiredXP } from '../utils/storage';
import { soundManager } from '../utils/audio';
import { PetFaceAvatar } from './PetFaceAvatar';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  pet: PetState;
  onRenamePet: (newName: string) => void;
  onSwitchPetType: (newType: PetType) => void;
  onOpenAdoptionCenter?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  pet,
  onRenamePet,
  onSwitchPetType,
  onOpenAdoptionCenter,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(pet.name);

  const reqXP = getRequiredXP(pet.level);
  const xpPercent = Math.min(100, Math.round((pet.experience / reqXP) * 100));

  const handleSaveName = () => {
    if (nameInput.trim()) {
      onRenamePet(nameInput.trim());
      setIsEditingName(false);
      soundManager.playPop();
    }
  };

  const achievements = [
    {
      id: 'ach-first-meal',
      title: 'First Meal',
      desc: 'Fed your pet a tasty meal',
      icon: '🍎',
      completed: (pet.lifetimeStats?.timesFed || 0) >= 1,
    },
    {
      id: 'ach-squeaky-clean',
      title: 'Bubble Enthusiast',
      desc: 'Given your pet 3+ bubble baths',
      icon: '🧼',
      completed: (pet.lifetimeStats?.timesCleaned || 0) >= 3,
    },
    {
      id: 'ach-gamer',
      title: 'Playful Buddy',
      desc: 'Played 5+ mini-games together',
      icon: '🎮',
      completed: (pet.lifetimeStats?.gamesPlayed || 0) >= 5,
    },
    {
      id: 'ach-high-flyer',
      title: 'Rising Star',
      desc: 'Reached Level 3 or higher',
      icon: '⭐',
      completed: (pet.level || 1) >= 3,
    },
    {
      id: 'ach-wealthy',
      title: 'Piggy Bank',
      desc: 'Earned over 300 coins in total',
      icon: '🪙',
      completed: (pet.lifetimeStats?.totalCoinsEarned || 0) >= 300,
    },
    {
      id: 'ach-loyal',
      title: 'Cherished Bond',
      desc: 'Achieved 95%+ Happiness',
      icon: '💖',
      completed: (pet.stats?.happiness || 0) >= 95,
    },
  ];

  const petTypes = Object.keys(PET_CONFIGS) as PetType[];

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="profile-modal-backdrop" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/50 backdrop-blur-xs">
          <motion.div
            id="profile-modal-card"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 p-5 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2 text-stone-800">
                <span className="text-2xl">📋</span>
                <div>
                  <h2 className="font-bubble text-xl font-bold">Pet Passport</h2>
                  <p className="text-xs text-stone-500">Adoption certificate & life milestones</p>
                </div>
              </div>

              <button
                id="btn-close-profile"
                onClick={onClose}
                className="p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto no-scrollbar py-3 space-y-4">
              {/* Pet ID Card Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 border border-orange-200/80 shadow-xs flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-xs border border-orange-200 flex items-center justify-center p-1">
                  <PetFaceAvatar type={pet.type} size={50} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {isEditingName ? (
                      <div className="flex items-center gap-1">
                        <input
                          id="input-pet-rename"
                          type="text"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          maxLength={16}
                          className="px-2 py-1 text-sm font-bubble font-bold border border-amber-400 rounded-lg w-32 focus:outline-hidden"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveName}
                          className="p-1 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-bubble text-lg font-bold text-stone-800 truncate">
                          {pet.name}
                        </h3>
                        <button
                          id="btn-edit-pet-name"
                          onClick={() => {
                            setNameInput(pet.name);
                            setIsEditingName(true);
                          }}
                          className="text-stone-400 hover:text-stone-600 p-1"
                        >
                          <Edit2 size={13} />
                        </button>
                      </>
                    )}
                  </div>

                  <p className="text-xs text-stone-500 font-medium">
                    Species: <span className="capitalize text-stone-700 font-semibold">{PET_CONFIGS[pet.type].species}</span>
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="bg-amber-400/30 text-amber-900 text-xs px-2.5 py-0.5 rounded-full font-bubble font-bold border border-amber-300/80">
                      Level {pet.level}
                    </span>
                    <span className="text-[11px] text-stone-500 font-medium">
                      {pet.experience} / {reqXP} XP
                    </span>
                  </div>
                </div>
              </div>

              {/* XP Progression Bar */}
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200">
                <div className="flex justify-between items-center text-xs font-bold text-stone-600 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Sparkles size={13} className="text-amber-500" /> Next Level Progress
                  </span>
                  <span>{xpPercent}%</span>
                </div>
                <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden p-0.5">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 rounded-full"
                    style={{ width: `${xpPercent}%` }}
                    animate={{ width: `${xpPercent}%` }}
                  />
                </div>
              </div>

              {/* Core Lifetime Stats Grid */}
              <div>
                <h4 className="font-bubble text-sm font-bold text-stone-700 mb-2">Pet Statistics</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-center">
                    <div className="text-xl">📅</div>
                    <div className="font-bubble text-lg font-bold text-stone-800 mt-1">
                      {pet.lifetimeStats.daysCared}
                    </div>
                    <div className="text-[11px] text-stone-500 font-medium">Days Cared For</div>
                  </div>

                  <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-center">
                    <div className="text-xl">🎮</div>
                    <div className="font-bubble text-lg font-bold text-stone-800 mt-1">
                      {pet.lifetimeStats.gamesPlayed}
                    </div>
                    <div className="text-[11px] text-stone-500 font-medium">Games Played</div>
                  </div>

                  <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-center">
                    <div className="text-xl">🪙</div>
                    <div className="font-bubble text-lg font-bold text-amber-600 mt-1">
                      {pet.lifetimeStats.totalCoinsEarned}
                    </div>
                    <div className="text-[11px] text-stone-500 font-medium">Total Coins Earned</div>
                  </div>

                  <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-center">
                    <div className="text-xl">🍴</div>
                    <div className="font-bubble text-lg font-bold text-stone-800 mt-1">
                      {pet.lifetimeStats.timesFed}
                    </div>
                    <div className="text-[11px] text-stone-500 font-medium">Meals Served</div>
                  </div>

                  <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-center">
                    <div className="text-xl">🛁</div>
                    <div className="font-bubble text-lg font-bold text-stone-800 mt-1">
                      {pet.lifetimeStats.timesCleaned}
                    </div>
                    <div className="text-[11px] text-stone-500 font-medium">Baths Given</div>
                  </div>

                  <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-center">
                    <div className="text-xl">💖</div>
                    <div className="font-bubble text-lg font-bold text-rose-500 mt-1">
                      {pet.stats.happiness}%
                    </div>
                    <div className="text-[11px] text-stone-500 font-medium">Happiness Index</div>
                  </div>
                </div>
              </div>

              {/* Change/Adopt Alternate Pet Species */}
              <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bubble font-bold text-indigo-900">
                    <RefreshCw size={13} /> Switch Active Pet
                  </div>
                  {onOpenAdoptionCenter && (
                    <button
                      onClick={() => {
                        soundManager.playPop();
                        onClose();
                        onOpenAdoptionCenter();
                      }}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white px-2 py-0.5 rounded-full border border-indigo-200 shadow-2xs hover:bg-indigo-50 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>Full Studio (50) →</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5 max-h-48 overflow-y-auto p-1">
                  {petTypes.map((ptype) => {
                    const isSelected = pet.type === ptype;
                    const cfg = PET_CONFIGS[ptype];
                    return (
                      <button
                        key={ptype}
                        id={`btn-select-type-${ptype}`}
                        onClick={() => {
                          if (!isSelected) {
                            soundManager.playPop();
                            onSwitchPetType(ptype);
                          }
                        }}
                        className={`p-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer min-h-[56px] ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-bold shadow-xs scale-102 ring-2 ring-indigo-300'
                            : 'bg-white text-stone-700 border border-indigo-200/80 hover:bg-indigo-100/50'
                        }`}
                      >
                        <PetFaceAvatar type={ptype} size={28} />
                        <span className="text-[10px] capitalize truncate max-w-full font-bubble">
                          {cfg?.species || ptype}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Achievements Showcase */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bubble text-sm font-bold text-stone-700 flex items-center gap-1.5">
                    <Award size={16} className="text-amber-500" /> Milestones & Badges
                  </h4>
                  <span className="text-xs text-stone-500 font-medium">
                    {achievements.filter((a) => a.completed).length} / {achievements.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {achievements.map((ach) => (
                    <div
                      key={ach.id}
                      className={`p-2.5 rounded-2xl border flex items-center gap-3 transition-all ${
                        ach.completed
                          ? 'bg-amber-50/60 border-amber-200'
                          : 'bg-stone-50 border-stone-200 opacity-60'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                        ach.completed ? 'bg-amber-100 border border-amber-300' : 'bg-stone-200 text-stone-400'
                      }`}>
                        {ach.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bubble text-xs font-bold text-stone-800 truncate">
                            {ach.title}
                          </span>
                          {ach.completed && (
                            <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                              Unlocked!
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 truncate">{ach.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Close */}
            <div className="pt-2 border-t border-stone-100 flex justify-end">
              <button
                id="btn-profile-done"
                onClick={onClose}
                className="px-5 py-2 bg-stone-800 text-white font-bubble text-xs font-bold rounded-xl hover:bg-stone-900 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
