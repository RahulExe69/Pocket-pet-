import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { PetState, PetCustomization, RoomCustomization } from '../types';
import { SHOP_ITEMS } from '../data/initialData';
import { PetAvatar } from './PetAvatar';
import { soundManager } from '../utils/audio';

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  pet: PetState;
  onUpdateCustomization: (custom: PetCustomization) => void;
  onUpdateRoom: (room: RoomCustomization) => void;
  onOpenShop: () => void;
}

type TabType = 'hat' | 'glasses' | 'bow' | 'outfit' | 'bed' | 'wallpaper' | 'decor';

export const CustomizationModal: React.FC<CustomizationModalProps> = ({
  isOpen,
  onClose,
  pet,
  onUpdateCustomization,
  onUpdateRoom,
  onOpenShop,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('hat');

  const tabs: { key: TabType; label: string; icon: string; isRoom?: boolean }[] = [
    { key: 'hat', label: 'Hats & Sprout', icon: '🌱' },
    { key: 'glasses', label: 'Glasses', icon: '👓' },
    { key: 'bow', label: 'Bows', icon: '🎀' },
    { key: 'outfit', label: 'Outfits', icon: '👗' },
    { key: 'bed', label: 'Beds', icon: '☁️', isRoom: true },
    { key: 'wallpaper', label: 'Walls', icon: '🖼️', isRoom: true },
    { key: 'decor', label: 'Decor', icon: '🪴', isRoom: true },
  ];

  // Filter items matching active slot that the player has unlocked
  const unlocked = Array.isArray(pet.unlockedItems) ? pet.unlockedItems : [];
  const availableItems = SHOP_ITEMS.filter((item) => {
    if (activeTab === 'hat') {
      return (item.slotType === 'hat' || item.slotType === 'accessory') && unlocked.includes(item.id);
    }
    return item.slotType === activeTab && unlocked.includes(item.id);
  });

  const handleToggleItem = (itemId: string, slot: TabType) => {
    soundManager.playPop();

    if (slot === 'bed' || slot === 'wallpaper' || slot === 'decor') {
      onUpdateRoom({
        ...(pet.room || {}),
        wallpaper: pet.room?.wallpaper || 'wall-cozy-mint',
        flooring: pet.room?.flooring || 'floor-wood',
        bed: pet.room?.bed || 'bed-pillow',
        decor: pet.room?.decor || 'decor-plant',
        [slot]: itemId,
      });
      return;
    }

    // Pet customization slot
    const currentCustom = { ...(pet.customization || {}) };
    const item = SHOP_ITEMS.find((i) => i.id === itemId);

    if (item?.slotType === 'accessory') {
      currentCustom.accessory = currentCustom.accessory === itemId ? undefined : itemId;
    } else if (slot === 'hat') {
      currentCustom.hat = currentCustom.hat === itemId ? undefined : itemId;
    } else if (slot === 'glasses') {
      currentCustom.glasses = currentCustom.glasses === itemId ? undefined : itemId;
    } else if (slot === 'bow') {
      currentCustom.bow = currentCustom.bow === itemId ? undefined : itemId;
    } else if (slot === 'outfit') {
      currentCustom.outfit = currentCustom.outfit === itemId ? undefined : itemId;
    }

    onUpdateCustomization(currentCustom);
  };

  const isCurrentEquipped = (itemId: string, slot: TabType): boolean => {
    if (slot === 'bed' || slot === 'wallpaper' || slot === 'decor') {
      return pet.room?.[slot] === itemId;
    }
    if (slot === 'hat') {
      return pet.customization?.hat === itemId || pet.customization?.accessory === itemId;
    }
    return pet.customization?.[slot] === itemId;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="customization-modal-backdrop" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/50 backdrop-blur-xs">
          <motion.div
            id="customization-modal-card"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-lg bg-pink-50/95 backdrop-blur-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-pink-200 p-5 flex flex-col max-h-[90vh]"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-2 border-b border-pink-200/70">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎀</span>
                <div>
                  <h2 className="font-bubble text-xl font-bold text-stone-800">Closet & Room Style</h2>
                  <p className="text-xs text-stone-500">Dress up {pet.name} and customize their habitat</p>
                </div>
              </div>

              <button
                id="btn-close-customizer"
                onClick={onClose}
                className="p-1.5 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Live Pet Preview in Dressing Room */}
            <div className="py-2 flex items-center justify-center">
              <div className="w-48 h-48 rounded-2xl bg-gradient-to-b from-white to-pink-100/60 border border-pink-200 shadow-inner flex items-center justify-center overflow-hidden relative">
                <div className="scale-75 origin-center">
                  <PetAvatar
                    type={pet.type}
                    mood="happy"
                    customization={pet.customization}
                    interactive={false}
                  />
                </div>
                <div className="absolute bottom-2 text-[11px] font-bubble font-bold text-pink-700 bg-white/80 px-2.5 py-0.5 rounded-full border border-pink-200">
                  {pet.name}
                </div>
              </div>
            </div>

            {/* Wardrobe Navigation Tabs */}
            <div className="flex gap-1.5 py-2 overflow-x-auto no-scrollbar border-y border-pink-200/50">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    id={`custom-tab-${tab.key}`}
                    onClick={() => {
                      soundManager.playClick();
                      setActiveTab(tab.key);
                    }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bubble font-bold transition-all shrink-0 ${
                      isActive
                        ? 'bg-pink-500 text-white shadow-xs scale-105'
                        : 'bg-white/80 text-stone-600 border border-pink-200/60 hover:bg-pink-100/50'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Owned Items List */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-3 min-h-[160px]">
              {availableItems.length === 0 ? (
                <div className="text-center py-8 text-stone-500 flex flex-col items-center gap-2">
                  <div className="text-4xl">🛍️</div>
                  <div className="font-bubble text-sm font-bold text-stone-700">No {activeTab}s owned yet!</div>
                  <div className="text-xs text-stone-500 max-w-xs">
                    Earn coins in mini-games and check out the Boutique to unlock new styles.
                  </div>
                  <button
                    id="btn-closet-to-shop"
                    onClick={() => {
                      onClose();
                      onOpenShop();
                    }}
                    className="mt-2 px-4 py-1.5 bg-amber-500 text-white font-bubble text-xs font-bold rounded-xl shadow-xs hover:bg-amber-600"
                  >
                    Visit Boutique 🪙
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {/* Unequip option for clothing/accessories */}
                  {!['bed', 'wallpaper'].includes(activeTab) && (
                    <button
                      id={`btn-unequip-${activeTab}`}
                      onClick={() => {
                        soundManager.playPop();
                        const next = { ...pet.customization };
                        if (activeTab === 'hat') {
                          next.hat = undefined;
                          next.accessory = undefined;
                        } else {
                          next[activeTab] = undefined;
                        }
                        onUpdateCustomization(next);
                      }}
                      className="p-3 rounded-2xl border-2 border-dashed border-stone-300 bg-white/50 text-stone-500 hover:bg-white flex flex-col items-center justify-center gap-1 text-xs font-bubble font-bold transition-all"
                    >
                      <span className="text-xl">🚫</span>
                      <span>None (Remove)</span>
                    </button>
                  )}

                  {availableItems.map((item) => {
                    const equipped = isCurrentEquipped(item.id, activeTab);
                    return (
                      <button
                        key={item.id}
                        id={`btn-equip-${item.id}`}
                        onClick={() => handleToggleItem(item.id, activeTab)}
                        className={`p-3 rounded-2xl border-2 text-left flex flex-col justify-between transition-all ${
                          equipped
                            ? 'bg-pink-100 border-pink-500 shadow-xs ring-2 ring-pink-400/30'
                            : 'bg-white border-pink-200/80 hover:border-pink-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-2xl">{item.icon}</span>
                          {equipped && (
                            <span className="bg-pink-500 text-white p-1 rounded-full text-xs">
                              <Check size={10} strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <div className="font-bubble text-xs font-bold text-stone-800 mt-2 truncate">
                          {item.name}
                        </div>
                        <span className="text-[10px] text-pink-600 font-semibold">
                          {equipped ? 'Equipped' : 'Tap to wear'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 border-t border-pink-200 flex justify-between items-center">
              <button
                id="btn-closet-shop-shortcut"
                onClick={() => {
                  onClose();
                  onOpenShop();
                }}
                className="text-xs font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1"
              >
                <span>🪙 Get More in Shop</span>
              </button>
              <button
                id="btn-done-closet"
                onClick={onClose}
                className="px-5 py-2 bg-pink-500 text-white font-bubble text-xs font-bold rounded-xl shadow-xs hover:bg-pink-600 active:scale-95"
              >
                Looks Cute! ✨
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
