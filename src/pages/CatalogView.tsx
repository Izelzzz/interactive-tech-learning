import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listPublishedLessons } from "@/content/load";
import type { Course } from "@/content/types";

export function CatalogView({ course }: { course: Course }) {
  const lessons = listPublishedLessons(course);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <Badge variant="secondary">课程目录</Badge>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">{course.title}</h1>
      <p className="mt-3 text-base leading-7 text-muted-foreground">从一次请求开始，把方法、目标、头和正文对上真实调用。</p>
      <ul className="mt-8 space-y-3">
        {lessons.map((lesson, index) => (
          <li key={lesson.lessonId}>
            <Link to={`/lessons/${lesson.lessonId}`} className="block">
              <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm ring-0 transition-colors hover:border-indigo-200">
                <CardHeader>
                  <CardDescription>0{index + 1}</CardDescription>
                  <CardTitle>{lesson.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">概念、交互、应用、测验在同一页。</CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
