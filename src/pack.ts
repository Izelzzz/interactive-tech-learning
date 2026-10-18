import type { PackRule } from './types';

export type { PackRule };

export function validatePack(
  draft: Record<string, string>,
  rule: PackRule,
): { ok: true } | { ok: false; code: 'pack_invalid' } {
  const normalized: Record<string, string> = {};
  for (const field of rule.fields) {
    const value = (draft[field] ?? '').trim();
    if (!value) return { ok: false, code: 'pack_invalid' };
    normalized[field] = value;
  }
  const matched = rule.validCombinations.some((combo) =>
    rule.fields.every((field) => combo[field] === normalized[field]),
  );
  return matched ? { ok: true } : { ok: false, code: 'pack_invalid' };
}
