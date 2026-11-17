import { describe, it, expect } from "vitest";
import { createLogger, LOG_KEY } from "../src/data/log";
function storage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => {
      data.set(k, v);
    },
    removeItem: (k: string) => {
      data.delete(k);
    },
  };
}
const input = {
  studentCode: "S00",
  puzzleId: "sample",
  correct: false,
  confidence: 3 as const,
  misconception: "sample_color_mixup",
  answer: "left",
};
describe("persistent learning log", () => {
  it("retains confidence and misconception after a new session", () => {
    const s = storage();
    const l = createLogger(s);
    l.append({ ...input, type: "prediction" });
    l.quiz(input);
    expect(createLogger(s).store.getState().events).toMatchObject([
      { ...input, type: "prediction" },
      { ...input, type: "quiz" },
    ]);
  });
  it("recovers from malformed data and resets only its own key", () => {
    const s = storage();
    s.setItem(LOG_KEY, "broken");
    s.setItem("other", "keep");
    const l = createLogger(s);
    expect(l.store.getState().events).toEqual([]);
    l.append({ ...input, type: "attempt" });
    l.reset();
    expect(s.getItem(LOG_KEY)).toBeNull();
    expect(s.getItem("other")).toBe("keep");
  });
  it("keeps an in-memory log with a visible warning when storage is full", () => {
    const l = createLogger({
      getItem: () => null,
      setItem: () => {
        throw Error("full");
      },
      removeItem: () => {},
    });
    l.append({ ...input, type: "hint" });
    expect(l.store.getState().events).toHaveLength(1);
    expect(l.store.getState().warning).toContain("could not be saved");
  });
});
