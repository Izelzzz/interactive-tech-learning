import { describe, expect, it } from 'vitest';
import {
  availableActions,
  createSession,
  currentCopy,
  errorMessage,
  next,
  replayRows,
  resultLabel,
  retryRepair,
  selectPath,
  sendPack,
  setMode,
  skip,
  visibleRegions,
} from '../src/runtime';
import { sampleUnit } from './helpers';

const unit = sampleUnit();

function playing(pathType: 'normal' | 'fault' = 'normal') {
  return selectPath(createSession(unit), unit, pathType);
}

describe('正常路径', () => {
  it('按 DNS → TCP → TLS → 组包 → 响应推进', () => {
    let session = playing('normal');
    expect(currentStepId(session)).toBe('dns');
    session = next(session, unit);
    expect(currentStepId(session)).toBe('tcp');
    session = next(session, unit);
    expect(currentStepId(session)).toBe('tls');
    session = next(session, unit);
    expect(currentStepId(session)).toBe('pack');
    expect(visibleRegions(session, unit)).toEqual(['topbar', 'stage', 'packbar']);
  });

  it('非法组包留在组包步，保留已填项，并给出当前模式的一行原因', () => {
    let session = atPack('normal');
    session = { ...session, packDraft: { Method: 'POST', Path: '/nope', Host: 'example.com' } };
    session = sendPack(session, unit);
    expect(currentStepId(session)).toBe('pack');
    expect(session.packDraft).toEqual({ Method: 'POST', Path: '/nope', Host: 'example.com' });
    expect(session.error?.code).toBe('pack_invalid');
    expect(errorMessage(session, unit)).toBe('这封信还寄不出去');
    expect(session.stepResults[3]).toBe('failed');
    expect(session.packOnceSuccess).toBe(false);
  });

  it('修正组包后进入响应，且首次失败后再成功则 packOnceSuccess 为 false', () => {
    let session = atPack('normal');
    session = { ...session, packDraft: { Method: '', Path: '', Host: '' } };
    session = sendPack(session, unit);
    session = { ...session, packDraft: { Method: 'GET', Path: '/', Host: 'example.com' } };
    session = sendPack(session, unit);
    expect(currentStepId(session)).toBe('response');
    expect(session.packOnceSuccess).toBe(false);
    expect(session.stepResults[3]).toBe('passed');
    expect(visibleRegions(session, unit)).toEqual(['topbar', 'stage']);
  });

  it('首次发送即通过时 packOnceSuccess 为 true', () => {
    let session = atPack('normal');
    session = { ...session, packDraft: { Method: 'GET', Path: '/', Host: 'example.com' } };
    session = sendPack(session, unit);
    expect(session.packOnceSuccess).toBe(true);
    expect(currentStepId(session)).toBe('response');
  });

  it('正常路径跳过不可用，组包步保持不动', () => {
    const session = skip(atPack('normal'), unit);
    expect(session.error?.code).toBe('skip_unavailable');
    expect(currentStepId(session)).toBe('pack');
    expect(errorMessage(session, unit)).toBe('正常路径按当前步规则前进');
  });

  it('走完响应后进入回放并记完课', () => {
    let session = atPack('normal');
    session = { ...session, packDraft: { Method: 'GET', Path: '/', Host: 'example.com' } };
    session = sendPack(session, unit);
    session = next(session, unit);
    expect(session.phase).toBe('replay');
    expect(session.completed).toBe(true);
    expect(replayRows(session, unit)?.map((row) => row.label)).toEqual([
      '通过',
      '通过',
      '通过',
      '通过',
      '通过',
    ]);
    expect(visibleRegions(session, unit)).toEqual(['topbar', 'stage']);
  });
});

