import { MultiplayerPlayer, MultiplayerRoom, MultiplayerMiniGameType, PetType } from '../types';

const ROOM_PREFIX = 'pocket_pet_multiplayer_room_';
const ACTIVE_ROOMS_KEY = 'pocket_pet_active_rooms_list';
const CHANNEL_NAME = 'pocket_pet_realtime_channel';

// Setup BroadcastChannel for instant inter-tab communication
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch {
  // BroadcastChannel unavailable
}

type RoomListener = (room: MultiplayerRoom | null) => void;
const listeners = new Set<RoomListener>();

function notifyListeners(room: MultiplayerRoom | null) {
  listeners.forEach((listener) => {
    try {
      listener(room);
    } catch (e) {
      console.error('Error in multiplayer room listener', e);
    }
  });
}

// Broadcast message types
type BroadcastMessage =
  | { type: 'ROOM_UPDATE'; room: MultiplayerRoom }
  | { type: 'ROOM_CLOSED'; code: string }
  | { type: 'ACTION_EVENT'; code: string; petId: string; action: string; payload?: any };

function broadcast(msg: BroadcastMessage) {
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(msg);
    } catch {
      // Ignored
    }
  }
}

// Initialize channel and cross-tab storage event listening
if (typeof window !== 'undefined') {
  if (broadcastChannel) {
    broadcastChannel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
      const data = event.data;
      if (!data) return;

      if (data.type === 'ROOM_UPDATE') {
        notifyListeners(data.room);
      } else if (data.type === 'ROOM_CLOSED') {
        notifyListeners(null);
      }
    };
  }

  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key && e.key.startsWith(ROOM_PREFIX)) {
      if (e.newValue) {
        try {
          const room = JSON.parse(e.newValue) as MultiplayerRoom;
          notifyListeners(room);
        } catch {
          // Ignored
        }
      } else {
        notifyListeners(null);
      }
    }
  });
}

