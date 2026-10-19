import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { Lesson } from "@/content/types";
import type { LearningResult } from "@/progress/store";
import type { Answers, QuizQuestion } from "@/quiz/score";
import { cn } from "@/lib/utils";

function optionClass(question: Extract<QuizQuestion, { type: "single" }>, optionId: string, answers: Answers, graded: boolean) {
  const selected = answers[question.id] === optionId;
  if (!graded) {
    return selected
      ? "border-indigo-300 bg-white shadow-sm"
      : "border-transparent bg-slate-100/80 hover:bg-slate-100";
  }
  if (optionId === question.answer) return "border-emerald-300 bg-emerald-50";
  if (selected) return "border-rose-300 bg-rose-50";
  return "border-transparent bg-slate-100/70";
}

export function QuizSection({
  lesson,
  answers,
  result,
  onAnswer,
  onSubmit,
}: {
  lesson: Lesson;
  answers: Answers;
  result: LearningResult;
  onAnswer: (questionId: string, value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-4">
      {lesson.quiz.questions.map((question, index) => (
        <Card key={question.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm ring-0">
          <CardHeader>
            <CardTitle className="text-base leading-7">
              {index + 1}. {question.stem}
              <span className="ml-2 text-sm font-normal text-muted-foreground">{question.points} 分</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {question.type === "single" ? (
              <>
                <RadioGroup
                  value={answers[question.id] ?? ""}
                  onValueChange={(value) => onAnswer(question.id, String(value))}
                  className="gap-2"
                >
                  {question.options.map((option) => (
                    <Label
                      key={option.id}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-normal",
                        optionClass(question, option.id, answers, result.quizCompleted),
                      )}
                    >
                      <RadioGroupItem value={option.id} />
                      <span className="w-5 font-medium text-slate-500">{option.id}</span>
                      <span>{option.text}</span>
                    </Label>
                  ))}
                </RadioGroup>
                <p className="text-sm text-muted-foreground">
                  {answers[question.id] ? `已选 ${answers[question.id]}。` : "选择一项。"}
                  {result.quizCompleted ? "对照下面的标准答案。" : "提交后对照标准答案。"}
                </p>
              </>
            ) : (
              <Textarea
                value={answers[question.id] ?? ""}
                onChange={(event) => onAnswer(question.id, event.target.value)}
                rows={5}
                aria-label="我的答案"
                placeholder="写下方法、目标，以及头或正文"
                className="min-h-28 rounded-xl bg-slate-50"
              />
            )}
            {result.quizCompleted ? (
              <div className="rounded-xl border border-teal-100 border-l-4 border-l-teal-500 bg-teal-50/70 p-4 text-sm leading-6">
                <p className="font-medium">标准答案</p>
                <p className="mt-1 whitespace-pre-wrap">
                  {question.type === "single"
                    ? `${question.answer}. ${question.options.find((option) => option.id === question.answer)?.text ?? ""}`
                    : question.reference}
                </p>
                <p className="mt-3 font-medium">解析</p>
                <p className="mt-1">{question.explanation}</p>
                {question.type === "short" ? (
                  <p className="mt-3">
                    命中要点：
                    {result.hits.length > 0
                      ? result.hits
                          .map((id) => question.rubric.find((item) => item.id === id)?.label ?? id)
                          .join("、")
                      : "这一次没有命中要点。"}
                  </p>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          className="border-0 bg-gradient-to-r from-indigo-500 to-cyan-400 text-white hover:from-indigo-500 hover:to-cyan-300"
          onClick={onSubmit}
        >
          提交测验
        </Button>
        <span className="text-sm text-muted-foreground">满分 100，60 分通过。</span>
        {result.quizCompleted ? (
          <>
            <Badge variant={result.passed ? "default" : "destructive"}>
              {result.passed ? "通过" : "未通过"}
            </Badge>
            <span className="text-sm font-medium">得分 {result.score} / 100</span>
          </>
        ) : null}
      </div>
    </div>
  );
}
