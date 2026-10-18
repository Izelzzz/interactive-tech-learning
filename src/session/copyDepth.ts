import type { Answers, CopyDepth } from "../quiz/score";

export type LessonSession = {
  copyDepth: CopyDepth;
  answers: Answers;
  messagePart: string;
  roundTripStep: string;
};

export function switchCopyDepth(session: LessonSession, copyDepth: CopyDepth): LessonSession {
  return { ...session, copyDepth };
}