export function subscribeToRoom(listener: RoomListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getActiveRoom(code: string): MultiplayerRoom | null {
  try {
    const raw = localStorage.getItem(`${ROOM_PREFIX}${code}`);
    if (!raw) return null;
    return JSON.parse(raw) as MultiplayerRoom;
  } catch {
    return null;
  }
}

export function saveRoom(room: MultiplayerRoom): void {
  try {
    localStorage.setItem(`${ROOM_PREFIX}${room.code}`, JSON.stringify(room));
    // Also track in active rooms index
    const rawList = localStorage.getItem(ACTIVE_ROOMS_KEY);
    const list: string[] = rawList ? JSON.parse(rawList) : [];
    if (!list.includes(room.code)) {
      list.push(room.code);
      localStorage.setItem(ACTIVE_ROOMS_KEY, JSON.stringify(list.slice(-10)));
    }
    broadcast({ type: 'ROOM_UPDATE', room });
    notifyListeners(room);
  } catch {
    // Ignored
  }
}

export function deleteRoom(code: string): void {
  try {
    localStorage.removeItem(`${ROOM_PREFIX}${code}`);
    const rawList = localStorage.getItem(ACTIVE_ROOMS_KEY);
    if (rawList) {
      const list: string[] = JSON.parse(rawList);
      const filtered = list.filter((c) => c !== code);
      localStorage.setItem(ACTIVE_ROOMS_KEY, JSON.stringify(filtered));
    }
    broadcast({ type: 'ROOM_CLOSED', code });
    notifyListeners(null);
  } catch {
    // Ignored
  }
}

// Generate random 6-digit code
export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

// Create a new room with host
export function createMultiplayerRoom(host: MultiplayerPlayer): MultiplayerRoom {
  const code = generateRoomCode();
  const room: MultiplayerRoom = {
    code,
    createdAt: Date.now(),
    host: {
      ...host,
      action: 'idle',
      lastPing: Date.now(),
    },
    guest: null,
    activeGame: 'none',
  };

  saveRoom(room);
  return room;
}

// Join an existing room with guest
export function joinMultiplayerRoom(
  code: string,
  guest: MultiplayerPlayer
): { success: boolean; room: MultiplayerRoom | null; error?: string } {
  const cleanCode = code.trim();
  const room = getActiveRoom(cleanCode);

  if (!room) {
    return { success: false, room: null, error: `Room #${cleanCode} not found! Check the code and try again.` };
  }

  // Prevent joining yourself as both host and guest
  if (room.host.petId === guest.petId) {
    // Update host state
    room.host = { ...room.host, ...guest, lastPing: Date.now() };
    saveRoom(room);
    return { success: true, room };
  }

  // If room already has guest with different petId
  if (room.guest && room.guest.petId !== guest.petId) {
    // Check if guest timed out (older than 30s)
    const isStale = Date.now() - (room.guest.lastPing || 0) > 30000;
    if (!isStale) {
      return { success: false, room: null, error: `Room #${cleanCode} is full (2/2 hamsters present).` };
    }
  }

  // Join as guest!
  room.guest = {
    ...guest,
    action: 'idle',
    lastPing: Date.now(),
  };

  saveRoom(room);
  return { success: true, room };
}

// Leave room
export function leaveMultiplayerRoom(code: string, petId: string): void {
  const room = getActiveRoom(code);
  if (!room) return;

  if (room.host.petId === petId) {
    // If host leaves, if there is a guest, promote guest to host or close room
    if (room.guest && !room.guest.isBot) {
      room.host = room.guest;
      room.guest = null;
      saveRoom(room);
    } else {
      deleteRoom(code);
    }
  } else if (room.guest && room.guest.petId === petId) {
    room.guest = null;
    saveRoom(room);
  }
}

// Update player position or target in room
export function updateRoomPlayerPosition(
  code: string,
  petId: string,
  pos: { x: number; z: number },
  targetPos?: { x: number; z: number },
  action: 'idle' | 'walking' | 'dance' | 'sing' | 'happy' | 'game' = 'walking'
): void {
  const room = getActiveRoom(code);
  if (!room) return;

  let changed = false;
  if (room.host.petId === petId) {
    room.host.position = pos;
    if (targetPos) room.host.targetPosition = targetPos;
    room.host.action = action;
    room.host.lastPing = Date.now();
    changed = true;
  } else if (room.guest && room.guest.petId === petId) {
    room.guest.position = pos;
    if (targetPos) room.guest.targetPosition = targetPos;
    room.guest.action = action;
    room.guest.lastPing = Date.now();
    changed = true;
  }

  if (changed) {
    saveRoom(room);
  }
}

// Trigger player action (dance, sing, happy jump)
export function triggerRoomPlayerAction(
  code: string,
  petId: string,
  action: 'dance' | 'sing' | 'happy' | 'idle'
): void {
  const room = getActiveRoom(code);
  if (!room) return;

  if (room.host.petId === petId) {
    room.host.action = action;
    room.host.lastPing = Date.now();
    saveRoom(room);
  } else if (room.guest && room.guest.petId === petId) {
    room.guest.action = action;
    room.guest.lastPing = Date.now();
    saveRoom(room);
  }
}

// Mini-game control in room
export function setRoomMiniGame(
  code: string,
  game: 'none' | MultiplayerMiniGameType,
  gameData: any = null
): void {
  const room = getActiveRoom(code);
  if (!room) return;

  room.activeGame = game;
  room.gameData = gameData;
  saveRoom(room);
}

// Update mini-game state (e.g. ball position, race progress)
export function updateRoomGameData(code: string, gameData: any): void {
  const room = getActiveRoom(code);
  if (!room) return;

  room.gameData = { ...(room.gameData || {}), ...gameData };
  saveRoom(room);
}

// Simulate Friend for Instant Single-Tab Demo Testing!
export function simulateFriendJoin(code: string): MultiplayerRoom | null {
  const room = getActiveRoom(code);
  if (!room) return null;

  const botNames = ['Mochi', 'Coco', 'Peanut', 'Boba', 'Pippin'];
  const randomName = botNames[Math.floor(Math.random() * botNames.length)];
  const botId = `HAM-${Math.floor(1000 + Math.random() * 9000)}`;

  const friend: MultiplayerPlayer = {
    petId: botId,
    petName: randomName,
    petType: 'hamster',
    customization: {
      accessory: 'bow-pink',
    },
    position: { x: 0.8, z: 0.5 },
    targetPosition: { x: 0.8, z: 0.5 },
    action: 'idle',
    lastPing: Date.now(),
    isBot: true,
  };

  room.guest = friend;
  saveRoom(room);
  return room;
}

// Unified multiplayer manager facade for simple clean state integration
export const multiplayerManager = {
  activeRoomCode: null as string | null,

  getCurrentRoom(): MultiplayerRoom | null {
    if (this.activeRoomCode) {
      const r = getActiveRoom(this.activeRoomCode);
      if (r) return r;
    }
    try {
      const rawList = localStorage.getItem(ACTIVE_ROOMS_KEY);
      if (rawList) {
        const list: string[] = JSON.parse(rawList);
        if (list.length > 0) {
          const lastCode = list[list.length - 1];
          const found = getActiveRoom(lastCode);
          if (found) {
            this.activeRoomCode = found.code;
            return found;
          }
        }
      }
    } catch {
      // Ignored
    }
    return null;
  },

  createRoom(pet: { id: string; name: string; type: PetType; customization?: any }): MultiplayerRoom {
    const host: MultiplayerPlayer = {
      petId: pet.id,
      petName: pet.name,
      petType: pet.type,
      customization: pet.customization,
      position: { x: -0.6, z: 0.2 },
      targetPosition: { x: -0.6, z: 0.2 },
      action: 'idle',
      lastPing: Date.now(),
    };
    const room = createMultiplayerRoom(host);
    this.activeRoomCode = room.code;
    return room;
  },

  joinRoom(code: string, pet: { id: string; name: string; type: PetType; customization?: any }): boolean {
    const guest: MultiplayerPlayer = {
      petId: pet.id,
      petName: pet.name,
      petType: pet.type,
      customization: pet.customization,
      position: { x: 0.8, z: 0.5 },
      targetPosition: { x: 0.8, z: 0.5 },
      action: 'idle',
      lastPing: Date.now(),
    };
    const res = joinMultiplayerRoom(code, guest);
    if (res.success && res.room) {
      this.activeRoomCode = res.room.code;
      return true;
    }
    return false;
  },

  leaveRoom(petId: string): void {
    if (this.activeRoomCode) {
      leaveMultiplayerRoom(this.activeRoomCode, petId);
      this.activeRoomCode = null;
    }
  },

  updatePlayerPosition(petId: string, pos: { x: number; z: number }): void {
    if (this.activeRoomCode) {
      updateRoomPlayerPosition(this.activeRoomCode, petId, pos, pos, 'walking');
    }
  },

  broadcastPlayerAction(petId: string, action: 'dance' | 'sing' | 'happy' | 'idle'): void {
    if (this.activeRoomCode) {
      triggerRoomPlayerAction(this.activeRoomCode, petId, action);
    }
  },

  simulateFriendJoin(pet: { id: string; name?: string; type?: PetType; customization?: any }): MultiplayerRoom | null {
    if (!this.activeRoomCode) {
      this.createRoom({
        id: pet.id,
        name: pet.name || 'Hammy',
        type: pet.type || 'hamster',
        customization: pet.customization,
      });
    }
    if (this.activeRoomCode) {
      return simulateFriendJoin(this.activeRoomCode);
    }
    return null;
  },

  setRoomGame(game: MultiplayerMiniGameType | null): void {
    if (this.activeRoomCode) {
      setRoomMiniGame(this.activeRoomCode, game || 'none');
    }
  },

  subscribeToRoom(listener: RoomListener): () => void {
    return subscribeToRoom(listener);
  },
};

