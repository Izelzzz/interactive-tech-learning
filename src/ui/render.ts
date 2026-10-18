import { listPublished, loadUnit } from '../catalog';
import type { createProgressStore } from '../progress-store';
import {
  availableActions,
  createSession,
  currentCopy,
  effectiveStep,
  errorMessage,
  learningResult,
  next,
  progressFromSession,
  replayRows,
  retryRepair,
  selectPath,
  sendPack,
  setMode,
  skip,
  updateDraft,
  visibleRegions,
  type Session,
} from '../runtime';
import type { Course, Mode, PathType, Step, Unit } from '../types';

type Store = ReturnType<typeof createProgressStore>;

export interface RenderOptions {
  course: Course;
  store: Store;
  hash: string;
  onHash: (hash: string) => void;
}

export function renderApp(root: HTMLElement, options: RenderOptions): void {
  const route = parseHash(options.hash);
  if (route.kind === 'catalog') {
    root.replaceChildren(renderCatalog(options));
    return;
  }
  const loaded = loadUnit(options.course, route.unitId);
  if (!loaded.ok) {
    root.replaceChildren(renderUnavailable(options, loaded.error.message));
    return;
  }
  mountUnit(root, options, loaded.unit);
}

function mountUnit(root: HTMLElement, options: RenderOptions, unit: Unit): void {
  let session = createSession(unit, options.store.readProgress(unit.unitId));
  let selectedRepair = '';
  let storageNote: string | null = null;

  const persist = () => {
    const progressWrite = options.store.writeProgress(unit.unitId, progressFromSession(session));
    storageNote = progressWrite.ok ? null : progressWrite.error.message;
    if (session.completed) {
      const resultWrite = options.store.writeResult(learningResult(session));
      if (!resultWrite.ok) storageNote = resultWrite.error.message;
    }
  };

  const commit = (nextSession: Session) => {
    const moved = nextSession.stepIndex !== session.stepIndex
      || nextSession.pathType !== session.pathType
      || nextSession.phase !== session.phase;
    session = nextSession;
    if (moved) selectedRepair = '';
    persist();
    draw();
  };

  const draw = () => {
    const regions = visibleRegions(session, unit);
    const page = el('div', 'page');
    if (regions.includes('topbar')) page.append(renderTopbar(unit, session, commit));
    const column = el('div', 'column');
    if (regions.includes('stage')) {
      column.append(renderStage(unit, session, options, selectedRepair, storageNote, {
        onRepair(id) {
          selectedRepair = id;
        },
        onRetry() {
          commit(retryRepair(session, unit, selectedRepair));
        },
        onNext() {
          commit(next(session, unit));
        },
        onSkip() {
          commit(skip(session, unit));
        },
        onPath(path) {
          commit(selectPath(session, unit, path));
        },
      }));
    }
    if (regions.includes('packbar')) {
      column.append(renderPack(session, unit, {
        onDraft(field, value) {
          session = updateDraft(session, field, value);
          options.store.writeProgress(unit.unitId, progressFromSession(session));
        },
        onSend() {
          commit(sendPack(session, unit));
        },
      }));
    }
    page.append(column);
    root.replaceChildren(page);
  };

  draw();
}

function renderCatalog(options: RenderOptions): HTMLElement {
  const main = el('main', 'catalog');
  main.append(el('p', 'eyebrow', 'HTTP'));
  main.append(el('h1', 'catalog-title', '课程目录'));
  const listed = listPublished(options.course);
  if (!listed.ok) {
    const empty = el('p', 'notice', listed.error.message);
    empty.dataset.errorCode = listed.error.code;
    main.append(empty);
    return main;
  }
  const list = el('ul', 'unit-list');
  for (const unit of listed.units) {
    const item = el('li', 'unit-item');
    const button = el('button', 'unit-link', unit.title);
    button.type = 'button';
    button.dataset.unit = unit.unitId;
    button.addEventListener('click', () => options.onHash(`#/units/${unit.unitId}`));
    item.append(button);
    const result = options.store.readResult(unit.unitId);
    if (result?.completed) {
      const done = el('span', 'done-flag', '已完课');
      done.dataset.completed = 'true';
      item.append(done);
    }
    list.append(item);
  }
  main.append(list);
  return main;
}

