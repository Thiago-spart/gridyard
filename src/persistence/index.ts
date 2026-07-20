import type { PieceInstance } from '../lib/pieces';
import * as localStorageBackend from './localStorage';
import * as supabaseBackend from './supabase';

interface PersistenceBackend {
  ensureSession: () => Promise<void>;
  saveScene: (pieces: PieceInstance[]) => Promise<void>;
  loadScene: () => Promise<PieceInstance[] | null>;
}

const localStorageAsBackend: PersistenceBackend = {
  ensureSession: async () => {},
  saveScene: async (pieces) => localStorageBackend.saveScene(pieces),
  loadScene: async () => localStorageBackend.loadScene(),
};

const activeBackend: PersistenceBackend = import.meta.env.VITE_SUPABASE_URL
  ? supabaseBackend
  : localStorageAsBackend;

export const ensureSession = activeBackend.ensureSession;
export const saveScene = activeBackend.saveScene;
export const loadScene = activeBackend.loadScene;
