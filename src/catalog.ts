import type { Course, Unit } from './types';

export interface UnitSummary {
  courseId: string;
  unitId: string;
  title: string;
}

export function listPublished(
  course: Course,
): { ok: true; units: UnitSummary[] } | { ok: false; error: { code: 'no_published_units'; message: string } } {
  const units = course.units
    .filter((unit) => unit.published)
    .map((unit) => ({ courseId: unit.courseId, unitId: unit.unitId, title: unit.title }));
  if (units.length === 0) {
    return { ok: false, error: { code: 'no_published_units', message: '暂无已发布单元' } };
  }
  return { ok: true, units };
}

export function loadUnit(
  course: Course,
  unitId: string,
): { ok: true; unit: Unit } | { ok: false; error: { code: 'unit_unavailable'; message: string } } {
  const unit = course.units.find((item) => item.unitId === unitId && item.published);
  if (!unit) {
    return { ok: false, error: { code: 'unit_unavailable', message: '该单元不可用' } };
  }
  return { ok: true, unit };
}
