import { describe, it, expect } from "vitest";
import { lessons, generate, GENERATOR_VERSION, type GeneratorConfig } from "./index";
import { keys, adjacent, mappingIds, keyboardMappings, recipesForText, defaultMappingForLanguage } from "../keyboard";
import { createSession, transition, sessionResult } from "../typing/engine";
import { emptyProgress, addResult, isProgress, isSessionResult, completionKey } from "./progress";
import { segmentText } from "../typing/text";
function finish(id: string) {
  const lesson = lessons.find(item => item.id === id)!;
  let session = createSession(lesson.exercise, id + "-session", 0);
  session = transition(session, { type: "insert", text: lesson.exercise.text }, 100).session;
  session = transition(session, { type: "finish" }, 1100).session;
  return sessionResult(session)!;
}
const config: GeneratorConfig = { mapping: "us", seed: "test", version: GENERATOR_VERSION, length: 60, difficulty: "easy", pattern: "random", punctuation: false, shift: false };
describe("physical keyboard and recipes", () => {
  it("has unique physical IDs and language-independent geometry", () => {
    expect(new Set(keys.map(key => key.id)).size).toBe(keys.length);
    expect(adjacent("KeyF", "KeyG")).toBe(true); expect(adjacent("KeyF", "KeyP")).toBe(false);
    expect(keys.find(key => key.id === "KeyF")).toMatchObject({ hand: "left", finger: "index" });
    expect(keys.find(key => key.id === "KeyJ")).toMatchObject({ hand: "right", finger: "index" });
    expect(keys.find(key => key.id === "KeyA")).toMatchObject({ hand: "left", finger: "pinky" });
  });
  it("models default layouts and Arabic multi-character outputs", () => {
    expect(mappingIds).toEqual(["us", "arabic-101"]);
    expect(defaultMappingForLanguage("en")).toBe("us");
    expect(defaultMappingForLanguage("nl")).toBe("us");
    expect(defaultMappingForLanguage("ar")).toBe("arabic-101");
    expect(recipesForText(keyboardMappings["arabic-101"], "لا")[0].steps[0].keyId).toBe("KeyB");
    expect(keyboardMappings["arabic-101"].recipes.find(r => r.id === "Digit9:shift")?.output).toBe(")");
  });
});
describe("curriculum", () => {
  it("provides 12 ordered versioned lessons for each mapping with reachable completion", () => {
    expect(lessons).toHaveLength(24);
    for (const mapping of mappingIds) {
      const curriculum = lessons.filter(l => l.mapping === mapping); expect(curriculum).toHaveLength(12);
      for (const lesson of curriculum) {
        expect(lesson.prerequisites).toEqual(lesson.index ? [curriculum[lesson.index - 1].id] : []);
        expect(lesson.recipeIds.map(id => keyboardMappings[mapping].recipes.find(r => r.id === id)!.output).join("")).toBe(lesson.exercise.text);
        const result = finish(lesson.id); expect(result.outcome).toBe("completed"); expect(result.metrics.accuracy).toBe(100); expect(isSessionResult(result)).toBe(true);
      }
    }
  });
});
describe("generator", () => {
  it("reproduces a seed, changes with seed, and captures configuration", () => {
    expect(generate(config)).toEqual(generate(config)); expect(generate({ ...config, seed: "other" })).not.toEqual(generate(config));
    const generated = generate(config); expect(generated.ok).toBe(true);
    if (generated.ok) expect(generated.exercise.source).toMatchObject({ kind: "reflex", config });
  });
  it("emits supported recipes at exact grapheme length across mappings, options and patterns", () => {
    for (const mapping of mappingIds) for (const pattern of ["random", "adjacent", "alternating", "repeated"] as const) for (const length of [10, 61, 1000]) {
      const result = generate({ ...config, mapping, pattern, length, difficulty: "hard", shift: true, punctuation: true });
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(segmentText(result.exercise.text, result.exercise.comparison).units).toHaveLength(length);
      const recipes = result.recipeIds.map(id => keyboardMappings[mapping].recipes.find(r => r.id === id)!);
      expect(recipes.map(r => r.output).join("")).toBe(result.exercise.text);
      recipes.slice(1).forEach((recipe, i) => {
        const a = recipes[i].steps[0].keyId, b = recipe.steps[0].keyId;
        if (pattern === "adjacent") expect(adjacent(a, b)).toBe(true);
        if (pattern === "alternating") expect(keys.find(k => k.id === a)!.hand).not.toBe(keys.find(k => k.id === b)!.hand);
        if (pattern === "repeated" && (i + 1) % 3) expect(a).toBe(b);
      });
    }
  });
  it("rejects invalid parameters rather than silently changing them", () => {
    expect(generate({ ...config, length: 1 })).toEqual({ ok: false, reason: "invalid-config" });
    expect(generate({ ...config, version: 999 })).toEqual({ ok: false, reason: "invalid-config" });
  });
});
describe("progress", () => {
  it("deduplicates sessions and records only matching versioned completed lessons", () => {
    const result = finish("us-home"); const progress = addResult(emptyProgress(), result, "2026-10-12T10:00:00Z");
    expect(addResult(progress, result, "2026-10-12T11:00:00Z")).toBe(progress);
    expect(progress.lessonCompletions[completionKey(lessons[0])]).toBeTruthy(); expect(isProgress(progress)).toBe(true);
    const old = structuredClone(result); old.sessionId = "old"; if (old.exercise.source?.kind === "lesson") old.exercise.source.mappingVersion = 2;
    expect(addResult(emptyProgress(), old, "2026-10-12T10:00:00Z").lessonCompletions).toEqual({});
  });
  it("bounds history at 500 without losing cumulative totals", () => {
    let progress = emptyProgress(); const result = finish("us-home");
    for (let i = 0; i < 501; i++) progress = addResult(progress, { ...result, sessionId: `id-${i}` }, "2026-10-12T10:00:00Z");
    expect(progress.sessions).toHaveLength(500); expect(progress.totalSessions).toBe(501); expect(progress.attempts).toBe(result.attempts * 501); expect(isProgress(progress)).toBe(true);
  });
  it("rejects forged metrics, duplicate IDs and corrupt payloads", () => {
    const result = finish("us-home"); expect(isSessionResult({ ...result, errors: 999999 })).toBe(false);
    expect(isSessionResult({ ...result, metrics: { ...result.metrics, accuracy: 70 } })).toBe(false);
    const progress = addResult(emptyProgress(), result, "2026-10-12T10:00:00Z");
    expect(isProgress({ ...progress, sessions: [...progress.sessions, ...progress.sessions] })).toBe(false);
    expect(isProgress({ ...progress, completedSessions: 100 })).toBe(false);
  });
});
it("reports an explicit empty-eligibility result when a pattern cannot fit the remainder", () => {
  const results = Array.from({ length: 100 }, (_, seed) => generate({ ...config, mapping: "arabic-101", difficulty: "hard", pattern: "repeated", length: 11, seed: String(seed) }));
  expect(results.some(result => !result.ok && result.reason === "no-eligible-outputs")).toBe(true);
});
it("seed reproducibility depends on values rather than object property order", () => {
  const reordered = { shift: config.shift, punctuation: config.punctuation, pattern: config.pattern, difficulty: config.difficulty, length: config.length, version: config.version, seed: config.seed, mapping: config.mapping };
  expect(generate(reordered)).toEqual(generate(config));
});

it("generates Dutch practice with its fixed US layout and rejects language/layout mismatches", () => {
  const result = generate({ ...config, language: "nl" });
  expect(result.ok && result.exercise.language).toBe("nl");
  expect(generate({ ...config, language: "ar" })).toEqual({ ok: false, reason: "invalid-config" });
});
it("preserves historical results using a retired mapping", () => {
  const result = finish("us-home"); result.exercise.keyboardMapping = "us-international";
  const progress = addResult(emptyProgress(), result, "2026-10-12T10:00:00Z");
  expect(isProgress(progress)).toBe(true);
  expect(progress.sessions[0].result.exercise.keyboardMapping).toBe("us-international");
});