function renderUnavailable(options: RenderOptions, message: string): HTMLElement {
  const main = el('main', 'catalog');
  const notice = el('p', 'notice', message);
  notice.dataset.errorCode = 'unit_unavailable';
  const back = el('button', 'text-button', '返回目录');
  back.type = 'button';
  back.dataset.nav = 'catalog';
  back.addEventListener('click', () => options.onHash('#/'));
  main.append(notice, back);
  return main;
}

function renderTopbar(unit: Unit, session: Session, commit: (session: Session) => void): HTMLElement {
  const bar = el('header', 'topbar');
  bar.dataset.region = 'topbar';
  const title = el('h1', 'unit-title', unit.title);
  const modes = el('div', 'modes');
  modes.setAttribute('role', 'group');
  modes.setAttribute('aria-label', '讲解深度');
  modes.append(modeButton('beginner', '小白', session, commit), modeButton('pro', '专业', session, commit));
  bar.append(title, modes);
  return bar;
}

function modeButton(mode: Mode, label: string, session: Session, commit: (session: Session) => void): HTMLButtonElement {
  const button = el('button', session.mode === mode ? 'mode is-on' : 'mode', label);
  button.type = 'button';
  button.dataset.mode = mode;
  button.setAttribute('aria-pressed', session.mode === mode ? 'true' : 'false');
  button.addEventListener('click', () => commit(setMode(session, mode)));
  return button;
}

interface StageHandlers {
  onRepair: (id: string) => void;
  onRetry: () => void;
  onNext: () => void;
  onSkip: () => void;
  onPath: (path: PathType) => void;
}

function renderStage(
  unit: Unit,
  session: Session,
  options: RenderOptions,
  selectedRepair: string,
  storageNote: string | null,
  handlers: StageHandlers,
): HTMLElement {
  const stage = el('section', 'stage');
  stage.dataset.region = 'stage';
  const rows = replayRows(session, unit);
  if (session.phase === 'replay' && rows) {
    stage.append(el('h2', 'replay-title', '结束回放'));
    const list = el('ol', 'replay');
    list.dataset.replay = 'true';
    for (const row of rows) {
      const item = el('li', 'replay-row');
      item.append(el('span', 'replay-name', row.title), el('span', 'replay-label', row.label));
      item.lastElementChild?.setAttribute('data-label', row.label);
      list.append(item);
    }
    stage.append(list, renderRecord(session), renderPathEntry(session.pathType, handlers.onPath), quietNav(options));
    return stage;
  }

  const step = effectiveStep(session, unit);
  stage.dataset.step = step.stepId;
  stage.append(el('p', 'kicker', step.title));
  const copy = el('p', 'copy', currentCopy(session, unit));
  copy.dataset.copy = 'true';
  stage.append(copy);
  if (showsFailure(session, step)) {
    const status = el('p', 'status', '失败');
    status.dataset.status = 'failed';
    stage.append(status);
  }
  if (step.stepType === 'repair' && step.repair) {
    stage.append(renderRepair(step, session.mode, selectedRepair, handlers.onRepair));
  }
  const message = errorMessage(session, unit);
  if (message && session.error?.code !== 'pack_invalid') {
    const error = el('p', 'error-line', message);
    error.dataset.error = session.error?.code ?? '';
    stage.append(error);
  }
  stage.append(renderActions(session, unit, handlers));
  if (storageNote) stage.append(el('p', 'notice', storageNote));
  stage.append(renderPathEntry(session.pathType, handlers.onPath), quietNav(options));
  return stage;
}

function showsFailure(session: Session, step: Step): boolean {
  if (session.error?.code === 'pack_invalid' || session.error?.code === 'repair_incomplete') return true;
  if (step.stepType === 'repair') return true;
  return step.completionResult === 'failed';
}

function renderRepair(step: Step, mode: Mode, selectedRepair: string, onRepair: (id: string) => void): HTMLElement {
  const group = el('fieldset', 'repair');
  const legend = el('legend', 'repair-legend', '重试');
  group.append(legend);
  for (const option of step.repair?.options ?? []) {
    const label = el('label', 'repair-option');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'repair';
    input.value = option.id;
    input.dataset.repairId = option.id;
    input.checked = selectedRepair === option.id;
    input.addEventListener('change', () => onRepair(option.id));
    label.append(input, el('span', 'repair-label', option.label[mode]));
    group.append(label);
  }
  return group;
}

