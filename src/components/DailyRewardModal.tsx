import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DailyReward } from '../types';
import { DAILY_REWARDS } from '../data/initialData';
import { soundManager } from '../utils/audio';

interface DailyRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  consecutiveDays: number;
  lastClaimedDay: number;
  onClaimDay: (reward: DailyReward) => void;
}

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({
  isOpen,
  onClose,
  consecutiveDays,
  lastClaimedDay,
  onClaimDay,
}) => {
  // Active day is consecutiveDays capped at 7
  const currentStreakDay = Math.min(7, Math.max(1, consecutiveDays));
  const canClaimToday = lastClaimedDay < currentStreakDay;

  const handleClaim = (reward: DailyReward) => {
    soundManager.playLevelUp();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#fbc531', '#ff7675', '#4cd137', '#00a8ff', '#9c88ff'],
      });
    } catch {
      // ignore
    }
    onClaimDay(reward);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="daily-reward-backdrop" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/50 backdrop-blur-xs">
          <motion.div
            id="daily-reward-card"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-md bg-gradient-to-b from-amber-50 to-orange-50 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-amber-200 p-5 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-amber-200/80">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-800 flex items-center justify-center text-xl">
                  <Gift size={22} />
                </div>
                <div>
                  <h2 className="font-bubble text-xl font-bold text-stone-800">Daily Login Treats</h2>
                  <p className="text-xs text-stone-500">Check in every day to collect rare goodies!</p>
                </div>
              </div>

              <button
                id="btn-close-daily-rewards"
                onClick={onClose}
                className="p-1.5 rounded-full bg-stone-200/70 hover:bg-stone-300 text-stone-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Streak Indicator */}
            <div className="my-3 p-3 bg-white/90 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔥</span>
                <div>
                  <div className="font-bubble text-sm font-bold text-stone-800">
                    Day {currentStreakDay} Login Streak!
                  </div>
                  <div className="text-[11px] text-stone-500">
                    {canClaimToday ? 'Your daily surprise is waiting!' : 'Reward claimed for today! Come back tomorrow.'}
                  </div>
                </div>
              </div>
            </div>

            {/* 7-Day Rewards Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 my-2">
              {DAILY_REWARDS.map((reward) => {
                const isClaimed = reward.day <= lastClaimedDay;
                const isCurrent = reward.day === currentStreakDay;
                const isClaimable = isCurrent && canClaimToday;
                const isLocked = reward.day > currentStreakDay;
                const isFinalDay = reward.day === 7;

                return (
                  <div
                    key={reward.day}
                    className={`relative p-2.5 rounded-2xl border-2 flex flex-col items-center justify-between text-center transition-all ${
                      isFinalDay ? 'col-span-3 sm:col-span-2 bg-gradient-to-br from-amber-100 to-yellow-200 border-amber-400' : ''
                    } ${
                      isClaimed
                        ? 'bg-emerald-50 border-emerald-300 opacity-80'
                        : isClaimable
                        ? 'bg-white border-amber-500 shadow-md ring-2 ring-amber-300 scale-105'
                        : isLocked
                        ? 'bg-stone-100/70 border-stone-200 opacity-60'
                        : 'bg-white border-amber-200'
                    }`}
                  >
                    <div className="text-[10px] font-bubble font-bold text-stone-500 uppercase tracking-wider">
                      Day {reward.day}
                    </div>

                    <div className="text-2xl my-1">{reward.icon}</div>

                    <div className="font-bubble text-xs font-bold text-stone-800 leading-tight">
                      +{reward.coins} 🪙
                    </div>

                    {reward.bonusItem && (
                      <span className="text-[9px] text-amber-700 font-bold truncate max-w-full">
                        +{reward.bonusItem.name}
                      </span>
                    )}

                    {/* Status Badge */}
                    <div className="mt-1">
                      {isClaimed ? (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600">
                          <Check size={10} strokeWidth={3} /> Claimed
                        </span>
                      ) : isClaimable ? (
                        <button
                          id={`btn-claim-reward-${reward.day}`}
                          onClick={() => handleClaim(reward)}
                          className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bubble text-[11px] font-bold rounded-lg shadow-xs animate-pulse hover:scale-105 active:scale-95"
                        >
                          Claim! 🎁
                        </button>
                      ) : (
                        <span className="text-[10px] text-stone-400 font-semibold">Locked</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Claim Action / Close */}
            <div className="mt-3 pt-3 border-t border-amber-200/80 flex items-center justify-between">
              <span className="text-xs text-stone-500 font-medium">Streaks reset if you miss consecutive days</span>
              <button
                id="btn-daily-close"
                onClick={onClose}
                className="px-5 py-2 bg-stone-800 text-white font-bubble text-xs font-bold rounded-xl hover:bg-stone-900 transition-colors"
              >
                Got It!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
