import type { Answers } from "../quiz/score";

export type StoredResult = {
  lessonId: string;
  quizCompleted: true;
  score: number;
  passed: boolean;
  answers: Answers;
  hits: string[];
};

export type LearningResult = { lessonId: string; quizCompleted: false } | StoredResult;

export type KeyValueStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

export type ResultStore = {
  readResult: (lessonId: string) => LearningResult;
  writeResult: (result: StoredResult) => void;
};

type MemoryState = {
  results: Map<string, StoredResult>;
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

function toStored(value: StoredResult): StoredResult {
  return {
    lessonId: value.lessonId,
    quizCompleted: true,
    score: value.score,
    passed: value.passed,
    answers: value.answers ?? {},
    hits: value.hits ?? [],
  };
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
      const stored = toStored(parsed);
      state.results.set(lessonId, stored);
      return stored;
    },
    writeResult(result) {
      const stored = toStored(result);
      state.results.set(result.lessonId, stored);
      if (!persist) return;
      try {
        persist.setItem(resultKey(result.lessonId), JSON.stringify(stored));
      } catch {
        return;
      }
    },
  };
}

export function createMemoryStore(): ResultStore {
  return createStore({ results: new Map() });
}

export function createLocalStorageStore(storage: KeyValueStorage): ResultStore {
  return createStore({ results: new Map() }, storage);
}

function resultKey(lessonId: string): string {
  return `itl:v1:result:${lessonId}`;
}
