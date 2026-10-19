import { Link, Route, Routes, useParams } from "react-router-dom";
import courseJson from "./content/http-course.json";
import { openLesson } from "./content/load";
import type { Course } from "./content/types";
import { createLocalStorageStore, type ResultStore } from "./progress/store";
import { CatalogView } from "./pages/CatalogView";
import { LessonScreen } from "./pages/LessonScreen";

const course = courseJson as Course;
const browserStore = createLocalStorageStore(window.localStorage);

export function App({ store = browserStore }: { store?: ResultStore }) {
  return (
    <Routes>
      <Route path="/" element={<CatalogView course={course} />} />
      <Route path="/lessons/:lessonId" element={<LessonRoute store={store} />} />
    </Routes>
  );
}

function LessonRoute({ store }: { store: ResultStore }) {
  const { lessonId = "" } = useParams();
  const opened = openLesson(course, lessonId);
  if ("error" in opened) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <p className="text-base">{opened.error.message}</p>
        <Link to="/" className="mt-4 inline-block text-sm font-medium underline-offset-4 hover:underline">
          返回目录
        </Link>
      </main>
    );
  }
  return <LessonScreen key={opened.lesson.lessonId} lesson={opened.lesson} store={store} />;
}
