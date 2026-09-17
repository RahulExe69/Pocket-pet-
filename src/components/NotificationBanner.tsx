import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationBannerProps {
  notification: AppNotification | null;
  onDismiss: () => void;
  onAction?: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  notification,
  onDismiss,
  onAction,
}) => {
  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="fixed top-3 inset-x-3 sm:inset-x-auto sm:right-6 sm:w-96 z-50 pointer-events-auto"
        >
          <div
            onClick={onAction}
            className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-xl border-2 border-amber-300 flex items-center justify-between gap-3 cursor-pointer hover:border-amber-400 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-xl shrink-0">
              {notification.type === 'hunger' && '🥕'}
              {notification.type === 'play' && '🎾'}
              {notification.type === 'sleep' && '😴'}
              {notification.type === 'clean' && '🫧'}
              {notification.type === 'general' && '🔔'}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-bubble text-xs font-bold text-stone-800 truncate">
                {notification.title}
              </div>
              <div className="text-[11px] text-stone-600 truncate mt-0.5">
                {notification.message}
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
