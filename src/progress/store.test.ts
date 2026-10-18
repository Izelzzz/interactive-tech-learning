import { expect, test } from "vitest";
import { createLocalStorageStore, createMemoryStore } from "./store";

test("reads an unsubmitted lesson as not completed", () => {
  const store = createMemoryStore();

  expect(store.readResult("http-one-request")).toEqual({
    lessonId: "http-one-request",
    quizCompleted: false,
  });
  expect(store.readCopyDepth("http-one-request")).toBeNull();
});

test("stores copy depth separately from the submitted result", () => {
  const store = createMemoryStore();
  store.writeCopyDepth("http-one-request", "pro");
  store.writeResult({
    lessonId: "http-one-request",
    quizCompleted: true,
    score: 25,
    passed: false,
    copyDepth: "beginner",
    answers: { q1: "A" },
    hits: [],
  });

  expect(store.readCopyDepth("http-one-request")).toBe("pro");
  expect(store.readResult("http-one-request")).toMatchObject({
    lessonId: "http-one-request",
    quizCompleted: true,
    score: 25,
    passed: false,
    copyDepth: "beginner",
    answers: { q1: "A" },
    hits: [],
  });
});

test("a later submission replaces score, pass state, and submit-time copy depth", () => {
  const store = createMemoryStore();
  store.writeResult({
    lessonId: "http-one-request",
    quizCompleted: true,
    score: 25,
    passed: false,
    copyDepth: "beginner",
    answers: { q1: "A" },
    hits: [],
  });
  store.writeResult({
    lessonId: "http-one-request",
    quizCompleted: true,
    score: 75,
    passed: true,
    copyDepth: "pro",
    answers: { q1: "A", q3: "GET /docs Host" },
    hits: ["action", "target", "extra"],
  });

  const result = store.readResult("http-one-request");
  expect(result).toMatchObject({
    quizCompleted: true,
    score: 75,
    passed: true,
    copyDepth: "pro",
    hits: ["action", "target", "extra"],
  });
});

test("round-trips the same fields through a storage-backed store", () => {
  const memory = new Map<string, string>();
  const storage = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
  };
  const writing = createLocalStorageStore(storage);
  writing.writeCopyDepth("http-one-request", "pro");
  writing.writeResult({
    lessonId: "http-one-request",
    quizCompleted: true,
    score: 60,
    passed: true,
    copyDepth: "pro",
    answers: { q3: "方法" },
    hits: ["action"],
  });

  const reading = createLocalStorageStore(storage);
  expect(reading.readCopyDepth("http-one-request")).toBe("pro");
  expect(reading.readResult("http-one-request")).toMatchObject({
    lessonId: "http-one-request",
    quizCompleted: true,
    score: 60,
    passed: true,
    copyDepth: "pro",
  });
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
    copyDepth: "beginner",
    answers: { q1: "A" },
    hits: ["action", "target", "extra"],
  });

  expect(store.readResult("http-one-request")).toMatchObject({
    quizCompleted: true,
    score: 100,
    passed: true,
  });
});
