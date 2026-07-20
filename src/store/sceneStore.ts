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
  hasLoaded: boolean;
  selectPiece: (id: string) => void;
  clearSelection: () => void;
  movePiece: (id: string, worldX: number, worldZ: number) => boolean;
  rotatePiece: (id: string) => void;
  setViewMode: (mode: 'top' | 'perspective') => void;
  saveScene: () => Promise<void>;
  loadScene: () => Promise<void>;
}

// Tracks save *invocation* order (not settlement order). Bumped at the start
// of every saveScene() call, before the await, and the resulting id is
// captured in that call's closure. A call's idle-reset timer is only allowed
// to fire if no *newer* call has been invoked since — checked by comparing
// the captured id against this counter's current value when the timer fires.
// This deliberately does NOT gate the status VALUE written when a call
// settles (set({ saveStatus: nextStatus }) stays unconditional — whichever
// call settles most recently wins the displayed value). It only gates
// whether a call is allowed to reset the status to 'idle' later, so a call
// that is superseded by a newer invocation can never wrongly report idle
// while that newer call may still be in flight.
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
  hasLoaded: false,

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
    const generation = ++saveGeneration;
    set({ saveStatus: 'saving' });
    let nextStatus: SaveStatus;
    try {
      await persistSave(get().pieces);
      nextStatus = 'saved';
    } catch (error) {
      console.error('Failed to save scene:', error);
      nextStatus = 'error';
    }
    set({ saveStatus: nextStatus });
    setTimeout(() => {
      if (generation === saveGeneration) set({ saveStatus: 'idle' });
    }, 2000);
  },

  loadScene: async () => {
    await ensureSession();
    const loaded = await persistLoad();
    if (loaded) set({ pieces: loaded, selectedIds: [] });
    set({ hasLoaded: true });
  },
}));
