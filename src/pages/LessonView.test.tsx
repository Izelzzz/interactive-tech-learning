import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { expect, test } from "vitest";
import { openLesson } from "../content/load";
import course from "../content/http-course.json";
import type { Course } from "../content/types";
import { CatalogView } from "./CatalogView";
import { LessonView } from "./LessonView";

const httpCourse = course as Course;
const opened = openLesson(httpCourse, "http-one-request");
if (!("lesson" in opened)) {
  throw new Error("published lesson missing");
}
const lesson = opened.lesson;

const noop = () => {};

function lessonHtml(copyDepth: "beginner" | "pro", quizCompleted: boolean) {
  return renderToStaticMarkup(
    <MemoryRouter>
      <LessonView
        lesson={lesson}
        copyDepth={copyDepth}
        answers={{ q1: "B", q3: "我的答案" }}
        messagePart="target"
        roundTripStep="arrive"
        result={
          quizCompleted
            ? {
                lessonId: lesson.lessonId,
                quizCompleted: true,
                score: 75,
                passed: true,
                copyDepth,
                answers: { q1: "B", q3: "我的答案" },
                hits: ["action"],
              }
            : { lessonId: lesson.lessonId, quizCompleted: false }
        }
        onCopyDepth={noop}
        onAnswer={noop}
        onMessagePart={noop}
        onRoundTrip={noop}
        onSubmit={noop}
      />
    </MemoryRouter>,
  );
}

test("catalog links to the published lesson", () => {
  const html = renderToStaticMarkup(
    <MemoryRouter>
      <CatalogView course={httpCourse} />
    </MemoryRouter>,
  );

  expect(html).toContain("HTTP");
  expect(html).toContain('href="/lessons/http-one-request"');
  expect(html).toContain("一次 HTTP 请求");
});

test("lesson page renders the header and four sections around the sample", () => {
  const html = lessonHtml("beginner", false);
  const concept = html.indexOf('id="concept"');
  const interactive = html.indexOf('id="interactive"');
  const application = html.indexOf('id="application"');
  const quiz = html.indexOf('id="quiz"');

  expect(html).toContain("返回目录");
  expect(html).toContain("一次 HTTP 请求");
  expect(html).toContain("学完能说明一次请求由什么组成，并能在样例调用里指出方法、目标与 Host。");
  expect(html).toContain('href="#concept"');
  expect(html).toContain('href="#interactive"');
  expect(html).toContain('href="#application"');
  expect(html).toContain('href="#quiz"');
  expect(concept).toBeGreaterThan(-1);
  expect(concept).toBeLessThan(interactive);
  expect(interactive).toBeLessThan(application);
  expect(application).toBeLessThan(quiz);
  expect(html).toContain("GET https://example.com/docs");
  expect(html).toContain("curl https://example.com/docs");
  expect(html).toContain("打开一个页面，就是发出一次请求");
  expect(html).not.toContain("一次 HTTP 调用对应一条请求报文");
  expect(html).toContain("它回答「要的东西在哪」");
  expect(html).toContain("报文送到对方");
  expect(html).toContain("在一次 HTTP 请求里，表示「这次要做的动作」的部分是哪一个？");
  expect(html).toContain("我的答案");
});

test("professional copy replaces narration and quiz explanations only", () => {
  const html = lessonHtml("pro", true);

  expect(html).toContain("一次 HTTP 调用对应一条请求报文");
  expect(html).not.toContain("打开一个页面，就是发出一次请求");
  expect(html).toContain("方法标明动作。状态码出现在响应里。");
  expect(html).not.toContain("「这次要做的动作」写在方法上");
  expect(html).toContain("在一次 HTTP 请求里，表示「这次要做的动作」的部分是哪一个？");
  expect(html).toContain("方法（例如 GET）");
  expect(html).toContain("我的答案");
  expect(html).toContain("得分 75 / 100");
  expect(html).toContain("通过");
  expect(html).toContain("标准答案");
  expect(html).toContain("命中要点");
  expect(html).toContain("动作");
});
