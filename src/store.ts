import { create } from 'zustand';

export interface PlayerState {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  health: number;
}

interface GameState {
  health: number;
  ammo: number;
  maxAmmo: number;
  otherPlayers: Map<string, PlayerState>;
  chat: { user: string; text: string }[];
  isLocked: boolean; // Pointer lock state
  setHealth: (h: number) => void;
  setAmmo: (a: number) => void;
  updatePlayer: (id: string, data: Partial<PlayerState>) => void;
  removePlayer: (id: string) => void;
  addChatMessage: (msg: { user: string; text: string }) => void;
  setLocked: (locked: boolean) => void;
}

export const useGameStore = create<GameState>((set) => ({
  health: 100,
  ammo: 30,
  maxAmmo: 30,
  otherPlayers: new Map(),
  chat: [],
  isLocked: false,
  setHealth: (health) => set({ health }),
  setAmmo: (ammo) => set({ ammo }),
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
