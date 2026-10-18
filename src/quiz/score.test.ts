import { expect, test } from "vitest";
import { scoreQuiz, type Quiz } from "./score";

const quiz: Quiz = {
  passScore: 60,
  questions: [
    {
      id: "q1",
      type: "single",
      points: 25,
      stem: "动作",
      options: [
        { id: "A", text: "方法" },
        { id: "B", text: "状态码" },
      ],
      answer: "A",
      explanation: { beginner: "小白解析一", pro: "专业解析一" },
    },
    {
      id: "q2",
      type: "single",
      points: 25,
      stem: "样例",
      options: [
        { id: "A", text: "GET 与 /docs" },
        { id: "B", text: "TLS" },
      ],
      answer: "A",
      explanation: { beginner: "小白解析二", pro: "专业解析二" },
    },
    {
      id: "q3",
      type: "short",
      points: 50,
      stem: "三件事",
      reference: "参考答案",
      explanation: { beginner: "小白解析三", pro: "专业解析三" },
      rubric: [
        { id: "action", label: "动作", points: 16, phrases: ["方法", "GET", "动作", "要做什么", "动词"] },
        {
          id: "target",
          label: "目标",
          points: 17,
          phrases: ["URL", "/docs", "example.com", "路径", "目标", "资源", "地址", "主机"],
        },
        {
          id: "extra",
          label: "附带信息",
          points: 17,
          phrases: ["Host", "头", "Header", "首部", "正文", "body", "附带", "可以没有正文", "没有正文"],
        },
      ],
    },
  ],
};

test("scores 100 and passes when both choices and all short points hit", () => {
  const result = scoreQuiz(quiz, {
    q1: "A",
    q2: "A",
    q3: "方法是 GET，目标是 https://example.com/docs，可以没有正文，仍有 Host: example.com",
  });

  expect(result.score).toBe(100);
  expect(result.passed).toBe(true);
  expect(result.hits).toEqual(["action", "target", "extra"]);
  expect(result.perQuestion).toEqual([
    { id: "q1", points: 25 },
    { id: "q2", points: 25 },
    { id: "q3", points: 50 },
  ]);
});

test("scores 0 for an unanswered question and still scores the answered one", () => {
  const result = scoreQuiz(quiz, { q1: "A" });

  expect(result.perQuestion).toEqual([
    { id: "q1", points: 25 },
    { id: "q2", points: 0 },
    { id: "q3", points: 0 },
  ]);
  expect(result.score).toBe(25);
  expect(result.passed).toBe(false);
  expect(result.hits).toEqual([]);
});

test("gives a wrong single choice 0 points", () => {
  const result = scoreQuiz(quiz, { q1: "B", q2: "A", q3: "" });

  expect(result.perQuestion[0]).toEqual({ id: "q1", points: 0 });
  expect(result.perQuestion[1]).toEqual({ id: "q2", points: 25 });
  expect(result.score).toBe(25);
});

test("matches short-answer phrases once, ignoring case", () => {
  const result = scoreQuiz(quiz, {
    q3: "get GET 方法方法，url 是 /docs，header: host",
  });

  expect(result.hits).toEqual(["action", "target", "extra"]);
  expect(result.perQuestion.find((item) => item.id === "q3")?.points).toBe(50);
});

test("fails at 59 and passes at 75 when the short answer also names the action", () => {
  const below = scoreQuiz(quiz, {
    q1: "A",
    q2: "B",
    q3: "路径是 /docs，Host 仍然在",
  });
  const passing = scoreQuiz(quiz, {
    q1: "A",
    q2: "A",
    q3: "方法是 GET，路径是 /docs，没有正文",
  });

  const oneChoice = scoreQuiz(quiz, {
    q1: "A",
    q3: "方法是 GET，路径是 /docs，没有正文",
  });

  expect(below.score).toBe(59);
  expect(below.passed).toBe(false);
  expect(below.hits).toEqual(["target", "extra"]);
  expect(oneChoice.score).toBe(75);
  expect(oneChoice.passed).toBe(true);
  expect(passing.score).toBe(100);
  expect(passing.passed).toBe(true);
  expect(passing.hits).toEqual(["action", "target", "extra"]);
});

test("scores a short answer 0 when no rubric phrase matches", () => {
  const result = scoreQuiz(quiz, { q1: "A", q2: "A", q3: "我不知道" });

  expect(result.score).toBe(50);
  expect(result.passed).toBe(false);
  expect(result.hits).toEqual([]);
  expect(result.perQuestion[2]).toEqual({ id: "q3", points: 0 });
});
