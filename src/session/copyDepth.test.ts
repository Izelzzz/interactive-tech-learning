import { expect, test } from "vitest";
import { switchCopyDepth } from "./copyDepth";

test("switching copy depth keeps answers and the visual position", () => {
  const next = switchCopyDepth(
    {
      copyDepth: "beginner",
      answers: { q1: "C", q3: "先写方法" },
      messagePart: "header",
      roundTripStep: "arrive",
    },
    "pro",
  );

  expect(next.copyDepth).toBe("pro");
  expect(next.answers).toEqual({ q1: "C", q3: "先写方法" });
  expect(next.messagePart).toBe("header");
  expect(next.roundTripStep).toBe("arrive");
});
