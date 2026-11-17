import { test, expect, type Page } from "@playwright/test";
function errors(page: Page) {
  const found: string[] = [];
  page.on("pageerror", (e) => found.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") found.push(m.text());
  });
  return found;
}
async function predict(page: Page, answer: string) {
  await page
    .getByRole("button", { name: "Make a prediction", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Ask Rio", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: answer, exact: true }).click();
  await page.getByRole("button", { name: "😄 Very sure", exact: true }).click();
}
async function hold(page: Page, name: string, until: string) {
  const b = page.getByRole("button", { name, exact: true });
  await b.scrollIntoViewIfNeeded();
  const r = (await b.boundingBox())!;
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
  await page.mouse.down();
  await expect(page.getByText(until, { exact: true })).toBeVisible({
    timeout: 45000,
  });
  await page.mouse.up();
}
async function stack(page: Page, materials: string[]) {
  for (let i = 0; i < materials.length; i++) {
    await page.getByRole("button", { name: materials[i], exact: true }).click();
    await page.locator(`[data-slot="${i}"]`).click();
  }
}
test("standalone plant loads without login or outer village", async ({
  page,
}) => {
  const found = errors(page);
  await page.goto("/?demo&debug");
  await expect(page.getByRole("heading", { name: /Every drop/ })).toBeVisible();
  await expect(page.getByText("Student code", { exact: true })).toHaveCount(0);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "docs/screens/water-house.png" });
  await expect(page.locator("output")).toContainText("triangles");
  expect(
    Number(await page.locator("output").getAttribute("data-calls")),
  ).toBeLessThan(200);
  expect(found).toEqual([]);
});
test("all six experiments: wrong predictions, filter retry, boil failure and delivery", async ({
  page,
}) => {
  test.setTimeout(180000);
  const found = errors(page);
  await page.goto("/?demo&reset");
  await page.getByRole("button", { name: "Begin Clean Water" }).click();
  await page
    .getByRole("button", { name: "Let’s collect", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Collect water", exact: true })
    .click();
  await expect(page.getByText("A PAGE FOR YOUR NOTEBOOK")).toBeVisible();
  await page.getByRole("button", { name: "Keep discovering" }).click();
  await predict(page, "The mud floats up");
  const wait = page.getByRole("button", { name: "Hold Wait", exact: true });
  await wait.focus();
  await page.keyboard.down("Space");
  await page.waitForTimeout(700);
  await page.keyboard.up("Space");
  const before = await page
    .locator("progress")
    .evaluate((e: HTMLProgressElement) => e.value);
  await page.waitForTimeout(300);
  expect(
    await page
      .locator("progress")
      .evaluate((e: HTMLProgressElement) => e.value),
  ).toBe(before);
  await hold(page, "Hold Wait", "A PAGE FOR YOUR NOTEBOOK");
  await expect(page.getByText("Interesting surprise!")).toBeVisible();
  await page.screenshot({ path: "docs/screens/settle.png" });
  await page.getByRole("button", { name: "Keep discovering" }).click();
  await page.getByRole("button", { name: "Let’s try", exact: true }).click();
  await page.getByRole("button", { name: "Ask Rio", exact: true }).click();
  await page
    .getByRole("button", { name: "Why use cotton?", exact: true })
    .click();
  await expect(page.getByText(/soft net/)).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await stack(page, [
    "Cotton",
    "Activated charcoal",
    "Pebbles",
    "Coarse sand",
    "Fine sand",
  ]);
  await page.getByRole("button", { name: "Pour water", exact: true }).click();
  await expect(page.getByText(/⚑ In this model, fine sand/)).toBeVisible({
    timeout: 15000,
  });
  await page.screenshot({ path: "docs/screens/filter-retry.png" });
  await stack(page, [
    "Cotton",
    "Activated charcoal",
    "Fine sand",
    "Coarse sand",
    "Pebbles",
  ]);
  await page.getByRole("button", { name: "Pour water", exact: true }).click();
  await expect(page.getByText("A PAGE FOR YOUR NOTEBOOK")).toBeVisible({
    timeout: 25000,
  });
  await page.screenshot({ path: "docs/screens/filter.png" });
  await page.getByRole("button", { name: "Keep discovering" }).click();
  await predict(page, "Yes, it looks clean");
  await expect(page.getByText("Interesting surprise!")).toBeVisible({
    timeout: 10000,
  });
  await page.screenshot({ path: "docs/screens/safe.png" });
  await page.getByRole("button", { name: "Keep discovering" }).click();
  await predict(page, "Yes, filtering removes all germs");
  await page.getByRole("button", { name: "Strike flint", exact: true }).click();
  await expect(page.getByText(/⚑ The hearth is empty/)).toBeVisible();
  await page.getByRole("button", { name: "Add wood", exact: true }).click();
  await page.getByRole("button", { name: "Strike flint", exact: true }).click();
  await hold(page, "Hold Fan", "A PAGE FOR YOUR NOTEBOOK");
  await page.screenshot({ path: "docs/screens/boil.png" });
  await page
    .getByRole("button", { name: "Let’s deliver", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /A glass of water/ }),
  ).toBeVisible({
    timeout: 25000,
  });
  const quizAnswers = [
    "Drink it because it is clear",
    "It removes much of the visible dirt",
    "Cotton",
    "No—check and treat it first",
  ];
  for (let i = 0; i < quizAnswers.length; i++) {
    await page
      .getByRole("button", { name: quizAnswers[i], exact: true })
      .click();
    await page
      .getByRole("button", {
        name: i === 0 ? "😄 Very sure" : "🙂 A bit sure",
        exact: true,
      })
      .click();
    await page
      .getByRole("button", {
        name:
          i === quizAnswers.length - 1
            ? "See where this helps"
            : "Next question",
        exact: true,
      })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: "Where this discovery helps" }),
  ).toBeVisible();
  await page.screenshot({ path: "docs/screens/applications.png" });
  await page
    .getByRole("button", { name: "Complete Module 1", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: /Module 1/ })).toBeVisible();
  await page.screenshot({ path: "docs/screens/complete.png" });
  await page.getByRole("button", { name: "Learning log", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "clear_means_safe", exact: true }),
  ).toHaveCount(2);
  await expect(
    page.getByRole("cell", { name: "filtering_kills_germs", exact: true }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("cell", { name: "water.quiz.rain", exact: true }),
  ).toHaveCount(1);
  expect(found).toEqual([]);
});
