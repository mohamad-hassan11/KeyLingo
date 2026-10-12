import { describe, expect, it } from "vitest";
import { createSession, transition, snapshot, sessionResult, type Exercise, type Session, type Command } from "./engine";
import { segmentText, inferNativeEdit } from "./text";

function exercise(text = "abc", overrides: Partial<Exercise> = {}): Exercise {
  return { id: "test", version: 1, mode: "vocabulary", text, language: "en", direction: "ltr",
    comparison: { language: "en", diacritics: "strict" }, keyboardMapping: "us", ...overrides };
}
function apply(session: Session, command: Command, now = session.lastTimestamp + 1000) {
  const result = transition(session, command, now);
  expect(result.accepted).toBe(true);
  return result.session;
}
function arabic(text: string, diacritics: "strict" | "optional" = "optional") {
  return exercise(text, { language: "ar", direction: "rtl", comparison: { language: "ar", diacritics }, keyboardMapping: "arabic-101" });
}

describe("typing lifecycle and historical metrics", () => {
  it("has unavailable metrics before first input, including long initial waits", () => {
    const s = createSession(exercise(), "one", 0);
    expect(snapshot(s, 60000).metrics).toEqual({ activeMs: 0, accuracy: null, grossWpm: null, netWpm: null });
    expect(sessionResult(s)).toBeNull();
  });
  it("starts at first insertion and guards zero elapsed speed", () => {
    const s = apply(createSession(exercise(), "one", 0), { type: "insert", text: "a" }, 10000);
    expect(snapshot(s, 10000).metrics).toEqual({ activeMs: 0, accuracy: 100, grossWpm: null, netWpm: null });
    expect(snapshot(s, 70000).metrics.netWpm).toBeCloseTo(.2);
  });
  it("advances on errors, permits correction, and keeps historical errors", () => {
    let s = apply(createSession(exercise(), "one", 0), { type: "insert", text: "x" });
    expect(snapshot(s, 1000)).toMatchObject({ position: 1, states: ["incorrect", "pending", "pending"] });
    s = apply(s, { type: "delete" }); s = apply(s, { type: "insert", text: "abc" });
    expect(s.attempts).toBe(4); expect(s.errors).toBe(1);
    expect(snapshot(s, 63000).metrics).toEqual({ activeMs: 62000, accuracy: 75, grossWpm: 4 / (5 * (62 / 60)), netWpm: 3 / (5 * (62 / 60)) });
    expect(s.characterStatistics.a).toEqual({ attempts: 2, errors: 1 });
  });
  it("counts repeated incorrect attempts even after deletion", () => {
    let s = createSession(exercise("a"), "one", 0);
    for (let i = 0; i < 3; i++) { s = apply(s, { type: "insert", text: "x" }); s = apply(s, { type: "delete" }); }
    s = apply(s, { type: "insert", text: "a" });
    expect(s).toMatchObject({ attempts: 4, errors: 3 }); expect(snapshot(s, s.lastTimestamp).metrics.accuracy).toBe(25);
  });
  it("does not finish automatically at target length and rejects overflow atomically", () => {
    let s = apply(createSession(exercise("ab"), "one", 0), { type: "insert", text: "ab" });
    expect(s.status).toBe("running"); expect(snapshot(s, 2000).finishBlock).toBeNull();
    const rejected = transition(s, { type: "insert", text: "cd" }, 2000);
    expect(rejected).toMatchObject({ accepted: false, reason: "capacity" }); expect(rejected.session).toBe(s);
    s = apply(s, { type: "delete" }, 2000); expect(snapshot(s, 2000).finishBlock).toBe("incomplete");
  });
  it.each(["vocabulary", "reflex"] as const)("permits %s completion with retained errors and freezes results", mode => {
    let s = apply(createSession(exercise("ab", { mode }), "one", 0), { type: "insert", text: "ax" }, 1000);
    s = apply(s, { type: "finish" }, 61000);
    const result = sessionResult(s)!;
    expect(result).toMatchObject({ sessionId: "one", outcome: "completed", metricsVersion: 1, attempts: 2, errors: 1, retainedCorrect: 1, remainingErrors: 1 });
    expect(result.metrics).toEqual({ activeMs: 60000, grossWpm: .4, netWpm: .2, accuracy: 50 });
    expect(snapshot(s, 999999).metrics).toEqual(result.metrics);
    expect(transition(s, { type: "insert", text: "a" }, 62000)).toMatchObject({ accepted: false, reason: "ended" });
    result.characterStatistics.a.attempts = 99; expect(s.characterStatistics.a.attempts).toBe(1);
  });
  it("guided mode requires both corrected target and 95% historical accuracy", () => {
    let s = apply(createSession(exercise("ab", { mode: "guided" }), "one", 0), { type: "insert", text: "ax" });
    expect(transition(s, { type: "finish" }, 2000)).toMatchObject({ accepted: false, reason: "correct-target" });
    s = apply(s, { type: "delete" }); s = apply(s, { type: "insert", text: "b" });
    expect(transition(s, { type: "finish" }, 4000)).toMatchObject({ accepted: false, reason: "accuracy" });
    let longer = apply(createSession(exercise("a".repeat(19), { mode: "guided" }), "two", 0), { type: "insert", text: "x" });
    longer = apply(longer, { type: "delete" }); longer = apply(longer, { type: "insert", text: "a".repeat(19) });
    expect(snapshot(longer, 4000).metrics.accuracy).toBe(95);
    expect(transition(longer, { type: "finish" }, 4000).accepted).toBe(true);
  });
  it("excludes the union of nested pauses and does not restart an existing pause", () => {
    let s = apply(createSession(exercise(), "one", 0), { type: "insert", text: "a" }, 1000);
    s = apply(s, { type: "pause", reason: "manual" }, 2000);
    s = apply(s, { type: "pause", reason: "lookup" }, 3000);
    s = apply(s, { type: "pause", reason: "manual" }, 4000);
    s = apply(s, { type: "resume", reason: "lookup" }, 8000);
    expect(s.status).toBe("paused"); expect(snapshot(s, 9000).metrics.activeMs).toBe(1000);
    expect(transition(s, { type: "insert", text: "b" }, 9000)).toMatchObject({ accepted: false, reason: "paused" });
    s = apply(s, { type: "resume", reason: "manual" }, 10000);
    expect(snapshot(s, 12000).metrics.activeMs).toBe(3000);
  });
  it("can pause a ready session without starting the clock", () => {
    let s = apply(createSession(exercise(), "one", 0), { type: "pause", reason: "focus" });
    expect(s.status).toBe("ready"); expect(transition(s, { type: "insert", text: "a" }, 2000).accepted).toBe(false);
    s = apply(s, { type: "resume", reason: "focus" }); expect(s.runningSince).toBeNull();
  });
  it("handles abandonment, incomplete finish, and restart with a new identity", () => {
    let s = createSession(exercise(), "one", 0);
    expect(transition(s, { type: "finish" }, 1000)).toMatchObject({ reason: "incomplete" });
    s = apply(s, { type: "abandon" }); expect(sessionResult(s)).toMatchObject({ outcome: "abandoned", metrics: { accuracy: null, activeMs: 0 } });
    s = apply(s, { type: "restart", sessionId: "two" }); expect(s).toMatchObject({ id: "two", status: "ready", attempts: 0, errors: 0, pauseReasons: [] });
  });
  it("rejects invalid timestamps and empty comparison targets", () => {
    expect(() => createSession(exercise(""), "one", 0)).toThrow();
    expect(() => createSession(arabic("ـَ"), "one", 0)).toThrow();
    const s = createSession(exercise(), "one", 1000);
    expect(() => snapshot(s, 999)).toThrow(RangeError);
    expect(() => transition(s, { type: "insert", text: "a" }, NaN)).toThrow(RangeError);
  });
  it("preserves state immutability", () => {
    const s = createSession(exercise(), "one", 0);
    const inserted = apply(s, { type: "insert", text: "x" });
    expect(s.acceptedText).toBe(""); expect(s.characterStatistics).toEqual({});
    const deleted = apply(inserted, { type: "delete" }); expect(inserted.acceptedText).toBe("x"); expect(deleted.acceptedText).toBe("");
  });
});

