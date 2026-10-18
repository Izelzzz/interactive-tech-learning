import type { Quiz } from "../quiz/score";

export type CopyText = {
  beginner: string;
  pro: string;
};

export type SectionId = "concept" | "interactive" | "application" | "quiz";

export type LessonSection = {
  id: SectionId;
  jump: string;
  heading: string;
};

export type Lesson = {
  lessonId: string;
  title: string;
  published: boolean;
  outcome: string;
  sample: {
    method: string;
    url: string;
    host: string;
    path: string;
    hostHeader: string;
    curl: string;
  };
  sections: LessonSection[];
  concept: {
    lead: CopyText;
    points: { id: string; title: string; body: CopyText }[];
    journey: CopyText;
  };
  messageCaption: CopyText;
  messageParts: {
    id: "method" | "target" | "header" | "body";
    label: string;
    solves: CopyText;
    sample: string;
  }[];
  roundTripCaption: CopyText;
  roundTrip: {
    id: "compose" | "arrive" | "respond";
    label: string;
    body: CopyText;
  }[];
  applicationIntro: CopyText;
  browserRecord: {
    text: string;
    marks: { label: string; value: string }[];
  }[];
  curlRecord: {
    command: string;
    methodLabel: string;
    target: string;
    host: string;
  };
  quiz: Quiz;
};

export type Course = {
  courseId: string;
  title: string;
  lessons: Lesson[];
};

export type LessonSummary = {
  courseId: string;
  lessonId: string;
  title: string;
};

export type LessonErrorCode = "lesson_unpublished" | "lesson_unavailable";

export type OpenLessonResult =
  | { lesson: Lesson }
  | { error: { code: LessonErrorCode; message: string } };
