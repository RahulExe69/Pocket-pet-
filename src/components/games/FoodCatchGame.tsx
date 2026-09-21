import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, RefreshCw, Trophy } from 'lucide-react';
import { PetType } from '../../types';
import { soundManager } from '../../utils/audio';

interface FoodCatchGameProps {
  petType: PetType;
  onFinishGame: (coinsEarned: number, xpEarned: number) => void;
  onExit: () => void;
}

interface FallingItem {
  id: number;
  x: number; // percentage 5 - 85
  y: number; // percentage 0 - 100
  type: 'food' | 'hazard';
  icon: string;
  points: number;
  speed: number;
}

export const FoodCatchGame: React.FC<FoodCatchGameProps> = ({
  petType,
  onFinishGame,
  onExit,
}) => {
  const [basketX, setBasketX] = useState<number>(50); // percentage 10 - 90
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [items, setItems] = useState<FallingItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);

  const foods = [
    { icon: '🍎', points: 10 },
    { icon: '🥕', points: 12 },
    { icon: '🌽', points: 15 },
    { icon: '🌻', points: 8 },
    { icon: '🍓', points: 15 },
    { icon: '🧁', points: 20 },
  ];

  // Touch & drag handler for smooth mobile control
  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!containerRef.current || gameOver) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const relX = ((clientX - rect.left) / rect.width) * 100;
    setBasketX(Math.max(10, Math.min(90, relX)));
  };

  // Game timer
  useEffect(() => {
    if (gameOver) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameOver]);

  // Main game loop
  useEffect(() => {
    if (gameOver) return;

    let prevTime = performance.now();

    const loop = (now: number) => {
      const delta = (now - prevTime) / 1000;
      prevTime = now;

      // Spawn items
      if (now - lastSpawnRef.current > 750) {
        lastSpawnRef.current = now;
        const isHazard = Math.random() < 0.22;
        const randomFood = foods[Math.floor(Math.random() * foods.length)];

        const newItem: FallingItem = {
          id: now + Math.random(),
          x: 10 + Math.random() * 80,
          y: 0,
          type: isHazard ? 'hazard' : 'food',
          icon: isHazard ? '⏰' : randomFood.icon,
          points: isHazard ? -10 : randomFood.points,
          speed: 25 + Math.random() * 20, // speed per sec
        };

        setItems((prev) => [...prev, newItem]);
      }

      // Update positions and check collisions
      setItems((prev) => {
        const nextItems: FallingItem[] = [];

        for (const item of prev) {
          const nextY = item.y + item.speed * delta;

          // Check if caught by pet basket at bottom (y between 80% and 92%)
          if (nextY >= 80 && nextY <= 92 && Math.abs(item.x - basketX) < 14) {
            if (item.type === 'food') {
              soundManager.playEat();
              setScore((s) => s + item.points);
            } else {
              soundManager.playPop();
              setLives((l) => {
                const nextL = l - 1;
                if (nextL <= 0) setGameOver(true);
                return Math.max(0, nextL);
              });
            }
            continue; // caught, do not keep
          }

          // Check if fallen past bottom
          if (nextY > 100) {
            if (item.type === 'food') {
              // Missed food
            }
            continue;
          }

          nextItems.push({ ...item, y: nextY });
        }

        return nextItems;
      });

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [basketX, gameOver]);

  // Handle final finish
  const handleFinish = () => {
    const coinsEarned = Math.max(10, Math.round(score * 0.8));
    const xpEarned = Math.max(15, Math.round(score * 0.5));
    soundManager.playLevelUp();
    onFinishGame(coinsEarned, xpEarned);
  };

  const restartGame = () => {
    setScore(0);
    setLives(3);
    setTimeLeft(30);
    setItems([]);
    setBasketX(50);
    setGameOver(false);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-gradient-to-b from-sky-200 via-amber-100 to-amber-50 rounded-3xl overflow-hidden select-none">
      {/* Top Game Bar */}
      <div className="p-3 bg-white/80 backdrop-blur-xs flex items-center justify-between border-b border-amber-200 z-20">
        <button
          id="btn-exit-food-catch"
          onClick={onExit}
          className="p-1.5 rounded-xl bg-white shadow-xs border border-stone-200 text-stone-600 hover:bg-stone-100"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-center gap-3 font-bubble">
          <div className="bg-amber-100 px-3 py-1 rounded-xl border border-amber-300 text-amber-800 text-xs font-bold">
            Score: <span className="text-sm">{score}</span>
          </div>

          <div className="bg-white px-3 py-1 rounded-xl border border-stone-200 text-stone-700 text-xs font-bold">
            ⏳ {timeLeft}s
          </div>

          <div className="flex gap-1 text-xs">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i}>{i < lives ? '❤️' : '🤍'}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Play Arena */}
      <div
        ref={containerRef}
        id="food-catch-arena"
        onMouseMove={handleTouchMove}
        onTouchMove={handleTouchMove}
        className="relative flex-1 w-full overflow-hidden touch-none cursor-grab active:cursor-grabbing"
      >
        {/* Falling items */}
        {items.map((item) => (
          <div
            key={item.id}
            className="absolute text-2xl -translate-x-1/2 -translate-y-1/2 drop-shadow-md pointer-events-none transition-transform"
            style={{ left: `${item.x}%`, top: `${item.y}%` }}
          >
            {item.icon}
          </div>
        ))}

        {/* Pet Basket Player at Bottom */}
        <div
          id="pet-catcher"
          className="absolute bottom-4 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-75"
          style={{ left: `${basketX}%` }}
        >
          <div className="text-3xl filter drop-shadow-md">
            {petType === 'hamster' ? '🐹' : petType === 'cat' ? '🐱' : '🐾'}
          </div>
          <div className="w-16 h-6 bg-amber-700/80 border-2 border-amber-900 rounded-b-xl flex items-center justify-center text-white text-[10px] font-bold shadow-md">
            🧺 Catch!
          </div>
        </div>

        {/* On-screen control buttons for mobile accessibility */}
        <div className="absolute bottom-2 inset-x-4 flex justify-between pointer-events-auto opacity-70 sm:opacity-40">
          <button
            onPointerDown={() => setBasketX((x) => Math.max(12, x - 12))}
            className="w-12 h-12 rounded-2xl bg-white/90 border border-amber-300 shadow-md font-bubble text-lg font-bold text-amber-800 flex items-center justify-center active:scale-95"
          >
            ◀
          </button>
          <button
            onPointerDown={() => setBasketX((x) => Math.min(88, x + 12))}
            className="w-12 h-12 rounded-2xl bg-white/90 border border-amber-300 shadow-md font-bubble text-lg font-bold text-amber-800 flex items-center justify-center active:scale-95"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Game Over / Victory Modal */}
      {gameOver && (
        <div className="absolute inset-0 z-30 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 max-w-xs w-full text-center border-2 border-amber-300 shadow-2xl"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-100 mx-auto flex items-center justify-center text-3xl mb-3">
              <Trophy className="text-amber-500" size={32} />
            </div>

            <h3 className="font-bubble text-xl font-bold text-stone-800">
              Yummy Feast!
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Your pet caught tons of delicious treats!
            </p>

            <div className="my-4 p-3 bg-amber-50 rounded-2xl border border-amber-200 flex justify-around">
              <div>
                <div className="text-xs text-stone-500 font-bold">Score</div>
                <div className="font-bubble text-lg font-bold text-stone-800">{score}</div>
              </div>
              <div className="border-r border-amber-200" />
              <div>
                <div className="text-xs text-stone-500 font-bold">Reward</div>
                <div className="font-bubble text-lg font-bold text-amber-600">
                  +{Math.max(10, Math.round(score * 0.8))} 🪙
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                id="btn-food-catch-retry"
                onClick={restartGame}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bubble text-xs font-bold rounded-xl flex items-center justify-center gap-1"
              >
                <RefreshCw size={14} /> Retry
              </button>
              <button
                id="btn-food-catch-collect"
                onClick={handleFinish}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bubble text-xs font-bold rounded-xl shadow-xs"
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
