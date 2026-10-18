import { Link } from "react-router-dom";
import { listPublishedLessons } from "../content/load";
import type { Course } from "../content/types";

export function CatalogView({ course }: { course: Course }) {
  const lessons = listPublishedLessons(course);

  return (
    <main className="catalog">
      <p className="eyebrow">课程目录</p>
      <h1>{course.title}</h1>
      <p className="lede">从一课开始，把一次请求拆开看。</p>
      <ul className="lesson-list">
        {lessons.map((lesson) => (
          <li key={lesson.lessonId}>
            <Link to={`/lessons/${lesson.lessonId}`}>{lesson.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