function renderActions(session: Session, unit: Unit, handlers: StageHandlers): HTMLElement {
  const row = el('div', 'actions');
  for (const action of availableActions(session, unit)) {
    if (action === 'send') continue;
    const button = el('button', action === 'skip' ? 'text-button' : 'primary', actionLabel(action));
    button.type = 'button';
    button.dataset.action = action;
    button.addEventListener('click', () => {
      if (action === 'next') handlers.onNext();
      if (action === 'retry') handlers.onRetry();
      if (action === 'skip') handlers.onSkip();
    });
    row.append(button);
  }
  return row;
}

function actionLabel(action: 'next' | 'retry' | 'skip' | 'send'): string {
  if (action === 'next') return '下一步';
  if (action === 'retry') return '重试';
  if (action === 'skip') return '跳过';
  return '发送';
}

function renderPathEntry(pathType: PathType, onPath: (path: PathType) => void): HTMLElement {
  const wrap = el('p', 'path-entry');
  const target: PathType = pathType === 'normal' ? 'fault' : 'normal';
  const button = el('button', 'text-button', target === 'fault' ? '进入故障路径' : '返回正常路径');
  button.type = 'button';
  button.dataset.path = target;
  button.addEventListener('click', () => onPath(target));
  wrap.append(button);
  return wrap;
}

function quietNav(options: RenderOptions): HTMLButtonElement {
  const back = el('button', 'text-button', '返回目录');
  back.type = 'button';
  back.dataset.nav = 'catalog';
  back.addEventListener('click', () => options.onHash('#/'));
  return back;
}

function renderRecord(session: Session): HTMLElement {
  const record = el('dl', 'record');
  record.dataset.record = 'true';
  const result = learningResult(session);
  record.append(
    recordRow('单元', 'unitId', result.unitId, result.unitId),
    recordRow('模式', 'mode', result.mode, result.mode === 'beginner' ? '小白' : '专业'),
    recordRow('路径', 'pathType', result.pathType, result.pathType === 'normal' ? '正常' : '故障'),
    recordRow('完课', 'completed', String(result.completed), result.completed ? '是' : '否'),
    recordRow('组包一次成功', 'packOnceSuccess', String(result.packOnceSuccess), result.packOnceSuccess ? '是' : '否'),
  );
  return record;
}

function recordRow(label: string, field: string, value: string, display: string): HTMLElement {
  const row = el('div', 'record-row');
  row.append(el('dt', 'record-label', label));
  const dd = el('dd', 'record-value', display);
  dd.dataset.resultField = field;
  dd.dataset.value = value;
  row.append(dd);
  return row;
}

interface PackHandlers {
  onDraft: (field: string, value: string) => void;
  onSend: () => void;
}

function renderPack(session: Session, unit: Unit, handlers: PackHandlers): HTMLElement {
  const step = effectiveStep(session, unit);
  const form = el('form', 'packbar');
  form.dataset.region = 'packbar';
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    handlers.onSend();
  });
  for (const field of step.packRule?.fields ?? []) {
    const label = el('label', 'field');
    label.append(el('span', 'field-name', field));
    const input = document.createElement('input');
    input.dataset.field = field;
    input.name = field;
    input.autocomplete = 'off';
    input.value = session.packDraft[field] ?? '';
    input.addEventListener('input', () => handlers.onDraft(field, input.value));
    label.append(input);
    form.append(label);
  }
  const send = el('button', 'primary', '发送');
  send.type = 'submit';
  send.dataset.action = 'send';
  form.append(send);
  const message = errorMessage(session, unit);
  if (session.error?.code === 'pack_invalid' && message) {
    const error = el('p', 'error-line', message);
    error.dataset.error = 'pack_invalid';
    form.append(error);
  }
  return form;
}

function parseHash(hash: string): { kind: 'catalog' } | { kind: 'unit'; unitId: string } {
  const cleaned = hash.replace(/^#/, '');
  const match = cleaned.match(/^\/units\/([^/]+)/);
  if (match?.[1]) return { kind: 'unit', unitId: decodeURIComponent(match[1]) };
  return { kind: 'catalog' };
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
