import { PetState, PetMood, PetType, PetStats, LifetimeStats, RoomCustomization } from '../types';
import { INITIAL_PET_STATE, PET_CONFIGS } from '../data/initialData';

const STORAGE_KEY = 'pocket_pet_save_v1';
const SOUND_KEY = 'pocket_pet_sound_v1';

// In-memory fallback if localStorage is blocked by iframe sandboxing policies
const memoryStore = new Map<string, string>();

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // Restricted environment fallback
  }
  return memoryStore.get(key) || null;
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Restricted environment fallback
  }
  memoryStore.set(key, value);
}

function safeRemoveItem(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Restricted environment fallback
  }
  memoryStore.delete(key);
}

export function generateUniquePetId(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `HAM-${num}`;
}

export function sanitizePetState(raw: unknown): PetState {
  if (!raw || typeof raw !== 'object') {
    return { ...INITIAL_PET_STATE };
  }

  const data = raw as Partial<PetState>;

  const validTypes = Object.keys(PET_CONFIGS) as PetType[];
  const type: PetType = (data.type && validTypes.includes(data.type as PetType)) ? (data.type as PetType) : INITIAL_PET_STATE.type;

  const rawStats = (data.stats || {}) as Partial<PetStats>;
  const stats = {
    hunger: typeof rawStats.hunger === 'number' && !isNaN(rawStats.hunger)
      ? Math.max(0, Math.min(100, Math.round(rawStats.hunger)))
      : INITIAL_PET_STATE.stats.hunger,
    happiness: typeof rawStats.happiness === 'number' && !isNaN(rawStats.happiness)
      ? Math.max(0, Math.min(100, Math.round(rawStats.happiness)))
      : INITIAL_PET_STATE.stats.happiness,
    energy: typeof rawStats.energy === 'number' && !isNaN(rawStats.energy)
      ? Math.max(0, Math.min(100, Math.round(rawStats.energy)))
      : INITIAL_PET_STATE.stats.energy,
    cleanliness: typeof rawStats.cleanliness === 'number' && !isNaN(rawStats.cleanliness)
      ? Math.max(0, Math.min(100, Math.round(rawStats.cleanliness)))
      : INITIAL_PET_STATE.stats.cleanliness,
  };

  const rawLifetime = (data.lifetimeStats || {}) as Partial<LifetimeStats>;
  const lifetimeStats = {
    totalCoinsEarned: typeof rawLifetime.totalCoinsEarned === 'number' && !isNaN(rawLifetime.totalCoinsEarned)
      ? rawLifetime.totalCoinsEarned
      : INITIAL_PET_STATE.lifetimeStats.totalCoinsEarned,
    gamesPlayed: typeof rawLifetime.gamesPlayed === 'number' && !isNaN(rawLifetime.gamesPlayed)
      ? rawLifetime.gamesPlayed
      : INITIAL_PET_STATE.lifetimeStats.gamesPlayed,
    timesFed: typeof rawLifetime.timesFed === 'number' && !isNaN(rawLifetime.timesFed)
      ? rawLifetime.timesFed
      : INITIAL_PET_STATE.lifetimeStats.timesFed,
    timesCleaned: typeof rawLifetime.timesCleaned === 'number' && !isNaN(rawLifetime.timesCleaned)
      ? rawLifetime.timesCleaned
      : INITIAL_PET_STATE.lifetimeStats.timesCleaned,
    timesPlayed: typeof rawLifetime.timesPlayed === 'number' && !isNaN(rawLifetime.timesPlayed)
      ? rawLifetime.timesPlayed
      : INITIAL_PET_STATE.lifetimeStats.timesPlayed,
    consecutiveLogins: typeof rawLifetime.consecutiveLogins === 'number' && !isNaN(rawLifetime.consecutiveLogins)
      ? Math.max(1, rawLifetime.consecutiveLogins)
      : INITIAL_PET_STATE.lifetimeStats.consecutiveLogins,
    lastLoginDate: typeof rawLifetime.lastLoginDate === 'string'
      ? rawLifetime.lastLoginDate
      : new Date().toISOString().split('T')[0],
    lastClaimedRewardDay: typeof rawLifetime.lastClaimedRewardDay === 'number' && !isNaN(rawLifetime.lastClaimedRewardDay)
      ? rawLifetime.lastClaimedRewardDay
      : INITIAL_PET_STATE.lifetimeStats.lastClaimedRewardDay,
    daysCared: typeof rawLifetime.daysCared === 'number' && !isNaN(rawLifetime.daysCared)
      ? rawLifetime.daysCared
      : INITIAL_PET_STATE.lifetimeStats.daysCared,
  };

  const rawRoom = (data.room || {}) as Partial<RoomCustomization> & { floor?: string };
  const room: RoomCustomization = {
    wallpaper: typeof rawRoom.wallpaper === 'string' ? rawRoom.wallpaper : INITIAL_PET_STATE.room.wallpaper,
    flooring: typeof rawRoom.flooring === 'string' ? rawRoom.flooring : (typeof rawRoom.floor === 'string' ? rawRoom.floor : INITIAL_PET_STATE.room.flooring),
    bed: typeof rawRoom.bed === 'string' ? rawRoom.bed : INITIAL_PET_STATE.room.bed,
    decor: typeof rawRoom.decor === 'string' ? rawRoom.decor : INITIAL_PET_STATE.room.decor,
  };

  const rawCustomization = data.customization || {};
  const customization = {
    hat: typeof rawCustomization.hat === 'string' ? rawCustomization.hat : undefined,
    glasses: typeof rawCustomization.glasses === 'string' ? rawCustomization.glasses : undefined,
    bow: typeof rawCustomization.bow === 'string' ? rawCustomization.bow : undefined,
    outfit: typeof rawCustomization.outfit === 'string' ? rawCustomization.outfit : undefined,
    accessory: typeof rawCustomization.accessory === 'string' ? rawCustomization.accessory : undefined,
  };

  const petId = (typeof data.id === 'string' && data.id && data.id !== 'pet_default')
    ? data.id
    : generateUniquePetId();

  return {
    id: petId,
    name: typeof data.name === 'string' && data.name.trim() ? data.name.trim() : INITIAL_PET_STATE.name,
    type,
    level: typeof data.level === 'number' && !isNaN(data.level) && data.level >= 1 ? data.level : 1,
    experience: typeof data.experience === 'number' && !isNaN(data.experience) && data.experience >= 0 ? data.experience : 0,
    coins: typeof data.coins === 'number' && !isNaN(data.coins) && data.coins >= 0 ? data.coins : INITIAL_PET_STATE.coins,
    stats,
    isSleeping: Boolean(data.isSleeping),
    customization,
    room,
    inventory: data.inventory && typeof data.inventory === 'object' ? { ...data.inventory } : { ...INITIAL_PET_STATE.inventory },
    unlockedItems: Array.isArray(data.unlockedItems) ? [...data.unlockedItems] : [...INITIAL_PET_STATE.unlockedItems],
    unlockedPets: Array.isArray(data.unlockedPets) && data.unlockedPets.length > 0 ? [...data.unlockedPets] : [type],
    adoptedAt: typeof data.adoptedAt === 'number' && !isNaN(data.adoptedAt) ? data.adoptedAt : Date.now(),
    lastInteractionAt: typeof data.lastInteractionAt === 'number' && !isNaN(data.lastInteractionAt) ? data.lastInteractionAt : Date.now(),
    tutorialCompleted: Boolean(data.tutorialCompleted),
    lifetimeStats,
  };
}

