// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import course from '../src/content/course.json';
import { createProgressStore } from '../src/progress-store';
import type { Course } from '../src/types';
import { renderApp } from '../src/ui/render';

const data = course as Course;

describe('单元页', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    localStorage.clear();
  });

  it('从目录进入已发布单元，走完正常路径并写下五项结果', () => {
    const view = mount('#/');
    const listed = document.querySelector('[data-unit="http-request-once"]');
    expect(listed?.textContent).toContain('一次 HTTP 请求');
    expect(document.querySelector('[data-unit="draft-unit"]')).toBeNull();
    listed?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(text('[data-region="topbar"]')).toContain('一次 HTTP 请求');
    expect(regions()).toEqual(['topbar', 'stage']);
    expect(text('[data-copy]')).toBe(stepCopy('normal', 'dns', 'beginner'));

    view.clickMode('pro');
    expect(text('[data-copy]')).toBe(stepCopy('normal', 'dns', 'pro'));
    expect(document.querySelector('[data-step]')?.getAttribute('data-step')).toBe('dns');

    view.clickMode('beginner');
    view.click('next');
    view.click('next');
    view.click('next');
    expect(document.querySelector('[data-step]')?.getAttribute('data-step')).toBe('pack');
    expect(regions()).toEqual(['topbar', 'stage', 'packbar']);
    expect(document.querySelector('[data-action="skip"]')).toBeNull();

    view.fill({ Method: 'POST', Path: '/nope', Host: 'example.com' });
    view.click('send');
    expect(document.querySelector('[data-step]')?.getAttribute('data-step')).toBe('pack');
    expect(fieldValue('Method')).toBe('POST');
    expect(text('[data-error]')).toBe(packHint('beginner'));
    expect(document.querySelectorAll('[data-error]')).toHaveLength(1);

    view.clickMode('pro');
    expect(text('[data-error]')).toBe(packHint('pro'));
    expect(document.querySelector('[data-step]')?.getAttribute('data-step')).toBe('pack');

    view.fill({ Method: 'GET', Path: '/', Host: 'example.com' });
    view.click('send');
    expect(document.querySelector('[data-step]')?.getAttribute('data-step')).toBe('response');
    expect(regions()).toEqual(['topbar', 'stage']);
    view.click('next');

    expect(document.querySelector('[data-replay]')).not.toBeNull();
    expect(labels()).toEqual(['通过', '通过', '通过', '通过', '通过']);
    expect(record('unitId')).toBe('http-request-once');
    expect(record('mode')).toBe('pro');
    expect(record('pathType')).toBe('normal');
    expect(record('completed')).toBe('true');
    expect(record('packOnceSuccess')).toBe('false');

    const stored = createProgressStore(localStorage).readResult('http-request-once');
    expect(stored).toEqual({
      unitId: 'http-request-once',
      mode: 'pro',
      pathType: 'normal',
      completed: true,
      packOnceSuccess: false,
    });

    view.clickPath('fault');
    expect(document.querySelector('[data-step]')?.getAttribute('data-step')).toBe('dns');
    expect(text('[data-copy]')).toBe(stepCopy('fault', 'dns', 'pro'));
    expect(document.querySelector('[data-action="skip"]')).not.toBeNull();
  });

  it('故障路径可修复，跳过组包坑后进入响应，回放含已跳过与失败', () => {
    const view = mount('#/units/http-request-once');
    view.clickPath('fault');
    expect(text('[data-copy]')).toBe(stepCopy('fault', 'dns', 'beginner'));
    expect(document.querySelector('[data-action="skip"]')).not.toBeNull();
    expect(document.querySelector('[data-action="retry"]')?.textContent).toBe('重试');

    view.chooseRepair('keep-invalid');
    view.click('retry');
    expect(document.querySelector('[data-step]')?.getAttribute('data-step')).toBe('dns');
    expect(text('[data-error]')).toBe(faultHint('dns', 'beginner'));

    view.chooseRepair('use-example-com');
    view.click('retry');
    view.chooseRepair('connect-443');
    view.click('retry');
    view.chooseRepair('match-cert-name');
    view.click('retry');
    expect(document.querySelector('[data-step]')?.getAttribute('data-step')).toBe('pack');
    expect(regions()).toEqual(['topbar', 'stage', 'packbar']);

    view.click('skip');
    expect(document.querySelector('[data-step]')?.getAttribute('data-step')).toBe('response');
    expect(regions()).toEqual(['topbar', 'stage']);
    expect(text('[data-copy]')).toBe(stepCopy('fault', 'response', 'beginner', 'skippedPack'));
    view.click('next');

    expect(labels()).toEqual(['通过', '通过', '通过', '已跳过', '失败']);
    expect(record('completed')).toBe('true');
    expect(record('pathType')).toBe('fault');
    expect(record('packOnceSuccess')).toBe('false');
  });

  it('中断后回到上次步骤', () => {
    const view = mount('#/units/http-request-once');
    view.click('next');
    expect(document.querySelector('[data-step]')?.getAttribute('data-step')).toBe('tcp');
    mount('#/units/http-request-once');
    expect(document.querySelector('[data-step]')?.getAttribute('data-step')).toBe('tcp');
  });

  it('缺失单元不进入单元页', () => {
    mount('#/units/missing');
    expect(document.querySelector('[data-region="stage"]')).toBeNull();
    expect(document.querySelector('[data-error-code="unit_unavailable"]')).not.toBeNull();
  });
});

