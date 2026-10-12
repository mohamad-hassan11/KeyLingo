import { test, expect, type Page } from "@playwright/test";
const input = (page: Page) => page.getByRole("textbox", { name: "Type here", exact: true });
const count = (page: Page, name: string) => page.getByRole("status", { name, exact: true });
async function saveHome(page: Page) {
  await page.goto("/en/practice/en-daily-life-a1");
  await page.getByRole("button", { name: "home", exact: true }).click();
  await expect(page.locator(".translation-result")).toHaveText("huis");
  await page.getByRole("button", { name: "Save word", exact: true }).click();
  await expect(page.getByRole("button", { name: "Saved", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Close and return to typing", exact: true }).click();
}
test("word lookup preserves input/scoring/time and nested pause, saves once, and returns focus", async ({ page }) => {
  await page.clock.install(); await page.goto("/en/practice/en-daily-life-a2");
  await input(page).focus(); await page.keyboard.insertText("I open"); await page.clock.runFor(1000);
  const attempts = await count(page, "Attempts").textContent();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const time = await count(page, "Active time").getAttribute("data-ms");
  await page.getByRole("button", { name: "window", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible(); await expect(page.locator(".translation-result")).toHaveText("raam");
  await page.clock.runFor(5000); await page.getByRole("button", { name: "Save word", exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("keylingo.vocabulary") ?? "null")?.payload.items.length)).toBe(1);
  await page.screenshot({ path: "docs/screens/phase4-word-lookup-desktop.png" });
  await page.getByRole("button", { name: "Close and return to typing", exact: true }).click();
  await expect(input(page)).toBeFocused(); await expect(input(page)).not.toBeEditable();
  await expect(input(page)).toHaveValue("I open"); await expect(count(page, "Attempts")).toHaveText(attempts!);
  await expect(count(page, "Active time")).toHaveAttribute("data-ms", time!);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.getByRole("button", { name: "window", exact: true }).click();
  await expect(page.getByRole("button", { name: "Saved", exact: true })).toBeDisabled();
  await page.keyboard.press("Escape"); await expect(input(page)).toBeFocused(); await expect(input(page)).toBeEditable();
  await page.keyboard.insertText(" the window every morning.");
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("keylingo.progress") ?? "null")?.payload.totalSessions)).toBe(1);
  const source = await page.evaluate(() => JSON.parse(localStorage.getItem("keylingo.progress")!).payload.sessions[0].result.exercise.source);
  expect(source).toMatchObject({ kind: "content", contentId: "en-daily-life-a2", contentVersion: 1 });
});
test("all six language directions, same-language honesty, sentence and exact lemma lookup", async ({ page }) => {
  const texts = { en: "home", nl: "huis", ar: "بيت" };
  for (const source of ["en", "nl", "ar"] as const) {
    await page.goto(`/en/practice/${source}-daily-life-a1`);
    await page.getByRole("button", { name: "Translate the full text" }).click();
    for (const target of ["en", "nl", "ar"] as const) {
      await page.getByLabel("Translation language", { exact: true }).selectOption(target);
      await expect(page.locator(".translation-result")).toHaveText(texts[target]);
      await expect(page.getByText("Same language: showing the original text and explanation.")).toHaveCount(source === target ? 1 : 0);
    }
    await page.keyboard.press("Escape"); await expect(input(page)).toBeFocused();
  }
  await page.goto("/en/practice/ar-daily-life-a2"); await page.getByRole("button", { name: "Look up a word", exact: true }).click();
  await page.getByLabel("Translation language", { exact: true }).selectOption("en");
  await page.getByLabel("Word or lemma").fill("نافذة"); await page.getByRole("button", { name: "Look up", exact: true }).click();
  await expect(page.locator(".translation-result")).toHaveText("window");
  await page.getByLabel("Word or lemma").fill("كتاب"); await expect(page.locator(".translation-result")).toHaveCount(0);
  await page.getByRole("button", { name: "Look up", exact: true }).click();
  await expect(page.locator(".translation-result")).toHaveText("book"); await expect(page.getByText("Source context", { exact: true })).toBeVisible();
  await page.getByLabel("Word or lemma").fill("unknown/?#"); await page.getByRole("button", { name: "Look up", exact: true }).click();
  await expect(page.getByText("No curated translation was found.", { exact: false })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open Wiktionary" })).toHaveAttribute("href", "https://ar.wiktionary.org/wiki/unknown%2F%3F%23");
});
test("filters publish coverage, show unavailable advanced levels and retain language independence", async ({ page }) => {
  await page.goto("/en/practice"); await expect(page.locator(".lesson-card")).toHaveCount(7);
  await page.getByLabel("Practice language", { exact: true }).selectOption("ar");
  await expect(page.locator(".lesson-card h2").first()).toHaveAttribute("lang", "ar");
  await page.getByLabel("Level", { exact: true }).selectOption("B2");
  await page.getByLabel("Category", { exact: true }).selectOption("casual"); await expect(page.locator(".lesson-card")).toHaveCount(1);
  await page.getByRole("link", { name: "Practice ↗", exact: true }).click();
  await expect(page.getByText("Informal conversational MSA · no dialect coverage")).toBeVisible();
  await expect(page.locator("#typing-target")).toHaveAttribute("dir", "rtl");
  await page.goto("/en/practice"); await page.getByLabel("Level", { exact: true }).selectOption("C1");
  await expect(page.getByRole("heading", { name: "No reviewed content for these filters." })).toBeVisible();
  await page.reload(); await expect(page.getByLabel("Level", { exact: true })).toHaveValue("C1");
  const response = await page.goto("/en/practice/nonexistent"); expect(response?.status()).toBe(404);
});
test("saved word survives reload, reveals, retypes, searches and removes explicitly", async ({ page }) => {
  await saveHome(page); await page.goto("/en/vocabulary"); await page.reload();
  await expect(page.locator(".review-card")).toHaveCount(1);
  await page.getByText("Reveal translation", { exact: true }).click(); await expect(page.locator(".translation-result")).toHaveText("huis");
  await page.screenshot({ path: "docs/screens/phase4-vocabulary-review.png", fullPage: true });
  await page.getByLabel("Search saved words").fill("nothing"); await expect(page.locator(".review-card")).toHaveCount(0);
  await page.getByLabel("Search saved words").fill("huis"); await expect(page.locator(".review-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Retype this word" }).click();
  await input(page).focus(); await page.keyboard.insertText("home"); await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Session complete" })).toBeVisible();
  await page.getByRole("button", { name: "Back to vocabulary" }).click(); await page.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(page.locator(".review-card")).toHaveCount(0); await page.reload(); await expect(page.locator(".review-card")).toHaveCount(0);
});
test("quota and corrupt vocabulary preserve memory and original data with export and backup recovery", async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) { if (key === "keylingo.vocabulary") throw new DOMException("quota", "QuotaExceededError"); original.call(this, key, value); };
  });
  await saveHome(page); await page.getByRole("link", { name: "My vocabulary", exact: true }).click();
  await expect(page.locator(".storage-warning").filter({ hasText: "Vocabulary could not be saved." })).toBeVisible();
  await expect(page.locator(".review-card")).toHaveCount(1);
  const download = page.waitForEvent("download"); await page.getByRole("button", { name: "Export vocabulary" }).first().click();
  expect((await download).suggestedFilename()).toBe("keylingo-vocabulary.json");
  expect(await page.evaluate(() => localStorage.getItem("keylingo.vocabulary"))).toBeNull();
});
test("corrupt vocabulary is not overwritten by saving, and backup recovery retains damage", async ({ page }) => {
  await saveHome(page);
  await page.goto("/en/practice/en-food-a1"); await page.getByRole("button", { name: "bread", exact: true }).click();
  await page.getByRole("button", { name: "Save word", exact: true }).click(); await page.keyboard.press("Escape");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("keylingo.vocabulary")!).payload.items.length)).toBe(2);
  await page.evaluate(() => localStorage.setItem("keylingo.vocabulary", "damaged")); await page.goto("/en/vocabulary"); await page.reload();
  await expect(page.locator(".storage-warning").filter({ hasText: "Vocabulary could not be saved." })).toBeVisible();
  await page.getByRole("link", { name: "Language practice", exact: true }).click();
  await page.locator('a[href="/en/practice/en-food-a1"]').click();
  await page.getByRole("button", { name: "bread", exact: true }).click(); await page.getByRole("button", { name: "Save word", exact: true }).click();
  await page.keyboard.press("Escape"); await page.getByRole("link", { name: "My vocabulary", exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem("keylingo.vocabulary"))).toBe("damaged");
  await page.getByRole("button", { name: "Restore last good backup" }).click();
  await expect(page.locator(".review-card")).toHaveCount(2);
  expect(await page.evaluate(() => localStorage.getItem("keylingo.vocabulary.recovery"))).toBe("damaged");
});
test("vocabulary revisions refresh across tabs without changing active text, and saves merge", async ({ page, context }) => {
  await page.goto("/en/practice/en-daily-life-a1"); await input(page).focus(); await page.keyboard.insertText("h");
  const other = await context.newPage(); await other.goto("/en/practice/en-food-a1");
  await other.getByRole("button", { name: "bread", exact: true }).click(); await other.getByRole("button", { name: "Save word", exact: true }).click();
  await expect.poll(() => other.evaluate(() => JSON.parse(localStorage.getItem("keylingo.vocabulary") ?? "null")?.payload.items.length)).toBe(1);
  await page.bringToFront(); await expect(input(page)).toHaveValue("h"); await expect(count(page, "Attempts")).toHaveText("1");
  await page.getByRole("button", { name: "home", exact: true }).click(); await page.getByRole("button", { name: "Save word", exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("keylingo.vocabulary") ?? "null")?.payload.items.length)).toBe(2);
  await page.keyboard.press("Escape"); await expect(input(page)).toHaveValue("h");
  await page.getByRole("link", { name: "My vocabulary", exact: true }).click(); await expect(page.locator(".review-card")).toHaveCount(2);
  await other.close();
});
test("vocabulary screens and lookup fit all locales and sizes with connected Arabic", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  for (const locale of ["en", "nl", "ar"]) for (const width of [360, 768, 1280]) {
    await page.emulateMedia({ colorScheme: locale === "ar" && width === 360 ? "dark" : "light" });
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`/${locale}/practice/ar-casual-b2`); await expect(page.locator("textarea")).toBeVisible();
    expect(await page.locator("#typing-target").evaluate(node => node.childNodes.length)).toBe(1);
    await page.locator(".vocabulary-lookup button").first().click(); await expect(page.getByRole("dialog")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (locale === "ar" && width === 360) {
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await page.screenshot({ path: "docs/screens/phase4-arabic-lookup-mobile.png", fullPage: true });
    }
    await page.keyboard.press("Escape");
    for (const section of ["practice", "vocabulary"]) { await page.goto(`/${locale}/${section}`); await expect(page.locator("h1")).toBeVisible(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); }
  }
  expect(errors).toEqual([]);
});
