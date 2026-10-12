import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const input = (page: Page) => page.getByRole("textbox", { name: "Type here", exact: true });
const count = (page: Page, name: string) => page.getByRole("status", { name, exact: true });
async function open(page: Page) {
  await page.goto("/en/harness"); await expect(input(page)).toBeVisible();
  await input(page).focus(); await expect(input(page)).toBeEditable();
}
async function committed(page: Page, text: string) { await input(page).focus(); await page.keyboard.insertText(text); }
async function activeMs(page: Page) { return Number(await count(page, "Active time").getAttribute("data-ms")); }

test("committed native input, correction, finish, and restart retain historical scoring", async ({ page }) => {
  await page.clock.install();
  await open(page);
  await page.keyboard.type("X"); await expect(count(page, "Attempts")).toHaveText("1");
  await expect(count(page, "Historical errors")).toHaveText("1"); await expect(count(page, "Position")).toHaveText("1 / 36");
  await page.keyboard.press("Backspace"); await expect(input(page)).toHaveValue("");
  await committed(page, "Every small step makes a difference.");
  await expect(count(page, "Attempts")).toHaveText("37"); await expect(count(page, "Remaining errors")).toHaveText("0");
  await expect(count(page, "Historical errors")).toHaveText("1");
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Session complete" })).toBeVisible();
  const duration = await activeMs(page); await page.clock.runFor(3000); expect(await activeMs(page)).toBe(duration);
  await page.getByRole("button", { name: "Restart", exact: true }).click();
  await expect(input(page)).toHaveValue(""); await expect(count(page, "Attempts")).toHaveText("0");
  await expect(count(page, "Accuracy")).toHaveText("—");
});

test("native input supports decomposed accents and line breaks", async ({ page }) => {
  await open(page); await page.getByLabel("Practice language", { exact: true }).selectOption("nl");
  await page.getByLabel("Sample text", { exact: true }).selectOption("unicode");
  await committed(page, "Een cafe");
  await expect(count(page, "Historical errors")).toHaveText("1");
  await committed(page, "\u0301");
  await expect(input(page)).toHaveValue("Een café"); await expect(count(page, "Attempts")).toHaveText("8");
  await expect(count(page, "Remaining errors")).toHaveText("0");
  await committed(page, ", een idee."); await page.keyboard.press("Enter"); await committed(page, "Een kleine stap.");
  await expect(input(page)).toHaveValue("Een café, een idee.\nEen kleine stap.");
  await expect(page.getByRole("button", { name: "Finish", exact: true })).toBeEnabled();
});

for (const order of ["input-before-end", "end-before-input"] as const) {
  test(`composition interim remains unscored and final commit is deduplicated (${order})`, async ({ page }) => {
    await open(page);
    await input(page).evaluate((node: HTMLTextAreaElement) => {
      node.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
      node.value = "Ev";
      node.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertCompositionText", data: "Ev", isComposing: true }));
    });
    await expect(input(page)).toHaveValue("Ev"); await expect(count(page, "Attempts")).toHaveText("0");
    await expect(count(page, "Active time")).toHaveAttribute("data-ms", "0");
    await input(page).evaluate((node: HTMLTextAreaElement, eventOrder) => {
      node.value = "Every";
      const end = () => node.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: "Every" }));
      const final = () => node.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: "Every", isComposing: false }));
      if (eventOrder === "input-before-end") { final(); end(); }
      else { end(); final(); }
      final(); // Browsers may report the final value again; no extra attempt.
    }, order);
    await expect(input(page)).toHaveValue("Every"); await expect(count(page, "Attempts")).toHaveText("5");
    await expect(count(page, "Historical errors")).toHaveText("0");
  });
}

test("a pause never rewrites active composition and rejects a paused final commit", async ({ page }) => {
  await open(page);
  await input(page).evaluate((node: HTMLTextAreaElement) => {
    node.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
    node.value = "Ev"; node.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertCompositionText", isComposing: true }));
  });
  // Programmatic click leaves the native composition transaction active for this synthetic fixture.
  await page.getByRole("button", { name: "Pause", exact: true }).evaluate((button: HTMLButtonElement) => button.click());
  await expect(input(page)).toHaveValue("Ev");
  await input(page).evaluate((node: HTMLTextAreaElement) => node.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: "Ev" })));
  await expect(input(page)).toHaveValue(""); await expect(count(page, "Attempts")).toHaveText("0");
});

