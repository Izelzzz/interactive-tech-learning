import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { Link } from "react-router-dom";
import type { Lesson } from "../content/types";
import type { CopyDepth } from "../quiz/score";

export function LessonHeader({
  lesson,
  copyDepth,
  onCopyDepth,
}: {
  lesson: Lesson;
  copyDepth: CopyDepth;
  onCopyDepth: (copyDepth: CopyDepth) => void;
}) {
  return (
    <>
      <div className="header-bar">
        <Link className="back-link" to="/">
          返回目录
        </Link>
        <h1>{lesson.title}</h1>
        <ToggleGroup.Root
          className="depth-toggle"
          type="single"
          value={copyDepth}
          aria-label="文案档"
          onValueChange={(value) => {
            if (value === "beginner" || value === "pro") onCopyDepth(value);
          }}
        >
          <ToggleGroup.Item value="beginner">小白</ToggleGroup.Item>
          <ToggleGroup.Item value="pro">专业</ToggleGroup.Item>
        </ToggleGroup.Root>
        <nav className="jump-nav" aria-label="四个区块">
          {lesson.sections.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.jump}
            </a>
          ))}
        </nav>
      </div>
      <p className="outcome">{lesson.outcome}</p>
    </>
  );
}
