import { describe, expect, it } from 'vitest';
import { listPublished, loadUnit } from '../src/catalog';
import type { Course } from '../src/types';
import { sampleUnit } from './helpers';

function course(): Course {
  const published = sampleUnit();
  return {
    courseId: 'http',
    units: [
      published,
      {
        ...published,
        unitId: 'draft-unit',
        title: '未发布草稿',
        published: false,
      },
    ],
  };
}

describe('catalog', () => {
  it('目录只列出已发布单元', () => {
    const listed = listPublished(course());
    expect(listed.ok).toBe(true);
    if (!listed.ok) return;
    expect(listed.units.map((unit) => unit.unitId)).toEqual(['http-request-once']);
    expect(listed.units[0]?.title).toBe('一次 HTTP 请求');
  });

  it('没有已发布单元时返回 no_published_units', () => {
    const listed = listPublished({ courseId: 'http', units: [] });
    expect(listed).toEqual({
      ok: false,
      error: { code: 'no_published_units', message: '暂无已发布单元' },
    });
  });

  it('未发布或缺失的单元不可进入', () => {
    const data = course();
    expect(loadUnit(data, 'draft-unit')).toEqual({
      ok: false,
      error: { code: 'unit_unavailable', message: '该单元不可用' },
    });
    expect(loadUnit(data, 'missing')).toEqual({
      ok: false,
      error: { code: 'unit_unavailable', message: '该单元不可用' },
    });
  });

  it('已发布单元可以加载', () => {
    const loaded = loadUnit(course(), 'http-request-once');
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.unit.paths.normal.steps.map((step) => step.stepId)).toEqual([
      'dns',
      'tcp',
      'tls',
      'pack',
      'response',
    ]);
  });
});
