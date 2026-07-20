import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureSession, saveScene, loadScene } from './supabase';
import type { PieceInstance } from '../lib/pieces';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  signInAnonymously: vi.fn(),
  upsert: vi.fn(),
  maybeSingle: vi.fn(),
}));

vi.mock('./supabaseClient', () => ({
  getSupabaseClient: () => ({
    auth: { getSession: mocks.getSession, signInAnonymously: mocks.signInAnonymously },
    from: vi.fn(() => ({
      upsert: mocks.upsert,
      select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: mocks.maybeSingle })) })),
    })),
  }),
}));

const pieces: PieceInstance[] = [{ id: 'a', type: 'pallet', gridX: 0, gridY: 0, rotation: 0 }];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ensureSession', () => {
  it('signs in anonymously when there is no session', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null } });
    await ensureSession();
    expect(mocks.signInAnonymously).toHaveBeenCalledOnce();
  });

  it('does nothing when a session already exists', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } });
    await ensureSession();
    expect(mocks.signInAnonymously).not.toHaveBeenCalled();
  });
});

describe('saveScene', () => {
  it('upserts the current pieces under the session user id', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } });
    mocks.upsert.mockResolvedValue({ error: null });
    await saveScene(pieces);
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1', data: pieces }),
    );
  });

  it('throws when the upsert fails', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } });
    mocks.upsert.mockResolvedValue({ error: new Error('network down') });
    await expect(saveScene(pieces)).rejects.toThrow('network down');
  });
});

describe('loadScene', () => {
  it('returns null when there is no session', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null } });
    expect(await loadScene()).toBeNull();
  });

  it('returns null when no row is stored for the user', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } });
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await loadScene()).toBeNull();
  });

  it('returns the stored pieces for the session user', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } });
    mocks.maybeSingle.mockResolvedValue({ data: { data: pieces }, error: null });
    expect(await loadScene()).toEqual(pieces);
  });

  it('returns null instead of throwing when the query errors', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } });
    mocks.maybeSingle.mockResolvedValue({ data: null, error: new Error('network down') });
    expect(await loadScene()).toBeNull();
  });
});