describe('模式', () => {
  it('切换模式后文案和失败提示变化，步骤索引保持不变', () => {
    let session = atPack('normal');
    session = { ...session, packDraft: { Method: 'POST', Path: '/', Host: 'example.com' } };
    session = sendPack(session, unit);
    const index = session.stepIndex;
    expect(currentCopy(session, unit)).toBe('小白组包');
    expect(errorMessage(session, unit)).toBe('这封信还寄不出去');
    session = setMode(session, 'pro');
    expect(session.stepIndex).toBe(index);
    expect(currentCopy(session, unit)).toBe('专业组包');
    expect(errorMessage(session, unit)).toBe('Method、Path 或 Host 不合法');
  });
});

describe('故障路径', () => {
  it('修复成功后前进，修错则留在本步并记失败', () => {
    let session = playing('fault');
    expect(availableActions(session, unit)).toEqual(['retry', 'skip']);
    session = retryRepair(session, unit, 'keep-invalid');
    expect(currentStepId(session)).toBe('dns');
    expect(session.error?.code).toBe('repair_incomplete');
    expect(session.stepResults[0]).toBe('failed');
    expect(errorMessage(session, unit)).toBe('还是那个找不到的名字');
    session = retryRepair(session, unit, 'use-example-com');
    expect(currentStepId(session)).toBe('tcp');
    expect(session.stepResults[0]).toBe('passed');
    expect(session.error).toBeNull();
  });

  it('跳过某一坑后该步记已跳过并进入下一步', () => {
    const session = skip(playing('fault'), unit);
    expect(session.notice?.code).toBe('step_skipped');
    expect(session.stepResults[0]).toBe('skipped');
    expect(currentStepId(session)).toBe('tcp');
    expect(resultLabel('skipped')).toBe('已跳过');
  });

  it('跳过组包坑后进入响应', () => {
    let session = atPack('fault');
    session = skip(session, unit);
    expect(currentStepId(session)).toBe('response');
    expect(session.stepResults[3]).toBe('skipped');
    expect(session.packOnceSuccess).toBe(false);
    expect(visibleRegions(session, unit)).toEqual(['topbar', 'stage']);
    expect(availableActions(session, unit)).toEqual(['next']);
    expect(currentCopy(session, unit)).toBe('信没有寄出，所以没有正常回信。');
  });

  it('组包已跳过时，确认响应记失败并进入回放，回放含通过、已跳过、失败', () => {
    let session = playing('fault');
    session = retryRepair(session, unit, 'use-example-com');
    session = retryRepair(session, unit, 'connect-443');
    session = retryRepair(session, unit, 'match-cert-name');
    session = skip(session, unit);
    session = next(session, unit);
    expect(session.phase).toBe('replay');
    expect(session.completed).toBe(true);
    expect(replayRows(session, unit)?.map((row) => row.label)).toEqual([
      '通过',
      '通过',
      '通过',
      '已跳过',
      '失败',
    ]);
  });

  it('故障组包校验通过后仍进入可修复的响应步', () => {
    let session = atPack('fault');
    session = { ...session, packDraft: { Method: 'GET', Path: '/', Host: 'example.com' } };
    session = sendPack(session, unit);
    expect(currentStepId(session)).toBe('response');
    expect(availableActions(session, unit)).toEqual(['retry', 'skip']);
    expect(currentCopy(session, unit)).toBe('网关暂时没拿到页面');
    session = retryRepair(session, unit, 'retry-upstream');
    expect(session.phase).toBe('replay');
    expect(session.completed).toBe(true);
    expect(session.stepResults[4]).toBe('passed');
  });
});

describe('主块', () => {
  it('非组包步只有顶栏和舞台', () => {
    expect(visibleRegions(playing('normal'), unit)).toEqual(['topbar', 'stage']);
  });
});

function currentStepId(session: ReturnType<typeof playing>) {
  return unit.paths[session.pathType].steps[session.stepIndex]?.stepId;
}

function atPack(pathType: 'normal' | 'fault') {
  let session = playing(pathType);
  if (pathType === 'normal') {
    session = next(session, unit);
    session = next(session, unit);
    session = next(session, unit);
    return session;
  }
  session = retryRepair(session, unit, 'use-example-com');
  session = retryRepair(session, unit, 'connect-443');
  session = retryRepair(session, unit, 'match-cert-name');
  return session;
}
