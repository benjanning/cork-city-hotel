const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const day = (n) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
async function review(page, url) {
  await page.goto(url);
  await page.getByLabel("Check-in", { exact: true }).fill(day(30));
  await page.getByLabel("Check-out", { exact: true }).fill(day(33));
  await page.getByRole("button", { name: "Find your room" }).click();
  await page.getByLabel("Number of rooms").selectOption("2");
  await page.locator('[data-room="2"]').click();
  await page.getByLabel("Sample guest name").fill("Sample Guest");
  await page
    .getByLabel("Example email", { exact: true })
    .fill("guest@example.com");
  await page.locator("#guest-form button").click();
  await expect(page.locator("#confirm")).toBeVisible();
}
for (const [mode, url] of [
  ["express", "http://127.0.0.1:3000"],
  ["static", "http://127.0.0.1:8090"],
]) {
  test(`${mode}: changed dates replace the review and repeat confirmation preserves identity`, async ({
    page,
  }) => {
    await review(page, url);
    await expect(page.locator(".summary-total")).toContainText("€720.00");
    await page
      .getByRole("link", { name: "Change dates ↗", exact: true })
      .click();
    await page.getByLabel("Check-out", { exact: true }).fill(day(35));
    await page.getByRole("button", { name: "Find your room" }).click();
    await page.locator('[data-room="2"]').click();
    await expect(page.getByLabel("Sample guest name")).toHaveValue(
      "Sample Guest",
    );
    await page.locator("#guest-form button").click();
    await expect(page.locator(".summary-total")).toContainText("€1,200.00");
    await page.locator("#confirm").click();
    await expect(page.locator(".reference")).toBeVisible();
    const reference = await page.locator(".reference strong").innerText();
    await page.goto(url + "/#review");
    await page.locator("#confirm").click();
    await expect(page.locator(".reference strong")).toHaveText(reference);
  });
}
test("expired Express session restores review without losing sample details or auto-confirming", async ({
  page,
  context,
}) => {
  await review(page, "http://127.0.0.1:3000");
  await context.clearCookies();
  await page.locator("#confirm").click();
  await expect(page.locator("#error")).toContainText(
    "review has been refreshed",
  );
  await expect(page.locator(".guest-review")).toContainText(
    "guest@example.com",
  );
  await expect(page.locator(".summary-total")).toContainText("€720.00");
  await expect(page.locator(".reference")).toHaveCount(0);
  await expect(page.locator("#confirm")).toBeVisible();
  fs.mkdirSync("verification/screenshots", { recursive: true });
  await page.screenshot({
    path: "verification/screenshots/refreshed-review.jpg",
    type: "jpeg",
    quality: 85,
    fullPage: true,
  });
  await page.locator("#confirm").click();
  await expect(page.locator(".reference")).toContainText("DEMO-");
});
test("a stored static review with an old rate is refreshed for explicit approval", async ({
  page,
}) => {
  await review(page, "http://127.0.0.1:8090");
  await page.evaluate(() => {
    const s = JSON.parse(sessionStorage.getItem("cork-city-hotel-v2"));
    s.quote.unitPriceCents = 11000;
    s.quote.totalCents = 66000;
    s.preview.quote = { ...s.quote };
    sessionStorage.setItem("cork-city-hotel-v2", JSON.stringify(s));
  });
  await page.reload();
  await expect(page.locator(".summary-total")).toContainText("€660.00");
  await page.locator("#confirm").click();
  await expect(page.locator("#error")).toContainText(
    "review has been refreshed",
  );
  await expect(page.locator(".summary-total")).toContainText("€720.00");
  await expect(page.locator(".reference")).toHaveCount(0);
  await page.locator("#confirm").click();
  await expect(page.locator(".reference")).toBeVisible();
});
test("an expired static review preserves the selection and requires a second confirmation", async ({
  page,
}) => {
  await review(page, "http://127.0.0.1:8090");
  await page.evaluate(() => {
    const s = JSON.parse(sessionStorage.getItem("cork-city-hotel-v2"));
    s.preview.expiresAt = 1;
    sessionStorage.setItem("cork-city-hotel-v2", JSON.stringify(s));
  });
  await page.reload();
  await page.locator("#confirm").click();
  await expect(page.locator("#error")).toContainText(
    "review has been refreshed",
  );
  await expect(page.locator(".guest-review")).toContainText("Sample Guest");
  await expect(page.locator("#confirm")).toBeVisible();
  await page.locator("#confirm").click();
  await expect(page.locator(".reference")).toBeVisible();
});