test("paste, drop, noncancelable replacement, and unsupported cursor edits preserve scored text", async ({ page }) => {
  await open(page); await page.keyboard.type("Ev");
  await input(page).evaluate((node: HTMLTextAreaElement) => {
    node.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true }));
    node.dispatchEvent(new InputEvent("beforeinput", { bubbles: true, cancelable: false, inputType: "insertFromPaste" }));
    node.value += "ery"; node.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertFromPaste", data: "ery" }));
  });
  await expect(input(page)).toHaveValue("Ev"); await expect(count(page, "Attempts")).toHaveText("2");
  await page.keyboard.type("e"); await expect(input(page)).toHaveValue("Eve");
  await input(page).evaluate((node: HTMLTextAreaElement) => {
    node.value += "ery"; node.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertFromDrop" }));
  });
  await expect(input(page)).toHaveValue("Eve");
  await input(page).evaluate((node: HTMLTextAreaElement) => {
    node.dispatchEvent(new InputEvent("beforeinput", { bubbles: true, cancelable: false, inputType: "insertReplacementText" }));
    node.value = "Xve"; node.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertReplacementText" }));
  });
  await expect(input(page)).toHaveValue("Eve");
  await page.keyboard.press("Home"); await page.keyboard.type("X");
  await expect(input(page)).toHaveValue("Eve"); await expect(count(page, "Attempts")).toHaveText("3");
  await page.keyboard.press("Control+z"); await expect(input(page)).toHaveValue("Eve");
  await expect(count(page, "Historical errors")).toHaveText("0");
});

test("noncancelable selection deletion and structural fallback are reconciled", async ({ page }) => {
  await open(page); await page.keyboard.type("Every");
  await input(page).evaluate((node: HTMLTextAreaElement) => {
    node.setSelectionRange(0, 5);
    node.dispatchEvent(new InputEvent("beforeinput", { bubbles: true, cancelable: false, inputType: "deleteContentBackward" }));
    node.value = ""; node.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "deleteContentBackward" }));
  });
  await expect(input(page)).toHaveValue("Every");
  await input(page).evaluate((node: HTMLTextAreaElement) => {
    node.value = "EvXry"; node.dispatchEvent(new InputEvent("input", { bubbles: true }));
  });
  await expect(input(page)).toHaveValue("Every"); await expect(count(page, "Attempts")).toHaveText("5");
});

test("Arabic multi-character input and optional/strict marks preserve logical progress", async ({ page }) => {
  await open(page); await page.getByLabel("Practice language", { exact: true }).selectOption("ar");
  await committed(page, "كل"); await expect(count(page, "Attempts")).toHaveText("2");
  await committed(page, "ّ"); await expect(count(page, "Attempts")).toHaveText("2");
  await expect(count(page, "Historical errors")).toHaveText("0");
  await expect(input(page)).toHaveAttribute("dir", "rtl");
  await page.getByLabel("Arabic comparison", { exact: true }).selectOption("strict");
  await committed(page, "ك"); await expect(count(page, "Attempts")).toHaveText("1");
  await expect(count(page, "Historical errors")).toHaveText("1");
  await committed(page, "ُ"); await expect(count(page, "Attempts")).toHaveText("1");
  await expect(count(page, "Remaining errors")).toHaveText("0");
  await page.getByLabel("Sample text", { exact: true }).selectOption("unicode");
  await committed(page, "أهلاً! لا، نعم — 12.\nخطوة جديدة.");
  await expect(count(page, "Remaining errors")).toHaveText("0");
  await expect(page.getByRole("button", { name: "Finish", exact: true })).toBeEnabled();
});

test("canonical mark reordering reconciles a composition append once", async ({ page }) => {
  await open(page); await page.getByLabel("Practice language", { exact: true }).selectOption("ar");
  await page.getByLabel("Arabic comparison", { exact: true }).selectOption("strict");
  await committed(page, "كّ");
  await input(page).evaluate((node: HTMLTextAreaElement) => {
    node.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
    node.value = "كَّ";
    node.dispatchEvent(new InputEvent("input", { bubbles: true, isComposing: true, inputType: "insertCompositionText" }));
    node.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: "َ" }));
    node.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: "َ" }));
  });
  await expect(input(page)).toHaveValue("كَّ"); await expect(count(page, "Attempts")).toHaveText("1");
  await expect(count(page, "Historical errors")).toHaveText("1");
});

