import { setup, assign, createActor } from "xstate";
import type { Confidence, PuzzleDefinition, CheckResult } from "./types";
import type { Logger } from "../data/log";
type Context = {
  prediction: string | null;
  confidence: Confidence | null;
  selection: string | null;
  result: CheckResult | null;
  hint: number;
};
type Event =
  | { type: "EDIT" }
  | { type: "START" }
  | { type: "PREDICT"; id: string }
  | { type: "CONFIDENCE"; value: Confidence }
  | { type: "SELECT"; id: string }
  | { type: "CHECK" }
  | { type: "HINT" }
  | { type: "CONTINUE" };
export function createPuzzle(
  puzzle: PuzzleDefinition,
  logger: Logger,
  studentCode: string,
  runId?: string,
) {
  const record = (
    type: "prediction" | "attempt" | "hint" | "completion",
    c: Context,
    correct: boolean | null,
    misconception: string | null,
    answer?: string,
  ) =>
    logger.append({
      type,
      studentCode,
      puzzleId: puzzle.id,
      correct,
      confidence: c.confidence,
      misconception,
      answer,
      runId,
    });
  return createActor(
    setup({
      types: { context: {} as Context, events: {} as Event },
      guards: {
        hasPrediction: () => !!puzzle.prediction,
        validPrediction: ({ event }) =>
          event.type === "PREDICT" &&
          !!puzzle.prediction?.choices.some((c) => c.id === event.id),
        validConfidence: ({ event }) =>
          event.type === "CONFIDENCE" && [1, 2, 3].includes(event.value),
        validSelection: ({ event }) =>
          event.type === "SELECT" &&
          puzzle.targets.some((t) => t.id === event.id),
        correct: ({ context }) => context.result?.correct === true,
      },
      actions: {
        predict: assign({
          prediction: ({ event }) =>
            event.type === "PREDICT" ? event.id : null,
        }),
        confidence: assign({
          confidence: ({ event }) =>
            event.type === "CONFIDENCE" ? event.value : null,
        }),
        logPrediction: ({ context }) => {
          const choice = puzzle.prediction?.choices.find(
            (c) => c.id === context.prediction,
          );
          if (choice)
            record(
              "prediction",
              context,
              choice.correct,
              choice.misconception,
              choice.id,
            );
        },
        select: assign({
          selection: ({ event }) => (event.type === "SELECT" ? event.id : null),
          result: () => null,
        }),
        check: assign({
          result: ({ context }) => puzzle.check(context.selection),
        }),
        logAttempt: ({ context }) =>
          record(
            "attempt",
            context,
            context.result!.correct,
            context.result?.misconception ?? null,
            context.selection ?? undefined,
          ),
        logCompletion: ({ context }) =>
          record("completion", context, true, null),
        hint: ({ context }) =>
          record(
            "hint",
            context,
            null,
            null,
            puzzle.hints[Math.min(context.hint, puzzle.hints.length - 1)],
          ),
        nextHint: assign({ hint: ({ context }) => context.hint + 1 }),
      },
    }).createMachine({
      id: puzzle.id,
      initial: "intro",
      context: {
        prediction: null,
        confidence: null,
        selection: null,
        result: null,
        hint: 0,
      },
      states: {
        intro: {
          on: {
            START: [
              { guard: "hasPrediction", target: "predict" },
              { target: "doing" },
            ],
          },
        },
        predict: {
          on: {
            PREDICT: {
              guard: "validPrediction",
              actions: "predict",
              target: "confidence",
            },
          },
        },
        confidence: {
          on: {
            CONFIDENCE: {
              guard: "validConfidence",
              actions: ["confidence", "logPrediction"],
              target: "doing",
            },
          },
        },
        doing: {
          on: {
            EDIT: { actions: assign({ result: () => null }) },
            SELECT: { guard: "validSelection", actions: "select" },
            CHECK: { actions: ["check", "logAttempt"], target: "checking" },
            HINT: { actions: ["hint", "nextHint"] },
          },
        },
        checking: {
          always: [
            { guard: "correct", target: "card", actions: "logCompletion" },
            { target: "doing" },
          ],
        },
        card: { on: { CONTINUE: "done" } },
        done: { type: "final" },
      },
    }),
  );
}