export function loadSavedPet(): PetState {
  try {
    const raw = safeGetItem(STORAGE_KEY);
    if (!raw) return { ...INITIAL_PET_STATE };
    
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ...INITIAL_PET_STATE };
    }

    const data: PetState = sanitizePetState(parsed);

    // Apply time-based decay since last interaction
    const now = Date.now();
    const elapsedMinutes = Math.floor((now - (data.lastInteractionAt || now)) / (1000 * 60));

    if (elapsedMinutes > 0) {
      // Gentle decay: capped so pet doesn't instantly zero out
      const decayCycles = Math.min(elapsedMinutes / 10, 20); // max 20 decay ticks while away

      if (data.isSleeping) {
        // While sleeping: energy regenerates! hunger drops slightly
        data.stats.energy = Math.min(100, Math.round(data.stats.energy + decayCycles * 4));
        data.stats.hunger = Math.max(10, Math.round(data.stats.hunger - decayCycles * 0.8));
      } else {
        data.stats.hunger = Math.max(5, Math.round(data.stats.hunger - decayCycles * 1.5));
        data.stats.energy = Math.max(10, Math.round(data.stats.energy - decayCycles * 1.2));
        data.stats.cleanliness = Math.max(10, Math.round(data.stats.cleanliness - decayCycles * 1.0));
        data.stats.happiness = Math.max(10, Math.round(data.stats.happiness - decayCycles * 1.0));
      }
      data.lastInteractionAt = now;
    }

    // Daily login calculation
    const todayStr = new Date().toISOString().split('T')[0];
    if (data.lifetimeStats.lastLoginDate !== todayStr) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (data.lifetimeStats.lastLoginDate === yesterdayStr) {
        data.lifetimeStats.consecutiveLogins += 1;
      } else {
        // missed days, reset streak to 1
        data.lifetimeStats.consecutiveLogins = 1;
      }
      data.lifetimeStats.lastLoginDate = todayStr;
      data.lifetimeStats.daysCared += 1;
    }

    return data;
  } catch (e) {
    console.error('Failed to load pet state from storage', e);
    return { ...INITIAL_PET_STATE };
  }
}

