import { validatePack } from './pack';
import type {
  AppError,
  LearningResult,
  Mode,
  PathType,
  Phase,
  Progress,
  Step,
  StepResult,
  StepType,
  Unit,
} from './types';

export interface Session {
  unitId: string;
  mode: Mode;
  pathType: PathType;
  stepIndex: number;
  phase: Phase;
  packDraft: Record<string, string>;
  packSendCount: number;
  packOnceSuccess: boolean;
  stepResults: Array<StepResult | null>;
  completed: boolean;
  error: AppError | null;
  notice: AppError | null;
}

export interface ReplayRow {
  stepId: string;
  title: string;
  result: StepResult;
  label: '通过' | '已跳过' | '失败';
}

const SKIP_UNAVAILABLE = '正常路径按当前步规则前进';
const STEP_SKIPPED = '该步记为已跳过并进入下一步';

export function createSession(unit: Unit, progress?: Partial<Progress> | null): Session {
  const pathType = progress?.pathType ?? 'normal';
  const steps = unit.paths[pathType].steps;
  return {
    unitId: unit.unitId,
    mode: progress?.mode ?? 'beginner',
    pathType,
    stepIndex: progress?.stepIndex ?? 0,
    phase: progress?.phase ?? 'playing',
    packDraft: emptyDraft(progress?.packDraft),
    packSendCount: progress?.packSendCount ?? 0,
    packOnceSuccess: progress?.packOnceSuccess ?? false,
    stepResults: progress?.stepResults ? progress.stepResults.slice() : steps.map(() => null),
    completed: progress?.completed ?? false,
    error: null,
    notice: null,
  };
}

export function selectPath(session: Session, unit: Unit, pathType: PathType): Session {
  const steps = unit.paths[pathType].steps;
  return {
    ...session,
    pathType,
    stepIndex: 0,
    phase: 'playing',
    completed: false,
    packDraft: emptyDraft(),
    packSendCount: 0,
    packOnceSuccess: false,
    stepResults: steps.map(() => null),
    error: null,
    notice: null,
  };
}

export function setMode(session: Session, mode: Mode): Session {
  return { ...session, mode };
}

export function updateDraft(session: Session, field: string, value: string): Session {
  return { ...session, packDraft: { ...session.packDraft, [field]: value } };
}

export function next(session: Session, unit: Unit): Session {
  const step = effectiveStep(session, unit);
  if (session.phase === 'replay' || step.stepType !== 'advance') return session;
  return settle(session, unit, step.completionResult ?? 'passed');
}

export function sendPack(session: Session, unit: Unit): Session {
  const step = effectiveStep(session, unit);
  if (session.phase === 'replay' || step.stepType !== 'pack' || !step.packRule) return session;
  const firstSend = session.packSendCount === 0;
  const packSendCount = session.packSendCount + 1;
  const verdict = validatePack(session.packDraft, step.packRule);
  if (!verdict.ok) {
    return failHere(session, 'failed', {
      code: 'pack_invalid',
      message: step.failHint?.[session.mode] ?? '',
    }, { packSendCount, packOnceSuccess: firstSend ? false : session.packOnceSuccess });
  }
  return settle(session, unit, 'passed', {
    packSendCount,
    packOnceSuccess: firstSend ? true : session.packOnceSuccess,
  });
}

export function retryRepair(session: Session, unit: Unit, actionId: string): Session {
  const step = effectiveStep(session, unit);
  if (session.phase === 'replay' || step.stepType !== 'repair' || !step.repair) return session;
  if (actionId !== step.repair.successAction) {
    return failHere(session, 'failed', {
      code: 'repair_incomplete',
      message: step.failHint?.[session.mode] ?? '',
    });
  }
  return settle(session, unit, 'passed');
}

export function skip(session: Session, unit: Unit): Session {
  const step = effectiveStep(session, unit);
  if (session.phase === 'replay') return session;
  if (session.pathType !== 'fault' || !step.skippable) {
    return {
      ...session,
      notice: null,
      error: { code: 'skip_unavailable', message: SKIP_UNAVAILABLE },
    };
  }
  return settle(session, unit, 'skipped', {
    notice: { code: 'step_skipped', message: STEP_SKIPPED },
  });
}

