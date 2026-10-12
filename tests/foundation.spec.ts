import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

test("locale routes, empty states, and real unknown-ID 404s", async ({ page }) => {
  for (const locale of ["en", "nl", "ar"]) {
    for (const section of ["", "/learn", "/reflex", "/practice", "/vocabulary", "/progress", "/settings", "/studies"]) {
      const response = await page.goto(`/${locale}${section}`);
      expect(response?.status()).toBe(200); await expect(page.locator("h1")).toBeVisible();
    }
  }
  for (const path of ["/fr", "/en/unknown", "/en/learn/missing", "/en/practice/missing", "/en/studies/missing"]) {
    const response = await page.goto(path); expect(response?.status()).toBe(404);
  }
});
test("language preferences stay independent, persist, and choose the root locale", async ({ page }) => {
  await page.goto("/en/settings");
  await page.getByLabel("Practice language", { exact: true }).selectOption("ar");
  await page.getByLabel("Translation language", { exact: true }).selectOption("en");
  await page.getByLabel("Appearance", { exact: true }).selectOption("dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByLabel("Interface language", { exact: true }).selectOption("nl");
  await expect(page).toHaveURL("/nl/settings");
  await page.reload();
  await expect(page.getByLabel("Oefentaal", { exact: true })).toHaveValue("ar");
  await expect(page.getByLabel("Vertaaltaal", { exact: true })).toHaveValue("en");
  await page.goto("/"); await expect(page).toHaveURL("/nl");
});
test("corrupt data is preserved until explicit backup recovery", async ({ page }) => {
  await page.goto("/en/settings");
  await page.getByLabel("Appearance", { exact: true }).selectOption("dark");
  await page.getByLabel("Appearance", { exact: true }).selectOption("light");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("keylingo.preferences")!).payload.theme)).toBe("light");
  await page.evaluate(() => localStorage.setItem("keylingo.preferences", "broken")); await page.reload();
  await expect(page.locator(".storage-warning")).toBeVisible();
  await page.getByLabel("Practice language", { exact: true }).selectOption("ar");
  expect(await page.evaluate(() => localStorage.getItem("keylingo.preferences"))).toBe("broken");
  await page.getByRole("button", { name: "Restore preference backup" }).click();
  await expect(page.getByLabel("Appearance", { exact: true })).toHaveValue("dark");
  await expect(page.locator(".storage-warning")).toHaveCount(0);
});
test("screen studies fit mobile, tablet, desktop and Arabic retains physical geometry", async ({ page }) => {
  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const locale of ["en", "ar"]) {
      for (const screen of ["home", "learn", "practice", "vocabulary", "progress"]) {
        await page.goto(`/${locale}/studies/${screen}`);
        await expect(page.locator("h1")).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
        if (screen === "practice") await expect(page.locator(".keyboard-study")).toHaveAttribute("dir", "ltr");
      }
    }
  }
});

test("storage denial leaves settings usable in memory", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, "localStorage", { get() { throw new Error("denied"); } }));
  await page.goto("/en/settings");
  await page.getByLabel("Appearance", { exact: true }).selectOption("dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".storage-warning")).toBeVisible();
});

test("clean state refreshes from another tab", async ({ page, context }) => {
  await page.goto("/en/settings");
  const other = await context.newPage(); await other.goto("/en/settings");
  await other.getByLabel("Appearance", { exact: true }).selectOption("dark");
  await expect(page.getByLabel("Appearance", { exact: true })).toHaveValue("dark");
  await other.close();
});

test("keyboard access reaches content and reveals a study word", async ({ page }) => {
  await page.goto("/en/studies/vocabulary");
  await page.keyboard.press("Tab"); await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter"); await expect(page.locator("#main")).toBeFocused();
  await page.getByText("Reveal meaning", { exact: true }).focus(); await page.keyboard.press("Enter");
  await expect(page.locator(".revealed")).toBeVisible();
});

test("capture reviewable screen studies", async ({ page }) => {
  await mkdir("docs/screens", { recursive: true });
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 1280, height: 960 });
  for (const screen of ["home", "learn", "practice", "vocabulary", "progress"]) {
    await page.goto(`/en/studies/${screen}`); await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `docs/screens/en-${screen}-desktop.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 768, height: 1024 }); await page.goto("/nl/studies/home");
  await page.evaluate(() => document.fonts.ready); await page.screenshot({ path: "docs/screens/nl-home-tablet.png", fullPage: true });
  await page.setViewportSize({ width: 360, height: 900 }); await page.goto("/en/studies/home");
  await page.evaluate(() => document.fonts.ready); await page.screenshot({ path: "docs/screens/en-home-mobile.png", fullPage: true });
  await page.goto("/ar/settings"); await page.getByLabel("المظهر", { exact: true }).selectOption("dark");
  await page.goto("/ar/studies/practice"); await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.evaluate(() => document.fonts.ready); await page.screenshot({ path: "docs/screens/ar-practice-mobile-dark.png", fullPage: true });
  await page.setViewportSize({ width: 1280, height: 960 }); await page.goto("/ar/settings");
  await page.getByLabel("المظهر", { exact: true }).selectOption("light"); await page.goto("/ar/studies/practice");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.evaluate(() => document.fonts.ready); await page.screenshot({ path: "docs/screens/ar-practice-desktop.png", fullPage: true });
  expect(errors).toEqual([]);
});
