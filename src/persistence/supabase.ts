import { getSupabaseClient } from './supabaseClient';
import type { PieceInstance } from '../lib/pieces';

const TABLE = 'scenes';

async function getUserId(): Promise<string> {
  const client = getSupabaseClient();
  const {
    data: { session },
  } = await client.auth.getSession();
  if (!session) {
    throw new Error('No Supabase session');
  }
  return session.user.id;
}

export async function ensureSession(): Promise<void> {
  const client = getSupabaseClient();
  const {
    data: { session },
  } = await client.auth.getSession();
  if (!session) {
    const { error } = await client.auth.signInAnonymously();
    if (error) throw error;
  }
}

export async function saveScene(pieces: PieceInstance[]): Promise<void> {
  const client = getSupabaseClient();
  const user_id = await getUserId();
  const { error } = await client
    .from(TABLE)
    .upsert({ user_id, data: pieces, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function loadScene(): Promise<PieceInstance[] | null> {
  const client = getSupabaseClient();
  let user_id: string;
  try {
    user_id = await getUserId();
  } catch {
    return null;
  }
  const { data, error } = await client
    .from(TABLE)
    .select('data')
    .eq('user_id', user_id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return data.data as PieceInstance[];
}
