/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  PetState,
  PetType,
  FoodItem,
  ShopItem,
  DailyReward,
  AppNotification,
  PetCustomization,
  RoomCustomization,
} from './types';
import { INITIAL_PET_STATE, PET_CONFIGS, DAILY_REWARDS } from './data/initialData';
import {
  loadSavedPet,
  savePet,
  clearSavedPet,
  calculateMood,
  addExperience,
  loadSoundPreference,
  saveSoundPreference,
} from './utils/storage';
import { soundManager } from './utils/audio';

// Components
import { SplashScreen } from './components/SplashScreen';
import { PetSelectionScreen } from './components/PetSelectionScreen';
import { HomeScreen } from './components/HomeScreen';
import { FoodDrawer } from './components/FoodDrawer';
import { ShopModal } from './components/ShopModal';
import { CustomizationModal } from './components/CustomizationModal';
import { ProfileModal } from './components/ProfileModal';
import { DailyRewardModal } from './components/DailyRewardModal';
import { SettingsModal } from './components/SettingsModal';
import { CleaningTool } from './components/CleaningTool';
import { TutorialOverlay } from './components/TutorialOverlay';
import { NotificationBanner } from './components/NotificationBanner';
import { MiniGamesHub } from './components/games/MiniGamesHub';
import { MultiplayerModal } from './components/MultiplayerModal';
import { MultiplayerMiniGames } from './components/games/MultiplayerMiniGames';
import { multiplayerManager } from './utils/multiplayer';
import { MultiplayerRoom, MultiplayerPlayer, MultiplayerMiniGameType } from './types';

