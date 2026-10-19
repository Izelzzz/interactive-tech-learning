import { expect, test } from "vitest";
import { scoreQuiz } from "../quiz/score";
import course from "./http-course.json";
import { listPublishedLessons, openLesson, type Course } from "./load";

const httpCourse = course as Course;

const outcome = "学完能说明一次请求由什么组成，并能在样例调用里指出方法、目标与 Host。";

test("lists the published HTTP lesson", () => {
  expect(listPublishedLessons(httpCourse)).toEqual([
    { courseId: "http", lessonId: "http-one-request", title: "一次 HTTP 请求" },
  ]);
});

test("loads the published lesson with the sample and four sections", () => {
  const opened = openLesson(httpCourse, "http-one-request");
  expect("lesson" in opened).toBe(true);
  if (!("lesson" in opened)) return;

  expect(opened.lesson.outcome).toBe(outcome);
  expect(opened.lesson.sample).toEqual({
    method: "GET",
    url: "https://example.com/docs",
    host: "example.com",
    path: "/docs",
    hostHeader: "Host: example.com",
    curl: "curl https://example.com/docs",
  });
  expect(opened.lesson.sections.map((section) => section.id)).toEqual([
    "concept",
    "interactive",
    "application",
    "quiz",
  ]);
  expect(opened.lesson.assemble.beats.map((beat) => beat.id)).toEqual(["method", "target", "header", "body"]);
  expect(opened.lesson.trip.stops.map((stop) => stop.id)).toEqual(["compose", "arrive", "respond"]);
  expect(opened.lesson.quiz.passScore).toBe(60);
  expect(opened.lesson.quiz.questions.map((question) => question.stem)).toEqual([
    "在一次 HTTP 请求里，表示「这次要做的动作」的部分是哪一个？",
    "样例「打开 https://example.com/docs」里，方法和目标怎样对应？",
    "用自己的话写出一条最小 HTTP 请求要交代的三件事。每件事给一个名称，并举一个来自本课样例的例子。样例没有正文时，第三件说明可以没有正文，并举出一个仍然会出现的头。",
  ]);
  const first = opened.lesson.quiz.questions[0];
  expect(first.type === "single" && first.options.map((option) => option.text)).toEqual([
    "响应里带回的状态码",
    "请求里标明的方法名",
    "请求附带的那段正文",
    "路上查找地址的步骤",
  ]);
  expect(opened.lesson.furtherReading.href).toBe("https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Guides/Overview");
});

test("keeps single-choice options the same length and varies the correct slot", () => {
  const opened = openLesson(httpCourse, "http-one-request");
  if (!("lesson" in opened)) throw new Error("lesson missing");
  const singles = opened.lesson.quiz.questions.filter((question) => question.type === "single");

  expect(singles.map((question) => question.answer)).toEqual(["B", "C"]);
  for (const question of singles) {
    const lengths = question.options.map((option) => [...option.text].length);
    expect(new Set(lengths).size).toBe(1);
  }
});

test("uses one narration and extends the request one field at a time", () => {
  const opened = openLesson(httpCourse, "http-one-request");
  if (!("lesson" in opened)) throw new Error("lesson missing");
  const lesson = opened.lesson;

  expect(typeof lesson.concept.lede).toBe("string");
  expect(lesson.concept.lede).toContain("方法是请求行开头的动词");
  expect(JSON.stringify(lesson)).not.toContain("beginner");
  expect(JSON.stringify(lesson)).not.toContain("copyDepth");
  const beats = lesson.assemble.beats;
  for (let index = 1; index < beats.length; index += 1) {
    expect(beats[index].text.startsWith(beats[index - 1].text)).toBe(true);
  }
  for (const question of lesson.quiz.questions) {
    expect(typeof question.explanation).toBe("string");
    expect(question.explanation.length).toBeGreaterThan(0);
  }

  const scored = scoreQuiz(lesson.quiz, {
    q1: "B",
    q2: "C",
    q3: "动作是方法 GET。目标是 https://example.com/docs。可以没有正文，仍然有 Host: example.com。",
  });
  expect(scored.score).toBe(100);
  expect(scored.passed).toBe(true);
});

test("keeps an unpublished lesson out of the catalog", () => {
  const draft: Course = {
    ...httpCourse,
    lessons: httpCourse.lessons.map((lesson) => ({ ...lesson, published: false })),
  };

  expect(listPublishedLessons(draft)).toEqual([]);
  expect(openLesson(draft, "http-one-request")).toEqual({
    error: { code: "lesson_unpublished", message: "目录只列出已发布课" },
  });
});

test("reports an unknown lesson id", () => {
  expect(openLesson(httpCourse, "missing")).toEqual({
    error: { code: "lesson_unavailable", message: "目录里没有这一课" },
  });
});
