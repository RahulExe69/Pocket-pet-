import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, RefreshCw, Trophy } from 'lucide-react';
import { PetType } from '../../types';
import { soundManager } from '../../utils/audio';

interface PetRunnerGameProps {
  petType: PetType;
  onFinishGame: (coinsEarned: number, xpEarned: number) => void;
  onExit: () => void;
}

interface Obstacle {
  id: number;
  x: number; // percentage from left
  type: 'rock' | 'fence' | 'bush';
}

interface RunnerCoin {
  id: number;
  x: number;
  y: number; // percentage from top
  collected: boolean;
}

export const PetRunnerGame: React.FC<PetRunnerGameProps> = ({
  petType,
  onFinishGame,
  onExit,
}) => {
  const [distance, setDistance] = useState<number>(0);
  const [coinsCollected, setCoinsCollected] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);

  // Jump physics
  const [petY, setPetY] = useState<number>(0); // 0 is ground
  const velocityRef = useRef<number>(0);
  const isJumpingRef = useRef<boolean>(false);

  const obstaclesRef = useRef<Obstacle[]>([]);
  const coinsRef = useRef<RunnerCoin[]>([]);
  const [renderObstacles, setRenderObstacles] = useState<Obstacle[]>([]);
  const [renderCoins, setRenderCoins] = useState<RunnerCoin[]>([]);

  const animFrameRef = useRef<number>(0);
  const lastObstacleSpawnRef = useRef<number>(0);
  const lastCoinSpawnRef = useRef<number>(0);

  const jump = () => {
    if (gameOver) return;
    if (!isJumpingRef.current || petY < 8) {
      soundManager.playJump();
      velocityRef.current = 130; // upward boost
      isJumpingRef.current = true;
    }
  };

  useEffect(() => {
    if (gameOver) return;

    let prevTime = performance.now();
    const gameSpeed = 55; // percent per second

    const loop = (now: number) => {
      const delta = Math.min((now - prevTime) / 1000, 0.05);
      prevTime = now;

      // Update pet jump physics
      if (isJumpingRef.current || petY > 0) {
        setPetY((y) => {
          velocityRef.current -= 340 * delta; // gravity
          const nextY = y + velocityRef.current * delta;
          if (nextY <= 0) {
            velocityRef.current = 0;
            isJumpingRef.current = false;
            return 0;
          }
          return nextY;
        });
      }

      // Update distance
      setDistance((d) => d + Math.round(gameSpeed * delta));

      // Spawn obstacles
      if (now - lastObstacleSpawnRef.current > 1600 + Math.random() * 800) {
        lastObstacleSpawnRef.current = now;
        const types: ('rock' | 'fence' | 'bush')[] = ['rock', 'fence', 'bush'];
        obstaclesRef.current.push({
          id: now + Math.random(),
          x: 105,
          type: types[Math.floor(Math.random() * types.length)],
        });
      }

      // Spawn coins
      if (now - lastCoinSpawnRef.current > 1200 + Math.random() * 600) {
        lastCoinSpawnRef.current = now;
        coinsRef.current.push({
          id: now + Math.random(),
          x: 105,
          y: 35 + Math.random() * 30,
          collected: false,
        });
      }

      // Move obstacles and check collisions
      // Pet horizontal position is fixed at 18%
      const petBox = { left: 16, right: 23, bottom: petY };

      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const obs = obstaclesRef.current[i];
        obs.x -= gameSpeed * delta;

        // Collision check
        if (obs.x >= petBox.left && obs.x <= petBox.right) {
          if (petBox.bottom < 22) {
            // Hit obstacle!
            soundManager.playPop();
            setGameOver(true);
            return;
          }
        }

        if (obs.x < -10) {
          obstaclesRef.current.splice(i, 1);
        }
      }

      // Move coins and check collection
      for (let i = coinsRef.current.length - 1; i >= 0; i--) {
        const coin = coinsRef.current[i];
        coin.x -= gameSpeed * delta;

        if (!coin.collected && Math.abs(coin.x - 20) < 6 && Math.abs(petY - (80 - coin.y)) < 24) {
          coin.collected = true;
          soundManager.playCoin();
          setCoinsCollected((c) => c + 1);
        }

        if (coin.x < -10) {
          coinsRef.current.splice(i, 1);
        }
      }

      setRenderObstacles([...obstaclesRef.current]);
      setRenderCoins([...coinsRef.current]);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [gameOver, petY]);

  const handleCollect = () => {
    const totalCoins = coinsCollected * 5 + Math.round(distance / 50);
    const xpEarned = Math.max(20, Math.round(distance / 40));
    soundManager.playLevelUp();
    onFinishGame(totalCoins, xpEarned);
  };

  const restartGame = () => {
    setDistance(0);
    setCoinsCollected(0);
    setPetY(0);
    velocityRef.current = 0;
    isJumpingRef.current = false;
    obstaclesRef.current = [];
    coinsRef.current = [];
    setRenderObstacles([]);
    setRenderCoins([]);
    setGameOver(false);
  };

  return (
    <div
      onPointerDown={jump}
      className="relative w-full h-full flex flex-col bg-gradient-to-b from-sky-300 via-sky-100 to-amber-50 rounded-3xl overflow-hidden select-none cursor-pointer"
    >
      {/* Top Header */}
      <div className="p-3 bg-white/80 backdrop-blur-xs flex items-center justify-between border-b border-sky-200 z-20">
        <button
          id="btn-exit-runner"
          onPointerDown={(e) => {
            e.stopPropagation();
            onExit();
          }}
          className="p-1.5 rounded-xl bg-white shadow-xs border border-stone-200 text-stone-600 hover:bg-stone-100"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-center gap-3 font-bubble">
          <div className="bg-amber-100 px-3 py-1 rounded-xl border border-amber-300 text-amber-800 text-xs font-bold flex items-center gap-1">
            <span>🪙</span>
            <span>{coinsCollected}</span>
          </div>

          <div className="bg-white px-3 py-1 rounded-xl border border-stone-200 text-stone-700 text-xs font-bold">
            🏃 {distance}m
          </div>
        </div>
      </div>

      {/* Runner Meadow Area */}
      <div id="runner-track" className="relative flex-1 w-full overflow-hidden">
        {/* Animated Background Clouds */}
        <div className="absolute top-4 left-6 text-3xl opacity-60">☁️</div>
        <div className="absolute top-12 right-12 text-2xl opacity-50">☁️</div>

        {/* Floating Coins */}
        {renderCoins.map((coin) => (
          !coin.collected && (
            <div
              key={coin.id}
              className="absolute text-xl -translate-x-1/2 -translate-y-1/2 animate-bounce"
              style={{ left: `${coin.x}%`, top: `${coin.y}%` }}
            >
              🪙
            </div>
          )
        ))}

        {/* Obstacles */}
        {renderObstacles.map((obs) => (
          <div
            key={obs.id}
            className="absolute bottom-10 -translate-x-1/2 text-2xl"
            style={{ left: `${obs.x}%` }}
          >
            {obs.type === 'rock' && '🪨'}
            {obs.type === 'fence' && '🪵'}
            {obs.type === 'bush' && '🌿'}
          </div>
        ))}

        {/* Player Pet */}
        <div
          id="runner-player-pet"
          className="absolute left-[18%] transition-transform duration-75 text-4xl"
          style={{ bottom: `${40 + petY * 1.6}px` }}
        >
          <div className="relative">
            {petType === 'hamster' ? '🐹' : petType === 'cat' ? '🐱' : '🐾'}
          </div>
        </div>

        {/* Ground track */}
        <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-emerald-600 to-emerald-500 border-t-4 border-emerald-400 flex items-center px-4 overflow-hidden">
          <div className="text-xs text-emerald-200 font-bold tracking-widest whitespace-nowrap">
            🌱 🌸 🌱 🌼 🌱 🌸 🌱 🌼 🌱 🌸 🌱 🌼 🌱 🌸 🌱 🌼 🌱
          </div>
        </div>

        {/* Mobile Jump Button Helper */}
        <div className="absolute bottom-14 right-4 z-10">
          <button
            id="btn-runner-jump"
            onPointerDown={(e) => {
              e.stopPropagation();
              jump();
            }}
            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bubble text-sm font-bold shadow-lg border-2 border-amber-300 active:scale-95 flex items-center gap-1.5"
          >
            ⬆️ JUMP!
          </button>
        </div>
      </div>

      {/* Game Over Modal */}
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
              Great Run!
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Your pet dashed {distance} meters and caught coins!
            </p>

            <div className="my-4 p-3 bg-amber-50 rounded-2xl border border-amber-200 flex justify-around">
              <div>
                <div className="text-xs text-stone-500 font-bold">Distance</div>
                <div className="font-bubble text-lg font-bold text-stone-800">{distance}m</div>
              </div>
              <div className="border-r border-amber-200" />
              <div>
                <div className="text-xs text-stone-500 font-bold">Reward</div>
                <div className="font-bubble text-lg font-bold text-amber-600">
                  +{coinsCollected * 5 + Math.round(distance / 50)} 🪙
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                id="btn-runner-retry"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  restartGame();
                }}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bubble text-xs font-bold rounded-xl flex items-center justify-center gap-1"
              >
                <RefreshCw size={14} /> Retry
              </button>
              <button
                id="btn-runner-collect"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  handleCollect();
                }}
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
