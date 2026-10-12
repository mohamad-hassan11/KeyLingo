import { describe, it, expect } from "vitest";
import { LocalRepository, type StoragePort } from "./repository";
import { defaultPreferences, isPreferences, migratePreferences, browserLocale, PREFERENCES_VERSION } from "./preferences";

class MemoryStorage implements StoragePort {
  data = new Map<string, string>();
  fail = false;
  getItem(key: string) { if (this.fail) throw new Error("denied"); return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { if (this.fail) throw new Error("quota"); this.data.set(key, value); }
  removeItem(key: string) { this.data.delete(key); }
}
function setup() { const storage = new MemoryStorage(); return { storage, repo: new LocalRepository(storage, "prefs", isPreferences, PREFERENCES_VERSION, migratePreferences) }; }
const envelope = (payload: unknown, schemaVersion = PREFERENCES_VERSION) => JSON.stringify({ schemaVersion, revision: 1, savedAt: "2026-10-12T00:00:00.000Z", payload });

describe("recoverable local repository", () => {
  it("starts empty and saves a validated envelope", async () => {
    const { repo } = setup(); expect(await repo.load()).toEqual({ status: "empty" });
    const result = await repo.save(defaultPreferences(), 0);
    expect(result.status).toBe("ok");
    expect(await repo.load()).toMatchObject({ status: "ok", envelope: { revision: 1, schemaVersion: PREFERENCES_VERSION, payload: defaultPreferences() } });
  });
  it("backs up the last valid value before replacement", async () => {
    const { storage, repo } = setup(); await repo.save(defaultPreferences());
    await repo.save({ ...defaultPreferences(), theme: "dark" }, 1);
    expect(JSON.parse(storage.getItem("prefs.backup")!).payload.theme).toBe("system");
    expect(await repo.load()).toMatchObject({ envelope: { revision: 2, payload: { theme: "dark" } } });
  });
  it.each(["{broken", envelope(defaultPreferences(), 8), envelope({ theme: "dark" })])("does not overwrite damaged or unknown data: %s", async raw => {
    const { storage, repo } = setup(); storage.setItem("prefs", raw);
    expect((await repo.save(defaultPreferences())).status).toBe("blocked");
    expect(storage.getItem("prefs")).toBe(raw);
  });
  it("migrates the known v0 schema in memory without writing automatically", async () => {
    const { storage, repo } = setup(); const old = { ...defaultPreferences(), keyboardMapping: "us" }; delete (old as Partial<typeof old>).theme;
    const raw = envelope(old, 0); storage.setItem("prefs", raw);
    expect(await repo.load()).toMatchObject({ status: "ok", migrated: true, envelope: { schemaVersion: PREFERENCES_VERSION, payload: { theme: "system" } } });
    expect(storage.getItem("prefs")).toBe(raw);
  });
  it("rejects stale revision writes", async () => {
    const { repo } = setup(); await repo.save(defaultPreferences());
    expect(await repo.save({ ...defaultPreferences(), theme: "dark" }, 0)).toEqual({ status: "conflict" });
    expect(await repo.load()).toMatchObject({ envelope: { payload: { theme: "system" } } });
  });
  it("reports storage denial and quota failures without throwing", async () => {
    const { storage, repo } = setup(); storage.fail = true;
    expect(await repo.load()).toEqual({ status: "unavailable" });
    expect(await repo.save(defaultPreferences())).toEqual({ status: "unavailable" });
  });
  it("restores a validated backup and retains corrupt primary", async () => {
    const { storage, repo } = setup(); await repo.save(defaultPreferences()); await repo.save({ ...defaultPreferences(), theme: "dark" });
    storage.setItem("prefs", "broken"); expect((await repo.restoreBackup()).status).toBe("ok");
    expect(storage.getItem("prefs.recovery")).toBe("broken");
    expect(await repo.load()).toMatchObject({ envelope: { payload: { theme: "system" } } });
  });
  it("rejects invalid imports and corrupt backups without changing primary", async () => {
    const { storage, repo } = setup(); await repo.save(defaultPreferences()); const original = storage.getItem("prefs");
    expect(await repo.importJSON(envelope({ ...defaultPreferences(), theme: ["dark"] }))).toEqual({ status: "invalid" });
    storage.setItem("prefs.backup", "broken"); expect(await repo.restoreBackup()).toEqual({ status: "invalid" });
    expect(storage.getItem("prefs")).toBe(original);
  });
  it("imports valid data with a new local revision and backup", async () => {
    const { repo } = setup(); await repo.save(defaultPreferences());
    expect(await repo.importJSON(envelope({ ...defaultPreferences(), practiceLanguage: "ar" }))).toMatchObject({ status: "ok", envelope: { revision: 2, payload: { practiceLanguage: "ar" } } });
  });
  it("explicit reset preserves damaged data", async () => {
    const { repo, storage } = setup(); storage.setItem("prefs", "broken");
    expect((await repo.reset(defaultPreferences("nl"))).status).toBe("ok");
    expect(storage.getItem("prefs.recovery")).toBe("broken");
  });
});
describe("locale and preference boundaries", () => {
  it("selects supported browser languages, with English fallback", () => {
    expect(browserLocale(["fr-FR", "nl-NL"])).toBe("nl"); expect(browserLocale(["ar-EG"])).toBe("ar"); expect(browserLocale(["fr"])).toBe("en");
  });
  it("rejects invalid enum, length, and nested configuration", () => {
    expect(isPreferences({ ...defaultPreferences(), theme: ["dark"] })).toBe(false);
    expect(isPreferences({ ...defaultPreferences(), reflex: { length: -1, difficulty: "easy", seed: "x" } })).toBe(false);
    expect(isPreferences({ ...defaultPreferences(), interfaceLanguage: "fr" })).toBe(false);
  });
});

describe("fixed layout preference migration", () => {
  it.each(["us", "us-international", "arabic-101"])("removes the old editable mapping %s while preserving other preferences", async keyboardMapping => {
    const { repo, storage } = setup();
    const raw = envelope({ ...defaultPreferences(), practiceLanguage: "ar", theme: "dark", keyboardMapping }, 1);
    storage.setItem("prefs", raw);
    expect(await repo.load()).toMatchObject({ status: "ok", migrated: true, envelope: { schemaVersion: 2, payload: { practiceLanguage: "ar", theme: "dark" } } });
    expect(storage.getItem("prefs")).toBe(raw);
    const loaded = await repo.load();
    if (loaded.status === "ok") expect(loaded.envelope.payload).not.toHaveProperty("keyboardMapping");
  });
  it("rejects invalid old layouts and editable mappings in the new schema", async () => {
    const { repo, storage } = setup();
    storage.setItem("prefs", envelope({ ...defaultPreferences(), keyboardMapping: "unknown" }, 1));
    expect(await repo.load()).toEqual({ status: "corrupt" });
    expect(isPreferences({ ...defaultPreferences(), keyboardMapping: "us" })).toBe(false);
  });
});
