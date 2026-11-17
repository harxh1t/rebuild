export interface WaterProgress {
  runId: string;
  step: string;
  cards: string[];
  complete: boolean;
  quizDone: boolean;
}
export const progressKey = (student: string) => `rebuild.water.v1.${student}`;
export function newProgress(): WaterProgress {
  return {
    runId: crypto.randomUUID(),
    step: "welcome",
    cards: [],
    complete: false,
    quizDone: false,
  };
}
export function loadProgress(storage: Storage, student: string): WaterProgress {
  try {
    const p = JSON.parse(storage.getItem(progressKey(student)) ?? "null");
    if (
      p &&
      typeof p.runId === "string" &&
      typeof p.step === "string" &&
      Array.isArray(p.cards) &&
      p.cards.every((s: unknown) => typeof s === "string")
    )
      return { ...newProgress(), ...p };
  } catch {
    /* Fall back to a fresh level. */
  }
  return newProgress();
}
