export type CopyDepth = "beginner" | "pro";

export type Explanation = Record<CopyDepth, string>;

export type SingleQuestion = {
  id: string;
  type: "single";
  points: number;
  stem: string;
  options: { id: string; text: string }[];
  answer: string;
  explanation: Explanation;
};

export type RubricPoint = {
  id: string;
  label: string;
  points: number;
  phrases: string[];
};

export type ShortQuestion = {
  id: string;
  type: "short";
  points: number;
  stem: string;
  reference: string;
  explanation: Explanation;
  rubric: RubricPoint[];
};

export type QuizQuestion = SingleQuestion | ShortQuestion;

export type Quiz = {
  passScore: number;
  questions: QuizQuestion[];
};

export type Answers = Record<string, string>;

export type ScoreResult = {
  score: number;
  passed: boolean;
  hits: string[];
  perQuestion: { id: string; points: number }[];
};

function includesPhrase(text: string, phrase: string): boolean {
  return text.toLowerCase().includes(phrase.toLowerCase());
}

export function scoreQuiz(quiz: Quiz, answers: Answers): ScoreResult {
  const hits: string[] = [];
  const perQuestion = quiz.questions.map((question) => {
    const raw = answers[question.id] ?? "";
    if (question.type === "single") {
      const points = raw === question.answer ? question.points : 0;
      return { id: question.id, points };
    }

    let points = 0;
    for (const item of question.rubric) {
      const matched = item.phrases.some((phrase) => includesPhrase(raw, phrase));
      if (matched) {
        points += item.points;
        hits.push(item.id);
      }
    }
    return { id: question.id, points };
  });
  const score = perQuestion.reduce((sum, item) => sum + item.points, 0);
  return { score, passed: score >= quiz.passScore, hits, perQuestion };
}
