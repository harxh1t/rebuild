import { describe, it, expect } from "vitest";
import { createLogger } from "../src/data/log";
import { createPuzzle } from "../src/engine/puzzle";
import { sample } from "../src/modules/water/sample";
function fixture(prediction = true) {
  const logger = createLogger({
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  });
  const actor = createPuzzle(
    { ...sample, prediction: prediction ? sample.prediction : undefined },
    logger,
    "S00",
  );
  actor.start();
  return { actor, logger };
}
describe("puzzle loop", () => {
  it("requires prediction and confidence before attempting, and retries without losing confidence", () => {
    const { actor, logger } = fixture();
    actor.send({ type: "CHECK" });
    expect(logger.store.getState().events).toHaveLength(0);
    actor.send({ type: "START" });
    actor.send({ type: "PREDICT", id: "invalid" });
    expect(actor.getSnapshot().value).toBe("predict");
    actor.send({ type: "PREDICT", id: "left" });
    actor.send({ type: "CONFIDENCE", value: 3 });
    actor.send({ type: "SELECT", id: "left" });
    actor.send({ type: "CHECK" });
    expect(actor.getSnapshot().value).toBe("doing");
    expect(actor.getSnapshot().context.result?.target).toBe("left");
    actor.send({ type: "HINT" });
    actor.send({ type: "SELECT", id: "right" });
    actor.send({ type: "CHECK" });
    expect(actor.getSnapshot().value).toBe("card");
    actor.send({ type: "CHECK" });
    expect(logger.store.getState().events.map((e) => e.type)).toEqual([
      "prediction",
      "attempt",
      "hint",
      "attempt",
      "completion",
    ]);
    expect(
      logger.store.getState().events.every((e) => e.confidence === 3),
    ).toBe(true);
    actor.send({ type: "CONTINUE" });
    expect(actor.getSnapshot().status).toBe("done");
  });
  it("supports an optional prediction and a helpful empty-selection failure", () => {
    const { actor, logger } = fixture(false);
    actor.send({ type: "START" });
    expect(actor.getSnapshot().value).toBe("doing");
    actor.send({ type: "CHECK" });
    expect(actor.getSnapshot().context.result?.cause).toBe("empty");
    expect(logger.store.getState().events[0].confidence).toBeNull();
  });
});
