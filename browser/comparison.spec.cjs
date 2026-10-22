const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const modes = process.env.HOTEL_BASE
  ? [["static", process.env.HOTEL_BASE.replace(/\/$/, "")]]
  : [
      ["express", "http://127.0.0.1:3000"],
      ["static", "http://127.0.0.1:8090"],
    ];
const day = (n) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
for (const [mode, url] of modes)
  test(`${mode}: full-stay comparison, explicit quantity repair and stale quote guard`, async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const shot = async (name) => {
      if (mode === "static") {
        fs.mkdirSync("verification/screenshots", { recursive: true });
        await page.screenshot({
          path: `verification/screenshots/${name}.jpg`,
          type: "jpeg",
          quality: 85,
          fullPage: true,
        });
      }
    };
    await page.goto(url);
    await page.getByLabel("Check-in", { exact: true }).fill(day(30));
    await page.getByLabel("Check-out", { exact: true }).fill(day(33));
    await page.getByLabel("Guests", { exact: true }).selectOption("6");
    await page.getByRole("button", { name: "Find your room" }).click();
    for (const [id, total] of [
      [1, "€240.00"],
      [2, "€360.00"],
      [3, "€480.00"],
    ]) {
      const card = page
        .locator(".room-card")
        .filter({ has: page.locator(`[data-room="${id}"]`) });
      await expect(card.locator(".stay-price strong")).toHaveText(total);
      await expect(card.locator("[data-room]")).toBeDisabled();
    }
    await shot("stay-comparison");
    await page
      .getByRole("button", {
        name: "Use minimum 3 rooms for The Courtyard Double",
        exact: true,
      })
      .press("Enter");
    await expect(page.getByLabel("Number of rooms")).toHaveValue("3");
    await expect(page.getByLabel("Number of rooms")).toBeFocused();
    for (const [id, total] of [
      [1, "€720.00"],
      [2, "€1,080.00"],
      [3, "€1,440.00"],
    ]) {
      const card = page
        .locator(".room-card")
        .filter({ has: page.locator(`[data-room="${id}"]`) });
      await expect(card.locator(".stay-price strong")).toHaveText(total);
    }
    await expect(page.locator('[data-room="1"]')).toBeDisabled();
    await expect(page.locator('[data-room="2"]')).toBeEnabled();
    await shot("quantity-repaired");
    await page.locator('[data-room="2"]').press("Enter");
    await expect(page.locator(".summary-total")).toContainText("€1,080.00");
    await page.getByLabel("Sample guest name").fill("Sample Visitor");
    await page
      .getByLabel("Example email", { exact: true })
      .fill("visitor@example.com");
    await page.locator("#guest-form button").click();
    await expect(page.locator("#confirm")).toBeVisible();
    await page
      .getByRole("link", { name: "← Change your room", exact: true })
      .click();
    await page.getByLabel("Number of rooms").selectOption("4");
    await page.goto(url + "/#guest");
    await expect(page.locator("#error")).toHaveText("Choose your room first.");
    await page.goto(url + "/#review");
    await expect(page.locator("#confirm")).toHaveCount(0);
    await page.goto(url + "/#rooms");
    await expect(page.locator(".page-heading")).toContainText("6 guests");
    await expect(page.locator(".page-heading")).toContainText("3 nights");
    await page.locator('[data-room="2"]').click();
    await expect(page.locator(".summary-total")).toContainText("€1,440.00");
    await expect(page.getByLabel("Sample guest name")).toHaveValue(
      "Sample Visitor",
    );
    await page
      .getByRole("link", { name: "← Change your room", exact: true })
      .click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByLabel("Number of rooms").selectOption("1");
    await page
      .getByRole("button", {
        name: "Use minimum 3 rooms for The Courtyard Double",
        exact: true,
      })
      .press("Enter");
    await expect(page.getByLabel("Number of rooms")).toBeFocused();
    await expect(page.locator('[data-room="2"]')).toBeEnabled();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await shot("mobile-stay-comparison");
    await page.goto(url + "/#stay");
    await page.getByLabel("Check-in", { exact: true }).fill(day(30));
    await page.getByLabel("Check-out", { exact: true }).fill(day(31));
    await page.getByLabel("Guests", { exact: true }).selectOption("1");
    await page.getByRole("button", { name: "Find your room" }).click();
    await page.getByLabel("Number of rooms").selectOption("1");
    await expect(page.locator("#comparison-context")).toContainText(
      "for 1 room and 1 guest",
    );
    await expect(page.locator(".page-heading")).toContainText(
      "1 night · 1 guest",
    );
    await expect(page.locator(".stay-price small").first()).toContainText(
      "1 night × 1 room",
    );
    await page.getByLabel("Number of rooms").selectOption("7");
    await page
      .getByRole("button", {
        name: "Use minimum 1 room for The Courtyard Double",
        exact: true,
      })
      .click();
    await expect(page.getByLabel("Number of rooms")).toHaveValue("1");
    await page.locator('[data-room="2"]').click();
    await expect(page.locator(".summary dl")).toContainText(
      "€120.00 × 1 night × 1 room",
    );
    expect(errors).toEqual([]);
  });
