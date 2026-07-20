import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSceneStore, INITIAL_PIECES } from './sceneStore';
import type { PieceInstance } from '../lib/pieces';

const mocks = vi.hoisted(() => ({
  ensureSession: vi.fn(async () => {}),
  saveScene: vi.fn(async () => {}),
  loadScene: vi.fn(async (): Promise<PieceInstance[] | null> => null),
}));

vi.mock('../persistence', () => ({
  ensureSession: mocks.ensureSession,
  saveScene: mocks.saveScene,
  loadScene: mocks.loadScene,
}));

function resetStore() {
  useSceneStore.setState({
    pieces: INITIAL_PIECES,
    selectedIds: [],
    viewMode: 'top',
    saveStatus: 'idle',
    hasLoaded: false,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.ensureSession.mockResolvedValue(undefined);
  mocks.saveScene.mockResolvedValue(undefined);
  mocks.loadScene.mockResolvedValue(null);
  resetStore();
});

describe('selectPiece', () => {
  it('selects a piece when none is selected', () => {
    useSceneStore.getState().selectPiece('pallet-1');
    expect(useSceneStore.getState().selectedIds).toEqual(['pallet-1']);
  });

  it('adds a second, different piece to the selection', () => {
    useSceneStore.getState().selectPiece('pallet-1');
    useSceneStore.getState().selectPiece('shelf-1');
    expect(useSceneStore.getState().selectedIds).toEqual(['pallet-1', 'shelf-1']);
  });

  it('starts fresh when a third piece is clicked with two already selected', () => {
    useSceneStore.getState().selectPiece('pallet-1');
    useSceneStore.getState().selectPiece('shelf-1');
    useSceneStore.getState().selectPiece('crate-1');
    expect(useSceneStore.getState().selectedIds).toEqual(['crate-1']);
  });
});

describe('movePiece', () => {
  it('moves a piece to a free position and returns true', () => {
    const result = useSceneStore.getState().movePiece('pallet-1', 8 * 1.2 + 0.1, 7 * 1.2 + 0.1);
    expect(result).toBe(true);
    const moved = useSceneStore.getState().pieces.find((p) => p.id === 'pallet-1');
    expect(moved?.gridX).toBe(8);
    expect(moved?.gridY).toBe(7);
  });

  it('rejects a move onto an occupied cell and returns false', () => {
    const result = useSceneStore.getState().movePiece('pallet-1', 3 * 1.2 + 0.1, 0 * 1.2 + 0.1);
    expect(result).toBe(false);
    const pallet = useSceneStore.getState().pieces.find((p) => p.id === 'pallet-1');
    expect(pallet?.gridX).toBe(0);
    expect(pallet?.gridY).toBe(0);
  });
});

describe('rotatePiece', () => {
  it('toggles rotation between 0 and 90', () => {
    useSceneStore.getState().rotatePiece('shelf-1');
    expect(useSceneStore.getState().pieces.find((p) => p.id === 'shelf-1')?.rotation).toBe(90);
    useSceneStore.getState().rotatePiece('shelf-1');
    expect(useSceneStore.getState().pieces.find((p) => p.id === 'shelf-1')?.rotation).toBe(0);
  });
});

describe('saveScene / loadScene', () => {
  it('calls persistSave with the current pieces', async () => {
    await useSceneStore.getState().saveScene();
    expect(mocks.saveScene).toHaveBeenCalledWith(useSceneStore.getState().pieces);
  });

  it('ensures a session then hydrates pieces from the persisted result', async () => {
    const loaded: PieceInstance[] = [{ id: 'a', type: 'pallet', gridX: 8, gridY: 7, rotation: 0 }];
    mocks.loadScene.mockResolvedValue(loaded);
    await useSceneStore.getState().loadScene();
    expect(mocks.ensureSession).toHaveBeenCalledOnce();
    expect(useSceneStore.getState().pieces).toEqual(loaded);
  });

  it('leaves pieces unchanged when nothing was persisted', async () => {
    await useSceneStore.getState().loadScene();
    expect(useSceneStore.getState().pieces).toEqual(INITIAL_PIECES);
  });

  it('starts with hasLoaded false and sets it true once loadScene resolves with a persisted scene', async () => {
    expect(useSceneStore.getState().hasLoaded).toBe(false);
    const loaded: PieceInstance[] = [{ id: 'a', type: 'pallet', gridX: 8, gridY: 7, rotation: 0 }];
    mocks.loadScene.mockResolvedValue(loaded);
    await useSceneStore.getState().loadScene();
    expect(useSceneStore.getState().hasLoaded).toBe(true);
  });

  it('sets hasLoaded true even when nothing was persisted', async () => {
    expect(useSceneStore.getState().hasLoaded).toBe(false);
    await useSceneStore.getState().loadScene();
    expect(useSceneStore.getState().hasLoaded).toBe(true);
  });
});

describe('saveStatus', () => {
  it('transitions saving -> saved -> idle around a successful save', async () => {
    vi.useFakeTimers();
    const savePromise = useSceneStore.getState().saveScene();
    expect(useSceneStore.getState().saveStatus).toBe('saving');
    await savePromise;
    expect(useSceneStore.getState().saveStatus).toBe('saved');
    await vi.advanceTimersByTimeAsync(2000);
    expect(useSceneStore.getState().saveStatus).toBe('idle');
    vi.useRealTimers();
  });

  it('transitions saving -> error -> idle when the save fails', async () => {
    vi.useFakeTimers();
    mocks.saveScene.mockRejectedValueOnce(new Error('offline'));
    const savePromise = useSceneStore.getState().saveScene();
    await savePromise;
    expect(useSceneStore.getState().saveStatus).toBe('error');
    await vi.advanceTimersByTimeAsync(2000);
    expect(useSceneStore.getState().saveStatus).toBe('idle');
    vi.useRealTimers();
  });

  it('logs the error to the console when the save fails', async () => {
    vi.useFakeTimers();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const failure = new Error('offline');
    mocks.saveScene.mockRejectedValueOnce(failure);
    await useSceneStore.getState().saveScene();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save scene:', failure);
    await vi.advanceTimersByTimeAsync(2000);
    consoleErrorSpy.mockRestore();
    vi.useRealTimers();
  });

  it('does not let a stale timer from an earlier save clobber a newer save status', async () => {
    vi.useFakeTimers();

    // First save resolves quickly, scheduling an idle timer ~2000ms out.
    const firstSave = useSceneStore.getState().saveScene();
    await firstSave;
    expect(useSceneStore.getState().saveStatus).toBe('saved');

    // Advance partway through the first save's idle window, then start a second save
    // that fails, before the first timer would have fired.
    await vi.advanceTimersByTimeAsync(1000);
    mocks.saveScene.mockRejectedValueOnce(new Error('offline'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const secondSave = useSceneStore.getState().saveScene();
    expect(useSceneStore.getState().saveStatus).toBe('saving');
    await secondSave;
    expect(useSceneStore.getState().saveStatus).toBe('error');

    // At the point the FIRST save's stale timer would have fired (1000ms after it was
    // scheduled), the second save's 'error' status must not be clobbered back to 'idle'.
    await vi.advanceTimersByTimeAsync(1000);
    expect(useSceneStore.getState().saveStatus).toBe('error');

    // Only once the second save's own 2000ms window elapses should it settle to idle.
    await vi.advanceTimersByTimeAsync(1000);
    expect(useSceneStore.getState().saveStatus).toBe('idle');

    consoleErrorSpy.mockRestore();
    vi.useRealTimers();
  });

  it('reflects the call that resolved last when two overlapping saves settle out of order', async () => {
    vi.useFakeTimers();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    let resolveA!: () => void;
    let rejectB!: (error: Error) => void;
    const pendingA = new Promise<void>((resolve) => {
      resolveA = resolve;
    });
    const pendingB = new Promise<void>((_resolve, reject) => {
      rejectB = reject;
    });
    mocks.saveScene.mockImplementationOnce(() => pendingA);
    mocks.saveScene.mockImplementationOnce(() => pendingB);

    // Call A is invoked first, call B is invoked second, while A is still pending.
    // B, as the *later-invoked* call, holds the higher generation id, so it is
    // the one whose idle timer will ultimately be allowed to fire (invocation
    // order governs the timer — settlement order only governs the status VALUE).
    const callA = useSceneStore.getState().saveScene();
    const callB = useSceneStore.getState().saveScene();
    expect(useSceneStore.getState().saveStatus).toBe('saving');

    // B (invoked second) settles first, out of order.
    await vi.advanceTimersByTimeAsync(500);
    rejectB(new Error('B failed'));
    await callB;
    expect(useSceneStore.getState().saveStatus).toBe('error');

    // A (invoked first) settles later, and its outcome must win the displayed
    // value unconditionally — the status VALUE is always last-settle-wins.
    await vi.advanceTimersByTimeAsync(500);
    resolveA();
    await callA;
    expect(useSceneStore.getState().saveStatus).toBe('saved');

    // Just before B's idle timer would fire (B settled at t=500, so its timer
    // targets t=2500; we are currently at t=1000), status must still be A's.
    await vi.advanceTimersByTimeAsync(1499);
    expect(useSceneStore.getState().saveStatus).toBe('saved');

    // B's idle timer fires now (t=2500). Because B was the *last-invoked* call
    // and nothing has been invoked since, its generation still matches, so it
    // is allowed to fire and resets status to idle — even though A settled
    // later and (temporarily) set the displayed value to 'saved'. This is the
    // documented consequence of gating the timer on invocation order: the
    // last-invoked call's timer is authoritative, not the last-settled call's.
    await vi.advanceTimersByTimeAsync(1);
    expect(useSceneStore.getState().saveStatus).toBe('idle');

    // A's own idle timer (generation 1) fires at t=3000 but is stale — B's
    // later invocation already moved the counter past it — so it is a no-op.
    await vi.advanceTimersByTimeAsync(500);
    expect(useSceneStore.getState().saveStatus).toBe('idle');

    consoleErrorSpy.mockRestore();
    vi.useRealTimers();
  });

  it('does not reset to idle while a later-invoked save is still pending, even after the earlier call settled and its timer would have fired', async () => {
    vi.useFakeTimers();

    let resolveA!: () => void;
    const pendingA = new Promise<void>((resolve) => {
      resolveA = resolve;
    });
    let resolveB!: () => void;
    const pendingB = new Promise<void>((resolve) => {
      resolveB = resolve;
    });
    mocks.saveScene.mockImplementationOnce(() => pendingA);
    mocks.saveScene.mockImplementationOnce(() => pendingB);

    // A is invoked at t=0 and will settle fast (t=100), scheduling an idle
    // timer for t=2100. B is invoked shortly after, at t=50, while A is still
    // pending, and stays pending well past t=2100.
    const callA = useSceneStore.getState().saveScene();
    await vi.advanceTimersByTimeAsync(50);
    const callB = useSceneStore.getState().saveScene();

    await vi.advanceTimersByTimeAsync(50); // t=100: A settles.
    resolveA();
    await callA;
    expect(useSceneStore.getState().saveStatus).toBe('saved');

    // Advance well past A's idle timer (t=2100) while B is still pending.
    // A's timer must be suppressed because B was invoked after A.
    await vi.advanceTimersByTimeAsync(2050); // now at t=2150
    expect(useSceneStore.getState().saveStatus).not.toBe('idle');
    expect(useSceneStore.getState().saveStatus).toBe('saved');

    // B finally settles at t=3000.
    await vi.advanceTimersByTimeAsync(850); // now at t=3000
    resolveB();
    await callB;
    expect(useSceneStore.getState().saveStatus).toBe('saved');

    // B's own idle timer fires 2000ms after B settled.
    await vi.advanceTimersByTimeAsync(2000);
    expect(useSceneStore.getState().saveStatus).toBe('idle');

    vi.useRealTimers();
  });
});
