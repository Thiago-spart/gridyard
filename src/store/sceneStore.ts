import { create } from 'zustand';
import { getFootprint, type PieceInstance } from '../lib/pieces';
import { hasCollision } from '../lib/collision';
import { worldToGrid } from '../lib/grid';
import { ensureSession, saveScene as persistSave, loadScene as persistLoad } from '../persistence';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SceneState {
  pieces: PieceInstance[];
  selectedIds: string[];
  viewMode: 'top' | 'perspective';
  saveStatus: SaveStatus;
  selectPiece: (id: string) => void;
  clearSelection: () => void;
  movePiece: (id: string, worldX: number, worldZ: number) => boolean;
  rotatePiece: (id: string) => void;
  setViewMode: (mode: 'top' | 'perspective') => void;
  saveScene: () => Promise<void>;
  loadScene: () => Promise<void>;
}

// Tracks save resolution order (not invocation order). Bumped once a call's
// persistSave settles, right before it decides the resulting status and
// schedules its own idle-reset timer. Only the timer belonging to whichever
// call settled *last* will still see its captured value match this counter
// when it fires, so an earlier-settling call's timer can never clobber a
// later-settling call's status — regardless of invocation order.
let saveGeneration = 0;

export const INITIAL_PIECES: PieceInstance[] = [
  { id: 'pallet-1', type: 'pallet', gridX: 0, gridY: 0, rotation: 0 },
  { id: 'shelf-1', type: 'shelf', gridX: 3, gridY: 0, rotation: 0 },
  { id: 'crate-1', type: 'crate', gridX: 6, gridY: 0, rotation: 0 },
  { id: 'workstation-1', type: 'workstation', gridX: 0, gridY: 3, rotation: 0 },
];

export const useSceneStore = create<SceneState>((set, get) => ({
  pieces: INITIAL_PIECES,
  selectedIds: [],
  viewMode: 'top',
  saveStatus: 'idle',

  selectPiece: (id) => {
    const { selectedIds } = get();
    if (selectedIds.length === 0) {
      set({ selectedIds: [id] });
    } else if (selectedIds.length === 1) {
      set({ selectedIds: selectedIds[0] === id ? selectedIds : [selectedIds[0], id] });
    } else {
      set({ selectedIds: [id] });
    }
  },

  clearSelection: () => set({ selectedIds: [] }),

  movePiece: (id, worldX, worldZ) => {
    const { pieces } = get();
    const piece = pieces.find((p) => p.id === id);
    if (!piece) return false;
    const footprint = getFootprint(piece);
    const { gridX, gridY } = worldToGrid(worldX, worldZ, footprint.width, footprint.depth);
    const candidate: PieceInstance = { ...piece, gridX, gridY };
    if (hasCollision(candidate, pieces)) return false;
    set({ pieces: pieces.map((p) => (p.id === id ? candidate : p)) });
    return true;
  },

  rotatePiece: (id) => {
    const { pieces } = get();
    const piece = pieces.find((p) => p.id === id);
    if (!piece) return;
    const candidate: PieceInstance = { ...piece, rotation: piece.rotation === 0 ? 90 : 0 };
    if (hasCollision(candidate, pieces)) return;
    set({ pieces: pieces.map((p) => (p.id === id ? candidate : p)) });
  },

  setViewMode: (viewMode) => set({ viewMode }),

  saveScene: async () => {
    set({ saveStatus: 'saving' });
    let nextStatus: SaveStatus;
    try {
      await persistSave(get().pieces);
      nextStatus = 'saved';
    } catch (error) {
      console.error('Failed to save scene:', error);
      nextStatus = 'error';
    }
    const generation = ++saveGeneration;
    set({ saveStatus: nextStatus });
    setTimeout(() => {
      if (generation === saveGeneration) set({ saveStatus: 'idle' });
    }, 2000);
  },

  loadScene: async () => {
    await ensureSession();
    const loaded = await persistLoad();
    if (loaded) set({ pieces: loaded, selectedIds: [] });
  },
}));
