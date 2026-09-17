import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Gamepad2 } from 'lucide-react';
import { PetType, MiniGameType } from '../../types';
import { FoodCatchGame } from './FoodCatchGame';
import { MemoryMatchGame } from './MemoryMatchGame';
import { BubblePopGame } from './BubblePopGame';
import { PetRunnerGame } from './PetRunnerGame';
import { soundManager } from '../../utils/audio';

interface MiniGamesHubProps {
  isOpen: boolean;
  onClose: () => void;
  petType: PetType;
  onGameReward: (coins: number, xp: number) => void;
}

export const MiniGamesHub: React.FC<MiniGamesHubProps> = ({
  isOpen,
  onClose,
  petType,
  onGameReward,
}) => {
  const [activeGame, setActiveGame] = useState<MiniGameType | null>(null);

  const games = [
    {
      id: 'food-catch' as MiniGameType,
      title: 'Food Catch',
      desc: 'Slide your pet basket to catch falling juicy fruits and yummy treats!',
      icon: '🍎',
      bgGradient: 'from-amber-400 to-orange-500',
      difficulty: 'Easy',
      coinsPot: 'Up to 60 🪙',
    },
    {
      id: 'memory-match' as MiniGameType,
      title: 'Memory Match',
      desc: 'Flip and pair cute pet symbols to sharpen your memory for rewards!',
      icon: '🃏',
      bgGradient: 'from-pink-400 to-purple-500',
      difficulty: 'Medium',
      coinsPot: 'Up to 70 🪙',
    },
    {
      id: 'bubble-pop' as MiniGameType,
      title: 'Bubble Pop',
      desc: 'Pop floating soap bubbles and golden stars before they float away!',
      icon: '🫧',
      bgGradient: 'from-sky-400 to-cyan-500',
      difficulty: 'Fast',
      coinsPot: 'Up to 50 🪙',
    },
    {
      id: 'pet-runner' as MiniGameType,
      title: 'Pet Runner',
      desc: 'Dash through flower fields, jumping obstacles and collecting stars!',
      icon: '🏃',
      bgGradient: 'from-emerald-400 to-teal-500',
      difficulty: 'Arcade',
      coinsPot: 'Up to 80 🪙',
    },
  ];

  const handleStartGame = (gameId: MiniGameType) => {
    soundManager.playPop();
    setActiveGame(gameId);
  };

  const handleFinish = (coins: number, xp: number) => {
    onGameReward(coins, xp);
    setActiveGame(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="minigames-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-xs">
          <motion.div
            id="minigames-modal-card"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-lg h-full sm:h-[88vh] bg-amber-50 rounded-none sm:rounded-3xl shadow-2xl border border-amber-200 flex flex-col overflow-hidden"
          >
            {activeGame ? (
              <div className="w-full h-full flex-1">
                {activeGame === 'food-catch' && (
                  <FoodCatchGame
                    petType={petType}
                    onFinishGame={handleFinish}
                    onExit={() => setActiveGame(null)}
                  />
                )}
                {activeGame === 'memory-match' && (
                  <MemoryMatchGame
                    onFinishGame={handleFinish}
                    onExit={() => setActiveGame(null)}
                  />
                )}
                {activeGame === 'bubble-pop' && (
                  <BubblePopGame
                    onFinishGame={handleFinish}
                    onExit={() => setActiveGame(null)}
                  />
                )}
                {activeGame === 'pet-runner' && (
                  <PetRunnerGame
                    petType={petType}
                    onFinishGame={handleFinish}
                    onExit={() => setActiveGame(null)}
                  />
                )}
              </div>
            ) : (
              <div className="flex flex-col h-full p-5">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-amber-200">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-800 flex items-center justify-center text-xl">
                      <Gamepad2 size={22} />
                    </div>
                    <div>
                      <h2 className="font-bubble text-xl font-bold text-stone-800">Pet Arcade</h2>
                      <p className="text-xs text-stone-500">Play fun games to earn coins & boost happiness!</p>
                    </div>
                  </div>

                  <button
                    id="btn-close-minigames"
                    onClick={onClose}
                    className="p-1.5 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-600 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Game Cards Grid */}
                <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-3">
                  {games.map((game) => (
                    <div
                      key={game.id}
                      className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs flex items-center justify-between gap-3 hover:shadow-md transition-all group"
                    >
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.bgGradient} text-white flex items-center justify-center text-2xl shadow-sm shrink-0`}>
                        {game.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bubble text-base font-bold text-stone-800 truncate">
                            {game.title}
                          </h3>
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                            {game.coinsPot}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 line-clamp-2 mt-0.5">
                          {game.desc}
                        </p>
                      </div>

                      <button
                        id={`btn-play-${game.id}`}
                        onClick={() => handleStartGame(game.id)}
                        className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bubble text-xs font-bold rounded-xl shadow-xs flex items-center gap-1 shrink-0 hover:scale-105 active:scale-95 transition-all"
                      >
                        <Play size={13} fill="currentColor" /> Play
                      </button>
                    </div>
                  ))}
                </div>

                {/* Footer Info */}
                <div className="pt-3 border-t border-amber-200 flex items-center justify-between text-xs text-stone-500 font-medium">
                  <span>Every game also grants pet EXP and happiness!</span>
                  <button
                    id="btn-games-hub-close"
                    onClick={onClose}
                    className="px-4 py-1.5 bg-stone-800 text-white font-bubble text-xs font-bold rounded-xl hover:bg-stone-900"
                  >
                    Back to Room
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
