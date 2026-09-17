import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Gift, Sparkles, ShoppingBag, Shirt, X, ChevronRight } from 'lucide-react';
import { PetState, PetMood, FoodItem } from '../types';
import { PetScene3D } from './3d/PetScene3D';
import { SpeechBubble } from './SpeechBubble';
import { soundManager } from '../utils/audio';

interface HomeScreenProps {
  pet: PetState;
  mood: PetMood;
  onPetClick: () => void;
  onOpenFeed: () => void;
  onGiveWater: () => void;
  onOpenPlay: () => void;
  onOpenClean: () => void;
  onToggleSleep: () => void;
  onOpenShop: () => void;
  onOpenCustomization: () => void;
  onOpenProfile: () => void;
  onOpenDailyRewards: () => void;
  onOpenSettings: () => void;
  onFeedItem?: (food: FoodItem) => void;
  feedTriggerProp?: { foodId: string; timestamp: number } | null;
  waterTriggerProp?: { timestamp: number } | null;
  customSpeechMessage?: string | null;
  dailyRewardAvailable?: boolean;
  isCleanOpen?: boolean;
}

// 3 Distinct Foods for Feeding the Hamster
const THREE_FOODS: (FoodItem & { colorBg: string; borderColor: string; tag: string })[] = [
  {
    id: 'seeds',
    name: 'Sunflower Seeds',
    icon: '🌻',
    price: 20,
    hungerBoost: 25,
    happinessBoost: 22,
    energyBoost: 16,
    description: 'Crispy striped seeds. Hamster’s favorite treat!',
    levelRequired: 1,
    favoriteFor: ['hamster'],
    colorBg: 'bg-amber-50 hover:bg-amber-100/80',
    borderColor: 'border-amber-300',
    tag: '⭐ Favorite',
  },
  {
    id: 'carrot',
    name: 'Crunchy Carrot',
    icon: '🥕',
    price: 18,
    hungerBoost: 30,
    happinessBoost: 15,
    energyBoost: 14,
    description: 'Fresh, juicy garden carrot packed with vitamins!',
    levelRequired: 1,
    favoriteFor: ['bunny'],
    colorBg: 'bg-orange-50 hover:bg-orange-100/80',
    borderColor: 'border-orange-300',
    tag: '🥕 Garden Fresh',
  },
  {
    id: 'apple',
    name: 'Sweet Apple',
    icon: '🍎',
    price: 15,
    hungerBoost: 22,
    happinessBoost: 18,
    energyBoost: 18,
    description: 'Crisp red apple slices rich in refreshing energy!',
    levelRequired: 1,
    colorBg: 'bg-rose-50 hover:bg-rose-100/80',
    borderColor: 'border-rose-300',
    tag: '🍏 Orchard Crisp',
  },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  pet,
  mood,
  onPetClick,
  onOpenFeed,
  onGiveWater,
  onOpenPlay,
  onOpenClean,
  onToggleSleep,
  onOpenShop,
  onOpenCustomization,
  onOpenProfile,
  onOpenDailyRewards,
  onOpenSettings,
  onFeedItem,
  feedTriggerProp,
  waterTriggerProp,
  customSpeechMessage,
  dailyRewardAvailable = false,
  isCleanOpen = false,
}) => {
  const [isDrinking, setIsDrinking] = useState<boolean>(false);
  const [isQuickFoodOpen, setIsQuickFoodOpen] = useState<boolean>(false);
  const [feedTrigger, setFeedTrigger] = useState<{ foodId: string; timestamp: number } | null>(null);
  const [waterTrigger, setWaterTrigger] = useState<{ timestamp: number } | null>(null);
  const [statNotice, setStatNotice] = useState<{
    text: string;
    hunger: number;
    energy: number;
    icon: string;
  } | null>(null);

  // Sync external feed/water triggers from App level
  React.useEffect(() => {
    if (feedTriggerProp) {
      setFeedTrigger(feedTriggerProp);
      const food = THREE_FOODS.find((f) => f.id === feedTriggerProp.foodId);
      if (food) {
        const isFav = food.favoriteFor?.includes(pet.type);
        setStatNotice({
          icon: food.icon,
          text: isFav ? `${pet.name}'s Favorite! 💖` : `Ate ${food.name}!`,
          hunger: food.hungerBoost,
          energy: food.energyBoost || 12,
        });
        setTimeout(() => setStatNotice(null), 2500);
      }
    }
  }, [feedTriggerProp, pet.name, pet.type]);

  React.useEffect(() => {
    if (waterTriggerProp) {
      setWaterTrigger(waterTriggerProp);
      setIsDrinking(true);
      setStatNotice({
        icon: '💧',
        text: 'Cool Spring Water!',
        hunger: 8,
        energy: 18,
      });
      setTimeout(() => setIsDrinking(false), 2200);
      setTimeout(() => setStatNotice(null), 2500);
    }
  }, [waterTriggerProp]);

  // Handle Feeding one of the 3 foods
  const handleSelectFood = (food: FoodItem) => {
    soundManager.playPop();
    setFeedTrigger({ foodId: food.id, timestamp: Date.now() });
    setIsQuickFoodOpen(false);

    if (onFeedItem) {
      onFeedItem(food);
    }

    const isFav = food.favoriteFor?.includes(pet.type);
    setStatNotice({
      icon: food.icon,
      text: isFav ? `${pet.name}'s Favorite! 💖` : `Ate ${food.name}!`,
      hunger: food.hungerBoost,
      energy: food.energyBoost || 12,
    });

    setTimeout(() => setStatNotice(null), 2500);
  };

  // Handle Giving Water
  const handleWaterClick = () => {
    soundManager.playDrink();
    setWaterTrigger({ timestamp: Date.now() });
    setIsDrinking(true);
    onGiveWater();

    setStatNotice({
      icon: '💧',
      text: 'Cool Spring Water!',
      hunger: 8,
      energy: 18,
    });

    setTimeout(() => setIsDrinking(false), 2200);
    setTimeout(() => setStatNotice(null), 2500);
  };

  // Wallpapers style map for framing backdrop
  const getWallpaperBackground = (wp: string, isSleeping: boolean) => {
    if (isSleeping) {
      return 'bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 text-white';
    }
    switch (wp) {
      case 'wall-pink-polka':
        return 'bg-gradient-to-b from-[#FFE9F0] via-[#FFF0F5] to-[#FFD6E0] text-pink-950';
      case 'wall-starry-night':
        return 'bg-gradient-to-b from-slate-900 via-indigo-950 to-purple-950';
      case 'wall-mint-forest':
        return 'bg-gradient-to-b from-emerald-100 via-teal-50 to-emerald-100';
      case 'wall-sakura-blossom':
        return 'bg-gradient-to-b from-[#FFE9F0] via-[#FFD6E0] to-[#FFE9F0] text-pink-950';
      default:
        // Bright Pink Cute House: Soft pastel pink #FFD6E0 & #FFE9F0
        return 'bg-gradient-to-b from-[#FFE9F0] via-[#FFF5F8] to-[#FFD6E0] text-pink-950';
    }
  };

  return (
    <div
      id="pet-home-screen"
      className={`relative w-full h-full max-w-md mx-auto flex flex-col justify-between select-none overflow-hidden transition-colors duration-700 ${getWallpaperBackground(
        pet.room?.wallpaper || 'wall-pink-polka',
        pet.isSleeping
      )}`}
    >
      {/* Night mode soft lamp glow overlay */}
      {pet.isSleeping && (
        <div className="absolute inset-0 bg-indigo-950/70 backdrop-blur-[0.5px] pointer-events-none z-10" />
      )}

      {/* TOP HEADER: Level, Coins, Navigation icons */}
      <header className="relative z-20 p-2.5 sm:p-3 flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Left: App Logo & Pet Passport */}
        <div className="flex items-center gap-1.5">
          {/* Official Pocket Pet App Header Logo */}
          <div
            id="app-header-brand-logo"
            className={`flex items-center gap-1.5 px-2 py-1 rounded-2xl border shadow-xs select-none ${
              pet.isSleeping
                ? 'bg-slate-800/90 border-slate-700 text-white'
                : 'bg-white/95 border-amber-200 text-stone-800'
            }`}
          >
            <div className="w-7 h-7 rounded-xl overflow-hidden border border-amber-300 shadow-xs shrink-0 bg-amber-50">
              <img
                src="/pocket_pet_icon.png"
                alt="Pocket Pet Logo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="font-bubble text-xs font-extrabold tracking-tight text-amber-900 hidden xs:inline">
              Pocket <span className="text-amber-600">Pet</span>
            </span>
          </div>

          {/* Pet Passport / Level */}
          <button
            id="btn-open-profile"
            onClick={onOpenProfile}
            className={`flex items-center gap-1.5 p-1 pr-2.5 rounded-2xl border shadow-xs transition-all active:scale-95 ${
              pet.isSleeping
                ? 'bg-slate-800/90 border-slate-700 text-white'
                : 'bg-white/90 border-amber-200 text-stone-800'
            }`}
          >
            <div className="w-7 h-7 rounded-xl bg-amber-400/20 flex items-center justify-center text-sm overflow-hidden shrink-0">
              {pet.type === 'hamster' ? (
                <img
                  src="/pocket_pet_icon.png"
                  alt={pet.name}
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <>
                  {pet.type === 'cat' && '🐱'}
                  {pet.type === 'dog' && '🐶'}
                  {pet.type === 'bunny' && '🐰'}
                  {pet.type === 'panda' && '🐼'}
                </>
              )}
            </div>
            <div className="text-left">
              <div className="font-bubble text-xs font-bold leading-tight flex items-center gap-1">
                <span className="truncate max-w-[65px]">{pet.name}</span>
                <span className="text-[9px] bg-amber-500 text-white px-1 rounded-sm font-bold">
                  L{pet.level}
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Right tools: Coins, Daily Reward, Settings */}
        <div className="flex items-center gap-1.5">
          {/* Coins badge */}
          <div
            className={`flex items-center gap-1 px-3 py-1.5 rounded-2xl border shadow-xs font-bubble text-xs font-bold ${
              pet.isSleeping
                ? 'bg-slate-800/90 border-slate-700 text-amber-300'
                : 'bg-white/90 border-amber-200 text-amber-800'
            }`}
          >
            <span className="text-sm">🪙</span>
            <span>{pet.coins}</span>
          </div>

          {/* Daily reward gift button */}
          <button
            id="btn-open-daily-reward"
            onClick={onOpenDailyRewards}
            className="relative p-2 rounded-2xl bg-white/90 border border-amber-200 shadow-xs text-amber-700 hover:bg-amber-50 active:scale-95 transition-transform"
          >
            <Gift size={18} />
            {dailyRewardAvailable && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white animate-ping" />
            )}
          </button>

          {/* Settings button */}
          <button
            id="btn-open-settings"
            onClick={onOpenSettings}
            className="p-2 rounded-2xl bg-white/90 border border-stone-200 shadow-xs text-stone-600 hover:bg-stone-50 active:scale-95 transition-transform"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* METERS STATUS BAR */}
      <div className="relative z-20 px-3">
        <div
          className={`grid grid-cols-4 gap-2 p-2.5 rounded-2xl border shadow-xs transition-colors ${
            pet.isSleeping
              ? 'bg-slate-900/80 border-slate-700 text-white'
              : 'bg-white/85 backdrop-blur-xs border-amber-200/80 text-stone-700'
          }`}
        >
          {/* Hunger Meter */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] font-bold">
              <span>🍖 Hunger</span>
              <span>{pet.stats.hunger}%</span>
            </div>
            <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  pet.stats.hunger < 30
                    ? 'bg-rose-500'
                    : pet.stats.hunger < 60
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                animate={{ width: `${pet.stats.hunger}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Happiness Meter */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] font-bold">
              <span>❤️ Happy</span>
              <span>{pet.stats.happiness}%</span>
            </div>
            <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  pet.stats.happiness < 30
                    ? 'bg-rose-500'
                    : pet.stats.happiness < 60
                    ? 'bg-amber-500'
                    : 'bg-pink-500'
                }`}
                animate={{ width: `${pet.stats.happiness}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Energy Meter */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] font-bold">
              <span>⚡ Energy</span>
              <span>{pet.stats.energy}%</span>
            </div>
            <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  pet.stats.energy < 30
                    ? 'bg-rose-500'
                    : pet.stats.energy < 60
                    ? 'bg-amber-500'
                    : 'bg-yellow-400'
                }`}
                animate={{ width: `${pet.stats.energy}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Cleanliness Meter */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] font-bold">
              <span>🧼 Clean</span>
              <span>{pet.stats.cleanliness}%</span>
            </div>
            <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  pet.stats.cleanliness < 30
                    ? 'bg-rose-500'
                    : pet.stats.cleanliness < 60
                    ? 'bg-amber-500'
                    : 'bg-sky-400'
                }`}
                animate={{ width: `${pet.stats.cleanliness}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* MAIN PET ROOM INTERACTIVE 3D STAGE */}
      <div
        id="pet-room-stage"
        className="relative flex-1 w-full h-full min-h-[340px] flex flex-col items-center justify-center my-1 z-10 overflow-hidden"
      >
        {/* Full 3D Interactive WebGL Scene */}
        <PetScene3D
          pet={pet}
          mood={mood}
          onPetClick={onPetClick}
          onOpenFeed={() => setIsQuickFoodOpen(true)}
          onGiveWater={handleWaterClick}
          onToggleSleep={onToggleSleep}
          feedTrigger={feedTrigger}
          waterTrigger={waterTrigger}
          isBathing={isCleanOpen}
          interactive={!pet.isSleeping}
        />

        {/* Floating Speech Bubble Above 3D Pet */}
        <div className="absolute top-2 left-0 right-0 pointer-events-none z-20 flex justify-center px-4">
          <div className="pointer-events-auto max-w-[280px]">
            <SpeechBubble
              mood={mood}
              customMessage={customSpeechMessage}
              onBubbleClick={onPetClick}
            />
          </div>
        </div>

        {/* Floating Stat Boost Toast Banner */}
        <AnimatePresence>
          {statNotice && (
            <motion.div
              initial={{ scale: 0.8, y: -20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: -15, opacity: 0 }}
              className="absolute top-16 z-30 pointer-events-none flex flex-col items-center gap-1 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl border-2 border-amber-300 shadow-lg"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{statNotice.icon}</span>
                <span className="font-bubble font-bold text-stone-800 text-sm">
                  {statNotice.text}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold font-bubble">
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  +{statNotice.hunger} 🍖 Hunger
                </span>
                <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  +{statNotice.energy} ⚡ Energy
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drinking water animation splash banner */}
        <AnimatePresence>
          {isDrinking && !statNotice && (
            <motion.div
              initial={{ scale: 0.5, y: -10, opacity: 0 }}
              animate={{ scale: 1.1, y: -20, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-1/3 z-30 pointer-events-none font-bubble text-base font-bold text-sky-700 bg-white/95 px-4 py-1.5 rounded-full border-2 border-sky-300 shadow-md flex items-center gap-1.5"
            >
              <span>💧</span>
              <span>Refreshing Spring Water!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* QUICK WARDROBE & BOUTIQUE SHORTCUT CHIPS */}
      <div className="relative z-20 px-4 py-1 flex justify-center gap-2">
        <button
          id="btn-quick-closet"
          onClick={onOpenCustomization}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/90 border border-pink-200 shadow-xs text-xs font-bubble font-bold text-pink-700 hover:bg-pink-50 active:scale-95 transition-all"
        >
          <Shirt size={14} /> Closet & Style
        </button>
        <button
          id="btn-quick-shop"
          onClick={onOpenShop}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/90 border border-amber-200 shadow-xs text-xs font-bubble font-bold text-amber-800 hover:bg-amber-50 active:scale-95 transition-all"
        >
          <ShoppingBag size={14} /> Boutique 🪙
        </button>
      </div>

      {/* TOUCH-FRIENDLY 3-FOOD SELECTION TRAY */}
      <AnimatePresence>
        {isQuickFoodOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-30 px-3 pb-2"
          >
            <div className="bg-white/95 backdrop-blur-md rounded-3xl border-2 border-amber-200 shadow-xl p-3 flex flex-col gap-2.5">
              {/* Header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">🥣</span>
                  <h3 className="font-bubble font-bold text-stone-800 text-sm">
                    Feed {pet.name} — Choose a Meal
                  </h3>
                </div>
                <button
                  id="btn-close-quick-food"
                  onClick={() => setIsQuickFoodOpen(false)}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* 3 Distinct Touch-Friendly Food Cards */}
              <div className="grid grid-cols-3 gap-2">
                {THREE_FOODS.map((food) => {
                  const invCount = pet.inventory[food.id] || 0;
                  return (
                    <button
                      key={food.id}
                      id={`btn-feed-${food.id}`}
                      onClick={() => handleSelectFood(food)}
                      className={`flex flex-col items-center justify-between p-2.5 rounded-2xl border-2 ${food.borderColor} ${food.colorBg} active:scale-95 transition-all text-left shadow-xs group min-h-[110px]`}
                    >
                      <div className="w-full flex justify-between items-start">
                        <span className="text-3xl group-hover:scale-110 transition-transform">
                          {food.icon}
                        </span>
                        <span className="text-[10px] font-bold font-bubble text-amber-900 bg-white/90 px-1.5 py-0.5 rounded-full border border-amber-200 shadow-xs">
                          {food.tag}
                        </span>
                      </div>

                      <div className="w-full mt-1.5">
                        <span className="block font-bubble font-bold text-stone-900 text-xs truncate">
                          {food.name}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-bold font-bubble mt-0.5">
                          <span className="text-emerald-700">+{food.hungerBoost} 🍖</span>
                          <span className="text-amber-700">+{food.energyBoost} ⚡</span>
                        </div>
                      </div>

                      <div className="w-full flex justify-between items-center text-[10px] font-bubble font-bold text-stone-500 mt-1 pt-1 border-t border-stone-200/60">
                        <span>Owned: {invCount}</span>
                        <span className="text-amber-600 font-bold">Feed ➔</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Browse Pantry button */}
              <div className="flex justify-between items-center pt-1 border-t border-stone-100">
                <span className="text-[11px] text-stone-500 font-medium pl-1">
                  Hamster will waddle to 3D bowl to eat!
                </span>
                <button
                  id="btn-open-full-pantry"
                  onClick={() => {
                    setIsQuickFoodOpen(false);
                    onOpenFeed();
                  }}
                  className="flex items-center gap-1 text-xs font-bubble font-bold text-amber-700 hover:text-amber-800 bg-amber-100/60 hover:bg-amber-100 px-3 py-1 rounded-full border border-amber-300/60 active:scale-95 transition-all"
                >
                  <span>All Foods 🎒</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOTTOM ACTION BUTTONS TOOLBAR */}
      <footer className="relative z-20 p-3 pt-1">
        <div className="grid grid-cols-6 gap-1.5 bg-white/95 backdrop-blur-md p-2 rounded-3xl border border-stone-200 shadow-lg">
          {/* 1. Feed */}
          <button
            id="btn-action-feed"
            onClick={() => {
              soundManager.playPop();
              setIsQuickFoodOpen((prev) => !prev);
            }}
            className={`flex flex-col items-center justify-center p-2 rounded-2xl active:scale-90 transition-all group ${
              isQuickFoodOpen ? 'bg-amber-100 ring-2 ring-amber-400' : 'hover:bg-amber-50'
            }`}
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">🥣</span>
            <span className="text-[11px] font-bubble font-bold text-stone-700 mt-0.5">Feed</span>
          </button>

          {/* 2. Water */}
          <button
            id="btn-action-water"
            onClick={handleWaterClick}
            className={`flex flex-col items-center justify-center p-2 rounded-2xl active:scale-90 transition-all group ${
              isDrinking ? 'bg-sky-100 ring-2 ring-sky-400' : 'hover:bg-sky-50'
            }`}
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">💧</span>
            <span className="text-[11px] font-bubble font-bold text-stone-700 mt-0.5">Water</span>
          </button>

          {/* 3. Play */}
          <button
            id="btn-action-play"
            onClick={onOpenPlay}
            className="flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-emerald-50 active:scale-90 transition-transform group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">🎾</span>
            <span className="text-[11px] font-bubble font-bold text-stone-700 mt-0.5">Play</span>
          </button>

          {/* 4. Clean */}
          <button
            id="btn-action-clean"
            onClick={onOpenClean}
            className="flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-teal-50 active:scale-90 transition-transform group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">🛁</span>
            <span className="text-[11px] font-bubble font-bold text-stone-700 mt-0.5">Clean</span>
          </button>

          {/* 5. Sleep */}
          <button
            id="btn-action-sleep"
            onClick={onToggleSleep}
            className={`flex flex-col items-center justify-center p-2 rounded-2xl active:scale-90 transition-all group ${
              pet.isSleeping ? 'bg-indigo-100 text-indigo-900 font-bold' : 'hover:bg-indigo-50'
            }`}
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">
              {pet.isSleeping ? '☀️' : '😴'}
            </span>
            <span className="text-[11px] font-bubble font-bold text-stone-700 mt-0.5">
              {pet.isSleeping ? 'Wake' : 'Sleep'}
            </span>
          </button>

          {/* 6. Shop */}
          <button
            id="btn-action-shop"
            onClick={onOpenShop}
            className="flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-orange-50 active:scale-90 transition-transform group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">🛍️</span>
            <span className="text-[11px] font-bubble font-bold text-stone-700 mt-0.5">Shop</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