test("nested manual/lookup/focus/visibility pauses exclude time and restore focus", async ({ page }) => {
  await page.clock.install(); await open(page); await committed(page, "Every");
  await page.clock.runFor(1000);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const pausedAt = await activeMs(page);
  await page.getByRole("button", { name: "Typing tips", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible(); await page.clock.runFor(5000);
  await page.getByRole("button", { name: "Close and return to typing" }).click();
  await expect(input(page)).toBeFocused(); await expect(input(page)).not.toBeEditable();
  expect(await activeMs(page)).toBe(pausedAt);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(input(page)).toBeEditable(); await page.clock.runFor(1000);
  expect(await activeMs(page)).toBeGreaterThan(pausedAt + 900);
  await page.getByRole("button", { name: "Typing tips", exact: true }).click();
  const lookupAt = await activeMs(page); await page.clock.runFor(4000); await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible(); await expect(input(page)).toBeFocused();
  expect(await activeMs(page)).toBe(lookupAt);
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: true }); document.dispatchEvent(new Event("visibilitychange")); });
  const hiddenAt = await activeMs(page); await page.clock.runFor(5000); expect(await activeMs(page)).toBe(hiddenAt);
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: false }); document.dispatchEvent(new Event("visibilitychange")); });
  await expect(input(page)).toBeEditable();
  await page.evaluate(() => window.dispatchEvent(new Event("blur"))); const blurredAt = await activeMs(page);
  await page.clock.runFor(3000); expect(await activeMs(page)).toBe(blurredAt);
  await page.evaluate(() => window.dispatchEvent(new Event("focus"))); await expect(input(page)).toBeEditable();
  await expect(input(page)).toHaveValue("Every"); await expect(count(page, "Historical errors")).toHaveText("0");
});

test("guided completion enforces corrected text and historical threshold", async ({ page }) => {
  await open(page); await page.getByLabel("Completion rule", { exact: true }).selectOption("guided");
  await committed(page, "Every small step makes a differenceX");
  await expect(page.getByRole("button", { name: "Finish", exact: true })).toBeDisabled();
  await page.keyboard.press("Backspace"); await committed(page, ".");
  await expect(page.getByRole("button", { name: "Finish", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Restart", exact: true }).click();
  await committed(page, "XXX"); await page.keyboard.press("Backspace"); await page.keyboard.press("Backspace"); await page.keyboard.press("Backspace");
  await committed(page, "Every small step makes a difference.");
  await expect(count(page, "Remaining errors")).toHaveText("0");
  await expect(page.getByRole("button", { name: "Finish", exact: true })).toBeDisabled();
});

test("external preference updates do not replace the active exercise", async ({ page, context }) => {
  await open(page); await committed(page, "Every");
  const other = await context.newPage(); await other.goto("/en/settings");
  await other.getByLabel("Practice language", { exact: true }).selectOption("ar");
  await expect(page.getByLabel("Practice language", { exact: true })).toHaveValue("en");
  await expect(input(page)).toHaveValue("Every"); await expect(count(page, "Attempts")).toHaveText("5");
  await other.close();
});

test("connected Arabic target, mixed direction, responsive overlays, and preview evidence", async ({ page }) => {
  await page.clock.install();
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await mkdir("docs/screens", { recursive: true });
  await page.goto("/ar/harness"); await page.locator("#harness-language").selectOption("ar");
  const textarea = page.locator("#typing-input"); await textarea.focus(); await page.keyboard.insertText("كل x");
  await page.clock.runFor(2000);
  expect(await page.locator("#typing-target").evaluate(node => node.childNodes.length)).toBe(1);
  await expect(page.locator(".typing-highlight.incorrect")).toHaveCount(1);
  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 1000 }); await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "docs/screens/phase2-arabic-harness.png", fullPage: true });
  await page.goto("/en/harness"); await committed(page, "Every X"); await page.clock.runFor(2000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("button", { name: "Typing tips", exact: true }).click();
  await page.screenshot({ path: "docs/screens/phase2-lookup-pause.png" });
  await page.keyboard.press("Escape"); await page.setViewportSize({ width: 360, height: 1000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "docs/screens/phase2-harness-mobile.png", fullPage: true });
  expect(errors).toEqual([]);
});
