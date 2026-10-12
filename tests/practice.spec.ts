import { test, expect, type Page } from "@playwright/test";
const textbox = (page: Page) => page.getByRole("textbox", { name: "Type here", exact: true });
async function finish(page: Page) {
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem("keylingo.progress") ?? "null")?.payload.totalSessions ?? 0);
  const target = await page.locator("#typing-target").textContent();
  await textbox(page).focus(); await page.keyboard.insertText(target!);
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Session complete" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("keylingo.progress") ?? "null")?.payload.totalSessions)).toBe(before + 1);
}
test("complete a lesson, unlock the next, and reload persisted progress without duplicates", async ({ page }) => {
  await page.goto("/en/learn"); await expect(page.getByRole("link", { name: "Start lesson" })).toHaveCount(1);
  await page.getByRole("link", { name: "Start lesson" }).click();
  await expect(page.locator('[data-key="KeyA"]')).toHaveClass(/highlighted/);
  await finish(page); await page.goto("/en/learn");
  await expect(page.getByRole("link", { name: "Start lesson" })).toHaveCount(2);
  await page.reload(); await expect(page.getByRole("link", { name: "Start lesson" })).toHaveCount(2);
  await page.goto("/en/progress"); await expect(page.locator(".session-history li")).toHaveCount(1);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("keylingo.progress")!).payload.totalSessions)).toBe(1);
  await page.goto("/en/learn/us-right"); await expect(page.getByText("Complete the previous lesson first.")).toBeVisible();
});
test("each mapping starts independently, including connected Arabic and unchanged keyboard geometry", async ({ page }) => {
  for (const language of ["nl", "ar"]) {
    await page.goto("/en/learn"); await page.getByLabel("Practice language", { exact: true }).selectOption(language);
    await expect(page.getByRole("link", { name: "Start lesson" })).toHaveCount(1);
    await page.getByRole("link", { name: "Start lesson" }).click();
    await expect(page.locator(".keyboard-scroll")).toHaveAttribute("dir", "ltr");
    await expect(page.locator("#typing-target")).toHaveAttribute("dir", language === "ar" ? "rtl" : "ltr");
    await finish(page);
  }
  await page.goto("/en/progress"); await expect(page.locator(".session-history li")).toHaveCount(2);
});
test("reflex reproduces seeds, saves configuration and forbids replacing active exercise", async ({ page }) => {
  await page.goto("/en/reflex"); await page.getByLabel("Seed", { exact: true }).fill("repeat-me");
  await page.getByLabel("Pattern", { exact: true }).selectOption("alternating");
  await page.getByRole("button", { name: "Generate exercise" }).click();
  const target = await page.locator("#typing-target").textContent();
  await expect(page.getByRole("button", { name: "Generate exercise" })).toBeDisabled();
  await finish(page);
  await page.getByRole("button", { name: "Generate exercise" }).click();
  await expect(page.locator("#typing-target")).toHaveText(target!);
  await page.getByRole("button", { name: "End session", exact: true }).click();
  await page.reload(); await expect(page.getByLabel("Seed", { exact: true })).toHaveValue("repeat-me");
  await expect(page.getByLabel("Pattern", { exact: true })).toHaveValue("alternating");
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("keylingo.progress")!).payload);
  expect(stored.totalSessions).toBe(2); expect(stored.sessions[0].result.exercise.source.config.seed).toBe("repeat-me");
});
test("corrupt progress is preserved, result stays in memory, and export remains available", async ({ page }) => {
  await page.goto("/en/learn/us-home");
  await page.evaluate(() => localStorage.setItem("keylingo.progress", "broken"));
  const target = await page.locator("#typing-target").textContent(); await textbox(page).focus(); await page.keyboard.insertText(target!);
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(page.locator("p[role=alert]")).toContainText("Progress could not be saved");
  expect(await page.evaluate(() => localStorage.getItem("keylingo.progress"))).toBe("broken");
  await page.getByRole("link", { name: "View progress" }).first().click();
  await expect(page.locator(".session-history li")).toHaveCount(1);
  const download = page.waitForEvent("download"); await page.getByRole("button", { name: "Export progress" }).click();
  expect((await download).suggestedFilename()).toBe("keylingo-progress.json");
});
test("practice screens fit mobile/tablet/desktop and all interface languages", async ({ page }) => {
  await page.goto("/en/learn"); await page.getByLabel("Practice language", { exact: true }).selectOption("ar");
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const locale of ["en", "nl", "ar"]) {
      await page.goto(`/${locale}/learn/arabic-101-home`); await expect(page.locator("textarea")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await expect(page.locator(".keyboard-scroll")).toHaveAttribute("dir", "ltr");
      for (const section of ["learn", "reflex", "progress"]) {
        await page.goto(`/${locale}/${section}`); await expect(page.locator("h1")).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      }
    }
  }
  await page.goto("/ar/learn/arabic-101-home");
  await page.screenshot({ path: "docs/screens/phase3-arabic-practice.png", fullPage: true });
  expect(errors).toEqual([]);
});
test("progress storage quota failure preserves a completed result in memory", async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === "keylingo.progress") throw new DOMException("Quota exceeded", "QuotaExceededError");
      original.call(this, key, value);
    };
  });
  await page.goto("/en/learn/us-home"); const target = await page.locator("#typing-target").textContent();
  await textbox(page).focus(); await page.keyboard.insertText(target!); await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(page.locator("p[role=alert]")).toContainText("Progress could not be saved");
  await page.getByRole("link", { name: "View progress" }).first().click();
  await expect(page.locator(".session-history li")).toHaveCount(1);
  expect(await page.evaluate(() => localStorage.getItem("keylingo.progress"))).toBeNull();
});
test("external progress revisions preserve active input and merge results from two tabs", async ({ page, context }) => {
  await page.goto("/en/learn/us-home"); const target = await page.locator("#typing-target").textContent();
  await textbox(page).focus(); await page.keyboard.insertText(target!.slice(0, 1));
  const other = await context.newPage(); await other.goto("/en/learn/us-home"); await finish(other);
  await page.bringToFront(); await expect(textbox(page)).toHaveValue(target!.slice(0, 1));
  await textbox(page).focus(); await page.keyboard.insertText(target!.slice(1));
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("keylingo.progress")!).payload.totalSessions)).toBe(2);
  await page.goto("/en/progress"); await expect(page.locator(".session-history li")).toHaveCount(2);
  await other.close();
});
test("progress restores a valid backup without overwriting damaged data silently", async ({ page }) => {
  await page.goto("/en/learn/us-home"); await finish(page);
  await page.getByRole("button", { name: "Restart", exact: true }).click(); await finish(page);
  await page.evaluate(() => localStorage.setItem("keylingo.progress", "damaged"));
  await page.goto("/en/progress"); await page.reload(); await expect(page.getByRole("button", { name: "Restore last good backup" })).toBeVisible();
  await page.getByRole("button", { name: "Restore last good backup" }).click();
  await expect(page.locator(".session-history li")).toHaveCount(1);
  expect(await page.evaluate(() => localStorage.getItem("keylingo.progress.recovery"))).toBe("damaged");
});

