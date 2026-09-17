import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, ShoppingBag } from 'lucide-react';
import { FoodItem, PetType } from '../types';
import { FOOD_CATALOG } from '../data/initialData';
import { soundManager } from '../utils/audio';

interface FoodDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: Record<string, number>;
  coins: number;
  petType: PetType;
  petLevel: number;
  onFeedItem: (food: FoodItem) => void;
  onBuyFood: (food: FoodItem) => void;
  onOpenShop: () => void;
}

export const FoodDrawer: React.FC<FoodDrawerProps> = ({
  isOpen,
  onClose,
  inventory,
  coins,
  petType,
  petLevel,
  onFeedItem,
  onBuyFood,
  onOpenShop,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div id="food-drawer-backdrop" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/40 backdrop-blur-xs">
          <motion.div
            id="food-drawer-panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="w-full max-w-lg bg-amber-50 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-amber-200/80 p-5 flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-amber-200/60">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🍎</span>
                <div>
                  <h3 className="font-bubble text-lg font-bold text-stone-800">Pet Pantry</h3>
                  <p className="text-xs text-stone-500">Tap to feed, or restock with coins</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-amber-100/90 text-amber-800 px-3 py-1 rounded-full text-xs font-bold border border-amber-300">
                  <span>🪙</span>
                  <span>{coins}</span>
                </div>
                <button
                  id="btn-close-food-drawer"
                  onClick={onClose}
                  className="p-1.5 rounded-full bg-stone-200/60 hover:bg-stone-300 text-stone-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Food Grid */}
            <div className="grid grid-cols-2 gap-3 py-4 overflow-y-auto no-scrollbar">
              {FOOD_CATALOG.map((food) => {
                const count = inventory[food.id] || 0;
                const isFavorite = food.favoriteFor?.includes(petType);
                const isLocked = food.levelRequired > petLevel;

                return (
                  <div
                    key={food.id}
                    className={`relative flex flex-col p-3 rounded-2xl border transition-all ${
                      count > 0
                        ? 'bg-white border-amber-200 shadow-sm hover:border-amber-400'
                        : 'bg-amber-100/40 border-dashed border-amber-200 opacity-90'
                    }`}
                  >
                    {/* Favorite badge */}
                    {isFavorite && (
                      <span className="absolute -top-2 -right-1 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                        Favorite! ❤️
                      </span>
                    )}

                    <div className="flex items-start gap-2.5">
                      <div className="text-3xl bg-amber-50 p-2 rounded-xl border border-amber-100 flex items-center justify-center shrink-0">
                        {food.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bubble text-sm font-bold text-stone-800 truncate">
                          {food.name}
                        </div>
                        <div className="text-[11px] text-stone-500 flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5 font-medium">
                          <span className="text-emerald-600">+{food.hungerBoost} 🍖</span>
                          <span className="text-rose-500">+{food.happinessBoost} ❤️</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-stone-600 mt-2 line-clamp-1">
                      {food.description}
                    </p>

                    {/* Footer Action */}
                    <div className="mt-3 pt-2 border-t border-amber-100 flex items-center justify-between gap-2">
                      <div className="text-xs font-bold text-stone-700">
                        In Bag: <span className={count > 0 ? 'text-amber-700' : 'text-stone-400'}>{count}</span>
                      </div>

                      {count > 0 ? (
                        <button
                          id={`btn-feed-${food.id}`}
                          onClick={() => {
                            soundManager.playEat();
                            onFeedItem(food);
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bubble text-xs font-bold rounded-xl shadow-xs hover:scale-105 active:scale-95 transition-all"
                        >
                          Feed 🍴
                        </button>
                      ) : (
                        <button
                          id={`btn-buy-food-${food.id}`}
                          disabled={coins < food.price || isLocked}
                          onClick={() => {
                            if (coins >= food.price && !isLocked) {
                              soundManager.playCoin();
                              onBuyFood(food);
                            }
                          }}
                          className={`px-2.5 py-1.5 rounded-xl font-bubble text-xs font-bold flex items-center gap-1 shadow-xs transition-all ${
                            isLocked
                              ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                              : coins < food.price
                              ? 'bg-amber-200 text-amber-600 cursor-not-allowed'
                              : 'bg-amber-500 text-white hover:bg-amber-600 active:scale-95'
                          }`}
                        >
                          {isLocked ? (
                            `Lvl ${food.levelRequired}`
                          ) : (
                            <>
                              <Plus size={12} />
                              <span>{food.price} 🪙</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Quick Shop Button */}
            <div className="pt-3 border-t border-amber-200/70 flex justify-between items-center">
              <span className="text-xs text-stone-500 font-medium">Need more toys or outfits?</span>
              <button
                id="btn-drawer-to-shop"
                onClick={() => {
                  onClose();
                  onOpenShop();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-800 text-white font-bubble text-xs font-bold rounded-xl hover:bg-stone-900 transition-colors"
              >
                <ShoppingBag size={14} /> Open Full Shop
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
