import { describe, expect, it } from 'vitest';
import { validatePack, type PackRule } from '../src/pack';

const rule: PackRule = {
  fields: ['Method', 'Path', 'Host'],
  validCombinations: [{ Method: 'GET', Path: '/', Host: 'example.com' }],
};

describe('validatePack', () => {
  it('接受规则列出的合法组合', () => {
    expect(validatePack({ Method: 'GET', Path: '/', Host: 'example.com' }, rule)).toEqual({
      ok: true,
    });
  });

  it('去掉字段两端空白后再比对', () => {
    expect(validatePack({ Method: ' GET ', Path: '/', Host: 'example.com' }, rule)).toEqual({
      ok: true,
    });
  });

  it('缺少必填字段时返回 pack_invalid', () => {
    expect(validatePack({ Method: 'GET', Path: '/', Host: '' }, rule)).toEqual({
      ok: false,
      code: 'pack_invalid',
    });
  });

  it('不在合法组合中时返回 pack_invalid', () => {
    expect(validatePack({ Method: 'POST', Path: '/', Host: 'example.com' }, rule)).toEqual({
      ok: false,
      code: 'pack_invalid',
    });
  });

  it('方法大小写与规则不一致时返回 pack_invalid', () => {
    expect(validatePack({ Method: 'get', Path: '/', Host: 'example.com' }, rule)).toEqual({
      ok: false,
      code: 'pack_invalid',
    });
  });
});