function mount(hash: string) {
  let current = hash;
  const store = createProgressStore(localStorage);
  const draw = () => {
    const root = document.querySelector('#app');
    if (!root) throw new Error('missing app root');
    renderApp(root as HTMLElement, {
      course: data,
      store,
      hash: current,
      onHash(next) {
        current = next;
        draw();
      },
    });
  };
  draw();
  return {
    click(action: 'next' | 'send' | 'skip' | 'retry') {
      const button = document.querySelector(`[data-action="${action}"]`);
      if (!button) throw new Error(`找不到 ${action}`);
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    },
    clickMode(mode: 'beginner' | 'pro') {
      document.querySelector(`[data-mode="${mode}"]`)?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    },
    clickPath(path: 'normal' | 'fault') {
      document.querySelector(`[data-path="${path}"]`)?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    },
    fill(values: Record<string, string>) {
      for (const [name, value] of Object.entries(values)) {
        const input = document.querySelector(`[data-field="${name}"]`) as HTMLInputElement | null;
        if (!input) throw new Error(`找不到字段 ${name}`);
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    },
    chooseRepair(id: string) {
      const input = document.querySelector(`[data-repair-id="${id}"]`) as HTMLInputElement | null;
      if (!input) throw new Error(`找不到修复选项 ${id}`);
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    },
  };
}

function regions(): string[] {
  return [...document.querySelectorAll('[data-region]')].map((node) => node.getAttribute('data-region') ?? '');
}

function text(selector: string): string {
  return document.querySelector(selector)?.textContent?.trim() ?? '';
}

function fieldValue(name: string): string {
  return (document.querySelector(`[data-field="${name}"]`) as HTMLInputElement | null)?.value ?? '';
}

function labels(): string[] {
  return [...document.querySelectorAll('[data-replay] [data-label]')].map((node) => node.textContent?.trim() ?? '');
}

function record(field: string): string {
  return document.querySelector(`[data-result-field="${field}"]`)?.getAttribute('data-value') ?? '';
}

function unitContent() {
  const unit = data.units.find((item) => item.unitId === 'http-request-once');
  if (!unit) throw new Error('缺少单元');
  return unit;
}

function stepCopy(
  path: 'normal' | 'fault',
  stepId: string,
  mode: 'beginner' | 'pro',
  variant?: 'skippedPack',
): string {
  const step = unitContent().paths[path].steps.find((item) => item.stepId === stepId);
  if (!step) throw new Error(stepId);
  if (variant === 'skippedPack') return step.whenPrior?.copy?.[mode] ?? '';
  return step.copy[mode];
}

function packHint(mode: 'beginner' | 'pro'): string {
  return unitContent().paths.normal.steps.find((step) => step.stepId === 'pack')?.failHint?.[mode] ?? '';
}

function faultHint(stepId: string, mode: 'beginner' | 'pro'): string {
  return unitContent().paths.fault.steps.find((step) => step.stepId === stepId)?.failHint?.[mode] ?? '';
}
