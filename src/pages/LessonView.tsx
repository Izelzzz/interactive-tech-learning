import { ApplicationSection } from "../components/ApplicationSection";
import { LessonHeader } from "../components/LessonHeader";
import { MessageStructure } from "../components/MessageStructure";
import { QuizSection } from "../components/QuizSection";
import { RoundTrip } from "../components/RoundTrip";
import type { Lesson } from "../content/types";
import type { LearningResult } from "../progress/store";
import type { Answers, CopyDepth } from "../quiz/score";

export function LessonView({
  lesson,
  copyDepth,
  answers,
  messagePart,
  roundTripStep,
  result,
  onCopyDepth,
  onAnswer,
  onMessagePart,
  onRoundTrip,
  onSubmit,
}: {
  lesson: Lesson;
  copyDepth: CopyDepth;
  answers: Answers;
  messagePart: string;
  roundTripStep: string;
  result: LearningResult;
  onCopyDepth: (copyDepth: CopyDepth) => void;
  onAnswer: (questionId: string, value: string) => void;
  onMessagePart: (partId: string) => void;
  onRoundTrip: (stepId: string) => void;
  onSubmit: () => void;
}) {
  return (
    <main className="lesson">
      <LessonHeader lesson={lesson} copyDepth={copyDepth} onCopyDepth={onCopyDepth} />
      <article id="concept" className="block">
        <p className="block-index">01</p>
        <h2>概念</h2>
        <p>{lesson.concept.lead[copyDepth]}</p>
        <ol className="concept-points">
          {lesson.concept.points.map((point) => (
            <li key={point.id}>
              <h3>{point.title}</h3>
              <p>{point.body[copyDepth]}</p>
            </li>
          ))}
        </ol>
        <p className="journey">{lesson.concept.journey[copyDepth]}</p>
      </article>
      <article id="interactive" className="block">
        <p className="block-index">02</p>
        <h2>交互 / 可视化</h2>
        <MessageStructure
          lesson={lesson}
          copyDepth={copyDepth}
          messagePart={messagePart}
          onMessagePart={onMessagePart}
        />
        <RoundTrip
          lesson={lesson}
          copyDepth={copyDepth}
          roundTripStep={roundTripStep}
          onRoundTrip={onRoundTrip}
        />
      </article>
      <ApplicationSection lesson={lesson} copyDepth={copyDepth} />
      <QuizSection
        lesson={lesson}
        copyDepth={copyDepth}
        answers={answers}
        result={result}
        onAnswer={onAnswer}
        onSubmit={onSubmit}
      />
    </main>
  );
}
