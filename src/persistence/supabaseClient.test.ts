import { afterEach, describe, expect, it, vi } from 'vitest';

describe('getSupabaseClient', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('throws when Supabase env vars are not configured', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', undefined);
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', undefined);
    const { getSupabaseClient } = await import('./supabaseClient');
    expect(() => getSupabaseClient()).toThrow('Supabase env vars are not configured');
  });

  it('returns the same client instance on repeated calls', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');
    const { getSupabaseClient } = await import('./supabaseClient');
    const first = getSupabaseClient();
    const second = getSupabaseClient();
    expect(first).toBe(second);
  });
});
