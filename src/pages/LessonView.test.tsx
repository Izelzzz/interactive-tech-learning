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

function lessonHtml(quizCompleted: boolean) {
  return renderToStaticMarkup(
    <MemoryRouter>
      <LessonView
        lesson={lesson}
        answers={{ q1: "B", q3: "我的答案" }}
        partId="target"
        tripId="arrive"
        fieldId="host"
        result={
          quizCompleted
            ? {
                lessonId: lesson.lessonId,
                quizCompleted: true,
                score: 75,
                passed: true,
                answers: { q1: "B", q3: "我的答案" },
                hits: ["action"],
              }
            : { lessonId: lesson.lessonId, quizCompleted: false }
        }
        onAnswer={noop}
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

test("lesson page renders one voice, the sample, and four sections", () => {
  const html = lessonHtml(false);
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
  expect(html).toContain("方法是请求行开头的动词");
  expect(html).toContain("目标在报文里先写成路径 /docs");
  expect(html).toContain("请求里的方法、路径和 Host 保持原样");
  expect(html).toContain("curl 从 URL 取出 example.com");
  expect(html).toContain("在一次 HTTP 请求里，表示「这次要做的动作」的部分是哪一个？");
  expect(html).toContain("我的答案");
  expect(html).toContain("组装请求");
  expect(html).toContain("追踪往返");
  expect(html).not.toContain("小白");
  expect(html).not.toContain("copyDepth");
});

test("submitted quiz shows the score, the answer, and the hit", () => {
  const html = lessonHtml(true);

  expect(html).toContain("https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Guides/Overview");
  expect(html).toContain("直接问我");
  expect(html).toContain("请求里标明的方法名");
  expect(html).toContain("得分 75 / 100");
  expect(html).toContain("通过");
  expect(html).toContain("标准答案");
  expect(html).toContain("命中要点");
  expect(html).toContain("动作");
  expect(html).toContain("方法标明这次要做的动作");
});
