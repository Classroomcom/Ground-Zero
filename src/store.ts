import { create } from 'zustand';

export interface PlayerState {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  health: number;
}

export interface Objective {
  id: string;
  type: 'BOMB_SITE' | 'SUPPLY_DROP' | 'EXTRACTION';
  position: [number, number, number];
  name: string;
}

interface GameState {
  health: number;
  ammo: number;
  maxAmmo: number;
  isReloading: boolean;
  myPosition: [number, number, number];
  myRotation: number;
  zone: { center: [number, number]; radius: number };
  objectives: Objective[];
  otherPlayers: Map<string, PlayerState>;
  chat: { user: string; text: string }[];
  isLocked: boolean; // Pointer lock state
  githubToken: string | null;
  githubUser: any | null;
  setHealth: (h: number) => void;
  setAmmo: (a: number) => void;
  setIsReloading: (r: boolean) => void;
  setMyPosition: (pos: [number, number, number], rot: number) => void;
  setZone: (center: [number, number], radius: number) => void;
  setObjectives: (objs: Objective[]) => void;
  updatePlayer: (id: string, data: Partial<PlayerState>) => void;
  removePlayer: (id: string) => void;
  addChatMessage: (msg: { user: string; text: string }) => void;
  setLocked: (locked: boolean) => void;
}

export const useGameStore = create<GameState>((set) => ({
  health: 100,
  ammo: 30,
  maxAmmo: 30,
  isReloading: false,
  myPosition: [0, 0, 0],
  myRotation: 0,
  zone: { center: [0, 0], radius: 150 },
  objectives: [],
  otherPlayers: new Map(),
  chat: [],
  isLocked: false,
  setHealth: (health) => set({ health }),
  setAmmo: (ammo) => set({ ammo }),
  setIsReloading: (isReloading) => set({ isReloading }),
  setMyPosition: (myPosition, myRotation) => set({ myPosition, myRotation }),
  setZone: (center, radius) => set((state) => ({ zone: { center, radius } })),
  setObjectives: (objectives) => set({ objectives }),
  updatePlayer: (id, data) => set((state) => {
    const newPlayers = new Map(state.otherPlayers);
    const existing = newPlayers.get(id) || { id, position: [0, 0, 0], rotation: [0, 0, 0], health: 100 };
    newPlayers.set(id, { ...existing, ...data });
    return { otherPlayers: newPlayers };
  }),
  removePlayer: (id) => set((state) => {
    const newPlayers = new Map(state.otherPlayers);
    newPlayers.delete(id);
    return { otherPlayers: newPlayers };
  }),
  addChatMessage: (msg) => set((state) => ({ 
    chat: [...state.chat.slice(-4), msg] // Keep last 5 messages
  })),
  setLocked: (isLocked) => set({ isLocked }),
}));
