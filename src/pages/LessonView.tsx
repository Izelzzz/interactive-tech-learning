import { Link } from "react-router-dom";
import { ApplicationCompare } from "@/components/ApplicationCompare";
import { QuizSection } from "@/components/QuizSection";
import { RequestAssembler } from "@/components/RequestAssembler";
import { RoundTripTracer } from "@/components/RoundTripTracer";
import { SampleCode } from "@/components/SampleCode";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Lesson } from "@/content/types";
import { cn } from "@/lib/utils";
import type { LearningResult } from "@/progress/store";
import type { Answers } from "@/quiz/score";

const shell = "mx-auto w-full max-w-5xl px-6";

export function LessonView({
  lesson,
  answers,
  partId,
  tripId,
  fieldId,
  result,
  onAnswer,
  onSubmit,
}: {
  lesson: Lesson;
  answers: Answers;
  partId: string;
  tripId: string;
  fieldId: string;
  result: LearningResult;
  onAnswer: (questionId: string, value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-background">
        <div className={`${shell} flex flex-wrap items-center gap-2 py-3`}>
          <Link to="/" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            返回目录
          </Link>
          <Separator orientation="vertical" className="h-4" />
          <span className="truncate text-sm font-medium">{lesson.title}</span>
          <nav className="ml-auto flex flex-wrap justify-end gap-1">
            {lesson.sections.map((section, index) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}
              >
                {index + 1} {section.jump}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <main className={`${shell} space-y-16 py-10`}>
        <div>
          <Badge variant="secondary">HTTP · 一次请求</Badge>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">{lesson.title}</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">{lesson.outcome}</p>
        </div>

        <section id="concept" className="scroll-mt-28 space-y-6">
          <SectionLabel index="01" title="概念" lede={lesson.concept.lede} />
          <SampleCode title={lesson.concept.requestTitle} value={lesson.concept.request}>
            {lesson.concept.request}
          </SampleCode>
          <Card className="rounded-2xl border border-slate-200 bg-white py-0 shadow-sm ring-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>部分</TableHead>
                  <TableHead>它回答的问题</TableHead>
                  <TableHead>样例</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lesson.concept.rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.part}</TableCell>
                    <TableCell>{row.question}</TableCell>
                    <TableCell className="font-mono text-xs">{row.sample}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <div className="grid gap-3 md:grid-cols-3">
            {lesson.concept.principles.map((principle) => (
              <Card key={principle.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm ring-0">
                <CardContent className="space-y-2">
                  <h3 className="font-semibold">{principle.title}</h3>
                  <p className="text-sm leading-6 text-slate-600">{principle.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="rounded-2xl border border-teal-100 border-l-4 border-l-teal-500 bg-teal-50/70 px-4 py-3 text-sm leading-6">
            {lesson.concept.callout}
          </div>
        </section>

        <section id="interactive" className="scroll-mt-28 space-y-6">
          <SectionLabel index="02" title="交互 / 可视化" lede={lesson.assemble.lede} />
          <RequestAssembler beats={lesson.assemble.beats} initialId={partId} prompt={lesson.assemble.prompt} />
          <p className="text-sm leading-7 text-muted-foreground">{lesson.trip.lede}</p>
          <RoundTripTracer stops={lesson.trip.stops} initialId={tripId} prompt={lesson.trip.prompt} />
        </section>

        <section id="application" className="scroll-mt-28 space-y-6">
          <SectionLabel index="03" title="应用" lede={lesson.application.lede} />
          <ApplicationCompare
            intro={lesson.application.intro}
            browserTitle={lesson.application.browserTitle}
            browser={lesson.application.browser}
            curlTitle={lesson.application.curlTitle}
            curl={lesson.application.curl}
            rows={lesson.application.rows}
            initialId={fieldId}
          />
        </section>

        <section id="quiz" className="scroll-mt-28 space-y-6">
          <SectionLabel index="04" title="测验" lede={lesson.quizLede} />
          <QuizSection lesson={lesson} answers={answers} result={result} onAnswer={onAnswer} onSubmit={onSubmit} />
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm leading-6 shadow-sm">
          <p>{lesson.furtherReading.note}</p>
          <a className="mt-2 inline-block font-medium text-indigo-700 underline-offset-4 hover:underline" href={lesson.furtherReading.href}>
            {lesson.furtherReading.title}
          </a>
        </aside>
      </main>
    </div>
  );
}

function SectionLabel({ index, title, lede }: { index: string; title: string; lede: string }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.18em] text-teal-700">{index}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">{lede}</p>
    </div>
  );
}
