import type { LearningResult, Progress } from './types';

export interface MemoryStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface StoreWriteOk {
  ok: true;
}

export interface StoreWriteErr {
  ok: false;
  error: { code: 'storage_unavailable'; message: string };
}

const STORAGE_MESSAGE = '进度无法保存，可继续本会话学习';

export function defaultProgress(): Progress {
  return {
    stepIndex: 0,
    mode: 'beginner',
    pathType: 'normal',
    phase: 'playing',
    packDraft: { Method: '', Path: '', Host: '' },
    packSendCount: 0,
    packOnceSuccess: false,
    stepResults: [],
    completed: false,
  };
}

interface SavedShape {
  progress?: Progress;
  result?: LearningResult;
}

export function createProgressStore(storage: MemoryStorage) {
  const memory = new Map<string, SavedShape>();

  function readRaw(unitId: string): SavedShape {
    const cached = memory.get(unitId);
    if (cached) return cached;
    try {
      const raw = storage.getItem(storageKey(unitId));
      if (!raw) return {};
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return {};
      return parsed as SavedShape;
    } catch {
      return {};
    }
  }

  function writeRaw(unitId: string, next: SavedShape): StoreWriteOk | StoreWriteErr {
    memory.set(unitId, next);
    try {
      storage.setItem(storageKey(unitId), JSON.stringify(next));
      return { ok: true };
    } catch {
      return { ok: false, error: { code: 'storage_unavailable', message: STORAGE_MESSAGE } };
    }
  }

  return {
    readProgress(unitId: string): Progress {
      const saved = readRaw(unitId).progress;
      if (!saved) return defaultProgress();
      return {
        ...defaultProgress(),
        ...saved,
        packDraft: { ...defaultProgress().packDraft, ...saved.packDraft },
      };
    },
    writeProgress(unitId: string, progress: Progress): StoreWriteOk | StoreWriteErr {
      const current = readRaw(unitId);
      return writeRaw(unitId, { ...current, progress });
    },
    readResult(unitId: string): LearningResult | null {
      return readRaw(unitId).result ?? null;
    },
    writeResult(result: LearningResult): StoreWriteOk | StoreWriteErr {
      const current = readRaw(result.unitId);
      return writeRaw(result.unitId, { ...current, result });
    },
  };
}

function storageKey(unitId: string): string {
  return `itl.unit.${unitId}`;
}
