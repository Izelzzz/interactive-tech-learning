import { useState } from "react";
import type { Lesson } from "../content/types";
import type { ResultStore, StoredResult } from "../progress/store";
import type { Answers, CopyDepth } from "../quiz/score";
import { scoreQuiz } from "../quiz/score";
import { switchCopyDepth } from "../session/copyDepth";
import { LessonView } from "./LessonView";

export function LessonScreen({ lesson, store }: { lesson: Lesson; store: ResultStore }) {
  const initialResult = store.readResult(lesson.lessonId);
  const [copyDepth, setCopyDepth] = useState<CopyDepth>(
    () => store.readCopyDepth(lesson.lessonId) ?? "beginner",
  );
  const [answers, setAnswers] = useState<Answers>(() =>
    initialResult.quizCompleted ? initialResult.answers : {},
  );
  const [messagePart, setMessagePart] = useState("method");
  const [roundTripStep, setRoundTripStep] = useState("compose");
  const [result, setResult] = useState(initialResult);

  function onCopyDepth(next: CopyDepth) {
    const session = switchCopyDepth({ copyDepth, answers, messagePart, roundTripStep }, next);
    setCopyDepth(session.copyDepth);
    store.writeCopyDepth(lesson.lessonId, session.copyDepth);
  }

  function onSubmit() {
    const scored = scoreQuiz(lesson.quiz, answers);
    const next: StoredResult = {
      lessonId: lesson.lessonId,
      quizCompleted: true,
      score: scored.score,
      passed: scored.passed,
      copyDepth,
      answers,
      hits: scored.hits,
    };
    store.writeResult(next);
    setResult(next);
  }

  return (
    <LessonView
      lesson={lesson}
      copyDepth={copyDepth}
      answers={answers}
      messagePart={messagePart}
      roundTripStep={roundTripStep}
      result={result}
      onCopyDepth={onCopyDepth}
      onAnswer={(questionId, value) => setAnswers((current) => ({ ...current, [questionId]: value }))}
      onMessagePart={setMessagePart}
      onRoundTrip={setRoundTripStep}
      onSubmit={onSubmit}
    />
  );
}
