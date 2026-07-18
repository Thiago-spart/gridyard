import type { PieceInstance } from '../lib/pieces';

const STORAGE_KEY = 'warehouse-layout-scene';

export function saveScene(pieces: PieceInstance[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pieces));
}

export function loadScene(): PieceInstance[] | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PieceInstance[];
  } catch {
    return null;
  }
}
