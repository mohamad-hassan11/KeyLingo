import { describe, expect, it } from "vitest";
import { categories, entries, draftEntries } from "@/content";
import { contentExercise, isContentEntry, validateCollection } from "./index";
import { changeVocabulary, emptyVocabulary, isVocabulary, savedWord } from "./vocabulary";
import { BundledTranslationProvider, dictionaryURL } from "@/lib/translation";
import { createSession, sessionResult, transition } from "../typing/engine";
import { addResult, emptyProgress, isProgress } from "../practice/progress";
import { LocalRepository, type StoragePort } from "@/lib/repository";
const provider = new BundledTranslationProvider(entries);
describe("pilot content", () => {
  it("covers every language/level/category once with valid ranges and independent review", () => {
    expect(entries).toHaveLength(84); expect(draftEntries).toHaveLength(84);
    expect(validateCollection(entries, categories)).toEqual([]);
    for (const entry of entries) {
      expect(entry.review.reviewer).not.toBe(entry.provenance.author);
      expect(entry.review.model).toBe("GPT-6-astra");
      expect(entry.review.findings.length).toBeGreaterThan(0);
      expect(entry.annotations.length).toBeGreaterThan(0);
      expect(entry.language !== "ar" || entry.category !== "casual" || entry.register === "informal-msa").toBe(true);
    }
  });
  it("rejects broken offsets, duplicate IDs, absent translations and incomplete review", () => {
    const entry = structuredClone(entries[0]);
    entry.annotations[0].end = 999; expect(isContentEntry(entry)).toBe(false);
    expect(isContentEntry({ ...entries[0], translations: { en: "home" } })).toBe(false);
    expect(isContentEntry({ ...entries[0], review: { ...entries[0].review, reviewer: "" } })).toBe(false);
    expect(validateCollection([entries[0], entries[0]], categories)).toContain(`Duplicate entry: ${entries[0].id}`);
  });
  it("validates source offsets at grapheme boundaries including astral and combining characters", () => {
    const entry = structuredClone(entries[0]);
    entry.text = "😀 cafe\u0301"; entry.translations.en = entry.text;
    entry.annotations[0] = { ...entry.annotations[0], start: 3, end: 8, surface: "cafe\u0301", translations: { en: "cafe\u0301", nl: "café", ar: "مقهى" } };
    expect(isContentEntry(entry)).toBe(true);
    entry.annotations[0].end = 7; entry.annotations[0].surface = "cafe";
    expect(isContentEntry(entry)).toBe(false);
  });
  it("produces completable vocabulary exercises and valid progress snapshots", () => {
    for (const entry of entries) {
      const exercise = contentExercise(entry, "optional");
      let session = createSession(exercise, entry.id, 0);
      session = transition(session, { type: "insert", text: entry.text }, 100).session;
      session = transition(session, { type: "finish" }, 1100).session;
      expect(session.status).toBe("completed");
      expect(isProgress(addResult(emptyProgress(), sessionResult(session)!, "2026-10-12T12:00:00Z"))).toBe(true);
    }
  });
});
describe("curated translation", () => {
  it("resolves every full-text and contextual word translation across all six directions", async () => {
    for (const entry of entries) for (const targetLanguage of ["en", "nl", "ar"] as const) {
      const result = await provider.lookup({ sourceLanguage: entry.language, targetLanguage, kind: "sentence", query: entry.text, contentId: entry.id });
      expect(result.status === "found" && result.text).toBe(entry.translations[targetLanguage]);
      expect(result.status === "found" && result.sameLanguage).toBe(entry.language === targetLanguage);
      for (const annotation of entry.annotations) {
        const word = await provider.lookup({ sourceLanguage: entry.language, targetLanguage, kind: "word", query: annotation.lemma, contentId: entry.id, senseId: annotation.senseId });
        expect(word.status === "found" && word.text).toBe(annotation.translations[targetLanguage]);
      }
    }
  });
  it("returns honest missing/ambiguous results and excludes draft entries", async () => {
    const source = entries[0]; const draft = { ...source, review: { ...source.review, status: "draft" as const } };
    expect((await new BundledTranslationProvider([draft]).lookup({ sourceLanguage: source.language, targetLanguage: "nl", kind: "sentence", query: source.text })).status).toBe("missing");
    const ambiguous = structuredClone(source); ambiguous.id = "another-sense"; ambiguous.annotations[0].senseId = "different-sense";
    expect(await new BundledTranslationProvider([source, ambiguous]).lookup({ sourceLanguage: source.language, targetLanguage: "nl", kind: "word", query: source.annotations[0].surface })).toMatchObject({ status: "missing", reason: "ambiguous", choices: expect.any(Array) });
    expect(await provider.lookup({ sourceLanguage: "ar", targetLanguage: "en", kind: "word", query: "كلمة مجهولة" })).toEqual({ status: "missing", reason: "not-found", choices: [] });
    expect(dictionaryURL("a/b ?#", "nl")).toBe("https://nl.wiktionary.org/wiki/a%2Fb%20%3F%23");
  });
});
describe("saved vocabulary", () => {
  it("keeps source context and target snapshots, deduplicates and removes explicitly", async () => {
    const entry = entries[0], annotation = entry.annotations[0];
    const result = await provider.lookup({ sourceLanguage: entry.language, targetLanguage: "nl", kind: "word", query: annotation.surface, contentId: entry.id });
    if (result.status !== "found") throw new Error("Missing fixture");
    const item = savedWord(result, "nl", "2026-10-12T12:00:00Z")!;
    let vocabulary = changeVocabulary(emptyVocabulary(), { type: "save", item });
    vocabulary = changeVocabulary(vocabulary, { type: "save", item });
    expect(vocabulary.items).toHaveLength(1); expect(vocabulary.items[0].context).toBe(entry.text);
    expect(isVocabulary(vocabulary)).toBe(true);
    expect(isVocabulary({ items: [{ ...item, id: "forged" }] })).toBe(false);
    expect(isVocabulary({ items: [item, item] })).toBe(false);
    expect(changeVocabulary(vocabulary, { type: "remove", id: item.id })).toEqual(emptyVocabulary());
  });
  it("validates storage/imports and preserves corrupt/future data, with recoverable backups", async () => {
    const data = new Map<string, string>();
    const port: StoragePort = { getItem: key => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value); }, removeItem: key => { data.delete(key); } };
    const repo = new LocalRepository(port, "words", isVocabulary);
    expect((await repo.save(emptyVocabulary())).status).toBe("ok");
    expect((await repo.save(emptyVocabulary())).status).toBe("ok");
    data.set("words", "broken"); expect((await repo.save(emptyVocabulary())).status).toBe("blocked");
    expect(data.get("words")).toBe("broken");
    expect((await repo.restoreBackup()).status).toBe("ok"); expect(data.get("words.recovery")).toBe("broken");
    expect((await repo.importJSON(JSON.stringify({ schemaVersion: 1, revision: 1, savedAt: "2026-10-12", payload: { items: ["invalid"] } }))).status).toBe("invalid");
    data.set("words", JSON.stringify({ schemaVersion: 999, revision: 1, savedAt: "2026-10-12", payload: emptyVocabulary() }));
    expect((await repo.load()).status).toBe("unknown-version"); expect((await repo.save(emptyVocabulary())).status).toBe("blocked");
    const quota = new LocalRepository({ ...port, setItem: () => { throw new Error("quota"); }, getItem: () => null }, "quota", isVocabulary);
    expect((await quota.save(emptyVocabulary())).status).toBe("unavailable");
  });
});
