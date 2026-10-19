import { Link } from "react-router-dom";
import { ApplicationCompare } from "@/components/ApplicationCompare";
import { QuizSection } from "@/components/QuizSection";
import { RequestAssembler } from "@/components/RequestAssembler";
import { RoundTripTracer } from "@/components/RoundTripTracer";
import { SampleCode } from "@/components/SampleCode";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Lesson, SectionId } from "@/content/types";
import { cn } from "@/lib/utils";
import type { LearningResult } from "@/progress/store";
import type { Answers } from "@/quiz/score";

const shell = "mx-auto w-full max-w-5xl px-6";
const prose = "max-w-[46rem] text-[1.0625rem] leading-[1.75] text-slate-700";

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
            {lesson.sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}
              >
                {section.jump}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <main className={`${shell} space-y-14 py-12`}>
        <header className="max-w-[46rem]">
          <Badge variant="secondary">{lesson.eyebrow}</Badge>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">{lesson.title}</h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">{lesson.lede}</p>
          <div className="mt-6 rounded-2xl border border-indigo-100 border-l-4 border-l-indigo-500 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-semibold tracking-wide text-indigo-700">学完你能</p>
            <p className="mt-2 text-base leading-7">{lesson.goal}</p>
          </div>
        </header>

        <section id="why" className="scroll-mt-32 space-y-6">
          <SectionHead index="01" title={heading(lesson, "why")} lede={lesson.why.lede} />
          <div className="grid gap-4 md:grid-cols-2">
            <Compare column={lesson.why.bad} tone="bad" />
            <Compare column={lesson.why.good} tone="good" />
          </div>
          <p className={prose}>{lesson.why.bridge}</p>
          <Callout title={lesson.why.callout.title} body={lesson.why.callout.body} />
        </section>

        <section id="parts" className="scroll-mt-32 space-y-6">
          <SectionHead index="02" title={heading(lesson, "parts")} lede={lesson.parts.lede} />
          <SampleCode title={lesson.parts.requestTitle} value={lesson.parts.request}>
            {lesson.parts.request}
          </SampleCode>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>部分</TableHead>
                  <TableHead>回答的问题</TableHead>
                  <TableHead>本课样例</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lesson.parts.rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.part}</TableCell>
                    <TableCell>{row.question}</TableCell>
                    <TableCell className="font-mono text-xs">{row.sample}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-lg font-medium">{lesson.parts.rule}</p>
          <Callout title={lesson.parts.callout.title} body={lesson.parts.callout.body} />
        </section>

        <section id="assemble-lab" className="scroll-mt-32 space-y-6">
          <SectionHead index="03" title={heading(lesson, "assemble-lab")} lede={lesson.assemble.prompt} />
          <RequestAssembler beats={lesson.assemble.beats} initialId={partId} prompt="" />
        </section>

        <section id="on-the-wire" className="scroll-mt-32 space-y-6">
          <SectionHead index="04" title={heading(lesson, "on-the-wire")} lede={lesson.trip.lede} />
          <RoundTripTracer stops={lesson.trip.stops} initialId={tripId} prompt={lesson.trip.prompt} />
        </section>

        <section id="apply" className="scroll-mt-32 space-y-6">
          <SectionHead index="05" title={heading(lesson, "apply")} lede={lesson.application.lede} />
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

        <section id="clinic" className="scroll-mt-32 space-y-6">
          <SectionHead index="06" title={heading(lesson, "clinic")} lede={lesson.clinic.lede} />
          <QuizSection lesson={lesson} answers={answers} result={result} onAnswer={onAnswer} onSubmit={onSubmit} />
          <div id="recap" className="scroll-mt-32 space-y-4 pt-4">
            <h2 className="text-[2rem] font-semibold tracking-tight">{lesson.recap.heading}</h2>
            <ul className="max-w-[46rem] space-y-3">
              {lesson.recap.items.map((item) => (
                <li key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 shadow-sm">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-teal-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <aside className="max-w-[46rem] rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm leading-6 shadow-sm">
            <p>{lesson.furtherReading.note}</p>
            <a className="mt-2 inline-block font-medium text-indigo-700 underline-offset-4 hover:underline" href={lesson.furtherReading.href}>
              {lesson.furtherReading.title}
            </a>
          </aside>
        </section>
      </main>
    </div>
  );
}

function heading(lesson: Lesson, id: SectionId) {
  return lesson.sections.find((section) => section.id === id)?.heading ?? id;
}

function SectionHead({ index, title, lede }: { index: string; title: string; lede: string }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.16em] text-teal-700">{index}</p>
      <h2 className="mt-2 text-[2rem] leading-tight font-semibold tracking-tight">{title}</h2>
      <p className={`mt-4 ${prose}`}>{lede}</p>
    </div>
  );
}

function Compare({ column, tone }: { column: { title: string; points: string[] }; tone: "bad" | "good" }) {
  const accent = tone === "bad" ? "border-t-rose-500" : "border-t-teal-500";
  return (
    <div className={`rounded-2xl border border-slate-200 border-t-4 ${accent} bg-white p-5 shadow-sm`}>
      <h3 className="text-base font-semibold">{column.title}</h3>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
        {column.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </div>
  );
}

function Callout({ title, body }: { title: string; body: string }) {
  return (
    <div className="max-w-[46rem] rounded-2xl border border-amber-100 border-l-4 border-l-amber-500 bg-amber-50/80 px-4 py-3 text-sm leading-6">
      <p className="font-semibold">{title}</p>
      <p className="mt-1">{body}</p>
    </div>
  );
}
