export type Mode = 'beginner' | 'pro';
export type PathType = 'normal' | 'fault';
export type StepType = 'advance' | 'pack' | 'repair';
export type StepResult = 'passed' | 'skipped' | 'failed';
export type Phase = 'playing' | 'replay';

export interface Copy {
  beginner: string;
  pro: string;
}

export interface PackRule {
  fields: string[];
  validCombinations: Record<string, string>[];
}

export interface RepairOption {
  id: string;
  label: Copy;
}

export interface RepairConfig {
  successAction: string;
  options: RepairOption[];
}

export interface WhenPrior {
  stepId: string;
  result: StepResult;
  copy?: Copy;
  stepType?: StepType;
  completionResult?: StepResult;
  skippable?: boolean;
  failHint?: Copy;
  repair?: RepairConfig;
}

export interface Step {
  stepId: string;
  title: string;
  stepType: StepType;
  copy: Copy;
  failHint?: Copy;
  packRule?: PackRule;
  skippable?: boolean;
  repair?: RepairConfig;
  completionResult?: StepResult;
  whenPrior?: WhenPrior;
}

export interface Unit {
  courseId: string;
  unitId: string;
  title: string;
  published: boolean;
  paths: Record<PathType, { steps: Step[] }>;
}

export interface Course {
  courseId: string;
  units: Unit[];
}

export interface Progress {
  stepIndex: number;
  mode: Mode;
  pathType: PathType;
  phase: Phase;
  packDraft: Record<string, string>;
  packSendCount: number;
  packOnceSuccess: boolean;
  stepResults: Array<StepResult | null>;
  completed: boolean;
}

export interface LearningResult {
  unitId: string;
  mode: Mode;
  pathType: PathType;
  completed: boolean;
  packOnceSuccess: boolean;
}

export interface AppError {
  code: string;
  message: string;
}
