import { expect, test } from "vitest";
import { createManualClock, createSweep, createTracer, createTyper, easeInOut } from "./player";

test("eases the midpoint of a hop to halfway", () => {
  expect(easeInOut(0)).toBe(0);
  expect(easeInOut(1)).toBe(1);
  expect(easeInOut(0.5)).toBe(0.5);
});

test("types the request from elapsed time, then holds and continues", () => {
  const clock = createManualClock();
  const seen: string[] = [];
  const typer = createTyper({
    beats: [
      { id: "method", text: "GET" },
      { id: "target", text: "GET /docs" },
    ],
    charsPerSecond: 10,
    holdMs: 200,
    clock,
    onChange: (state) => seen.push(`${state.beatId}:${state.text}`),
  });

  typer.play();
  clock.tick(100);
  clock.tick(100);
  clock.tick(100);
  expect(seen.at(-1)).toBe("method:GET");

  clock.tick(200);
  expect(seen.at(-1)).toBe("target:GET");
  clock.tick(100);
  expect(seen.at(-1)).toBe("target:GET ");
});

test("jumps to a beat and stops the typer", () => {
  const clock = createManualClock();
  let last = { text: "", playing: true, beatId: "" };
  const typer = createTyper({
    beats: [
      { id: "method", text: "GET" },
      { id: "target", text: "GET /docs" },
    ],
    charsPerSecond: 10,
    holdMs: 200,
    clock,
    onChange: (state) => {
      last = state;
    },
  });

  typer.play();
  typer.jump("target");
  clock.tick(500);

  expect(last).toMatchObject({ text: "GET /docs", beatId: "target", playing: false });
});

test("moves the packet between stops by script, not by a snap", () => {
  const clock = createManualClock();
  const samples: number[] = [];
  const tracer = createTracer({
    stops: [
      { id: "compose", at: 0, packet: "GET /docs" },
      { id: "arrive", at: 1, packet: "在路上" },
      { id: "respond", at: 2, packet: "200 OK" },
    ],
    travelMs: 300,
    clock,
    onChange: (state) => samples.push(state.at),
  });

  tracer.play();
  clock.tick(150);
  const mid = samples.at(-1) ?? 0;
  expect(mid).toBeGreaterThan(0.2);
  expect(mid).toBeLessThan(0.8);

  clock.tick(150);
  expect(samples.at(-1)).toBe(1);
});

test("grows a field marker from elapsed time", () => {
  const clock = createManualClock();
  const values: number[] = [];
  const sweep = createSweep({
    durationMs: 400,
    clock,
    onChange: (progress) => values.push(progress),
  });

  sweep.start();
  clock.tick(200);
  expect(values.at(-1)).toBeCloseTo(0.5, 5);
  clock.tick(200);
  expect(values.at(-1)).toBe(1);
});
