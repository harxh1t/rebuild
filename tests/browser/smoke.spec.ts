import { test, expect } from "@playwright/test";
test("sample wrong then right, persistent log, shortcuts and touch", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/?demo&reset");
  await page.getByRole("button", { name: /Solar house/ }).click();
  await expect(
    page.getByText("Solar house: Coming soon.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Water house/ }).click();
  await page.getByRole("button", { name: "Let’s try" }).click();
  await page.getByRole("button", { name: "Left box", exact: true }).click();
  await page.getByRole("button", { name: "😄 Very sure" }).click();
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(
    page.getByText("⚑ Tap a box first, then press Check."),
  ).toBeVisible();
  // Click real geometry, not only the accessible fallback buttons.
  await page.locator("canvas").click({ position: { x: 578, y: 464 } });
  await expect(
    page.getByRole("button", { name: "Left box", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(page.getByText("Interesting surprise!")).toBeVisible();
  await expect(page.getByText(/⚑ This box is terracotta/)).toBeVisible();
  await page.getByRole("button", { name: "Hint", exact: true }).click();
  await expect(page.getByText("Look for the colour of a leaf.")).toBeVisible();
  await page.screenshot({ path: "test-results/sample-error.png" });
  await page.locator("canvas").click({ position: { x: 862, y: 464 } });
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(page.getByText("YOUR NOTEBOOK")).toBeVisible();
  await page.screenshot({ path: "test-results/sample-notebook.png" });
  await page.getByRole("button", { name: "Back to village" }).click();
  await page.goto("/?demo&log");
  await expect(
    page.getByRole("cell", { name: "completion", exact: true }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("cell", { name: "attempt", exact: true }),
  ).toHaveCount(3);
  await expect(
    page.getByRole("cell", { name: "sample_color_mixup", exact: true }),
  ).toHaveCount(2);
  await page.goto("/?demo&jump=sample&debug");
  await expect(page.getByRole("button", { name: "Let’s try" })).toBeVisible();
  await expect(page.locator("output")).toContainText("draw calls");
  await page.goto("/?demo&jump=missing");
  await expect(page.getByText(/couldn’t find puzzle/)).toBeVisible();
  await page.goto("/?demo&reset&log");
  await expect(page.getByText("No discoveries recorded yet.")).toBeVisible();
  expect(errors).toEqual([]);
});
test("student code and touch input", async ({ browser }) => {
  const context = await browser.newContext({
    hasTouch: true,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("http://127.0.0.1:5173/");
  await page.getByLabel("Student code").fill("S12");
  await page.getByRole("button", { name: "Let’s begin" }).click();
  await page.getByRole("button", { name: /Water house/ }).tap();
  await page.getByRole("button", { name: "Let’s try" }).tap();
  await page.getByRole("button", { name: "Right box", exact: true }).tap();
  await page.getByRole("button", { name: "🙂 A bit sure" }).tap();
  await page.touchscreen.tap(862, 464);
  await expect(
    page.getByRole("button", { name: "Right box", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Check", exact: true }).tap();
  await expect(page.getByText("YOUR NOTEBOOK")).toBeVisible();
  expect(errors).toEqual([]);
  await context.close();
});