export default function App() {
  // App view navigation
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'pet-selection' | 'home'>('splash');

  // Core pet state
  const [pet, setPet] = useState<PetState>(() => loadSavedPet());

  // Sound preference
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const pref = loadSoundPreference();
    soundManager.enabled = pref;
    return pref;
  });

  // Reminders / notifications
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [activeNotification, setActiveNotification] = useState<AppNotification | null>(null);

  // Modals visibility
  const [isFoodOpen, setIsFoodOpen] = useState<boolean>(false);
  const [isShopOpen, setIsShopOpen] = useState<boolean>(false);
  const [isCustomizationOpen, setIsCustomizationOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isDailyRewardOpen, setIsDailyRewardOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isCleanOpen, setIsCleanOpen] = useState<boolean>(false);
  const [isPlayOpen, setIsPlayOpen] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);

  // Multiplayer state
  const [isMultiplayerOpen, setIsMultiplayerOpen] = useState<boolean>(false);
  const [isMultiplayerMiniGamesOpen, setIsMultiplayerMiniGamesOpen] = useState<boolean>(false);
  const [activeMiniGame, setActiveMiniGame] = useState<MultiplayerMiniGameType | null>(null);
  const [currentRoom, setCurrentRoom] = useState<MultiplayerRoom | null>(() => multiplayerManager.getCurrentRoom());

  // 3D Pet Model Graphics Style ('textured' = authentic 3D GLB model from pets.glb, 'mochi' = stylized mochi)
  const [modelStyle, setModelStyle] = useState<'textured' | 'mochi'>(() => {
    try {
      return (localStorage.getItem('pocket_pet_model_style') as 'textured' | 'mochi') || 'textured';
    } catch {
      return 'textured';
    }
  });

  const handleToggleModelStyle = (style: 'textured' | 'mochi') => {
    setModelStyle(style);
    try {
      localStorage.setItem('pocket_pet_model_style', style);
    } catch {
      // ignore
    }
  };

  // Temporary custom pet reaction speech
  const [customSpeech, setCustomSpeech] = useState<string | null>(null);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 3D Scene Action Triggers
  const [feedTrigger, setFeedTrigger] = useState<{ foodId: string; timestamp: number } | null>(null);
  const [waterTrigger, setWaterTrigger] = useState<{ timestamp: number } | null>(null);

  // Synchronize storage whenever pet updates
  useEffect(() => {
    savePet(pet);
  }, [pet]);

  // Subscribe to real-time room sync across tabs & local storage
  useEffect(() => {
    const unsubscribe = multiplayerManager.subscribeToRoom((room) => {
      setCurrentRoom(room);
      if (room?.activeGame && room.activeGame !== 'none') {
        setActiveMiniGame(room.activeGame);
      } else {
        setActiveMiniGame(null);
      }
    });
    return unsubscribe;
  }, []);

  // Determine friend pet in the room
  const friendPet: MultiplayerPlayer | null = React.useMemo(() => {
    if (!currentRoom) return null;
    if (currentRoom.host.petId === pet.id) {
      return currentRoom.guest || null;
    } else {
      return currentRoom.host;
    }
  }, [currentRoom, pet.id]);

  // Check if first-time user when entering home
  useEffect(() => {
    if (currentScreen === 'home' && !pet.tutorialCompleted) {
      const timer = setTimeout(() => {
        setIsTutorialOpen(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [currentScreen, pet.tutorialCompleted]);

  // Periodic life simulation & gentle care reminders
  useEffect(() => {
    const interval = setInterval(() => {
      let pendingNotif: AppNotification | null = null;

      setPet((prev) => {
        if (prev.isSleeping) {
          // While sleeping, regenerate energy and slightly decrease hunger
          return {
            ...prev,
            stats: {
              ...prev.stats,
              energy: Math.min(100, prev.stats.energy + 2),
              hunger: Math.max(5, prev.stats.hunger - 0.5),
            },
          };
        }

        // Active pet gradual decay
        const nextHunger = Math.max(5, prev.stats.hunger - 0.8);
        const nextEnergy = Math.max(10, prev.stats.energy - 0.5);
        const nextClean = Math.max(5, prev.stats.cleanliness - 0.5);
        const nextHappy = Math.max(10, prev.stats.happiness - 0.6);

        // Check if reminders should be triggered
        if (notificationsEnabled) {
          if (nextHunger < 30 && (!activeNotification || activeNotification.type !== 'hunger')) {
            pendingNotif = {
              id: 'notif-hunger',
              title: `${prev.name} is hungry! 🥕`,
              message: 'Time for a delicious treat or crunchy meal.',
              timestamp: Date.now(),
              read: false,
              type: 'hunger',
            };
          } else if (nextClean < 30 && (!activeNotification || activeNotification.type !== 'clean')) {
            pendingNotif = {
              id: 'notif-clean',
              title: `${prev.name} wants a bath! 🫧`,
              message: 'Their fur got messy. Grab the soap sponge!',
              timestamp: Date.now(),
              read: false,
              type: 'clean',
            };
          } else if (nextEnergy < 25 && (!activeNotification || activeNotification.type !== 'sleep')) {
            pendingNotif = {
              id: 'notif-sleep',
              title: `${prev.name} is sleepy 😴`,
              message: 'Yawn... tuck your pet in for cozy rest.',
              timestamp: Date.now(),
              read: false,
              type: 'sleep',
            };
          }
        }

        return {
          ...prev,
          stats: {
            hunger: Math.round(nextHunger),
            happiness: Math.round(nextHappy),
            energy: Math.round(nextEnergy),
            cleanliness: Math.round(nextClean),
          },
        };
      });

      if (pendingNotif) {
        showNotification(pendingNotif);
      }
    }, 25000); // Ticks every 25 seconds

    return () => clearInterval(interval);
  }, [notificationsEnabled, activeNotification]);

  const showNotification = (notif: AppNotification) => {
    setActiveNotification(notif);
    soundManager.playPop();
  };

  const triggerSpeech = (message: string, durationMs = 3500) => {
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
    }
    setCustomSpeech(message);
    speechTimeoutRef.current = setTimeout(() => {
      setCustomSpeech(null);
    }, durationMs);
  };

  // Sound toggle
  const handleToggleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    soundManager.enabled = enabled;
    saveSoundPreference(enabled);
  };

  // Adoption / Companion Swap handler
  const handleAdoptPet = (type: PetType, name?: string) => {
    setPet((prev) => {
      const companionName = name?.trim() || PET_CONFIGS[type]?.name || prev.name;
      const updatedUnlocked = prev.unlockedPets.includes(type)
        ? prev.unlockedPets
        : [...prev.unlockedPets, type];

      const swappedPet: PetState = {
        ...prev,
        type,
        name: companionName,
        unlockedPets: updatedUnlocked,
        customization: prev.type === type ? prev.customization : {},
      };
      savePet(swappedPet);
      return swappedPet;
    });

    triggerSpeech(`Say hello to your ${PET_CONFIGS[type]?.species || 'companion'}! 🐾✨`);
    setCurrentScreen('home');
  };

  // Pet tapping / cuddling interaction
  const handlePetInteraction = () => {
    soundManager.playPurr();
    setPet((prev) => {
      const nextHappy = Math.min(100, prev.stats.happiness + 4);
      const { updatedPet, leveledUp } = addExperience(prev, 5);

      if (leveledUp) {
        handleCelebration();
      }

      return {
        ...updatedPet,
        stats: {
          ...updatedPet.stats,
          happiness: nextHappy,
        },
        lifetimeStats: {
          ...updatedPet.lifetimeStats,
          timesPlayed: updatedPet.lifetimeStats.timesPlayed + 1,
        },
      };
    });

    const cuddleMessages = [
      'Purrrr... that feels so nice! 💕',
      'I love you! ❤️',
      'Hehehe that tickles! ✨',
      'So cozy and happy! 🥰',
    ];
    triggerSpeech(cuddleMessages[Math.floor(Math.random() * cuddleMessages.length)]);
  };

  // Feed Pet
  const handleFeedItem = (food: FoodItem) => {
    setFeedTrigger({ foodId: food.id, timestamp: Date.now() });
    setPet((prev) => {
      const count = prev.inventory[food.id] || 0;
      const nextInventory = { ...prev.inventory };
      if (count > 1) {
        nextInventory[food.id] = count - 1;
      } else if (count === 1) {
        delete nextInventory[food.id];
      }

      const isFavorite = food.favoriteFor?.includes(prev.type);
      const favBonus = isFavorite ? 10 : 0;

      const nextHunger = Math.min(100, prev.stats.hunger + food.hungerBoost);
      const nextHappiness = Math.min(100, prev.stats.happiness + food.happinessBoost + favBonus);
      const nextEnergy = Math.min(100, prev.stats.energy + (food.energyBoost || 12));

      const { updatedPet, leveledUp } = addExperience(prev, 15 + (isFavorite ? 10 : 0));
      if (leveledUp) handleCelebration();

      return {
        ...updatedPet,
        inventory: nextInventory,
        stats: {
          ...updatedPet.stats,
          hunger: nextHunger,
          happiness: nextHappiness,
          energy: nextEnergy,
        },
        lifetimeStats: {
          ...updatedPet.lifetimeStats,
          timesFed: updatedPet.lifetimeStats.timesFed + 1,
        },
      };
    });

    const isFav = food.favoriteFor?.includes(pet.type);
    triggerSpeech(isFav ? `Mmm, my favorite ${food.name}! YAY! 💖` : `Nom nom! Delicious ${food.name}! 😋`);
  };

  // Water Pet
  const handleGiveWater = () => {
    setWaterTrigger({ timestamp: Date.now() });
    setPet((prev) => {
      const nextEnergy = Math.min(100, prev.stats.energy + 18);
      const nextHunger = Math.min(100, prev.stats.hunger + 8);
      const nextHappiness = Math.min(100, prev.stats.happiness + 8);
      const { updatedPet, leveledUp } = addExperience(prev, 8);
      if (leveledUp) handleCelebration();

      return {
        ...updatedPet,
        stats: {
          ...updatedPet.stats,
          energy: nextEnergy,
          hunger: nextHunger,
          happiness: nextHappiness,
        },
      };
    });
    triggerSpeech('Ahhh, cool crisp spring water! So refreshing! 💧✨');
  };

  // Dance talent action
  const handleDance = () => {
    setPet((prev) => {
      const nextHappiness = Math.min(100, prev.stats.happiness + 18);
      const nextEnergy = Math.min(100, prev.stats.energy + 10);
      const { updatedPet, leveledUp } = addExperience(prev, 16);
      if (leveledUp) handleCelebration();

      return {
        ...updatedPet,
        stats: {
          ...updatedPet.stats,
          happiness: nextHappiness,
          energy: nextEnergy,
        },
        lifetimeStats: {
          ...updatedPet.lifetimeStats,
          timesPlayed: updatedPet.lifetimeStats.timesPlayed + 1,
        },
      };
    });
    if (currentRoom) {
      multiplayerManager.broadcastPlayerAction(pet.id, 'dance');
    }
    triggerSpeech(`Woohoo! Look at my spins and groovy moves! 💃✨`);
  };

  // Sing talent action
  const handleSing = () => {
    setPet((prev) => {
      const nextHappiness = Math.min(100, prev.stats.happiness + 18);
      const nextEnergy = Math.min(100, prev.stats.energy + 10);
      const { updatedPet, leveledUp } = addExperience(prev, 16);
      if (leveledUp) handleCelebration();

      return {
        ...updatedPet,
        stats: {
          ...updatedPet.stats,
          happiness: nextHappiness,
          energy: nextEnergy,
        },
        lifetimeStats: {
          ...updatedPet.lifetimeStats,
          timesPlayed: updatedPet.lifetimeStats.timesPlayed + 1,
        },
      };
    });
    if (currentRoom) {
      multiplayerManager.broadcastPlayerAction(pet.id, 'sing');
    }
    triggerSpeech(`Tra-la-la-la-la! A special cute song just for you! 🎵🐹`);
  };

  // Multiplayer Movement & Room Actions
  const handleTapFloorMove = (pos: { x: number; z: number }) => {
    if (currentRoom) {
      multiplayerManager.updatePlayerPosition(pet.id, pos);
    }
  };

  const handleCreateMultiplayerRoom = () => {
    const room = multiplayerManager.createRoom(pet);
    setCurrentRoom(room);
    soundManager.playLevelUp();
    triggerSpeech(`Created Room #${room.code}! Share this code with a friend! 🎉`);
  };

  const handleJoinMultiplayerRoom = (code: string) => {
    const success = multiplayerManager.joinRoom(code, pet);
    if (success) {
      soundManager.playLevelUp();
      triggerSpeech(`Joined Room #${code}! Let's play together in the pink room! 💕`);
    } else {
      soundManager.playSqueak();
      triggerSpeech(`Could not find or join Room #${code}. Check the 6-digit code!`);
    }
  };

  const handleLeaveMultiplayerRoom = () => {
    multiplayerManager.leaveRoom(pet.id);
    setCurrentRoom(null);
    setActiveMiniGame(null);
    triggerSpeech(`Left the multiplayer room. Back to solo play! 🏡`);
  };

  const handleSimulateFriendJoin = () => {
    multiplayerManager.simulateFriendJoin(pet);
    soundManager.playLevelUp();
    triggerSpeech(`A cute friend hamster just joined your pink room! 💖`);
  };

  const handleLaunchMiniGame = (game: MultiplayerMiniGameType) => {
    setActiveMiniGame(game);
    setIsMultiplayerMiniGamesOpen(true);
    if (currentRoom) {
      multiplayerManager.setRoomGame(game);
    }
  };

  const handleCloseMiniGames = () => {
    setIsMultiplayerMiniGamesOpen(false);
    setActiveMiniGame(null);
    if (currentRoom) {
      multiplayerManager.setRoomGame(null);
    }
  };

  const handleMiniGameReward = (coins: number, xp: number) => {
    setPet((prev) => {
      const { updatedPet, leveledUp } = addExperience(prev, xp);
      if (leveledUp) handleCelebration();
      return {
        ...updatedPet,
        coins: updatedPet.coins + coins,
        lifetimeStats: {
          ...updatedPet.lifetimeStats,
          gamesPlayed: updatedPet.lifetimeStats.gamesPlayed + 1,
          totalCoinsEarned: updatedPet.lifetimeStats.totalCoinsEarned + coins,
        },
      };
    });
    soundManager.playLevelUp();
  };

  // Clean Pet (Finish washing)
  const handleFinishCleaning = () => {
    setIsCleanOpen(false);
    setPet((prev) => {
      const { updatedPet, leveledUp } = addExperience(prev, 25);
      if (leveledUp) handleCelebration();

      return {
        ...updatedPet,
        stats: {
          ...updatedPet.stats,
          cleanliness: 100,
          happiness: Math.min(100, updatedPet.stats.happiness + 15),
        },
        lifetimeStats: {
          ...updatedPet.lifetimeStats,
          timesCleaned: updatedPet.lifetimeStats.timesCleaned + 1,
        },
      };
    });
    triggerSpeech('So fresh and squeaky clean! ✨🫧');
  };

  // Toggle Sleep
  const handleToggleSleep = () => {
    soundManager.playPop();
    const willSleep = !pet.isSleeping;

    setPet((prev) => ({
      ...prev,
      isSleeping: willSleep,
    }));

    if (willSleep) {
      triggerSpeech('Goodnight! Sweet dreams... 😴🌙');
    } else {
      triggerSpeech('Good morning! Ready to play! ☀️');
    }
  };

  // Mini-Game Reward Handler
  const handleGameReward = (coinsEarned: number, xpEarned: number) => {
    setPet((prev) => {
      const nextCoins = prev.coins + coinsEarned;
      const nextHappy = Math.min(100, prev.stats.happiness + 20);
      const nextEnergy = Math.max(10, prev.stats.energy - 10); // playing costs some energy

      const { updatedPet, leveledUp } = addExperience(prev, xpEarned);
      if (leveledUp) handleCelebration();

      return {
        ...updatedPet,
        coins: nextCoins,
        stats: {
          ...updatedPet.stats,
          happiness: nextHappy,
          energy: nextEnergy,
        },
        lifetimeStats: {
          ...updatedPet.lifetimeStats,
          gamesPlayed: updatedPet.lifetimeStats.gamesPlayed + 1,
          totalCoinsEarned: updatedPet.lifetimeStats.totalCoinsEarned + coinsEarned,
        },
      };
    });

    triggerSpeech(`That was so fun! We won ${coinsEarned} coins! 🎉`);
  };

  // Purchase Goods in Shop
  const handlePurchaseItem = (item: ShopItem) => {
    if (pet.coins < item.price) return;

    setPet((prev) => ({
      ...prev,
      coins: prev.coins - item.price,
      unlockedItems: [...prev.unlockedItems, item.id],
    }));

    triggerSpeech(`Yay! Bought ${item.name}! 🛍️`);
  };

  // Purchase Food in Shop or Food Drawer
  const handlePurchaseFood = (food: FoodItem) => {
    if (pet.coins < food.price) return;

    setPet((prev) => {
      const currentCount = prev.inventory[food.id] || 0;
      return {
        ...prev,
        coins: prev.coins - food.price,
        inventory: {
          ...prev.inventory,
          [food.id]: currentCount + 1,
        },
      };
    });
  };

  // Claim Daily Login Reward
  const handleClaimDailyReward = (reward: DailyReward) => {
    setPet((prev) => {
      const nextCoins = prev.coins + reward.coins;
      const nextInventory = { ...prev.inventory };
      const nextUnlocked = [...prev.unlockedItems];

      if (reward.bonusItem) {
        if (reward.bonusItem.type === 'food') {
          nextInventory[reward.bonusItem.id] = (nextInventory[reward.bonusItem.id] || 0) + 2;
        } else {
          if (!nextUnlocked.includes(reward.bonusItem.id)) {
            nextUnlocked.push(reward.bonusItem.id);
          }
        }
      }

      return {
        ...prev,
        coins: nextCoins,
        inventory: nextInventory,
        unlockedItems: nextUnlocked,
        lifetimeStats: {
          ...prev.lifetimeStats,
          lastClaimedRewardDay: reward.day,
          totalCoinsEarned: prev.lifetimeStats.totalCoinsEarned + reward.coins,
        },
      };
    });

    triggerSpeech(`Claimed Day ${reward.day} treat! Woohoo! 🎁`);
  };

  // Celebration Confetti
  const handleCelebration = () => {
    soundManager.playLevelUp();
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.55 },
      });
    } catch {
      // ignore
    }
  };

  // Switch Active Pet Species
  const handleSwitchPetType = (newType: PetType) => {
    setPet((prev) => ({
      ...prev,
      type: newType,
      unlockedPets: prev.unlockedPets.includes(newType)
        ? prev.unlockedPets
        : [...prev.unlockedPets, newType],
    }));
    triggerSpeech(`Look, I transformed into a cute ${PET_CONFIGS[newType].species}! ✨`);
  };

  // Rename Pet
  const handleRenamePet = (newName: string) => {
    setPet((prev) => ({
      ...prev,
      name: newName,
    }));
    triggerSpeech(`I love my new name, ${newName}! ❤️`);
  };

  // Reset Progress
  const handleResetPet = () => {
    clearSavedPet();
    setPet(INITIAL_PET_STATE);
    setCurrentScreen('pet-selection');
  };

  const currentMood = calculateMood(pet.stats, pet.isSleeping);
  const currentStreakDay = Math.min(7, Math.max(1, pet.lifetimeStats.consecutiveLogins));
  const dailyRewardAvailable = pet.lifetimeStats.lastClaimedRewardDay < currentStreakDay;

  return (
    <div id="pocket-pet-app" className="relative w-full h-screen bg-[#FFE9F0] flex items-center justify-center overflow-hidden">
      {/* Container simulating a sleek mobile viewport or full desktop center view */}
      <div className="relative w-full h-full sm:max-w-md sm:h-[94vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-[#FFE9F0] flex flex-col border border-pink-200/90 shadow-pink-900/10">
        {/* In-game Notification banner */}
        <NotificationBanner
          notification={activeNotification}
          onDismiss={() => setActiveNotification(null)}
          onAction={() => {
            if (activeNotification?.type === 'hunger') setIsFoodOpen(true);
            if (activeNotification?.type === 'clean') setIsCleanOpen(true);
            if (activeNotification?.type === 'play') setIsPlayOpen(true);
            setActiveNotification(null);
          }}
        />

        {/* Screen 1: Splash Screen */}
        {currentScreen === 'splash' && (
          <SplashScreen
            onStartGame={() => {
              // If user already has chosen a pet, go to home; otherwise go to pet selection
              if (pet.lifetimeStats.daysCared > 1 || pet.lifetimeStats.gamesPlayed > 0 || pet.name !== 'Hammy') {
                setCurrentScreen('home');
              } else {
                setCurrentScreen('pet-selection');
              }
            }}
            hasExistingPet={Boolean(pet.name)}
            petName={pet.name}
          />
        )}

        {/* Screen 2: Pet Adoption / Selection */}
        {currentScreen === 'pet-selection' && (
          <PetSelectionScreen
            onAdoptPet={handleAdoptPet}
            onClose={() => setCurrentScreen('home')}
            initialType={pet.type}
          />
        )}

        {/* Screen 3: Pet Home Screen */}
        {currentScreen === 'home' && (
          <HomeScreen
            pet={pet}
            mood={currentMood}
            onOpenPetSelection={() => setCurrentScreen('pet-selection')}
            onPetClick={handlePetInteraction}
            onOpenFeed={() => setIsFoodOpen(true)}
            onFeedItem={handleFeedItem}
            onGiveWater={handleGiveWater}
            onDance={handleDance}
            onSing={handleSing}
            feedTriggerProp={feedTrigger}
            waterTriggerProp={waterTrigger}
            onOpenPlay={() => setIsPlayOpen(true)}
            onOpenClean={() => setIsCleanOpen(true)}
            onToggleSleep={handleToggleSleep}
            onOpenShop={() => setIsShopOpen(true)}
            onOpenCustomization={() => setIsCustomizationOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
            onOpenDailyRewards={() => setIsDailyRewardOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            customSpeechMessage={customSpeech}
            dailyRewardAvailable={dailyRewardAvailable}
            isCleanOpen={isCleanOpen}
            onOpenMultiplayer={() => setIsMultiplayerOpen(true)}
            onOpenMiniGames={() => setIsMultiplayerMiniGamesOpen(true)}
            currentRoom={currentRoom}
            friendPet={friendPet}
            onTapFloorMove={handleTapFloorMove}
            activeGame={activeMiniGame}
            modelStyle={modelStyle}
            onToggleModelStyle={handleToggleModelStyle}
          />
        )}

        {/* OVERLAYS & MODALS */}

        {/* Interactive Soap Scrub Bath Tool */}
        {isCleanOpen && (
          <CleaningTool
            onCleanProgress={(progress) => {
              setPet((prev) => ({
                ...prev,
                stats: {
                  ...prev.stats,
                  cleanliness: Math.min(100, Math.round(progress)),
                },
              }));
            }}
            onFinishCleaning={handleFinishCleaning}
            onClose={() => setIsCleanOpen(false)}
          />
        )}

        {/* Food Pantry Drawer */}
        <FoodDrawer
          isOpen={isFoodOpen}
          onClose={() => setIsFoodOpen(false)}
          inventory={pet.inventory}
          coins={pet.coins}
          petType={pet.type}
          petLevel={pet.level}
          onFeedItem={handleFeedItem}
          onBuyFood={handlePurchaseFood}
          onOpenShop={() => setIsShopOpen(true)}
        />

        {/* Boutique Shop Modal */}
        <ShopModal
          isOpen={isShopOpen}
          onClose={() => setIsShopOpen(false)}
          coins={pet.coins}
          petLevel={pet.level}
          unlockedItems={pet.unlockedItems}
          inventory={pet.inventory}
          onPurchaseItem={handlePurchaseItem}
          onPurchaseFood={handlePurchaseFood}
          onOpenCustomization={() => setIsCustomizationOpen(true)}
        />

        {/* Wardrobe & Room Customizer Modal */}
        <CustomizationModal
          isOpen={isCustomizationOpen}
          onClose={() => setIsCustomizationOpen(false)}
          pet={pet}
          onUpdateCustomization={(custom: PetCustomization) => {
            setPet((prev) => ({ ...prev, customization: custom }));
          }}
          onUpdateRoom={(room: RoomCustomization) => {
            setPet((prev) => ({ ...prev, room }));
          }}
          onOpenShop={() => setIsShopOpen(true)}
        />

        {/* Pet Passport & Milestones Modal */}
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          pet={pet}
          onRenamePet={handleRenamePet}
          onSwitchPetType={handleSwitchPetType}
          onOpenAdoptionCenter={() => setCurrentScreen('pet-selection')}
        />

        {/* Daily Rewards Modal */}
        <DailyRewardModal
          isOpen={isDailyRewardOpen}
          onClose={() => setIsDailyRewardOpen(false)}
          consecutiveDays={currentStreakDay}
          lastClaimedDay={pet.lifetimeStats.lastClaimedRewardDay}
          onClaimDay={handleClaimDailyReward}
        />

        {/* Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          notificationsEnabled={notificationsEnabled}
          onToggleNotifications={(enabled) => setNotificationsEnabled(enabled)}
          onResetPet={handleResetPet}
          modelStyle={modelStyle}
          onToggleModelStyle={handleToggleModelStyle}
        />

        {/* Mini Games Hub */}
        <MiniGamesHub
          isOpen={isPlayOpen}
          onClose={() => setIsPlayOpen(false)}
          petType={pet.type}
          onGameReward={handleGameReward}
        />

        {/* Multiplayer Room Manager Modal (Create 6-digit room or Join) */}
        <MultiplayerModal
          isOpen={isMultiplayerOpen}
          onClose={() => setIsMultiplayerOpen(false)}
          pet={pet}
          currentRoom={currentRoom}
          onCreateRoom={handleCreateMultiplayerRoom}
          onJoinRoom={handleJoinMultiplayerRoom}
          onLeaveRoom={handleLeaveMultiplayerRoom}
          onSimulateFriend={handleSimulateFriendJoin}
          onOpenMiniGames={() => {
            setIsMultiplayerOpen(false);
            setIsMultiplayerMiniGamesOpen(true);
          }}
        />

        {/* Multiplayer Mini Games Modal (Race, Hide & Seek, Ball Play) */}
        <MultiplayerMiniGames
          isOpen={isMultiplayerMiniGamesOpen}
          onClose={handleCloseMiniGames}
          playerPet={{ name: pet.name, id: pet.id, type: pet.type }}
          friendPet={friendPet}
          activeGame={activeMiniGame}
          onSelectGame={handleLaunchMiniGame}
          onReward={handleMiniGameReward}
        />

        {/* First-time Tutorial Walkthrough */}
        <TutorialOverlay
          isOpen={isTutorialOpen}
          onComplete={() => {
            setIsTutorialOpen(false);
            setPet((prev) => ({ ...prev, tutorialCompleted: true }));
          }}
          petName={pet.name}
        />
      </div>
    </div>
  );
}
