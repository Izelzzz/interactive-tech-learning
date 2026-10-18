import * as ToggleGroup from "@radix-ui/react-toggle-group";
import type { Lesson } from "../content/types";
import type { CopyDepth } from "../quiz/score";

export function MessageStructure({
  lesson,
  copyDepth,
  messagePart,
  onMessagePart,
}: {
  lesson: Lesson;
  copyDepth: CopyDepth;
  messagePart: string;
  onMessagePart: (partId: string) => void;
}) {
  const selected = lesson.messageParts.find((part) => part.id === messagePart) ?? lesson.messageParts[0];

  return (
    <figure className="visual">
      <figcaption>{lesson.messageCaption[copyDepth]}</figcaption>
      <div className="message-layout">
        <ToggleGroup.Root
          className="message-wire"
          type="single"
          value={selected.id}
          aria-label="报文结构"
          onValueChange={(value) => {
            if (value) onMessagePart(value);
          }}
        >
          {lesson.messageParts.map((part) => (
            <ToggleGroup.Item key={part.id} className={`wire-part wire-${part.id}`} value={part.id}>
              <span className="wire-label">{part.label}</span>
              <span className="wire-sample">{part.sample}</span>
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>
        <div className="readout">
          <p className="readout-kicker">{selected.label}</p>
          <p>{selected.solves[copyDepth]}</p>
        </div>
      </div>
    </figure>
  );
}
