import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Lock, ShoppingBag } from 'lucide-react';
import { ShopItem, ShopCategory, FoodItem } from '../types';
import { SHOP_ITEMS, FOOD_CATALOG } from '../data/initialData';
import { soundManager } from '../utils/audio';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  petLevel: number;
  unlockedItems: string[];
  inventory: Record<string, number>;
  onPurchaseItem: (item: ShopItem) => void;
  onPurchaseFood: (food: FoodItem) => void;
  onOpenCustomization: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  onClose,
  coins,
  petLevel,
  unlockedItems,
  inventory,
  onPurchaseItem,
  onPurchaseFood,
  onOpenCustomization,
}) => {
  const [activeCategory, setActiveCategory] = useState<ShopCategory>('accessories');

  const categories: { key: ShopCategory; label: string; icon: string }[] = [
    { key: 'accessories', label: 'Hats & Clips', icon: '👒' },
    { key: 'outfits', label: 'Outfits', icon: '👗' },
    { key: 'toys', label: 'Toys', icon: '🎾' },
    { key: 'food', label: 'Food Store', icon: '🍎' },
    { key: 'beds', label: 'Beds', icon: '☁️' },
    { key: 'wallpapers', label: 'Walls', icon: '🖼️' },
    { key: 'decor', label: 'Decor', icon: '🪴' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="shop-modal-backdrop" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/50 backdrop-blur-xs">
          <motion.div
            id="shop-modal-card"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-xl bg-amber-50/95 backdrop-blur-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-amber-200 p-5 flex flex-col max-h-[90vh]"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-amber-200">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/20 flex items-center justify-center text-xl text-amber-800">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h2 className="font-bubble text-xl font-bold text-stone-800">Pet Boutique</h2>
                  <p className="text-xs text-stone-500">Delight your companion with cute goods</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-amber-200/70 border border-amber-300 px-3.5 py-1.5 rounded-full text-xs font-bold text-amber-900 shadow-xs">
                  <span>🪙</span>
                  <span className="font-bubble text-sm">{coins}</span>
                </div>
                <button
                  id="btn-close-shop"
                  onClick={onClose}
                  className="p-1.5 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex gap-1.5 py-3 overflow-x-auto no-scrollbar border-b border-amber-200/50">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    id={`shop-tab-${cat.key}`}
                    onClick={() => {
                      soundManager.playClick();
                      setActiveCategory(cat.key);
                    }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bubble font-bold transition-all shrink-0 ${
                      isActive
                        ? 'bg-amber-500 text-white shadow-xs scale-105'
                        : 'bg-white/80 text-stone-600 border border-amber-200/60 hover:bg-amber-100/50'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Item Catalog Grid */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-3 min-h-[280px]">
              {activeCategory === 'food' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  {FOOD_CATALOG.map((food) => {
                    const isLocked = food.levelRequired > petLevel;
                    const canAfford = coins >= food.price;
                    const count = inventory[food.id] || 0;

                    return (
                      <div
                        key={food.id}
                        className="bg-white p-3 rounded-2xl border border-amber-200/80 shadow-xs flex flex-col justify-between"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="text-3xl bg-amber-50 p-2 rounded-xl border border-amber-100 flex items-center justify-center shrink-0">
                            {food.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bubble text-sm font-bold text-stone-800 truncate">
                              {food.name}
                            </div>
                            <div className="text-[11px] text-stone-500 font-medium mt-0.5">
                              +{food.hungerBoost} 🍖 +{food.happinessBoost} ❤️
                            </div>
                            <div className="text-[10px] text-amber-700 font-bold mt-1">
                              Owned: {count}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-amber-100 flex items-center justify-between">
                          <span className="font-bubble text-sm font-bold text-amber-700 flex items-center gap-1">
                            🪙 {food.price}
                          </span>

                          <button
                            id={`btn-shop-buy-food-${food.id}`}
                            disabled={!canAfford || isLocked}
                            onClick={() => {
                              if (canAfford && !isLocked) {
                                soundManager.playCoin();
                                onPurchaseFood(food);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl font-bubble text-xs font-bold transition-all ${
                              isLocked
                                ? 'bg-stone-200 text-stone-400 cursor-not-allowed flex items-center gap-1'
                                : !canAfford
                                ? 'bg-amber-100 text-amber-400 cursor-not-allowed'
                                : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-xs active:scale-95'
                            }`}
                          >
                            {isLocked ? (
                              <>
                                <Lock size={12} /> Lvl {food.levelRequired}
                              </>
                            ) : (
                              'Buy +1'
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {SHOP_ITEMS.filter((item) => item.category === activeCategory).map((item) => {
                    const isUnlocked = unlockedItems.includes(item.id);
                    const isLockedByLevel = item.levelRequired > petLevel;
                    const canAfford = coins >= item.price;

                    return (
                      <div
                        key={item.id}
                        className={`bg-white p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                          isUnlocked
                            ? 'border-emerald-300 bg-emerald-50/30'
                            : 'border-amber-200/80 shadow-xs'
                        }`}
                      >
                        <div>
                          <div className="w-full h-16 rounded-xl bg-amber-50/60 border border-amber-100 flex items-center justify-center text-3xl mb-2 relative">
                            {item.icon}
                            {isUnlocked && (
                              <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-white rounded-full p-0.5">
                                <Check size={12} strokeWidth={3} />
                              </div>
                            )}
                          </div>
                          <div className="font-bubble text-sm font-bold text-stone-800 truncate">
                            {item.name}
                          </div>
                          <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5">
                            {item.description}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-amber-100 flex items-center justify-between">
                          <span className="font-bubble text-xs font-bold text-amber-700">
                            🪙 {item.price}
                          </span>

                          {isUnlocked ? (
                            <span className="text-[11px] font-bubble font-bold text-emerald-600">
                              Owned
                            </span>
                          ) : (
                            <button
                              id={`btn-shop-buy-${item.id}`}
                              disabled={!canAfford || isLockedByLevel}
                              onClick={() => {
                                if (canAfford && !isLockedByLevel) {
                                  soundManager.playCoin();
                                  onPurchaseItem(item);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl font-bubble text-xs font-bold flex items-center gap-1 transition-all ${
                                isLockedByLevel
                                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                                  : !canAfford
                                  ? 'bg-amber-100 text-amber-400 cursor-not-allowed'
                                  : 'bg-amber-500 text-white hover:bg-amber-600 shadow-xs active:scale-95'
                              }`}
                            >
                              {isLockedByLevel ? (
                                <>
                                  <Lock size={12} /> Lvl {item.levelRequired}
                                </>
                              ) : (
                                'Unlock'
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Dressing Room Shortcut */}
            <div className="pt-3 border-t border-amber-200 flex items-center justify-between">
              <span className="text-xs text-stone-500 font-medium">Want to try on your accessories?</span>
              <button
                id="btn-shop-to-customizer"
                onClick={() => {
                  onClose();
                  onOpenCustomization();
                }}
                className="px-3.5 py-2 bg-gradient-to-r from-pink-500 to-rose-400 text-white font-bubble text-xs font-bold rounded-xl shadow-xs hover:scale-105 active:scale-95 transition-all"
              >
                🎀 Open Closet
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