describe("Unicode comparison and logical offsets", () => {
  it("maps source UTF-16 offsets, normalized offsets, and grapheme indices", () => {
    const text = segmentText("e\u0301🙂\r\nx", { language: "nl", diacritics: "strict" });
    expect(text.normalized).toBe("é🙂\nx"); expect(text.units).toHaveLength(4);
    expect(text.units.map(g => [g.originalStart, g.originalEnd, g.normalizedStart, g.normalizedEnd, g.unitIndex]))
      .toEqual([[0, 2, 0, 1, 0], [2, 4, 1, 3, 1], [4, 6, 3, 4, 2], [6, 7, 4, 5, 3]]);
  });
  it("accepts decomposed Dutch accents and counts spaces/newlines", () => {
    const s = apply(createSession(exercise("é \nx", { language: "nl", comparison: { language: "nl", diacritics: "strict" } }), "one", 0), { type: "insert", text: "e\u0301 \r\nx" });
    expect(s.acceptedText).toBe("é \nx"); expect(s.attempts).toBe(4); expect(s.errors).toBe(0);
  });
  it("reconciles a dead-key combining mark into its existing attempt", () => {
    let s = apply(createSession(exercise("é"), "one", 0), { type: "insert", text: "e" });
    s = apply(s, { type: "insert", text: "\u0301" });
    expect(s).toMatchObject({ acceptedText: "é", attempts: 1, errors: 1 });
    expect(snapshot(s, 3000)).toMatchObject({ correct: 1, remainingErrors: 0 });
  });
  it("counts an incorrect inserted mark once without extra attempts", () => {
    let s = apply(createSession(exercise("a"), "one", 0), { type: "insert", text: "a" });
    s = apply(s, { type: "insert", text: "\u0301" }); s = apply(s, { type: "insert", text: "\u0300" });
    expect(s.attempts).toBe(1); expect(s.errors).toBe(1);
    expect(s.characterStatistics.a).toEqual({ attempts: 1, errors: 1 });
  });
  it("reconciles deletion of a combining mark without scoring a deletion", () => {
    let s = apply(createSession(exercise("é"), "one", 0), { type: "insert", text: "é" });
    s = apply(s, { type: "delete", retainedText: "e" });
    expect(s).toMatchObject({ attempts: 1, errors: 0, acceptedText: "e" }); expect(snapshot(s, 3000).remainingErrors).toBe(1);
  });
  it("ignores optional Arabic marks and tatweel but keeps display offsets", () => {
    const target = segmentText("كُـلّ", { language: "ar", diacritics: "optional" });
    expect(target.units.map(g => g.comparison)).toEqual(["ك", "ل"]);
    expect(target.graphemes[1].unitIndex).toBeNull();
    let s = apply(createSession(arabic("كُلّ"), "one", 0), { type: "insert", text: "ك" });
    s = apply(s, { type: "insert", text: "ُـلّ" });
    expect(s).toMatchObject({ attempts: 2, errors: 0, acceptedText: "كُـلّ" });
    expect(snapshot(s, 3000).correct).toBe(2);
  });
  it("ignored marks alone neither count attempts nor start time", () => {
    const s = apply(createSession(arabic("ب"), "one", 0), { type: "insert", text: "ـَ" });
    expect(s).toMatchObject({ attempts: 0, status: "ready", startedAt: null });
  });
  it("strict Arabic counts a modified grapheme once and retains historic errors", () => {
    let s = apply(createSession(arabic("بَ", "strict"), "one", 0), { type: "insert", text: "ب" });
    s = apply(s, { type: "insert", text: "َ" });
    expect(s).toMatchObject({ attempts: 1, errors: 1 }); expect(snapshot(s, 3000).correct).toBe(1);
    const exact = apply(createSession(arabic("بَ", "strict"), "two", 0), { type: "insert", text: "بَ" });
    expect(exact.errors).toBe(0);
  });
  it.each([["أ", "ا"], ["إ", "ا"], ["آ", "ا"], ["ى", "ي"], ["ؤ", "و"], ["ئ", "ي"]])("preserves meaningful Arabic distinction %s / %s", (target, actual) => {
    const s = apply(createSession(arabic(target), "one", 0), { type: "insert", text: actual }); expect(s.errors).toBe(1);
  });
  it("normalizes decomposed hamza without removing it", () => {
    const s = apply(createSession(arabic("أ"), "one", 0), { type: "insert", text: "ا\u0654" }); expect(s.errors).toBe(0);
  });
  it("accepts Arabic multi-character output and mixed RTL/LTR in logical order", () => {
    const s = apply(createSession(arabic("لا 12!"), "one", 0), { type: "insert", text: "لا 12!" });
    expect(s.attempts).toBe(6); expect(snapshot(s, 3000).states).toEqual(Array(6).fill("correct"));
  });
  it("handles emoji grapheme extensions rather than UTF-16 characters", () => {
    let s = apply(createSession(exercise("👩‍💻"), "one", 0), { type: "insert", text: "👩" });
    s = apply(s, { type: "insert", text: "‍💻" });
    expect(s.attempts).toBe(1); expect(snapshot(s, 3000).correct).toBe(1);
    s = apply(s, { type: "delete" }); expect(s.acceptedText).toBe("");
  });
  it("rejects arbitrary replacement and derives normalized native edits", () => {
    expect(inferNativeEdit("e", "é")).toEqual({ type: "insert", text: "\u0301" });
    expect(inferNativeEdit("é", "e")).toEqual({ type: "delete", retainedText: "e" });
    expect(inferNativeEdit("é", "e\u0301")).toEqual({ type: "unchanged" });
    expect(inferNativeEdit("abc", "axc")).toEqual({ type: "unsupported" });
    const s = apply(createSession(exercise(), "one", 0), { type: "insert", text: "ab" });
    expect(transition(s, { type: "delete", retainedText: "x" }, 2000)).toMatchObject({ reason: "unsupported" });
  });
  it("reconciles reordered Arabic marks and rejects replacement of an existing mark", () => {
    expect(inferNativeEdit("بّ", "بَّ")).toEqual({ type: "insert", text: "َ" });
    expect(inferNativeEdit("بَّ", "بّ")).toEqual({ type: "delete", retainedText: "بّ" });
    expect(inferNativeEdit("بّ", "بَ")).toEqual({ type: "unsupported" });
    let s = apply(createSession(arabic("بَّ", "strict"), "one", 0), { type: "insert", text: "بّ" });
    s = apply(s, { type: "insert", text: "َ" });
    expect(s).toMatchObject({ attempts: 1, errors: 1 }); expect(snapshot(s, 3000).correct).toBe(1);
    s = apply(s, { type: "delete", retainedText: "بّ" }); expect(s.attempts).toBe(1);
  });
  it("reconciles canonical Latin accent reordering without accepting arbitrary edits", () => {
    expect(inferNativeEdit("é", "ȩ́")).toEqual({ type: "insert", text: "\u0327" });
    expect(inferNativeEdit("café", "cafȩ́!")).toEqual({ type: "insert", text: "\u0327!" });
    expect(inferNativeEdit("café", "cáfȩ́")).toEqual({ type: "unsupported" });
    expect(inferNativeEdit("á", "à")).toEqual({ type: "unsupported" });
  });
});
