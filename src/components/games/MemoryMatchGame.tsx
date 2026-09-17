import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, RefreshCw, Trophy } from 'lucide-react';
import { soundManager } from '../../utils/audio';

interface MemoryMatchGameProps {
  onFinishGame: (coinsEarned: number, xpEarned: number) => void;
  onExit: () => void;
}

interface Card {
  id: number;
  pairId: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({
  onFinishGame,
  onExit,
}) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [matchedCount, setMatchedCount] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);

  const icons = ['🍎', '🥕', '🌻', '🍓', '🎾', '👑'];

  const initGame = () => {
    const deck: Card[] = [];
    icons.forEach((icon, index) => {
      // 2 cards per pair
      deck.push({ id: index * 2, pairId: index, icon, isFlipped: false, isMatched: false });
      deck.push({ id: index * 2 + 1, pairId: index, icon, isFlipped: false, isMatched: false });
    });

    // Shuffle
    const shuffled = deck.sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlippedIndices([]);
    setMoves(0);
    setMatchedCount(0);
    setIsLocked(false);
    setGameOver(false);
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleCardClick = (index: number) => {
    if (isLocked) return;
    const card = cards[index];
    if (card.isFlipped || card.isMatched) return;

    soundManager.playPop();

    // Flip card
    const nextCards = [...cards];
    nextCards[index].isFlipped = true;
    setCards(nextCards);

    const nextFlipped = [...flippedIndices, index];
    setFlippedIndices(nextFlipped);

    if (nextFlipped.length === 2) {
      setMoves((m) => m + 1);
      setIsLocked(true);

      const [firstIdx, secondIdx] = nextFlipped;
      const firstCard = nextCards[firstIdx];
      const secondCard = nextCards[secondIdx];

      if (firstCard.pairId === secondCard.pairId) {
        // Match found!
        setTimeout(() => {
          soundManager.playCoin();
          nextCards[firstIdx].isMatched = true;
          nextCards[secondIdx].isMatched = true;
          setCards([...nextCards]);
          setFlippedIndices([]);
          setIsLocked(false);

          const nextMatchCount = matchedCount + 1;
          setMatchedCount(nextMatchCount);

          if (nextMatchCount >= icons.length) {
            soundManager.playLevelUp();
            setGameOver(true);
          }
        }, 500);
      } else {
        // No match, flip back
        setTimeout(() => {
          nextCards[firstIdx].isFlipped = false;
          nextCards[secondIdx].isFlipped = false;
          setCards([...nextCards]);
          setFlippedIndices([]);
          setIsLocked(false);
        }, 850);
      }
    }
  };

  const handleCollect = () => {
    // Fewer moves = higher bonus!
    const baseCoins = 40;
    const moveBonus = Math.max(10, 30 - moves);
    const totalCoins = baseCoins + moveBonus;
    const xpEarned = 35;
    onFinishGame(totalCoins, xpEarned);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-gradient-to-b from-purple-100 via-pink-50 to-amber-50 rounded-3xl overflow-hidden select-none">
      {/* Top Header */}
      <div className="p-3 bg-white/80 backdrop-blur-xs flex items-center justify-between border-b border-pink-200 z-20">
        <button
          id="btn-exit-memory"
          onClick={onExit}
          className="p-1.5 rounded-xl bg-white shadow-xs border border-stone-200 text-stone-600 hover:bg-stone-100"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-center gap-3 font-bubble">
          <div className="bg-purple-100 px-3 py-1 rounded-xl border border-purple-200 text-purple-900 text-xs font-bold">
            Matches: <span className="text-sm">{matchedCount}</span>/{icons.length}
          </div>
          <div className="bg-white px-3 py-1 rounded-xl border border-stone-200 text-stone-700 text-xs font-bold">
            Moves: {moves}
          </div>
        </div>
      </div>

      {/* Grid of 12 cards */}
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 w-full max-w-sm">
          {cards.map((card, index) => {
            const isRevealed = card.isFlipped || card.isMatched;

            return (
              <motion.button
                key={card.id}
                id={`card-${index}`}
                onClick={() => handleCardClick(index)}
                whileTap={{ scale: 0.94 }}
                className={`aspect-square rounded-2xl border-2 flex items-center justify-center text-3xl shadow-xs transition-all relative overflow-hidden ${
                  card.isMatched
                    ? 'bg-emerald-100/80 border-emerald-400 opacity-90 scale-95'
                    : isRevealed
                    ? 'bg-white border-pink-400 shadow-md'
                    : 'bg-gradient-to-br from-pink-400 to-purple-500 border-purple-300 text-white hover:brightness-105'
                }`}
              >
                {isRevealed ? (
                  <span>{card.icon}</span>
                ) : (
                  <span className="text-xl opacity-75">🐾</span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Game Over Victory Modal */}
      {gameOver && (
        <div className="absolute inset-0 z-30 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 max-w-xs w-full text-center border-2 border-purple-300 shadow-2xl"
          >
            <div className="w-16 h-16 rounded-2xl bg-purple-100 mx-auto flex items-center justify-center text-3xl mb-3">
              <Trophy className="text-purple-600" size={32} />
            </div>

            <h3 className="font-bubble text-xl font-bold text-stone-800">
              Brilliant Memory!
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              All matching pairs discovered in {moves} moves!
            </p>

            <div className="my-4 p-3 bg-purple-50 rounded-2xl border border-purple-200 flex justify-around">
              <div>
                <div className="text-xs text-stone-500 font-bold">Moves</div>
                <div className="font-bubble text-lg font-bold text-stone-800">{moves}</div>
              </div>
              <div className="border-r border-purple-200" />
              <div>
                <div className="text-xs text-stone-500 font-bold">Reward</div>
                <div className="font-bubble text-lg font-bold text-purple-700">
                  +{Math.max(10, 30 - moves) + 40} 🪙
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                id="btn-memory-retry"
                onClick={initGame}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bubble text-xs font-bold rounded-xl flex items-center justify-center gap-1"
              >
                <RefreshCw size={14} /> Play Again
              </button>
              <button
                id="btn-memory-collect"
                onClick={handleCollect}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bubble text-xs font-bold rounded-xl shadow-xs"
              >
                Collect 🎁
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
