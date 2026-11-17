import { createStore } from "zustand/vanilla";
import type { Confidence } from "../engine/types";
export const LOG_KEY = "rebuild.events.v1";
export interface LogEvent {
  id: string;
  time: string;
  type: "prediction" | "attempt" | "hint" | "completion" | "quiz";
  studentCode: string;
  puzzleId: string;
  correct: boolean | null;
  confidence: Confidence | null;
  misconception: string | null;
  answer?: string;
}
type Input = Omit<LogEvent, "id" | "time">;
export function createLogger(
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">,
) {
  let initial: LogEvent[] = [];
  try {
    const parsed: unknown = JSON.parse(storage.getItem(LOG_KEY) ?? "[]");
    if (Array.isArray(parsed))
      initial = parsed.filter(
        (e): e is LogEvent =>
          !!e &&
          typeof e.id === "string" &&
          typeof e.studentCode === "string" &&
          typeof e.puzzleId === "string" &&
          ["prediction", "attempt", "hint", "completion", "quiz"].includes(
            e.type,
          ) &&
          [null, true, false].includes(e.correct) &&
          [null, 1, 2, 3].includes(e.confidence) &&
          typeof e.time === "string" &&
          (e.misconception === null || typeof e.misconception === "string"),
      );
  } catch {
    /* Damaged or unavailable storage must not stop play. */
  }
  const store = createStore<{ events: LogEvent[]; warning: string | null }>(
    () => ({ events: initial, warning: null }),
  );
  function append(input: Input) {
    const event: LogEvent = {
      ...input,
      id: crypto.randomUUID(),
      time: new Date().toISOString(),
    };
    const events = [...store.getState().events, event];
    let warning = null;
    try {
      storage.setItem(LOG_KEY, JSON.stringify(events));
    } catch {
      warning =
        "Progress could not be saved on this laptop. Keep this page open.";
    }
    store.setState({ events, warning });
    return event;
  }
  return {
    store,
    append,
    quiz: (input: Omit<Input, "type">) => append({ ...input, type: "quiz" }),
    reset: () => {
      try {
        storage.removeItem(LOG_KEY);
        store.setState({ events: [], warning: null });
      } catch {
        store.setState({ warning: "Saved data could not be cleared." });
      }
    },
  };
}
export type Logger = ReturnType<typeof createLogger>;
