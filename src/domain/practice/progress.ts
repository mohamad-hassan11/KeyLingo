import { lessons } from "./index";
import { type SessionResult, type CharacterStatistics, METRICS_VERSION } from "../typing/engine";
import { segmentText } from "../typing/text";
import { mappingIds } from "../keyboard";
const record = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const count = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) >= 0;
const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;
const language = (v: unknown) => ["en", "nl", "ar"].includes(String(v));
export type HistoryItem = { savedAt: string; result: SessionResult };
export type Progress = { sessions: HistoryItem[]; totalSessions: number; completedSessions: number; activeMs: number; attempts: number; errors: number; characterStatistics: Record<string, CharacterStatistics>; lessonCompletions: Record<string, string> };
export function emptyProgress(): Progress { return { sessions: [], totalSessions: 0, completedSessions: 0, activeMs: 0, attempts: 0, errors: 0, characterStatistics: {}, lessonCompletions: {} }; }
export const completionKey = (lesson: typeof lessons[number]) => `${lesson.id}@${lesson.version}:mapping@1`;
function statisticsValid(value: unknown): value is CharacterStatistics {
  return record(value) && Object.keys(value).length <= 1000 && Object.entries(value).every(([key, stat]) => key.length > 0 && key.length <= 100 && record(stat) && count(stat.attempts) && count(stat.errors) && stat.errors <= stat.attempts);
}
export function isSessionResult(value: unknown): value is SessionResult {
  if (!record(value) || typeof value.sessionId !== "string" || !value.sessionId || value.sessionId.length > 100 || value.metricsVersion !== METRICS_VERSION || !["completed", "abandoned"].includes(String(value.outcome)) || !record(value.exercise) || !record(value.metrics)) return false;
  const e = value.exercise, m = value.metrics;
  if (typeof e.id !== "string" || !e.id || e.id.length > 200 || !count(e.version) || e.version < 1 || !["guided", "reflex", "vocabulary"].includes(String(e.mode)) || typeof e.text !== "string" || e.text.length > 10000 || !language(e.language) || e.direction !== (e.language === "ar" ? "rtl" : "ltr") || ![...mappingIds, "us-international"].includes(String(e.keyboardMapping)) || !record(e.comparison) || e.comparison.language !== e.language || !["optional", "strict"].includes(String(e.comparison.diacritics))) return false;
  if (!count(value.attempts) || !count(value.errors) || value.errors > value.attempts || !count(value.retainedCorrect) || !count(value.remainingErrors) || !finite(m.activeMs) || !statisticsValid(value.characterStatistics)) return false;
  const target = segmentText(e.text, e.comparison as SessionResult["exercise"]["comparison"]);
  const length = target.units.length;
  const expectedCharacters = new Set(target.units.map(unit => unit.comparison));
  if (Object.keys(value.characterStatistics).some(key => !expectedCharacters.has(key))) return false;
  if (!length || value.retainedCorrect + value.remainingErrors > length || value.retainedCorrect + value.remainingErrors > value.attempts || (value.outcome === "completed" && value.retainedCorrect + value.remainingErrors !== length)) return false;
  const expectedAccuracy = value.attempts ? 100 * (value.attempts - value.errors) / value.attempts : null;
  const minutes = m.activeMs / 60000;
  const equal = (a: unknown, b: number | null) => b === null ? a === null : finite(a) && Math.abs(a - b) < 1e-8;
  if (!equal(m.accuracy, expectedAccuracy) || !equal(m.grossWpm, value.attempts && minutes ? value.attempts / (5 * minutes) : null) || !equal(m.netWpm, value.attempts && minutes ? value.retainedCorrect / (5 * minutes) : null)) return false;
  if (value.outcome === "completed" && e.mode === "guided" && (value.remainingErrors > 0 || (expectedAccuracy ?? 0) < 95)) return false;
  if (e.source !== undefined) {
    if (!record(e.source)) return false;
    if (e.source.kind !== "content" && (!count(e.source.mappingVersion) || e.source.mappingVersion < 1)) return false;
    if (e.source.kind === "lesson") {
      if (e.mode !== "guided" || typeof e.source.lessonId !== "string" || e.source.lessonId !== e.id || !count(e.source.lessonVersion) || e.source.lessonVersion !== e.version) return false;
    } else if (e.source.kind === "reflex") {
      const c = e.source.config;
      if (e.mode !== "reflex" || !record(c) || c.mapping !== e.keyboardMapping || (c.language !== undefined && c.language !== e.language) || !count(c.version) || c.version !== e.version || !count(c.length) || c.length < 10 || c.length > 1000 || c.length !== length || typeof c.seed !== "string" || c.seed.length > 100 || !["easy", "medium", "hard"].includes(String(c.difficulty)) || !["random", "adjacent", "alternating", "repeated"].includes(String(c.pattern)) || typeof c.shift !== "boolean" || typeof c.punctuation !== "boolean") return false;
    } else if (e.source.kind === "content") {
      if (e.mode !== "vocabulary" || e.source.contentId !== e.id || e.source.contentVersion !== e.version) return false;
    } else return false;
  }
  const stats = Object.values(value.characterStatistics);
  return stats.reduce((sum, s) => sum + s.attempts, 0) === value.attempts && stats.reduce((sum, s) => sum + s.errors, 0) === value.errors;
}
export function isProgress(value: unknown): value is Progress {
  if (!record(value) || !Array.isArray(value.sessions) || value.sessions.length > 500 || !count(value.totalSessions) || !count(value.completedSessions) || value.completedSessions > value.totalSessions || value.totalSessions < value.sessions.length || !finite(value.activeMs) || !count(value.attempts) || !count(value.errors) || value.errors > value.attempts || !record(value.characterStatistics) || !record(value.lessonCompletions)) return false;
  const ids = new Set<string>();
  for (const item of value.sessions) {
    if (!record(item) || typeof item.savedAt !== "string" || !Number.isFinite(Date.parse(item.savedAt)) || !isSessionResult(item.result) || ids.has(item.result.sessionId)) return false;
    ids.add(item.result.sessionId);
  }
  const retained = value.sessions as HistoryItem[];
  if (value.completedSessions < retained.filter(item => item.result.outcome === "completed").length || value.attempts < retained.reduce((sum, item) => sum + item.result.attempts, 0) || value.errors < retained.reduce((sum, item) => sum + item.result.errors, 0) || value.activeMs < retained.reduce((sum, item) => sum + item.result.metrics.activeMs, 0)) return false;
  const aggregates = Object.values(value.characterStatistics);
  if (!aggregates.every(statisticsValid)) return false;
  const stats = aggregates.flatMap(group => Object.entries(group));
  if (stats.some(([key]) => segmentText(key, { language: "en", diacritics: "strict" }).units.length !== 1) || stats.reduce((sum, [, s]) => sum + s.attempts, 0) !== value.attempts || stats.reduce((sum, [, s]) => sum + s.errors, 0) !== value.errors) return false;
  return Object.keys(value.characterStatistics).length <= 20 && Object.entries(value.characterStatistics).every(([key, stats]) => /^(us|us-international|arabic-101):(en|nl|ar):v\d+$/.test(key) && statisticsValid(stats)) && Object.entries(value.lessonCompletions).every(([key, date]) => key.length <= 200 && /@\d+:mapping@\d+$/.test(key) && typeof date === "string" && Number.isFinite(Date.parse(date)));
}
export function addResult(progress: Progress, result: SessionResult, savedAt: string): Progress {
  if (!isSessionResult(result) || !Number.isFinite(Date.parse(savedAt))) throw new Error("Invalid session result");
  if (progress.sessions.some(item => item.result.sessionId === result.sessionId)) return progress;
  const group = `${result.exercise.keyboardMapping}:${result.exercise.language}:v${result.metricsVersion}`;
  const stats = { ...progress.characterStatistics[group] };
  for (const [key, value] of Object.entries(result.characterStatistics)) {
    const previous = Object.hasOwn(stats, key) ? stats[key] : { attempts: 0, errors: 0 };
    Object.defineProperty(stats, key, { value: { attempts: previous.attempts + value.attempts, errors: previous.errors + value.errors }, enumerable: true, configurable: true, writable: true });
  }
  const completions = { ...progress.lessonCompletions };
  const source = result.exercise.source;
  if (result.outcome === "completed" && source?.kind === "lesson") {
    const lesson = lessons.find(item => item.id === source.lessonId && item.version === source.lessonVersion && item.mapping === result.exercise.keyboardMapping && source.mappingVersion === 1 && item.exercise.text === result.exercise.text);
    if (lesson) completions[completionKey(lesson)] ??= savedAt;
  }
  return { sessions: [...progress.sessions, { savedAt, result: structuredClone(result) }].slice(-500), totalSessions: progress.totalSessions + 1, completedSessions: progress.completedSessions + Number(result.outcome === "completed"), activeMs: progress.activeMs + result.metrics.activeMs, attempts: progress.attempts + result.attempts, errors: progress.errors + result.errors, characterStatistics: { ...progress.characterStatistics, [group]: stats }, lessonCompletions: completions };
}