test("layouts follow practice language, ignore interface language, and have no editable controls", async ({ page }) => {
  await page.goto("/en/settings");
  await expect(page.locator("#keyboardMapping")).toHaveCount(0);
  await page.getByLabel("Practice language", { exact: true }).selectOption("ar");
  await expect(page.locator(".setup-chip")).toContainText("Arabic 101");
  await page.goto("/nl/learn");
  await expect(page.locator("#practice-mapping")).toHaveCount(0);
  await page.getByRole("link", { name: "Start les", exact: true }).click();
  await expect(page).toHaveURL(/arabic-101-home$/);
  await page.goto("/en/reflex"); await expect(page.locator("#reflex-mapping")).toHaveCount(0);
  await page.getByRole("button", { name: "Generate exercise" }).click();
  await expect(page.locator("#typing-target")).toHaveAttribute("lang", "ar");
  await expect(page.locator(".keyboard-guide h2")).toContainText("Arabic 101");
  const removed = await page.goto("/en/learn/us-international-home"); expect(removed?.status()).toBe(404);
});
test("old preferences migrate and retired layout history stays readable", async ({ page }) => {
  await page.goto("/en/learn/us-home"); await finish(page);
  await page.evaluate(() => {
    const prefs = JSON.parse(localStorage.getItem("keylingo.preferences") ?? "null") ?? { revision: 1, savedAt: new Date().toISOString(), payload: { interfaceLanguage: "en", practiceLanguage: "en", translationLanguage: "nl", theme: "dark", cefr: "A1", category: null, diacritics: "optional", reflex: { length: 60, difficulty: "easy", seed: "saved" } } };
    prefs.schemaVersion = 1; prefs.payload.keyboardMapping = "us-international";
    localStorage.setItem("keylingo.preferences", JSON.stringify(prefs));
    const progress = JSON.parse(localStorage.getItem("keylingo.progress")!);
    progress.payload.sessions[0].result.exercise.keyboardMapping = "us-international";
    localStorage.setItem("keylingo.progress", JSON.stringify(progress));
  });
  await page.goto("/en/progress"); await page.reload();
  await expect(page.locator(".session-history li")).toContainText("US International");
  await expect(page.locator(".setup-chip")).toContainText("US");
  await page.goto("/en/settings"); await page.getByLabel("Practice language", { exact: true }).selectOption("ar");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("keylingo.preferences")!).schemaVersion)).toBe(2);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("keylingo.preferences")!).payload)).not.toHaveProperty("keyboardMapping");
  await page.reload(); await expect(page.getByLabel("Practice language", { exact: true })).toHaveValue("ar");
});
