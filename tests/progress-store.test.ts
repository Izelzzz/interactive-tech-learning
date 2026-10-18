import { describe, expect, it } from 'vitest';
import { createProgressStore, type MemoryStorage } from '../src/progress-store';
import type { Progress } from '../src/types';

function memory(): MemoryStorage & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    getItem(key) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
  };
}

const saved: Progress = {
  stepIndex: 3,
  mode: 'pro',
  pathType: 'fault',
  phase: 'playing',
  packDraft: { Method: 'GET', Path: '/', Host: 'example.com' },
  packSendCount: 1,
  packOnceSuccess: true,
  stepResults: ['passed', 'skipped', 'passed', null, null],
  completed: false,
};

describe('progress-store', () => {
  it('没有记录时默认小白、正常路径、第 0 步', () => {
    const progress = createProgressStore(memory()).readProgress('http-request-once');
    expect(progress.mode).toBe('beginner');
    expect(progress.pathType).toBe('normal');
    expect(progress.stepIndex).toBe(0);
    expect(progress.phase).toBe('playing');
  });

  it('写入后再读出步骤、模式与路径', () => {
    const store = createProgressStore(memory());
    expect(store.writeProgress('http-request-once', saved).ok).toBe(true);
    const progress = store.readProgress('http-request-once');
    expect(progress.stepIndex).toBe(3);
    expect(progress.mode).toBe('pro');
    expect(progress.pathType).toBe('fault');
    expect(progress.packDraft).toEqual(saved.packDraft);
    expect(progress.packOnceSuccess).toBe(true);
  });

  it('完课结果可读出五项字段', () => {
    const store = createProgressStore(memory());
    const result = {
      unitId: 'http-request-once',
      mode: 'beginner' as const,
      pathType: 'fault' as const,
      completed: true,
      packOnceSuccess: false,
    };
    expect(store.writeResult(result).ok).toBe(true);
    expect(store.readResult('http-request-once')).toEqual(result);
    expect(store.readResult('missing')).toBeNull();
  });

  it('新的存储实例能读到已写入的进度', () => {
    const backing = memory();
    createProgressStore(backing).writeProgress('http-request-once', saved);
    const again = createProgressStore(backing).readProgress('http-request-once');
    expect(again.stepIndex).toBe(3);
    expect(again.stepResults).toEqual(saved.stepResults);
  });

  it('存储写入失败时保留会话内进度，并返回 storage_unavailable', () => {
    const backing: MemoryStorage = {
      getItem() {
        return null;
      },
      setItem() {
        throw new Error('denied');
      },
    };
    const store = createProgressStore(backing);
    const written = store.writeProgress('http-request-once', saved);
    expect(written).toEqual({
      ok: false,
      error: { code: 'storage_unavailable', message: '进度无法保存，可继续本会话学习' },
    });
    expect(store.readProgress('http-request-once').stepIndex).toBe(3);
    const resultWrite = store.writeResult({
      unitId: 'http-request-once',
      mode: 'pro',
      pathType: 'normal',
      completed: true,
      packOnceSuccess: true,
    });
    expect(resultWrite.ok).toBe(false);
    expect(store.readResult('http-request-once')?.completed).toBe(true);
  });
});
