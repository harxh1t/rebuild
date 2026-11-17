import type { Group } from "three";
export type Confidence = 1 | 2 | 3;
export interface Choice {
  id: string;
  label: string;
  correct: boolean;
  misconception: string | null;
}
export interface CheckResult {
  correct: boolean;
  cause?: string;
  target?: string;
  misconception?: string;
}
export interface PuzzleScene {
  root: Group;
  select: (id: string) => void;
  flag: (id?: string) => void;
  dispose: () => void;
}
export interface PuzzleDefinition {
  id: string;
  title: string;
  intro: readonly string[];
  prediction?: { question: string; choices: readonly Choice[] };
  setup: () => PuzzleScene;
  targets: readonly { id: string; label: string }[];
  check: (selection: string | null) => CheckResult;
  errors: Record<string, string>;
  hints: readonly string[];
  card: { belief: string; why: string; idea: string };
}
export interface ModuleDefinition {
  id: string;
  title: string;
  puzzles: readonly PuzzleDefinition[];
}
