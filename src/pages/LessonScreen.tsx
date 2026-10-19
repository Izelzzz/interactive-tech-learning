import { useState } from "react";
import type { Lesson } from "@/content/types";
import type { ResultStore, StoredResult } from "@/progress/store";
import type { Answers } from "@/quiz/score";
import { scoreQuiz } from "@/quiz/score";
import { LessonView } from "./LessonView";

export function LessonScreen({ lesson, store }: { lesson: Lesson; store: ResultStore }) {
  const initialResult = store.readResult(lesson.lessonId);
  const [answers, setAnswers] = useState<Answers>(() => (initialResult.quizCompleted ? initialResult.answers : {}));
  const [result, setResult] = useState(initialResult);

  function onSubmit() {
    const scored = scoreQuiz(lesson.quiz, answers);
    const next: StoredResult = {
      lessonId: lesson.lessonId,
      quizCompleted: true,
      score: scored.score,
      passed: scored.passed,
      answers,
      hits: scored.hits,
    };
    store.writeResult(next);
    setResult(next);
  }

  return (
    <LessonView
      lesson={lesson}
      answers={answers}
      partId="method"
      tripId="compose"
      fieldId="method"
      result={result}
      onAnswer={(questionId, value) => setAnswers((current) => ({ ...current, [questionId]: value }))}
      onSubmit={onSubmit}
    />
  );
}
