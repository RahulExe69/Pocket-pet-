import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Volume2, VolumeX, Bell, BellOff, RotateCcw, Heart, Info } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
  notificationsEnabled: boolean;
  onToggleNotifications: (enabled: boolean) => void;
  onResetPet: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  soundEnabled,
  onToggleSound,
  notificationsEnabled,
  onToggleNotifications,
  onResetPet,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="settings-modal-backdrop" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/50 backdrop-blur-xs">
          <motion.div
            id="settings-modal-card"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 p-5 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚙️</span>
                <div>
                  <h2 className="font-bubble text-xl font-bold text-stone-800">Game Settings</h2>
                  <p className="text-xs text-stone-500">Audio, notifications & game options</p>
                </div>
              </div>

              <button
                id="btn-close-settings"
                onClick={onClose}
                className="p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-3">
              {/* Sound Effects Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl text-lg ${soundEnabled ? 'bg-amber-100 text-amber-800' : 'bg-stone-200 text-stone-400'}`}>
                    {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                  </div>
                  <div>
                    <div className="font-bubble text-sm font-bold text-stone-800">Sound Effects</div>
                    <div className="text-xs text-stone-500">Pet purrs, chomping, and chime audio</div>
                  </div>
                </div>

                <button
                  id="btn-toggle-sound"
                  onClick={() => {
                    const next = !soundEnabled;
                    onToggleSound(next);
                    if (next) soundManager.playPop();
                  }}
                  className={`w-12 h-6.5 flex items-center rounded-full p-1 transition-colors ${
                    soundEnabled ? 'bg-emerald-500' : 'bg-stone-300'
                  }`}
                >
                  <div
                    className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                      soundEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* In-Game Care Reminders & Notifications */}
              <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl text-lg ${notificationsEnabled ? 'bg-indigo-100 text-indigo-800' : 'bg-stone-200 text-stone-400'}`}>
                    {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
                  </div>
                  <div>
                    <div className="font-bubble text-sm font-bold text-stone-800">Pet Care Reminders</div>
                    <div className="text-xs text-stone-500">Alerts when pet is hungry, sleepy or wants to play</div>
                  </div>
                </div>

                <button
                  id="btn-toggle-notifications"
                  onClick={() => {
                    soundManager.playPop();
                    onToggleNotifications(!notificationsEnabled);
                  }}
                  className={`w-12 h-6.5 flex items-center rounded-full p-1 transition-colors ${
                    notificationsEnabled ? 'bg-indigo-600' : 'bg-stone-300'
                  }`}
                >
                  <div
                    className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                      notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* App Info with Official App Icon */}
              <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200/80 text-xs text-stone-600 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl overflow-hidden border border-amber-300 shadow-xs shrink-0 bg-white">
                  <img
                    src="/pocket_pet_icon.png"
                    alt="Pocket Pet Official Icon"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <div className="font-bubble text-xs font-bold text-stone-800">Pocket Pet Mobile</div>
                  <div className="text-[11px] text-stone-500 leading-tight">Your offline-first virtual companion. All progress is saved safely!</div>
                </div>
              </div>

              {/* Reset Game Data */}
              <div className="pt-2">
                {showResetConfirm ? (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl">
                    <p className="text-xs font-bold text-rose-700 mb-2 text-center">
                      Are you sure? This will adopt a new pet and reset your coins and closet!
                    </p>
                    <div className="flex gap-2">
                      <button
                        id="btn-cancel-reset"
                        onClick={() => setShowResetConfirm(false)}
                        className="flex-1 py-1.5 bg-stone-200 text-stone-700 font-bubble text-xs font-bold rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        id="btn-confirm-reset"
                        onClick={() => {
                          setShowResetConfirm(false);
                          onResetPet();
                          onClose();
                        }}
                        className="flex-1 py-1.5 bg-rose-600 text-white font-bubble text-xs font-bold rounded-xl shadow-xs"
                      >
                        Yes, Start Fresh
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    id="btn-trigger-reset"
                    onClick={() => setShowResetConfirm(true)}
                    className="w-full py-2.5 px-3 rounded-2xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bubble text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RotateCcw size={14} /> Adopt a New Pet / Reset Progress
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Footer */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
              <span className="flex items-center gap-1">
                Made with <Heart size={12} className="text-rose-500 fill-rose-500" /> for pet lovers
              </span>
              <button
                id="btn-settings-close-done"
                onClick={onClose}
                className="px-4 py-1.5 bg-stone-800 text-white font-bubble text-xs font-bold rounded-xl hover:bg-stone-900"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
