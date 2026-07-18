import { create } from 'zustand';
import { getFootprint, type PieceInstance } from '../lib/pieces';
import { hasCollision } from '../lib/collision';
import { worldToGrid } from '../lib/grid';
import { saveScene as persistSave, loadScene as persistLoad } from '../persistence/localStorage';

interface SceneState {
  pieces: PieceInstance[];
  selectedIds: string[];
  viewMode: 'top' | 'perspective';
  selectPiece: (id: string) => void;
  clearSelection: () => void;
  movePiece: (id: string, worldX: number, worldZ: number) => boolean;
  rotatePiece: (id: string) => void;
  setViewMode: (mode: 'top' | 'perspective') => void;
  saveScene: () => void;
  loadScene: () => void;
}

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

  saveScene: () => persistSave(get().pieces),
  loadScene: () => {
    const loaded = persistLoad();
    if (loaded) set({ pieces: loaded, selectedIds: [] });
  },
}));
