import { describe, it, expect } from "vitest";
import {
  checkFilter,
  placeLayer,
  MATERIALS,
  settleProgress,
  heatStep,
} from "../src/modules/water/logic";
import { answerRioTyped, CONTENT, QUIZ } from "../src/modules/water/content";
describe("water treatment model", () => {
  it("accepts only the cotton-first approved stack", () => {
    expect(checkFilter(MATERIALS).outcome).toBe("clear");
  });
  it.each([
    [["fine", "charcoal", "cotton", "coarse", "pebbles"], "sandy", 0],
    [["cotton", "charcoal", "pebbles", "coarse", "fine"], "clogged", 4],
    [["cotton", null, "fine", "coarse", "pebbles"], "cloudy", 1],
    [["cotton", "charcoal", null, "coarse", "pebbles"], "cloudy", 2],
  ] as const)("explains mixed-up order %j", (layers, outcome, slot) => {
    expect(checkFilter(layers)).toMatchObject({ outcome, slot });
  });
  it("moves a material instead of duplicating it", () => {
    const result = placeLayer(MATERIALS, "cotton", 3);
    expect(result).toEqual(["coarse", "charcoal", "fine", "cotton", "pebbles"]);
    expect(new Set(result).size).toBe(5);
  });
  it("pauses settling when released", () => {
    expect(settleProgress(0.4, false, 2)).toBe(0.4);
    expect(settleProgress(0.4, true, 2)).toBe(0.9);
    expect(settleProgress(0.9, true, 2)).toBe(1);
  });
  it("cannot heat without a fire and cools without fanning", () => {
    expect(
      heatStep(
        { temperature: 25, boiledSeconds: 0, finished: false },
        true,
        false,
        1,
      ).temperature,
    ).toBe(25);
    expect(
      heatStep(
        { temperature: 80, boiledSeconds: 0, finished: false },
        false,
        true,
        1,
      ).temperature,
    ).toBeLessThan(80);
  });
  it("requires sustained boiling and does not finish twice", () => {
    const s = { temperature: 100, boiledSeconds: 0, finished: false };
    expect(heatStep(s, true, true, 1).finished).toBe(false);
    const done = heatStep(s, true, true, 2);
    expect(done.finished).toBe(true);
    expect(heatStep(done, false, false, 10)).toEqual(done);
  });
  it("keeps offline Rio hints short and intro text to two lines", () => {
    Object.values(CONTENT).forEach((c) => {
      expect(c.intro.length).toBeLessThanOrEqual(2);
      expect(c.chips).toHaveLength(3);
      c.chips.forEach((chip) =>
        expect(chip.answer.split(/\s+/).length).toBeLessThanOrEqual(25),
      );
    });
  });
  it("maps every quiz answer and keeps exactly one transfer question", () => {
    expect(QUIZ).toHaveLength(4);
    expect(QUIZ.filter((question) => question.transfer)).toHaveLength(1);
    QUIZ.forEach((question) => {
      expect(question.options.filter((option) => option.correct)).toHaveLength(
        1,
      );
      question.options
        .filter((option) => !option.correct)
        .forEach((option) => expect(option.misconception).toBeTruthy());
    });
  });
  it("provides the hidden typed-question fallback without a network", () => {
    expect(answerRioTyped("Why cotton?", "filter")).toContain("soft net");
  });
});
