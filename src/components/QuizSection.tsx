import * as RadioGroup from "@radix-ui/react-radio-group";
import type { Lesson } from "../content/types";
import type { LearningResult } from "../progress/store";
import type { Answers, CopyDepth, QuizQuestion, ShortQuestion } from "../quiz/score";

function isShort(question: QuizQuestion): question is ShortQuestion {
  return question.type === "short";
}

export function QuizSection({
  lesson,
  copyDepth,
  answers,
  result,
  onAnswer,
  onSubmit,
}: {
  lesson: Lesson;
  copyDepth: CopyDepth;
  answers: Answers;
  result: LearningResult;
  onAnswer: (questionId: string, value: string) => void;
  onSubmit: () => void;
}) {
  const submitted = result.quizCompleted;

  return (
    <section id="quiz" className="block">
      <p className="block-index">04</p>
      <h2>测验</h2>
      <p className="quiz-rule">两道单选各 25 分，简答 50 分。达到 60 分通过。</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        {lesson.quiz.questions.map((question, index) => (
          <fieldset key={question.id}>
            <legend>
              {index + 1}. {question.stem}
            </legend>
            {question.type === "single" ? (
              <RadioGroup.Root
                className="choices"
                value={answers[question.id] ?? ""}
                aria-label={question.stem}
                onValueChange={(value) => onAnswer(question.id, value)}
              >
                {question.options.map((option) => (
                  <label key={option.id} className="choice">
                    <RadioGroup.Item value={option.id} />
                    <span>
                      {option.id}. {option.text}
                    </span>
                  </label>
                ))}
              </RadioGroup.Root>
            ) : (
              <textarea
                value={answers[question.id] ?? ""}
                onChange={(event) => onAnswer(question.id, event.target.value)}
                rows={5}
                aria-label={question.stem}
              />
            )}
            {submitted ? (
              <div className="review">
                {isShort(question) ? (
                  <>
                    <p className="review-label">参考答案</p>
                    <p className="reference">{question.reference}</p>
                    <p>
                      命中要点：
                      {result.hits.length
                        ? question.rubric
                            .filter((item) => result.hits.includes(item.id))
                            .map((item) => item.label)
                            .join("、")
                        : "无"}
                    </p>
                  </>
                ) : (
                  <p>
                    标准答案：{question.answer}.{" "}
                    {question.options.find((option) => option.id === question.answer)?.text}
                  </p>
                )}
                <p className="review-label">解析</p>
                <p>{question.explanation[copyDepth]}</p>
              </div>
            ) : null}
          </fieldset>
        ))}
        <button className="submit" type="submit">
          {submitted ? "再次提交" : "提交测验"}
        </button>
      </form>
      {submitted ? (
        <div className={`score-panel${result.passed ? " passed" : ""}`} aria-live="polite">
          <p className="score-value">得分 {result.score} / 100</p>
          <p className="score-state">{result.passed ? "通过" : "未通过"}</p>
        </div>
      ) : null}
    </section>
  );
}
