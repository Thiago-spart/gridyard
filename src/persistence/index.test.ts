import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./localStorage', () => ({
  saveScene: vi.fn(),
  loadScene: vi.fn(() => null),
}));

vi.mock('./supabase', () => ({
  ensureSession: vi.fn(async () => {}),
  saveScene: vi.fn(async () => {}),
  loadScene: vi.fn(async () => null),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('persistence backend selection', () => {
  it('uses the localStorage backend when no Supabase env vars are set', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', undefined);
    const localStorageBackend = await import('./localStorage');
    const persistence = await import('./index');
    await persistence.ensureSession();
    await persistence.saveScene([]);
    expect(localStorageBackend.saveScene).toHaveBeenCalledWith([]);
  });

  it('uses the Supabase backend when VITE_SUPABASE_URL is set', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    const supabaseBackend = await import('./supabase');
    const persistence = await import('./index');
    await persistence.saveScene([]);
    expect(supabaseBackend.saveScene).toHaveBeenCalledWith([]);
  });
});
