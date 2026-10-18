import type { ReactNode } from "react";
import type { Lesson } from "../content/types";
import type { CopyDepth } from "../quiz/score";

function renderMarked(text: string, marks: { label: string; value: string }[]): ReactNode[] {
  let pieces: { text: string; label?: string }[] = [{ text }];
  for (const mark of marks) {
    pieces = pieces.flatMap((piece) => {
      if (piece.label || !piece.text.includes(mark.value)) return [piece];
      const parts = piece.text.split(mark.value);
      const next: { text: string; label?: string }[] = [];
      parts.forEach((part, index) => {
        if (part) next.push({ text: part });
        if (index < parts.length - 1) next.push({ text: mark.value, label: mark.label });
      });
      return next;
    });
  }
  return pieces.map((piece, index) =>
    piece.label ? (
      <mark key={`${piece.label}-${index}`} data-label={piece.label}>
        {piece.text}
      </mark>
    ) : (
      <span key={`text-${index}`}>{piece.text}</span>
    ),
  );
}

export function ApplicationSection({ lesson, copyDepth }: { lesson: Lesson; copyDepth: CopyDepth }) {
  return (
    <section id="application" className="block">
      <p className="block-index">03</p>
      <h2>应用</h2>
      <p>{lesson.applicationIntro[copyDepth]}</p>
      <div className="record-grid">
        <article className="record">
          <h3>浏览器请求记录</h3>
          <pre>
            {lesson.browserRecord.map((line) => (
              <span className="record-line" key={line.text}>
                {renderMarked(line.text, line.marks)}
                {"\n"}
              </span>
            ))}
          </pre>
          <ul className="legend">
            <li>
              <span>方法</span> {lesson.sample.method}
            </li>
            <li>
              <span>目标</span> {lesson.sample.path}
            </li>
            <li>
              <span>Host</span> {lesson.sample.host}
            </li>
          </ul>
        </article>
        <article className="record">
          <h3>curl</h3>
          <p className="method-note">
            方法 <mark>{lesson.curlRecord.methodLabel}</mark>
          </p>
          <pre>{renderMarked(lesson.curlRecord.command, [{ label: "目标", value: lesson.curlRecord.target }])}</pre>
          <ul className="legend">
            <li>
              <span>方法</span> {lesson.curlRecord.methodLabel}
            </li>
            <li>
              <span>目标</span> {lesson.curlRecord.target}
            </li>
            <li>
              <span>Host</span> {lesson.curlRecord.host}
            </li>
          </ul>
        </article>
      </div>
    </section>
  );
}