export function savePet(state: PetState): void {
  try {
    const toSave = {
      ...state,
      lastInteractionAt: Date.now(),
    };
    safeSetItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error('Failed to save pet state', e);
  }
}

export function clearSavedPet(): void {
  safeRemoveItem(STORAGE_KEY);
}

export function calculateMood(stats: PetState['stats'], isSleeping: boolean): PetMood {
  const safeStats = stats || INITIAL_PET_STATE.stats;
  if (isSleeping) return 'sleepy';
  if ((safeStats.cleanliness ?? 100) < 35) return 'dirty';
  if ((safeStats.hunger ?? 100) < 35) return 'hungry';
  if ((safeStats.energy ?? 100) < 30) return 'sleepy';
  if ((safeStats.happiness ?? 100) < 40) return 'sad';
  if ((safeStats.happiness ?? 100) > 80 && (safeStats.hunger ?? 100) > 60 && (safeStats.energy ?? 100) > 60) return 'excited';
  return 'happy';
}

export function getRequiredXP(level: number): number {
  return Math.max(1, level) * 100;
}

export function addExperience(pet: PetState, amount: number): { updatedPet: PetState; leveledUp: boolean; newLevel: number } {
  const safePet = sanitizePetState(pet);
  let xp = safePet.experience + Math.max(0, amount);
  let level = safePet.level;
  let leveledUp = false;
  let reqXP = getRequiredXP(level);

  while (xp >= reqXP) {
    xp -= reqXP;
    level += 1;
    leveledUp = true;
    reqXP = getRequiredXP(level);
  }

  const updatedPet: PetState = {
    ...safePet,
    level,
    experience: xp,
    coins: leveledUp ? safePet.coins + level * 50 : safePet.coins,
  };

  return { updatedPet, leveledUp, newLevel: level };
}

export function loadSoundPreference(): boolean {
  try {
    const val = safeGetItem(SOUND_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function saveSoundPreference(val: boolean): void {
  try {
    safeSetItem(SOUND_KEY, String(val));
  } catch {
    // ignore
  }
}
