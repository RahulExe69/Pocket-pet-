import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Flag, Eye, Play, RotateCcw, X, Zap, Award, Sparkles, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../../utils/audio';
import { MultiplayerMiniGameType, MultiplayerPlayer } from '../../types';

interface MultiplayerMiniGamesProps {
  isOpen: boolean;
  onClose: () => void;
  activeGame: MultiplayerMiniGameType | null;
  onSelectGame: (game: MultiplayerMiniGameType) => void;
  playerPet: { name: string; id: string; type: string };
  friendPet: MultiplayerPlayer | null;
  onReward: (coins: number, xp: number) => void;
  onSyncGameEvent?: (event: any) => void;
}

export const MultiplayerMiniGames: React.FC<MultiplayerMiniGamesProps> = ({
  isOpen,
  onClose,
  activeGame,
  onSelectGame,
  playerPet,
  friendPet,
  onReward,
  onSyncGameEvent,
}) => {
  // Opponent name & id fallback
  const opponent = friendPet || {
    petName: 'Mochi',
    petId: 'HAM-2981',
    petType: 'hamster' as const,
    position: { x: 0, z: 0 },
    action: 'idle' as const,
    lastPing: Date.now(),
    isBot: true,
  };

  // RACE GAME STATE
  const [raceCountdown, setRaceCountdown] = useState<number | null>(null);
  const [raceActive, setRaceActive] = useState(false);
  const [playerProgress, setPlayerProgress] = useState(0);
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [raceWinner, setRaceWinner] = useState<'player' | 'opponent' | null>(null);
  const opponentIntervalRef = useRef<any>(null);

  // HIDE & SEEK GAME STATE
  const HIDING_SPOTS = [
    { id: 'bed', name: 'Cloud Bed', icon: '☁️', desc: 'Tucked beneath the cozy duvet' },
    { id: 'food', name: 'Seed Corner', icon: '🌻', desc: 'Snacking behind the big bowls' },
    { id: 'shelf', name: 'Toy Corner', icon: '🧸', desc: 'Hiding behind plushies and yarn' },
  ];
  const [hiddenSpot, setHiddenSpot] = useState<string>('bed');
  const [searchedSpots, setSearchedSpots] = useState<string[]>([]);
  const [seekFound, setSeekFound] = useState(false);
  const [seekRound, setSeekRound] = useState(1);
  const [seekScore, setSeekScore] = useState(0);

  // BALL PLAY GAME STATE
  const [ballRally, setBallRally] = useState(0);
  const [ballTurn, setBallTurn] = useState<'player' | 'opponent'>('player');
  const [ballMessage, setBallMessage] = useState('Pass the ball to start the rally!');
  const [ballKicking, setBallKicking] = useState(false);

  // Clean up timers on game change
  useEffect(() => {
    if (opponentIntervalRef.current) {
      clearInterval(opponentIntervalRef.current);
    }
  }, [activeGame]);

  // Handle Race Start
  const startRace = () => {
    setRaceWinner(null);
    setPlayerProgress(0);
    setOpponentProgress(0);
    setRaceCountdown(3);
    setRaceActive(false);

    soundManager.playPop();

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setRaceCountdown(count);
        soundManager.playPop();
      } else if (count === 0) {
        setRaceCountdown(0);
        setRaceActive(true);
        soundManager.playLevelUp();

        // Start opponent runner simulation
        opponentIntervalRef.current = setInterval(() => {
          setOpponentProgress((prev) => {
            if (prev >= 100) {
              clearInterval(opponentIntervalRef.current);
              return 100;
            }
            // Steady opponent speed with slight randomness
            const next = prev + 3.2 + Math.random() * 2.8;
            if (next >= 100) {
              clearInterval(opponentIntervalRef.current);
              setRaceWinner('opponent');
              setRaceActive(false);
              return 100;
            }
            return next;
          });
        }, 180);
      } else {
        clearInterval(interval);
        setRaceCountdown(null);
      }
    }, 900);
  };

  // Player Tap to Dash in Race
  const handlePlayerDash = () => {
    if (!raceActive || raceWinner) return;

    soundManager.playSqueak();
    setPlayerProgress((prev) => {
      const next = prev + 6.5;
      if (next >= 100) {
        clearInterval(opponentIntervalRef.current);
        setRaceActive(false);
        setRaceWinner('player');
        soundManager.playFanfare();
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        onReward(50, 35);
        return 100;
      }
      return next;
    });

    if (onSyncGameEvent) {
      onSyncGameEvent({ type: 'RACE_STEP', playerProgress });
    }
  };

  // Handle Hide & Seek Search
  const startHideAndSeek = () => {
    const randomSpot = HIDING_SPOTS[Math.floor(Math.random() * HIDING_SPOTS.length)].id;
    setHiddenSpot(randomSpot);
    setSearchedSpots([]);
    setSeekFound(false);
    setSeekRound(1);
    setSeekScore(0);
    soundManager.playPop();
  };

  const handleSpotSearch = (spotId: string) => {
    if (searchedSpots.includes(spotId) || seekFound) return;

    soundManager.playPop();
    const newSearched = [...searchedSpots, spotId];
    setSearchedSpots(newSearched);

    if (spotId === hiddenSpot) {
      setSeekFound(true);
      setSeekScore((prev) => prev + (4 - newSearched.length) * 15);
      soundManager.playFanfare();
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.65 } });
      onReward(40, 25);
    } else {
      soundManager.playSqueak();
    }
  };

  const nextSeekRound = () => {
    const randomSpot = HIDING_SPOTS[Math.floor(Math.random() * HIDING_SPOTS.length)].id;
    setHiddenSpot(randomSpot);
    setSearchedSpots([]);
    setSeekFound(false);
    setSeekRound((prev) => prev + 1);
  };

  // Handle Ball Play Kick
  const startBallPlay = () => {
    setBallRally(0);
    setBallTurn('player');
    setBallMessage('Tap "Kick Ball" to kick to your friend!');
    soundManager.playPop();
  };

  const handleKickBall = () => {
    if (ballKicking || ballTurn !== 'player') return;

    setBallKicking(true);
    soundManager.playPop();
    setBallMessage(`${playerPet.name} kicked the ball! ⚽💨`);

    setTimeout(() => {
      const nextRally = ballRally + 1;
      setBallRally(nextRally);
      setBallTurn('opponent');
      setBallMessage(`${opponent.petName} is running to return the pass! 🐾`);

      // Opponent return kick
      setTimeout(() => {
        soundManager.playPop();
        soundManager.playSqueak();
        const opponentReturnRally = nextRally + 1;
        setBallRally(opponentReturnRally);
        setBallTurn('player');
        setBallKicking(false);
        setBallMessage(`Great pass! ${opponent.petName} passed it back! 🎾`);

        if (opponentReturnRally % 4 === 0) {
          confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
          soundManager.playCelebration();
          onReward(25, 15);
        }
      }, 1300);
    }, 700);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-900/60 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 15 }}
        className="relative w-full max-w-sm bg-white rounded-3xl border-2 border-amber-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎮</span>
            <div>
              <h2 className="font-bubble text-base font-extrabold tracking-wide">Multiplayer Mini-Games</h2>
              <p className="text-[11px] text-pink-100 font-medium">
                {playerPet.name} & {opponent.petName}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playPop();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-amber-100 bg-amber-50/60 p-1.5 gap-1">
          <button
            onClick={() => {
              soundManager.playPop();
              onSelectGame('race');
              startRace();
            }}
            className={`flex-1 py-2 rounded-xl font-bubble text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              activeGame === 'race'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Flag size={14} /> Race
          </button>
          <button
            onClick={() => {
              soundManager.playPop();
              onSelectGame('hide-and-seek');
              startHideAndSeek();
            }}
            className={`flex-1 py-2 rounded-xl font-bubble text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              activeGame === 'hide-and-seek'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-rose-800 hover:bg-rose-100'
            }`}
          >
            <Eye size={14} /> Hide & Seek
          </button>
          <button
            onClick={() => {
              soundManager.playPop();
              onSelectGame('ball-play');
              startBallPlay();
            }}
            className={`flex-1 py-2 rounded-xl font-bubble text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              activeGame === 'ball-play'
                ? 'bg-indigo-500 text-white shadow-xs'
                : 'text-indigo-800 hover:bg-indigo-100'
            }`}
          >
            <span>⚽</span> Ball Play
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col justify-between">
          {/* 1. RACE GAME */}
          {activeGame === 'race' && (
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-3xl">🏁</span>
                <h3 className="font-bubble text-base font-extrabold text-stone-800">Hamster Sprint Race</h3>
                <p className="text-xs text-stone-500">Tap repeatedly to sprint across the pink room!</p>
              </div>

              {/* Countdown or Winner Banner */}
              {raceCountdown !== null && (
                <div className="p-3 bg-amber-100 border border-amber-300 rounded-2xl text-center">
                  <span className="font-bubble text-2xl font-black text-amber-700 animate-bounce block">
                    {raceCountdown === 0 ? 'GO!! 🚀' : raceCountdown}
                  </span>
                  <span className="text-xs text-amber-800 font-bold">Get ready to tap fast!</span>
                </div>
              )}

              {raceWinner && (
                <div
                  className={`p-3 rounded-2xl text-center border ${
                    raceWinner === 'player'
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                      : 'bg-rose-100 border-rose-300 text-rose-800'
                  }`}
                >
                  <Trophy size={28} className="mx-auto mb-1 text-amber-500" />
                  <h4 className="font-bubble text-base font-extrabold">
                    {raceWinner === 'player' ? `🏆 ${playerPet.name} Won!` : `🎉 ${opponent.petName} Won!`}
                  </h4>
                  <p className="text-xs font-medium">
                    {raceWinner === 'player'
                      ? 'Incredible sprinting! +50 Coins & +35 XP earned!'
                      : 'Great race! Tap restart for a rematch!'}
                  </p>
                </div>
              )}

              {/* Progress Bars */}
              <div className="space-y-3 bg-stone-50 p-3 rounded-2xl border border-stone-200">
                {/* Player Track */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-stone-700 mb-1">
                    <span className="flex items-center gap-1">
                      <span>🐹</span> {playerPet.name} (You)
                    </span>
                    <span>{Math.min(100, Math.round(playerProgress))}%</span>
                  </div>
                  <div className="w-full h-3.5 bg-stone-200 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-100"
                      style={{ width: `${Math.min(100, playerProgress)}%` }}
                    />
                  </div>
                </div>

                {/* Opponent Track */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-stone-700 mb-1">
                    <span className="flex items-center gap-1">
                      <span>🐾</span> {opponent.petName} ({opponent.petId})
                    </span>
                    <span>{Math.min(100, Math.round(opponentProgress))}%</span>
                  </div>
                  <div className="w-full h-3.5 bg-stone-200 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full transition-all duration-150"
                      style={{ width: `${Math.min(100, opponentProgress)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Race Controls */}
              <div className="pt-2">
                {!raceActive && !raceCountdown && (
                  <button
                    onClick={startRace}
                    className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bubble text-sm font-extrabold shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <Play size={18} /> Start Race
                  </button>
                )}

                {raceActive && (
                  <button
                    onClick={handlePlayerDash}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-bubble text-base font-black shadow-lg shadow-amber-500/30 active:scale-90 transition-transform flex items-center justify-center gap-2 animate-pulse select-none cursor-pointer"
                  >
                    <Zap size={22} className="text-yellow-200" /> TAP TO DASH!! 🐾
                  </button>
                )}

                {raceWinner && (
                  <button
                    onClick={startRace}
                    className="w-full mt-2 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bubble text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RotateCcw size={14} /> Rematch
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 2. HIDE & SEEK GAME */}
          {activeGame === 'hide-and-seek' && (
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-3xl">🙈</span>
                <h3 className="font-bubble text-base font-extrabold text-stone-800">
                  Round {seekRound}: Find {opponent.petName}!
                </h3>
                <p className="text-xs text-stone-500">
                  {opponent.petName} is hiding in the room. Guess which spot they chose!
                </p>
              </div>

              {seekFound && (
                <div className="p-3 rounded-2xl bg-pink-100 border border-pink-300 text-center text-pink-800">
                  <Sparkles size={24} className="mx-auto mb-1 text-pink-500" />
                  <h4 className="font-bubble text-base font-extrabold">🎉 Peek-a-boo! You Found {opponent.petName}!</h4>
                  <p className="text-xs font-medium">+40 Coins & +25 XP awarded!</p>
                  <button
                    onClick={nextSeekRound}
                    className="mt-2.5 px-4 py-1.5 rounded-xl bg-pink-500 text-white font-bubble text-xs font-bold shadow-xs hover:bg-pink-600 transition-colors"
                  >
                    Next Round ➡️
                  </button>
                </div>
              )}

              {/* Hiding Spots Selection */}
              <div className="grid grid-cols-1 gap-2.5">
                {HIDING_SPOTS.map((spot) => {
                  const isSearched = searchedSpots.includes(spot.id);
                  const isCorrect = isSearched && spot.id === hiddenSpot;

                  return (
                    <button
                      key={spot.id}
                      onClick={() => handleSpotSearch(spot.id)}
                      disabled={isSearched || seekFound}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                        isCorrect
                          ? 'bg-emerald-100 border-emerald-400 text-emerald-900'
                          : isSearched
                          ? 'bg-stone-100 border-stone-200 opacity-60 text-stone-500'
                          : 'bg-white border-amber-200 hover:border-amber-400 hover:bg-amber-50/50 shadow-xs active:scale-98'
                      }`}
                    >
                      <span className="text-3xl p-1 bg-amber-50 rounded-xl border border-amber-100">{spot.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bubble text-sm font-extrabold">{spot.name}</h4>
                          {isSearched && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
                              {isCorrect ? 'FOUND! 💖' : 'Empty 💨'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500">{spot.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Score bar */}
              <div className="flex justify-between items-center bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-700">
                <span>Score: {seekScore} pts</span>
                <span className="text-stone-400">Attempts: {searchedSpots.length} / 3</span>
              </div>
            </div>
          )}

          {/* 3. BALL PLAY GAME */}
          {activeGame === 'ball-play' && (
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-3xl">⚽</span>
                <h3 className="font-bubble text-base font-extrabold text-stone-800">Co-op Hamster Ball Play</h3>
                <p className="text-xs text-stone-500">Kick the colorful bouncy ball back and forth!</p>
              </div>

              {/* Rally Badge */}
              <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-4 rounded-2xl border border-indigo-200 text-center">
                <span className="text-xs text-indigo-700 font-extrabold tracking-wider uppercase">Current Rally</span>
                <div className="font-bubble text-4xl font-black text-indigo-900 my-1 flex items-center justify-center gap-1.5">
                  <span>{ballRally}</span>
                  <span className="text-2xl">🔥</span>
                </div>
                <p className="text-xs text-stone-600 font-medium">{ballMessage}</p>
              </div>

              {/* Players facing off */}
              <div className="flex items-center justify-around p-3 bg-stone-50 rounded-2xl border border-stone-200">
                <div className="text-center">
                  <div
                    className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-2xl border-2 ${
                      ballTurn === 'player' ? 'border-indigo-500 bg-indigo-100 scale-105' : 'border-stone-200 bg-white'
                    }`}
                  >
                    🐹
                  </div>
                  <span className="text-xs font-extrabold text-stone-800 mt-1 block">{playerPet.name}</span>
                  <span className="text-[10px] text-stone-400 font-medium">Player</span>
                </div>

                <div className="text-xl animate-bounce">
                  <span>↔️</span>
                </div>

                <div className="text-center">
                  <div
                    className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-2xl border-2 ${
                      ballTurn === 'opponent' ? 'border-pink-500 bg-pink-100 scale-105' : 'border-stone-200 bg-white'
                    }`}
                  >
                    🐾
                  </div>
                  <span className="text-xs font-extrabold text-stone-800 mt-1 block">{opponent.petName}</span>
                  <span className="text-[10px] text-pink-600 font-medium font-mono">{opponent.petId}</span>
                </div>
              </div>

              {/* Kick Action Button */}
              <button
                onClick={handleKickBall}
                disabled={ballTurn !== 'player' || ballKicking}
                className={`w-full py-3.5 rounded-2xl font-bubble text-sm font-extrabold shadow-md flex items-center justify-center gap-2 transition-all ${
                  ballTurn === 'player' && !ballKicking
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 shadow-indigo-500/20'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
              >
                <span>⚽</span> {ballTurn === 'player' ? 'KICK BALL TO FRIEND!' : `${opponent.petName} is kicking...`}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
