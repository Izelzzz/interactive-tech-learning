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
  expect(html).toContain("读懂一次 HTTP 请求");
});

test("lesson page reads why, parts, lab, wire, apply, then clinic", () => {
  const html = lessonHtml(false);
  const why = html.indexOf('id="why"');
  const parts = html.indexOf('id="parts"');
  const lab = html.indexOf('id="assemble-lab"');
  const wire = html.indexOf('id="on-the-wire"');
  const apply = html.indexOf('id="apply"');
  const clinic = html.indexOf('id="clinic"');

  expect(html).toContain("返回目录");
  expect(html).toContain("读懂一次 HTTP 请求");
  expect(html).toContain("学完你能");
  expect(html).toContain("这一课回答「打开一个网址时，客户端到底发出了什么」");
  expect(html).toContain('href="#why"');
  expect(html).toContain('href="#parts"');
  expect(html).toContain('href="#assemble-lab"');
  expect(html).toContain('href="#on-the-wire"');
  expect(html).toContain('href="#apply"');
  expect(html).toContain('href="#clinic"');
  expect(html).not.toContain('href="#concept"');
  expect(why).toBeGreaterThan(-1);
  expect(why).toBeLessThan(parts);
  expect(parts).toBeLessThan(lab);
  expect(lab).toBeLessThan(wire);
  expect(wire).toBeLessThan(apply);
  expect(apply).toBeLessThan(clinic);
  expect(html).toContain("为什么要把请求拆开看");
  expect(html).toContain("坏写法");
  expect(html).toContain("好写法");
  expect(html).toContain("状态码 ≠ 请求方法");
  expect(html).toContain("第一步：一条请求要交代什么");
  expect(html).toContain("正文可以空。Host 仍然要有。");
  expect(html).toContain("报文字段 ≠ 路上的步骤");
  expect(html).toContain("实验：按字段写出这条请求");
  expect(html).toContain("点播放，按时间写入字段");
  expect(html).toContain("/docs 只写出路径");
  expect(html).toContain("第二步：路上发生了什么");
  expect(html).toContain("观察包从客户端到服务端再回来时，报文区何时换成响应状态行。");
  expect(html).toContain("请求行和 Host 一行都没改");
  expect(html).toContain("第三步：浏览器记录和 curl 怎样对上");
  expect(html).toContain("curl 省略 -X 时默认 GET");
  expect(html).toContain("curl 从 URL 取出 example.com");
  expect(html).toContain("GET https://example.com/docs");
  expect(html).toContain("curl https://example.com/docs");
  expect(html).toContain("诊所：这几句把字段认成了什么");
  expect(html).toContain("有人用 200 描述这次请求的动作");
  expect(html).toContain("本课小结");
  expect(html).toContain("我的答案");
  expect(html).toContain("组装请求");
  expect(html).toContain("追踪往返");
  expect(html).not.toContain("小白");
  expect(html).not.toContain("copyDepth");
  expect(html).not.toContain(">概念<");
  expect(html).not.toContain("它回答什么");
});

test("submitted quiz shows the score, every option note, and the recap", () => {
  const html = lessonHtml(true);

  expect(html).toContain("https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Guides/Overview");
  expect(html).toContain("直接问我");
  expect(html).toContain("请求里标明的方法名");
  expect(html).toContain("得分 75 / 100");
  expect(html).toContain("通过");
  expect(html).toContain("标准答案");
  expect(html).toContain("命中要点");
  expect(html).toContain("动作");
  expect(html).toContain("状态码写在响应的状态行上");
  expect(html).toContain("方法写在请求行开头");
  expect(html).toContain("Host 是头，GET 是方法");
  expect(html).toContain("方法说动作。样例是 GET。状态码写在响应里。");
});