export function effectiveStep(session: Session, unit: Unit): Step {
  const steps = stepsOf(session, unit);
  const step = steps[session.stepIndex] ?? steps[0];
  const when = step?.whenPrior;
  if (!step || !when) return step;
  const priorIndex = steps.findIndex((item) => item.stepId === when.stepId);
  if (priorIndex < 0 || session.stepResults[priorIndex] !== when.result) return step;
  return {
    ...step,
    copy: when.copy ?? step.copy,
    stepType: when.stepType ?? step.stepType,
    completionResult: when.completionResult ?? step.completionResult,
    skippable: when.skippable ?? step.skippable,
    failHint: when.failHint ?? step.failHint,
    repair: when.repair ?? step.repair,
  };
}

export function currentCopy(session: Session, unit: Unit): string {
  return effectiveStep(session, unit).copy[session.mode];
}

export function errorMessage(session: Session, unit: Unit): string | null {
  if (!session.error) return null;
  if (session.error.code === 'pack_invalid' || session.error.code === 'repair_incomplete') {
    const hint = effectiveStep(session, unit).failHint?.[session.mode];
    if (hint) return hint;
  }
  return session.error.message;
}

export function availableActions(session: Session, unit: Unit): Array<'next' | 'retry' | 'skip' | 'send'> {
  if (session.phase === 'replay') return [];
  const step = effectiveStep(session, unit);
  if (step.stepType === 'pack') return step.skippable ? ['send', 'skip'] : ['send'];
  if (step.stepType === 'repair') return step.skippable ? ['retry', 'skip'] : ['retry'];
  return ['next'];
}

export function visibleRegions(
  session: Session,
  unit: Unit,
): Array<'topbar' | 'stage' | 'packbar'> {
  if (session.phase === 'replay') return ['topbar', 'stage'];
  if (effectiveStep(session, unit).stepType === 'pack') return ['topbar', 'stage', 'packbar'];
  return ['topbar', 'stage'];
}

export function resultLabel(result: StepResult): '通过' | '已跳过' | '失败' {
  if (result === 'passed') return '通过';
  if (result === 'skipped') return '已跳过';
  return '失败';
}

export function replayRows(session: Session, unit: Unit): ReplayRow[] | null {
  if (session.phase !== 'replay') return null;
  return stepsOf(session, unit).map((step, index) => {
    const result = session.stepResults[index] ?? 'failed';
    return { stepId: step.stepId, title: step.title, result, label: resultLabel(result) };
  });
}

export function learningResult(session: Session): LearningResult {
  return {
    unitId: session.unitId,
    mode: session.mode,
    pathType: session.pathType,
    completed: session.completed,
    packOnceSuccess: session.packOnceSuccess,
  };
}

export function progressFromSession(session: Session): Progress {
  return {
    stepIndex: session.stepIndex,
    mode: session.mode,
    pathType: session.pathType,
    phase: session.phase,
    packDraft: { ...session.packDraft },
    packSendCount: session.packSendCount,
    packOnceSuccess: session.packOnceSuccess,
    stepResults: session.stepResults.slice(),
    completed: session.completed,
  };
}

export function currentStepType(session: Session, unit: Unit): StepType {
  return effectiveStep(session, unit).stepType;
}

function settle(session: Session, unit: Unit, result: StepResult, extra: Partial<Session> = {}): Session {
  const steps = stepsOf(session, unit);
  const stepResults = session.stepResults.slice();
  while (stepResults.length < steps.length) stepResults.push(null);
  stepResults[session.stepIndex] = result;
  const last = session.stepIndex >= steps.length - 1;
  return {
    ...session,
    ...extra,
    stepResults,
    error: null,
    notice: extra.notice ?? null,
    stepIndex: last ? session.stepIndex : session.stepIndex + 1,
    phase: last ? 'replay' : 'playing',
    completed: last ? true : session.completed,
  };
}

function failHere(
  session: Session,
  result: StepResult,
  error: AppError,
  extra: Partial<Session> = {},
): Session {
  const stepResults = session.stepResults.slice();
  stepResults[session.stepIndex] = result;
  return { ...session, ...extra, stepResults, error, notice: null };
}

function stepsOf(session: Session, unit: Unit): Step[] {
  return unit.paths[session.pathType].steps;
}

function emptyDraft(draft?: Record<string, string>): Record<string, string> {
  return { Method: '', Path: '', Host: '', ...draft };
}
