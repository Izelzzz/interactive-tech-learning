import type { Quiz } from "../quiz/score";

export type SectionId = "why" | "parts" | "assemble-lab" | "on-the-wire" | "apply" | "clinic";

export type LessonSection = {
  id: SectionId;
  jump: string;
  heading: string;
};

export type FieldId = "method" | "target" | "header" | "body";
export type TripId = "compose" | "arrive" | "respond";
export type AppFieldId = "method" | "target" | "host";

export type ConceptRow = {
  id: FieldId;
  part: string;
  question: string;
  sample: string;
};

export type Callout = {
  title: string;
  body: string;
};

export type CompareColumn = {
  title: string;
  points: string[];
};

export type AssembleBeat = {
  id: FieldId;
  label: string;
  text: string;
  question: string;
  note: string;
  sample: string;
};

export type TripStop = {
  id: TripId;
  label: string;
  at: number;
  packet: string;
  title: string;
  wire: string;
  note: string;
};

export type AppRow = {
  id: AppFieldId;
  field: string;
  browser: string;
  curl: string;
  note: string;
  browserLine: number;
  curlLine: number;
};

export type Lesson = {
  lessonId: string;
  title: string;
  published: boolean;
  eyebrow: string;
  lede: string;
  goal: string;
  sample: {
    method: string;
    url: string;
    host: string;
    path: string;
    hostHeader: string;
    curl: string;
  };
  sections: LessonSection[];
  why: {
    lede: string;
    bad: CompareColumn;
    good: CompareColumn;
    bridge: string;
    callout: Callout;
  };
  parts: {
    lede: string;
    requestTitle: string;
    request: string;
    rows: ConceptRow[];
    rule: string;
    callout: Callout;
  };
  assemble: {
    prompt: string;
    beats: AssembleBeat[];
  };
  trip: {
    lede: string;
    prompt: string;
    stops: TripStop[];
  };
  application: {
    lede: string;
    intro: string;
    browserTitle: string;
    browser: string;
    curlTitle: string;
    curl: string;
    rows: AppRow[];
  };
  clinic: {
    lede: string;
  };
  recap: {
    heading: string;
    items: string[];
  };
  quiz: Quiz;
  furtherReading: {
    href: string;
    title: string;
    note: string;
  };
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
