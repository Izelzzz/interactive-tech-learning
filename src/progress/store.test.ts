import { expect, test } from "vitest";
import { createLocalStorageStore, createMemoryStore } from "./store";

test("reads an unsubmitted lesson as not completed", () => {
  const store = createMemoryStore();

  expect(store.readResult("http-one-request")).toEqual({
    lessonId: "http-one-request",
    quizCompleted: false,
  });
});

test("a later submission replaces score and pass state", () => {
  const store = createMemoryStore();
  store.writeResult({
    lessonId: "http-one-request",
    quizCompleted: true,
    score: 25,
    passed: false,
    answers: { q1: "A" },
    hits: [],
  });
  store.writeResult({
    lessonId: "http-one-request",
    quizCompleted: true,
    score: 75,
    passed: true,
    answers: { q1: "B", q3: "GET /docs Host" },
    hits: ["action", "target", "extra"],
  });

  expect(store.readResult("http-one-request")).toMatchObject({
    quizCompleted: true,
    score: 75,
    passed: true,
    hits: ["action", "target", "extra"],
  });
});

test("round-trips the stored result through a storage-backed store", () => {
  const memory = new Map<string, string>();
  const storage = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
  };
  const writing = createLocalStorageStore(storage);
  writing.writeResult({
    lessonId: "http-one-request",
    quizCompleted: true,
    score: 60,
    passed: true,
    answers: { q3: "方法" },
    hits: ["action"],
  });

  const reading = createLocalStorageStore(storage);
  expect(reading.readResult("http-one-request")).toEqual({
    lessonId: "http-one-request",
    quizCompleted: true,
    score: 60,
    passed: true,
    answers: { q3: "方法" },
    hits: ["action"],
  });
  expect(JSON.stringify([...memory.values()])).not.toContain("copyDepth");
});

test("keeps the session result when storage writes fail", () => {
  const storage = {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("blocked");
    },
  };
  const store = createLocalStorageStore(storage);
  store.writeResult({
    lessonId: "http-one-request",
    quizCompleted: true,
    score: 100,
    passed: true,
    answers: { q1: "B" },
    hits: ["action", "target", "extra"],
  });

  expect(store.readResult("http-one-request")).toMatchObject({
    quizCompleted: true,
    score: 100,
    passed: true,
  });
});
