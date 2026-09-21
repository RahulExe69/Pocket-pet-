export type PetType =
  | 'hamster'
  | 'cat'
  | 'chinchilla'
  | 'ferret'
  | 'hedgehog'
  | 'gerbil'
  | 'dog'
  | 'bunny'
  | 'panda';

export type PetMood = 'happy' | 'hungry' | 'sleepy' | 'dirty' | 'excited' | 'sad';

export interface PetStats {
  hunger: number; // 0 to 100 (100 = full)
  happiness: number; // 0 to 100 (100 = ecstatic)
  energy: number; // 0 to 100 (100 = fully rested)
  cleanliness: number; // 0 to 100 (100 = sparkling clean)
}

export interface PetCustomization {
  hat?: string;
  glasses?: string;
  bow?: string;
  outfit?: string;
  accessory?: string; // like the leaf sprout!
}

export interface RoomCustomization {
  wallpaper: string;
  flooring: string;
  bed: string;
  decor: string;
}

export interface LifetimeStats {
  daysCared: number;
  gamesPlayed: number;
  totalCoinsEarned: number;
  timesFed: number;
  timesCleaned: number;
  timesPlayed: number;
  lastLoginDate: string; // YYYY-MM-DD
  consecutiveLogins: number;
  lastClaimedRewardDay: number; // 0 to 7
}

export interface PetState {
  id: string;
  name: string;
  type: PetType;
  level: number;
  experience: number;
  coins: number;
  stats: PetStats;
  customization: PetCustomization;
  room: RoomCustomization;
  isSleeping: boolean;
  adoptedAt: number;
  lastInteractionAt: number;
  inventory: Record<string, number>; // item id -> quantity
  unlockedItems: string[]; // item IDs owned
  unlockedPets: PetType[]; // pets adopted/unlocked
  lifetimeStats: LifetimeStats;
  tutorialCompleted: boolean;
}

export interface FoodItem {
  id: string;
  name: string;
  icon: string;
  price: number;
  hungerBoost: number;
  happinessBoost: number;
  energyBoost: number;
  description: string;
  levelRequired: number;
  favoriteFor?: PetType[];
}

export type ShopCategory = 'food' | 'toys' | 'accessories' | 'outfits' | 'beds' | 'wallpapers' | 'decor';

export interface ShopItem {
  id: string;
  name: string;
  category: ShopCategory;
  price: number;
  icon: string;
  description: string;
  levelRequired: number;
  slotType?: keyof PetCustomization | keyof RoomCustomization;
  color?: string;
  isConsumable?: boolean;
}

export type MiniGameType = 'food-catch' | 'memory-match' | 'bubble-pop' | 'pet-runner';

export type MultiplayerMiniGameType = 'race' | 'hide-and-seek' | 'ball-play';

export interface MultiplayerPlayer {
  petId: string;
  petName: string;
  petType: PetType;
  customization?: PetCustomization;
  position: { x: number; z: number };
  targetPosition?: { x: number; z: number };
  action: 'idle' | 'walking' | 'dance' | 'sing' | 'happy' | 'game';
  score?: number;
  lastPing: number;
  isBot?: boolean;
}

export interface MultiplayerRoom {
  code: string; // 6-digit room code e.g. "849201"
  createdAt: number;
  host: MultiplayerPlayer;
  guest: MultiplayerPlayer | null;
  activeGame: 'none' | MultiplayerMiniGameType;
  gameData?: any;
}

export interface DailyReward {
  day: number;
  coins: number;
  rewardText: string;
  icon: string;
  bonusItem?: {
    type: 'food' | 'accessory';
    id: string;
    name: string;
  };
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: 'hunger' | 'sleep' | 'play' | 'clean' | 'general';
}

export interface SoundSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  notificationsEnabled: boolean;
}
