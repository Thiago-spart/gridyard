import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { debounce } from './debounce';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('debounce', () => {
  it('collapses rapid successive calls into a single invocation', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 600);
    debounced('a');
    debounced('b');
    debounced('c');
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(600);
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('c');
  });

  it('invokes again after the delay elapses between calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 600);
    debounced('a');
    vi.advanceTimersByTime(600);
    debounced('b');
    vi.advanceTimersByTime(600);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
