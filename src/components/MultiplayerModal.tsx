import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Copy,
  Check,
  Play,
  LogOut,
  Sparkles,
  PlusCircle,
  KeyRound,
  Trophy,
  Flag,
  Eye,
  X,
  Share2,
  Bot,
} from 'lucide-react';
import { PetState, MultiplayerRoom, MultiplayerMiniGameType } from '../types';
import { soundManager } from '../utils/audio';

interface MultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pet: PetState;
  currentRoom: MultiplayerRoom | null;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onLeaveRoom: () => void;
  onSimulateFriend: () => void;
  onLaunchMiniGame?: (game: MultiplayerMiniGameType) => void;
  onOpenMiniGames?: () => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  isOpen,
  onClose,
  pet,
  currentRoom,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onSimulateFriend,
  onLaunchMiniGame,
  onOpenMiniGames,
}) => {
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPetId, setCopiedPetId] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyCode = (code: string) => {
    soundManager.playPop();
    try {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Ignored
    }
  };

  const handleCopyPetId = () => {
    soundManager.playPop();
    try {
      navigator.clipboard.writeText(pet.id);
      setCopiedPetId(true);
      setTimeout(() => setCopiedPetId(false), 2000);
    } catch {
      // Ignored
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    const code = joinCodeInput.trim();
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      setJoinError('Please enter a valid 6-digit room code.');
      soundManager.playSqueak();
      return;
    }
    soundManager.playPop();
    onJoinRoom(code);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-900/60 backdrop-blur-xs select-none">
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 15 }}
        className="relative w-full max-w-sm bg-white rounded-3xl border-2 border-pink-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Users size={18} />
            </div>
            <div>
              <h2 className="font-bubble text-base font-extrabold tracking-wide">Multiplayer Playroom</h2>
              <p className="text-[11px] text-pink-100 font-medium">Play together in the pink room!</p>
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

        {/* Pet ID Tag Bar */}
        <div className="bg-amber-50/80 px-4 py-2 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-amber-900">Your Pet ID:</span>
            <span className="font-mono font-extrabold text-xs text-amber-700 bg-white px-2 py-0.5 rounded-lg border border-amber-300 shadow-2xs">
              {pet.id}
            </span>
          </div>
          <button
            onClick={handleCopyPetId}
            className="flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-900 bg-amber-200/60 hover:bg-amber-200 px-2 py-1 rounded-lg transition-colors"
          >
            {copiedPetId ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
            <span>{copiedPetId ? 'Copied!' : 'Copy ID'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* VIEW 1: NOT IN A ROOM */}
          {!currentRoom ? (
            <div className="space-y-3.5">
              {/* Option 1: Create Room */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-200 text-left space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-pink-500 text-white flex items-center justify-center shadow-xs">
                    <PlusCircle size={22} />
                  </div>
                  <div>
                    <h3 className="font-bubble text-sm font-black text-pink-950">Option 1: Create Room</h3>
                    <p className="text-[11px] text-pink-800/80">Generates a 6-digit code for your friend</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    soundManager.playPop();
                    onCreateRoom();
                  }}
                  className="w-full py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 active:scale-95 text-white font-bubble text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={14} /> Generate 6-Digit Room
                </button>
              </div>

              {/* Option 2: Join Room */}
              <form
                onSubmit={handleJoinSubmit}
                className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 text-left space-y-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <KeyRound size={22} />
                  </div>
                  <div>
                    <h3 className="font-bubble text-sm font-black text-amber-950">Option 2: Join Room</h3>
                    <p className="text-[11px] text-amber-800/80">Enter a 6-digit code to enter friend's room</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 482910"
                    value={joinCodeInput}
                    onChange={(e) => {
                      setJoinCodeInput(e.target.value.replace(/\D/g, ''));
                      setJoinError(null);
                    }}
                    className="flex-1 px-3 py-2 text-center font-mono font-black text-base tracking-widest bg-white rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-amber-950 placeholder:text-stone-300"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bubble text-xs font-extrabold shadow-sm transition-all"
                  >
                    Join Room
                  </button>
                </div>

                {joinError && <p className="text-[11px] font-bold text-rose-600">{joinError}</p>}
              </form>

              {/* Realtime Inter-tab tip */}
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-[11px] text-stone-600 flex items-start gap-2">
                <span className="text-base">💡</span>
                <p>
                  <strong className="text-stone-800">Multiplayer Demo Sync:</strong> Open this app in another tab or
                  browser window to see real-time movements, dancing, and mini-games synced live between both hamsters!
                </p>
              </div>
            </div>
          ) : (
            /* VIEW 2: IN A ROOM */
            <div className="space-y-3.5">
              {/* Active Room Code Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-100 via-rose-100 to-amber-100 border border-pink-300 text-center space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-pink-700">Room Code</span>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono text-2xl font-black text-pink-950 tracking-widest">
                    #{currentRoom.code}
                  </span>
                  <button
                    onClick={() => handleCopyCode(currentRoom.code)}
                    className="p-1.5 rounded-xl bg-white/80 hover:bg-white text-pink-700 border border-pink-200 shadow-2xs transition-colors"
                    title="Copy Code"
                  >
                    {copiedCode ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-[10px] text-pink-800 font-medium">Share this 6-digit code with your friend</p>
              </div>

              {/* Connected Players Status */}
              <div className="space-y-2">
                <span className="text-xs font-extrabold text-stone-700 block">Connected Hamsters (in room):</span>

                {/* Host Card */}
                <div className="p-2.5 rounded-xl bg-white border border-amber-200 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">👑</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bubble text-xs font-bold text-stone-800">
                          {currentRoom.host.petName}
                        </span>
                        <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                          Host
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-stone-400">ID: {currentRoom.host.petId}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    In Room 🟢
                  </span>
                </div>

                {/* Guest Card */}
                {currentRoom.guest ? (
                  <div className="p-2.5 rounded-xl bg-white border border-pink-200 shadow-2xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">💖</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bubble text-xs font-bold text-stone-800">
                            {currentRoom.guest.petName}
                          </span>
                          <span className="text-[9px] bg-pink-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                            Friend
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-pink-600">ID: {currentRoom.guest.petId}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Connected 🟢
                    </span>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-pink-50/70 border border-dashed border-pink-300 text-center space-y-2">
                    <div className="flex items-center justify-center gap-1.5 text-pink-700 text-xs font-bold animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-pink-500" />
                      <span>Waiting for friend to enter #{currentRoom.code}...</span>
                    </div>
                    <button
                      onClick={() => {
                        soundManager.playPop();
                        onSimulateFriend();
                      }}
                      className="w-full py-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-800 font-bubble text-[11px] font-bold border border-pink-200 flex items-center justify-center gap-1 transition-colors"
                    >
                      <Bot size={13} /> 🎮 Simulate AI Friend Join (Demo)
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Launch Mini-Games */}
              <div className="pt-2 border-t border-stone-200 space-y-2">
                <span className="text-xs font-extrabold text-stone-800 flex items-center gap-1">
                  <Trophy size={14} className="text-amber-500" /> Mini-Games:
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      soundManager.playPop();
                      onLaunchMiniGame('race');
                      onClose();
                    }}
                    className="p-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-center active:scale-95 transition-all shadow-2xs flex flex-col items-center"
                  >
                    <span className="text-2xl mb-1">🏁</span>
                    <span className="font-bubble text-xs font-extrabold text-amber-900">Race</span>
                    <span className="text-[9px] text-amber-700 font-medium">Sprint!</span>
                  </button>

                  <button
                    onClick={() => {
                      soundManager.playPop();
                      onLaunchMiniGame('hide-and-seek');
                      onClose();
                    }}
                    className="p-2.5 rounded-2xl bg-pink-50 hover:bg-pink-100 border border-pink-200 text-center active:scale-95 transition-all shadow-2xs flex flex-col items-center"
                  >
                    <span className="text-2xl mb-1">🙈</span>
                    <span className="font-bubble text-xs font-extrabold text-pink-900">Hide & Seek</span>
                    <span className="text-[9px] text-pink-700 font-medium">Peek-a-boo!</span>
                  </button>

                  <button
                    onClick={() => {
                      soundManager.playPop();
                      onLaunchMiniGame('ball-play');
                      onClose();
                    }}
                    className="p-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-center active:scale-95 transition-all shadow-2xs flex flex-col items-center"
                  >
                    <span className="text-2xl mb-1">⚽</span>
                    <span className="font-bubble text-xs font-extrabold text-indigo-900">Ball Play</span>
                    <span className="text-[9px] text-indigo-700 font-medium">Pass Rally!</span>
                  </button>
                </div>
              </div>

              {/* Leave Room Button */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    soundManager.playPop();
                    onLeaveRoom();
                  }}
                  className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bubble text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <LogOut size={14} /> Leave Room
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
