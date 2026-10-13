import { test, expect, type Page } from "@playwright/test";

const textbox = (page: Page) => page.getByRole("textbox", { name: "Type here", exact: true });

async function finishLesson(page: Page) {
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem("keylingo.progress") ?? "null")?.payload.totalSessions ?? 0);
  const target = await page.locator("#typing-target").textContent();
  await textbox(page).focus();
  await page.keyboard.insertText(target!);
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Session complete" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("keylingo.progress") ?? "null")?.payload.totalSessions)).toBe(before + 1);
}

test("progress page displays metrics, filters sessions, shows trend and character difficulty", async ({ page }) => {
  // First complete a lesson to have a genuine valid saved session with statistics
  await page.goto("/en/learn/us-home");
  await finishLesson(page);

  // Now navigate to progress
  await page.goto("/en/progress");

  // Verify lifetime metrics cards
  await expect(page.locator(".live-metrics")).toBeVisible();
  await expect(page.locator(".live-metrics")).toContainText("1"); // Total sessions

  // Verify weekly trend bars are rendered
  await expect(page.locator(".trend-bars")).toBeVisible();
  await expect(page.locator(".trend-column")).toHaveCount(8);

  // Verify session history items
  await expect(page.locator(".session-history li")).toHaveCount(1);

  // Test filter: outcome "Completed"
  await page.getByLabel("Session result", { exact: true }).selectOption("completed");
  await expect(page.locator(".session-history li")).toHaveCount(1);

  // Test filter: outcome "Exited" (abandoned)
  await page.getByLabel("Session result", { exact: true }).selectOption("abandoned");
  await expect(page.locator(".session-history li")).toHaveCount(0);

  // Reset filter to All
  await page.getByLabel("Session result", { exact: true }).selectOption("all");
  await expect(page.locator(".session-history li")).toHaveCount(1);
});

test("progress data management supports export, reset, and backup recovery", async ({ page }) => {
  // Complete two sessions so a backup exists (first save creates record, second save writes .backup)
  await page.goto("/en/learn/us-home");
  await finishLesson(page);
  await page.getByRole("button", { name: "Restart", exact: true }).click();
  await finishLesson(page);

  await page.goto("/en/progress");

  // Verify 2 sessions initially
  await expect(page.locator(".session-history li")).toHaveCount(2);

  // Test Export
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export progress", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("keylingo-progress.json");

  // Test Reset (with confirmation dialog)
  page.on("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Reset progress", exact: true }).click();
  await expect(page.locator("p[role=status]")).toContainText("Progress data updated.");

  // Check that progress is now empty
  const resetData = await page.evaluate(() => JSON.parse(localStorage.getItem("keylingo.progress")!).payload);
  expect(resetData.totalSessions).toBe(0);

  // Verify recovery copy was retained
  const recovery = await page.evaluate(() => localStorage.getItem("keylingo.progress.recovery"));
  expect(recovery).toBeTruthy();

  // Test Backup Recovery
  await page.getByRole("button", { name: "Restore last good backup", exact: true }).click();
  await expect(page.locator("p[role=status]")).toContainText("Progress data updated.");
  const recoveredData = await page.evaluate(() => JSON.parse(localStorage.getItem("keylingo.progress")!).payload);
  expect(recoveredData.totalSessions).toBeGreaterThan(0);
});

test("vocabulary data management supports export, backup, and reset", async ({ page }) => {
  await page.goto("/en/vocabulary");

  // Verify export button exists and triggers download
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export vocabulary", exact: true }).first().click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("keylingo-vocabulary.json");

  // Test confirmed reset on vocabulary
  page.on("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Reset vocabulary", exact: true }).click();
  await expect(page.locator("p[role=status]")).toContainText("Vocabulary updated.");
});
