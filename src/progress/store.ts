import type { Answers, CopyDepth } from "../quiz/score";

export type StoredResult = {
  lessonId: string;
  quizCompleted: true;
  score: number;
  passed: boolean;
  copyDepth: CopyDepth;
  answers: Answers;
  hits: string[];
};

export type LearningResult =
  | { lessonId: string; quizCompleted: false }
  | StoredResult;

export type KeyValueStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

export type ResultStore = {
  readResult: (lessonId: string) => LearningResult;
  writeResult: (result: StoredResult) => void;
  readCopyDepth: (lessonId: string) => CopyDepth | null;
  writeCopyDepth: (lessonId: string, copyDepth: CopyDepth) => void;
};

type MemoryState = {
  results: Map<string, StoredResult>;
  depths: Map<string, CopyDepth>;
};

function readPersisted<T>(storage: KeyValueStorage, key: string): T | null {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function isCopyDepth(value: unknown): value is CopyDepth {
  return value === "beginner" || value === "pro";
}

function isStoredResult(value: unknown, lessonId: string): value is StoredResult {
  if (!value || typeof value !== "object") return false;
  const record = value as StoredResult;
  return record.lessonId === lessonId && record.quizCompleted === true && typeof record.score === "number";
}

function createStore(state: MemoryState, persist?: KeyValueStorage): ResultStore {
  return {
    readResult(lessonId) {
      const cached = state.results.get(lessonId);
      if (cached) return cached;
      if (!persist) return { lessonId, quizCompleted: false };
      const parsed = readPersisted<unknown>(persist, resultKey(lessonId));
      if (!isStoredResult(parsed, lessonId)) return { lessonId, quizCompleted: false };
      state.results.set(lessonId, parsed);
      return parsed;
    },
    writeResult(result) {
      state.results.set(result.lessonId, result);
      if (!persist) return;
      try {
        persist.setItem(resultKey(result.lessonId), JSON.stringify(result));
      } catch {
        return;
      }
    },
    readCopyDepth(lessonId) {
      const cached = state.depths.get(lessonId);
      if (cached) return cached;
      if (!persist) return null;
      try {
        const raw = persist.getItem(depthKey(lessonId));
        if (!isCopyDepth(raw)) return null;
        state.depths.set(lessonId, raw);
        return raw;
      } catch {
        return null;
      }
    },
    writeCopyDepth(lessonId, copyDepth) {
      state.depths.set(lessonId, copyDepth);
      if (!persist) return;
      try {
        persist.setItem(depthKey(lessonId), copyDepth);
      } catch {
        return;
      }
    },
  };
}

export function createMemoryStore(): ResultStore {
  return createStore({ results: new Map(), depths: new Map() });
}

export function createLocalStorageStore(storage: KeyValueStorage): ResultStore {
  return createStore({ results: new Map(), depths: new Map() }, storage);
}

function resultKey(lessonId: string): string {
  return `itl:v1:result:${lessonId}`;
}

function depthKey(lessonId: string): string {
  return `itl:v1:copyDepth:${lessonId}`;
}
