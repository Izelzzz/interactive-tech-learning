import courseJson from './content/course.json';
import { createProgressStore } from './progress-store';
import './styles.css';
import type { Course } from './types';
import { renderApp } from './ui/render';

const course = courseJson as Course;
const root = document.querySelector('#app');
if (!root) throw new Error('缺少 #app');

const store = createProgressStore(window.localStorage);

function draw(): void {
  renderApp(root as HTMLElement, {
    course,
    store,
    hash: window.location.hash || '#/',
    onHash(hash) {
      const next = hash.startsWith('#') ? hash : `#${hash}`;
      if (window.location.hash === next) draw();
      else window.location.hash = next;
    },
  });
}

window.addEventListener('hashchange', draw);
draw();
