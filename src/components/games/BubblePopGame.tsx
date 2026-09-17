import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, RefreshCw, Trophy } from 'lucide-react';
import { soundManager } from '../../utils/audio';

interface BubblePopGameProps {
  onFinishGame: (coinsEarned: number, xpEarned: number) => void;
  onExit: () => void;
}

interface FloatingBubble {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  type: 'regular' | 'golden' | 'heart';
}

export const BubblePopGame: React.FC<BubblePopGameProps> = ({
  onFinishGame,
  onExit,
}) => {
  const [bubbles, setBubbles] = useState<FloatingBubble[]>([]);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(25);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);

  // Countdown timer
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

  // Bubble animation and rising loop
  useEffect(() => {
    if (gameOver) return;

    let prevTime = performance.now();

    const loop = (now: number) => {
      const delta = (now - prevTime) / 1000;
      prevTime = now;

      // Spawn new bubbles from bottom
      if (now - lastSpawnRef.current > 420) {
        lastSpawnRef.current = now;
        const rand = Math.random();
        const type = rand > 0.85 ? 'golden' : rand > 0.65 ? 'heart' : 'regular';
        const newBubble: FloatingBubble = {
          id: now + Math.random(),
          x: 10 + Math.random() * 80,
          y: 105, // start slightly below
          size: 45 + Math.random() * 25,
          speed: 25 + Math.random() * 25,
          type,
        };
        setBubbles((prev) => [...prev, newBubble]);
      }

      // Move bubbles upwards
      setBubbles((prev) =>
        prev
          .map((b) => ({ ...b, y: b.y - b.speed * delta }))
          .filter((b) => b.y > -20)
      );

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [gameOver]);

  const popBubble = (id: number, type: FloatingBubble['type']) => {
    if (gameOver) return;

    if (type === 'golden') {
      soundManager.playCoin();
      setScore((s) => s + 15);
    } else if (type === 'heart') {
      soundManager.playSqueak();
      setScore((s) => s + 10);
    } else {
      soundManager.playPop();
      setScore((s) => s + 5);
    }

    setBubbles((prev) => prev.filter((b) => b.id !== id));
  };

  const handleCollect = () => {
    const coinsEarned = Math.max(15, Math.round(score * 0.7));
    const xpEarned = Math.max(20, Math.round(score * 0.4));
    soundManager.playLevelUp();
    onFinishGame(coinsEarned, xpEarned);
  };

  const restartGame = () => {
    setScore(0);
    setTimeLeft(25);
    setBubbles([]);
    setGameOver(false);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-gradient-to-b from-sky-300 via-blue-100 to-indigo-100 rounded-3xl overflow-hidden select-none">
      {/* Top Header */}
      <div className="p-3 bg-white/80 backdrop-blur-xs flex items-center justify-between border-b border-sky-200 z-20">
        <button
          id="btn-exit-bubble-pop"
          onClick={onExit}
          className="p-1.5 rounded-xl bg-white shadow-xs border border-stone-200 text-stone-600 hover:bg-stone-100"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-center gap-3 font-bubble">
          <div className="bg-sky-100 px-3 py-1 rounded-xl border border-sky-300 text-sky-800 text-xs font-bold">
            Points: <span className="text-sm">{score}</span>
          </div>

          <div className="bg-white px-3 py-1 rounded-xl border border-stone-200 text-stone-700 text-xs font-bold">
            ⏳ {timeLeft}s
          </div>
        </div>
      </div>

      {/* Bubble Play Field */}
      <div
        ref={containerRef}
        id="bubble-pop-arena"
        className="relative flex-1 w-full overflow-hidden touch-none"
      >
        {bubbles.map((bubble) => (
          <div
            key={bubble.id}
            onPointerDown={() => popBubble(bubble.id, bubble.type)}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer flex items-center justify-center rounded-full transition-transform active:scale-125"
            style={{
              left: `${bubble.x}%`,
              top: `${bubble.y}%`,
              width: bubble.size,
              height: bubble.size,
            }}
          >
            {bubble.type === 'golden' ? (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-200 via-amber-300 to-yellow-400 border-2 border-yellow-100 shadow-md flex items-center justify-center text-lg animate-pulse">
                ⭐
              </div>
            ) : bubble.type === 'heart' ? (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-200 via-rose-300 to-pink-400 border-2 border-pink-100 shadow-md flex items-center justify-center text-lg">
                💖
              </div>
            ) : (
              <div className="w-full h-full rounded-full bg-white/50 border-2 border-white/80 shadow-inner flex items-center justify-center backdrop-blur-[1px]">
                <div className="w-2.5 h-2.5 bg-white rounded-full absolute top-2 left-2 opacity-80" />
              </div>
            )}
          </div>
        ))}

        <div className="absolute top-2 inset-x-0 text-center pointer-events-none text-xs font-bold text-sky-800/60 font-bubble">
          Tap or swipe to pop bubbles! 🫧
        </div>
      </div>

      {/* Game Over Modal */}
      {gameOver && (
        <div className="absolute inset-0 z-30 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 max-w-xs w-full text-center border-2 border-sky-300 shadow-2xl"
          >
            <div className="w-16 h-16 rounded-2xl bg-sky-100 mx-auto flex items-center justify-center text-3xl mb-3">
              <Trophy className="text-sky-600" size={32} />
            </div>

            <h3 className="font-bubble text-xl font-bold text-stone-800">
              Pop Extravaganza!
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              You popped a shower of colorful bubbles!
            </p>

            <div className="my-4 p-3 bg-sky-50 rounded-2xl border border-sky-200 flex justify-around">
              <div>
                <div className="text-xs text-stone-500 font-bold">Points</div>
                <div className="font-bubble text-lg font-bold text-stone-800">{score}</div>
              </div>
              <div className="border-r border-sky-200" />
              <div>
                <div className="text-xs text-stone-500 font-bold">Reward</div>
                <div className="font-bubble text-lg font-bold text-sky-700">
                  +{Math.max(15, Math.round(score * 0.7))} 🪙
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                id="btn-bubble-retry"
                onClick={restartGame}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bubble text-xs font-bold rounded-xl flex items-center justify-center gap-1"
              >
                <RefreshCw size={14} /> Play Again
              </button>
              <button
                id="btn-bubble-collect"
                onClick={handleCollect}
                className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bubble text-xs font-bold rounded-xl shadow-xs"
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
