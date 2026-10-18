import * as ToggleGroup from "@radix-ui/react-toggle-group";
import type { Lesson } from "../content/types";
import type { CopyDepth } from "../quiz/score";

export function RoundTrip({
  lesson,
  copyDepth,
  roundTripStep,
  onRoundTrip,
}: {
  lesson: Lesson;
  copyDepth: CopyDepth;
  roundTripStep: string;
  onRoundTrip: (stepId: string) => void;
}) {
  const index = Math.max(
    0,
    lesson.roundTrip.findIndex((step) => step.id === roundTripStep),
  );
  const current = lesson.roundTrip[index];

  function move(delta: number) {
    const next = lesson.roundTrip[index + delta];
    if (next) onRoundTrip(next.id);
  }

  return (
    <figure className="visual">
      <figcaption>{lesson.roundTripCaption[copyDepth]}</figcaption>
      <ToggleGroup.Root
        className="trip"
        type="single"
        value={current.id}
        aria-label="一次往返"
        onValueChange={(value) => {
          if (value) onRoundTrip(value);
        }}
      >
        {lesson.roundTrip.map((step, stepIndex) => (
          <ToggleGroup.Item key={step.id} className="trip-step" value={step.id}>
            <span className="trip-index">{stepIndex + 1}</span>
            <span>{step.label}</span>
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>
      <div className="trip-detail">
        <p>{current.body[copyDepth]}</p>
        <div className="trip-controls">
          <button type="button" onClick={() => move(-1)} disabled={index === 0}>
            上一步
          </button>
          <span>
            {index + 1} / {lesson.roundTrip.length}
          </span>
          <button type="button" onClick={() => move(1)} disabled={index === lesson.roundTrip.length - 1}>
            下一步
          </button>
        </div>
      </div>
    </figure>
  );
}
