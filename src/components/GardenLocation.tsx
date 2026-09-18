import React, { useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { PetState, PetMood } from '../types';
import { GardenScene3D } from './3d/GardenScene3D';
import { GardenButterfly } from './3d/gardenGeometries';
import { soundManager } from '../utils/audio';
import { Home, Sparkles, Trophy, Award, RefreshCw, Volume2 } from 'lucide-react';

interface GardenLocationProps {
  pet: PetState;
  mood: PetMood;
  onReturnToRoom: () => void;
  onUpdatePet: (updater: (prev: PetState) => PetState) => void;
}

export const GardenLocation: React.FC<GardenLocationProps> = ({
  pet,
  mood,
  onReturnToRoom,
  onUpdatePet,
}) => {
  const [butterflyScore, setButterflyScore] = useState<number>(0);
  const [totalButterfliesCaught, setTotalButterfliesCaught] = useState<number>(0);
  const [lastCaughtName, setLastCaughtName] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>('Welcome to the Sunny Garden! Tap anywhere to walk, tap butterflies & coins!');
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);
  const [rewardClaimedCount, setRewardClaimedCount] = useState<number>(0);

  // Catch butterfly handler
  const handleCatchButterfly = useCallback(
    (bf: GardenButterfly) => {
      setLastCaughtName(bf.colorName);
      setButterflyScore((prev) => {
        const nextScore = prev + 1;
        // Check milestone reward (every 5 catches)
        if (nextScore >= 5) {
          setShowRewardModal(true);
          try {
            confetti({
              particleCount: 60,
              spread: 70,
              origin: { y: 0.6 },
            });
          } catch {
            // ignore
          }
          soundManager.playLevelUp();
        }
        return nextScore;
      });

      setTotalButterfliesCaught((prev) => prev + 1);

      // Award coins & XP to pet state
      onUpdatePet((prevPet) => ({
        ...prevPet,
        coins: prevPet.coins + 5,
        experience: prevPet.experience + 8,
        stats: {
          ...prevPet.stats,
          happiness: Math.min(100, prevPet.stats.happiness + 4),
        },
      }));

      setToastMessage(`🦋 Caught a ${bf.colorName}! +5 🪙`);
      setTimeout(() => {
        setToastMessage((cur) => (cur?.includes(bf.colorName) ? null : cur));
      }, 3000);
    },
    [onUpdatePet]
  );

  // Collect item handler (coins & stars)
  const handleCollectItem = useCallback(
    (type: 'coin' | 'star', value: number) => {
      onUpdatePet((prevPet) => ({
        ...prevPet,
        coins: prevPet.coins + (type === 'coin' ? value : 0),
        experience: prevPet.experience + (type === 'star' ? value : 5),
        stats: {
          ...prevPet.stats,
          happiness: Math.min(100, prevPet.stats.happiness + 3),
        },
      }));

      const msg = type === 'coin' ? `🪙 Collected Golden Coin! +${value} Coins` : `⭐ Lucky Star! +${value} XP`;
      setToastMessage(msg);
      setTimeout(() => {
        setToastMessage((cur) => (cur === msg ? null : cur));
      }, 2500);
    },
    [onUpdatePet]
  );

  // Interactive object feedback
  const handleInteractObject = useCallback((name: string) => {
    setToastMessage(name);
    setTimeout(() => {
      setToastMessage((cur) => (cur === name ? null : cur));
    }, 2500);
  }, []);

  // Claim milestone reward
  const handleClaimReward = () => {
    soundManager.playLevelUp();
    onUpdatePet((prevPet) => ({
      ...prevPet,
      coins: prevPet.coins + 50,
      experience: prevPet.experience + 40,
      stats: {
        ...prevPet.stats,
        happiness: Math.min(100, prevPet.stats.happiness + 25),
      },
    }));

    setRewardClaimedCount((prev) => prev + 1);
    setButterflyScore(0);
    setShowRewardModal(false);
    setToastMessage('🎉 Claimed +50 🪙 Coins & Bonus Happiness!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-gradient-to-b from-sky-100 via-emerald-50 to-emerald-100 overflow-hidden select-none">
      {/* Top Garden Navigation & HUD Bar */}
      <header className="relative z-20 flex items-center justify-between px-3 py-2 bg-white/90 backdrop-blur-md border-b border-emerald-200/80 shadow-xs">
        {/* Back to Room Button */}
        <button
          id="btn-garden-back-to-room"
          onClick={() => {
            soundManager.playPop();
            onReturnToRoom();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bubble font-bold text-xs shadow-xs transition-all cursor-pointer"
          title="Return to Cozy Room"
        >
          <Home className="w-4 h-4" />
          <span>🏡 Room</span>
        </button>

        {/* Location Title */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1">
            <span className="text-base">🌻</span>
            <span className="font-bubble font-bold text-emerald-900 text-sm tracking-wide">
              Sunny Garden
            </span>
          </div>
          <span className="text-[10px] text-emerald-700 font-medium">
            Tap to walk • Catch butterflies
          </span>
        </div>

        {/* Pet Coins & Level HUD */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full border border-amber-200 text-xs font-bold text-amber-900">
            <span>🪙</span>
            <span>{pet.coins}</span>
          </div>
          <div className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-full border border-purple-200 text-xs font-bold text-purple-900">
            <span>⭐</span>
            <span>Lv.{pet.level}</span>
          </div>
        </div>
      </header>

      {/* Mini-Game HUD: Catch the Butterflies */}
      <div className="relative z-20 px-3 py-1.5 bg-emerald-500/15 backdrop-blur-xs border-b border-emerald-300/40 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-lg animate-bounce">🦋</span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bubble font-bold text-emerald-950 text-xs">
                Catch the Butterflies:
              </span>
              <span className="font-mono font-bold text-emerald-800 bg-white/80 px-1.5 py-0.5 rounded-md border border-emerald-200">
                {butterflyScore} / 5
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-28 h-1.5 bg-emerald-200/80 rounded-full overflow-hidden mt-0.5">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(100, (butterflyScore / 5) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-emerald-800 bg-white/70 px-2 py-1 rounded-full border border-emerald-200">
            Total: {totalButterfliesCaught} 🦋
          </span>
        </div>
      </div>

      {/* Floating Status Toast */}
      {toastMessage && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none max-w-[90%] transition-all animate-fade-in">
          <div className="bg-white/95 text-emerald-900 px-3 py-1.5 rounded-full shadow-md border border-emerald-300 text-xs font-bold flex items-center gap-1.5 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* 3D Garden Scene */}
      <div className="relative flex-1 w-full h-full min-h-[360px] overflow-hidden">
        <GardenScene3D
          pet={pet}
          mood={mood}
          onCatchButterfly={handleCatchButterfly}
          onCollectItem={handleCollectItem}
          onInteractObject={handleInteractObject}
          onHamsterClick={() => {
            setToastMessage(`💖 ${pet.name} loves exploring the garden!`);
            setTimeout(() => setToastMessage(null), 2500);
          }}
          gameActive={true}
        />
      </div>

      {/* Bottom Garden Quick Controls / Instructions */}
      <footer className="relative z-20 px-3 py-2 bg-white/90 backdrop-blur-md border-t border-emerald-200/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3 text-stone-600">
          <span className="flex items-center gap-1 text-[11px]">
            <span className="text-sm">👆</span> Tap butterflies to catch
          </span>
          <span className="flex items-center gap-1 text-[11px] hidden sm:inline-flex">
            <span className="text-sm">🐾</span> Tap grass/path to walk
          </span>
          <span className="flex items-center gap-1 text-[11px]">
            <span className="text-sm">💧</span> Tap watering can & flowers
          </span>
        </div>

        <button
          onClick={() => {
            soundManager.playPop();
            onReturnToRoom();
          }}
          className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 font-bubble font-bold text-xs transition-transform cursor-pointer flex items-center gap-1"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Return</span>
        </button>
      </footer>

      {/* Catch the Butterflies Milestone Reward Modal */}
      {showRewardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border-2 border-amber-300 text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-3xl shadow-inner border border-amber-300 animate-bounce">
              🏆
            </div>

            <h3 className="font-bubble font-bold text-stone-800 text-lg">
              Garden Champion!
            </h3>

            <p className="text-xs text-stone-600 leading-relaxed">
              You caught <strong>5 colorful butterflies</strong> in the garden!{' '}
              {pet.name} is super delighted and leaping with joy!
            </p>

            <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-3 flex justify-around items-center">
              <div className="flex flex-col items-center">
                <span className="text-xl">🪙</span>
                <span className="text-xs font-bold text-amber-900">+50 Coins</span>
              </div>
              <div className="w-px h-8 bg-amber-200" />
              <div className="flex flex-col items-center">
                <span className="text-xl">💖</span>
                <span className="text-xs font-bold text-pink-700">+25 Happiness</span>
              </div>
              <div className="w-px h-8 bg-amber-200" />
              <div className="flex flex-col items-center">
                <span className="text-xl">⭐</span>
                <span className="text-xs font-bold text-purple-700">+40 XP</span>
              </div>
            </div>

            <button
              id="btn-claim-garden-reward"
              onClick={handleClaimReward}
              className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 active:scale-95 text-white font-bubble font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Trophy className="w-4 h-4" />
              <span>Claim Reward & Keep Playing</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
