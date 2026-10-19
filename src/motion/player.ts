export type Clock = {
  now: () => number;
  request: (callback: (time: number) => void) => number;
  cancel: (id: number) => void;
};

export function browserClock(): Clock {
  return {
    now: () => performance.now(),
    request: (callback) => requestAnimationFrame(callback),
    cancel: (id) => cancelAnimationFrame(id),
  };
}

export function createManualClock() {
  let time = 0;
  let nextId = 1;
  const pending = new Map<number, (time: number) => void>();

  return {
    now: () => time,
    request(callback: (time: number) => void) {
      const id = nextId;
      nextId += 1;
      pending.set(id, callback);
      return id;
    },
    cancel(id: number) {
      pending.delete(id);
    },
    tick(ms: number) {
      time += ms;
      const batch = [...pending.entries()];
      pending.clear();
      for (const [, callback] of batch) callback(time);
    },
  };
}

export function easeInOut(amount: number): number {
  const t = Math.min(1, Math.max(0, amount));
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

export type Beat = {
  id: string;
  text: string;
};

export type TyperState = {
  text: string;
  beatId: string;
  playing: boolean;
  done: boolean;
};

export function createTyper(options: {
  beats: Beat[];
  charsPerSecond: number;
  holdMs: number;
  clock: Clock;
  onChange: (state: TyperState) => void;
}) {
  const { beats, charsPerSecond, holdMs, clock, onChange } = options;
  const msPerChar = 1000 / charsPerSecond;
  let beatIndex = 0;
  let charIndex = 0;
  let phase: "type" | "hold" = "type";
  let phaseStart = 0;
  let playing = false;
  let handle = 0;

  function emit() {
    const beat = beats[beatIndex];
    onChange({
      text: beat.text.slice(0, charIndex),
      beatId: beat.id,
      playing,
      done: !playing && beatIndex === beats.length - 1 && charIndex >= beat.text.length,
    });
  }

  function frame(now: number) {
    if (!playing) return;
    const beat = beats[beatIndex];
    const elapsed = now - phaseStart;
    if (phase === "type") {
      charIndex = Math.min(beat.text.length, Math.floor(elapsed / msPerChar));
      if (charIndex >= beat.text.length) {
        phase = "hold";
        phaseStart = now;
      }
    } else if (elapsed >= holdMs) {
      if (beatIndex >= beats.length - 1) {
        playing = false;
        charIndex = beat.text.length;
        emit();
        return;
      }
      const typed = beat.text.length;
      beatIndex += 1;
      charIndex = Math.min(typed, beats[beatIndex].text.length);
      phase = "type";
      phaseStart = now - charIndex * msPerChar;
    }
    emit();
    handle = clock.request(frame);
  }

  return {
    play() {
      if (beats.length === 0) return;
      beatIndex = 0;
      charIndex = 0;
      playing = true;
      phase = "type";
      phaseStart = clock.now();
      emit();
      clock.cancel(handle);
      handle = clock.request(frame);
    },
    pause() {
      playing = false;
      clock.cancel(handle);
      emit();
    },
    jump(id: string) {
      const index = beats.findIndex((beat) => beat.id === id);
      if (index < 0) return;
      playing = false;
      clock.cancel(handle);
      beatIndex = index;
      charIndex = beats[index].text.length;
      phase = "hold";
      emit();
    },
    stop() {
      playing = false;
      clock.cancel(handle);
    },
  };
}

export function createSweep(options: {
  durationMs: number;
  clock: Clock;
  onChange: (progress: number) => void;
}) {
  let handle = 0;

  return {
    start() {
      const origin = options.clock.now();
      const step = (now: number) => {
        const amount = Math.min(1, (now - origin) / options.durationMs);
        options.onChange(easeInOut(amount));
        if (amount < 1) handle = options.clock.request(step);
      };
      options.clock.cancel(handle);
      handle = options.clock.request(step);
    },
    stop() {
      options.clock.cancel(handle);
    },
  };
}

export type TracerStop = {
  id: string;
  at: number;
  packet: string;
};

export type TracerState = {
  at: number;
  stopId: string;
  packet: string;
  playing: boolean;
};

export function createTracer(options: {
  stops: TracerStop[];
  travelMs: number;
  clock: Clock;
  startId?: string;
  onChange: (state: TracerState) => void;
}) {
  const { stops, travelMs, clock, onChange } = options;
  const startIndex = Math.max(0, stops.findIndex((stop) => stop.id === options.startId));
  let index = startIndex;
  let at = stops[startIndex]?.at ?? 0;
  let playing = false;
  let handle = 0;
  let queue: number[] = [];
  let run: { from: number; to: number; start: number; duration: number; destIndex: number } | null = null;

  function publish(packet?: string) {
    onChange({
      at,
      stopId: stops[index].id,
      packet: packet ?? stops[index].packet,
      playing,
    });
  }

  function startHop(now: number, destIndex: number) {
    const dest = stops[destIndex];
    run = {
      from: at,
      to: dest.at,
      start: now,
      duration: Math.max(1, Math.abs(dest.at - at) * travelMs),
      destIndex,
    };
    playing = true;
  }

  function frame(now: number) {
    if (!run) return;
    const amount = Math.min(1, (now - run.start) / run.duration);
    at = run.from + (run.to - run.from) * easeInOut(amount);
    const packet = stops[run.destIndex].packet;
    if (amount < 1) {
      publish(packet);
      handle = clock.request(frame);
      return;
    }
    index = run.destIndex;
    at = run.to;
    run = null;
    const next = queue.shift();
    if (next === undefined) {
      playing = false;
      publish();
      return;
    }
    startHop(now, next);
    publish(stops[next].packet);
    handle = clock.request(frame);
  }

  function arm(now: number, destIndex: number) {
    clock.cancel(handle);
    startHop(now, destIndex);
    publish(stops[destIndex].packet);
    handle = clock.request(frame);
  }

  return {
    play() {
      if (stops.length === 0) return;
      index = 0;
      at = stops[0].at;
      queue = stops.map((_, stopIndex) => stopIndex).slice(1);
      const first = queue.shift();
      if (first === undefined) {
        playing = false;
        publish();
        return;
      }
      arm(clock.now(), first);
    },
    seek(id: string) {
      const destIndex = stops.findIndex((stop) => stop.id === id);
      if (destIndex < 0) return;
      queue = [];
      if (Math.abs(stops[destIndex].at - at) < 0.001) {
        clock.cancel(handle);
        index = destIndex;
        at = stops[destIndex].at;
        playing = false;
        run = null;
        publish();
        return;
      }
      arm(clock.now(), destIndex);
    },
    reset() {
      clock.cancel(handle);
      index = 0;
      at = stops[0]?.at ?? 0;
      playing = false;
      run = null;
      queue = [];
      if (stops.length > 0) publish();
    },
    stop() {
      playing = false;
      clock.cancel(handle);
    },
  };
}
