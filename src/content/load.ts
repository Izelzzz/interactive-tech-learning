import type { Course, LessonSummary, OpenLessonResult } from "./types";

export type { Course, Lesson, LessonSummary, OpenLessonResult } from "./types";

export function listPublishedLessons(course: Course): LessonSummary[] {
  return course.lessons
    .filter((lesson) => lesson.published)
    .map((lesson) => ({
      courseId: course.courseId,
      lessonId: lesson.lessonId,
      title: lesson.title,
    }));
}

export function openLesson(course: Course, lessonId: string): OpenLessonResult {
  const lesson = course.lessons.find((item) => item.lessonId === lessonId);
  if (!lesson) {
    return { error: { code: "lesson_unavailable", message: "目录里没有这一课" } };
  }
  if (!lesson.published) {
    return { error: { code: "lesson_unpublished", message: "目录只列出已发布课" } };
  }
  return { lesson };
}
