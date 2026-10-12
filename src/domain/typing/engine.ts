import { normalizeText, segmentText, inferNativeEdit, type ComparisonPolicy, type Language, type SegmentedText } from "./text";

export const METRICS_VERSION = 1;
export type Exercise = {
  id: string; version: number; mode: "guided" | "reflex" | "vocabulary";
  text: string; language: Language; direction: "ltr" | "rtl";
  comparison: ComparisonPolicy; keyboardMapping: string;
  source?: { kind: "lesson"; lessonId: string; lessonVersion: number; mappingVersion: number }
    | { kind: "reflex"; config: import("../practice").GeneratorConfig; mappingVersion: number }
    | { kind: "content"; contentId: string; contentVersion: number };
};
export type PauseReason = "manual" | "focus" | "visibility" | "lookup";
export type CharacterStatistics = Record<string, { attempts: number; errors: number }>;
export type Session = {
  id: string; exercise: Exercise; target: SegmentedText; acceptedText: string;
  input: SegmentedText; retainedErrorFlags: boolean[];
  status: "ready" | "running" | "paused" | "completed" | "abandoned";
  pauseReasons: PauseReason[];
  startedAt: number | null; runningSince: number | null; activeMs: number;
  endedAt: number | null; lastTimestamp: number;
  attempts: number; errors: number; characterStatistics: CharacterStatistics;
};
export type Command = { type: "insert"; text: string }
  | { type: "delete"; retainedText?: string }
  | { type: "pause"; reason: PauseReason }
  | { type: "resume"; reason: PauseReason }
  | { type: "finish" }
  | { type: "abandon" }
  | { type: "restart"; sessionId: string };
export type Rejection = "ended" | "paused" | "capacity" | "unsupported" | "incomplete" | "correct-target" | "accuracy";
export type Transition = { accepted: true; session: Session }
  | { accepted: false; reason: Rejection; session: Session };
export type Metrics = { activeMs: number; grossWpm: number | null; netWpm: number | null; accuracy: number | null };
export type Snapshot = {
  status: Session["status"]; position: number; targetLength: number;
  states: ("pending" | "correct" | "incorrect")[];
  correct: number; remainingErrors: number; finishBlock: Rejection | null;
  metrics: Metrics;
};
export type SessionResult = {
  sessionId: string; exercise: Exercise; metricsVersion: number;
  outcome: "completed" | "abandoned"; metrics: Metrics;
  attempts: number; errors: number; retainedCorrect: number; remainingErrors: number;
  characterStatistics: CharacterStatistics;
};

function assertTime(now: number, previous = 0) {
  if (!Number.isFinite(now) || now < previous) throw new RangeError("A finite monotonic timestamp is required");
}

export function createSession(exercise: Exercise, sessionId: string, now: number): Session {
  assertTime(now);
  if (!sessionId || !exercise.id || exercise.comparison.language !== exercise.language) throw new Error("Invalid exercise/session configuration");
  const config: Exercise = { ...exercise, comparison: { ...exercise.comparison }, ...(exercise.source ? { source: structuredClone(exercise.source) } : {}) };
  const target = segmentText(config.text, config.comparison);
  if (target.units.length === 0) throw new Error("An exercise needs at least one comparison unit");
  return {
    id: sessionId, exercise: config, target, acceptedText: "",
    input: segmentText("", config.comparison), retainedErrorFlags: [], status: "ready",
    pauseReasons: [], startedAt: null, runningSince: null, activeMs: 0,
    endedAt: null, lastTimestamp: now, attempts: 0, errors: 0, characterStatistics: {},
  };
}

function elapsed(session: Session, now: number) {
  return session.activeMs + (session.runningSince === null ? 0 : now - session.runningSince);
}

export function snapshot(session: Session, now: number): Snapshot {
  assertTime(now, session.lastTimestamp);
  const states = session.target.units.map((unit, index) => {
    const actual = session.input.units[index];
    return !actual ? "pending" : actual.comparison === unit.comparison ? "correct" : "incorrect";
  });
  const correct = states.filter(state => state === "correct").length;
  const remainingErrors = states.filter(state => state === "incorrect").length;
  const activeMs = elapsed(session, now);
  const minutes = activeMs / 60000;
  const metrics: Metrics = {
    activeMs,
    grossWpm: session.attempts && minutes > 0 ? session.attempts / (5 * minutes) : null,
    netWpm: session.attempts && minutes > 0 ? correct / (5 * minutes) : null,
    accuracy: session.attempts ? 100 * (session.attempts - session.errors) / session.attempts : null,
  };
  let finishBlock: Rejection | null = null;
  if (session.status === "completed" || session.status === "abandoned") finishBlock = "ended";
  else if (session.input.units.length !== session.target.units.length) finishBlock = "incomplete";
  else if (session.exercise.mode === "guided" && remainingErrors > 0) finishBlock = "correct-target";
  else if (session.exercise.mode === "guided" && (metrics.accuracy ?? 0) < 95) finishBlock = "accuracy";
  return { status: session.status, position: session.input.units.length, targetLength: session.target.units.length,
    states, correct, remainingErrors, finishBlock, metrics };
}

function reject(session: Session, reason: Rejection): Transition { return { accepted: false, reason, session }; }

function stopClock(session: Session, now: number): Pick<Session, "activeMs" | "runningSince"> {
  return { activeMs: elapsed(session, now), runningSince: null };
}

export function transition(session: Session, command: Command, now: number): Transition {
  assertTime(now, session.lastTimestamp);
  if (command.type === "restart") return { accepted: true, session: createSession(session.exercise, command.sessionId, now) };
  if (session.status === "completed" || session.status === "abandoned") return reject(session, "ended");
  if (command.type === "pause" || command.type === "resume") {
    const reasons = command.type === "pause" ? [...new Set([...session.pauseReasons, command.reason])]
      : session.pauseReasons.filter(reason => reason !== command.reason);
    const clock = reasons.length ? stopClock(session, now)
      : { activeMs: session.activeMs, runningSince: session.startedAt !== null ? (session.runningSince ?? now) : null };
    return { accepted: true, session: { ...session, ...clock, pauseReasons: reasons, lastTimestamp: now,
      status: session.startedAt === null ? "ready" : reasons.length ? "paused" : "running" } };
  }
  if (command.type === "finish" || command.type === "abandon") {
    const finishBlock = snapshot(session, now).finishBlock;
    if (command.type === "finish" && finishBlock) return reject(session, finishBlock);
    return { accepted: true, session: { ...session, ...stopClock(session, now), endedAt: now,
      status: command.type === "finish" ? "completed" : "abandoned", lastTimestamp: now } };
  }
  if (session.pauseReasons.length) return reject(session, "paused");

  let acceptedText: string;
  if (command.type === "insert") {
    acceptedText = normalizeText(session.acceptedText + command.text);
  } else {
    const last = session.input.graphemes.at(-1);
    acceptedText = command.retainedText === undefined
      ? session.acceptedText.slice(0, last?.originalStart ?? 0) : normalizeText(command.retainedText);
    const edit = inferNativeEdit(session.acceptedText, acceptedText);
    if (edit.type !== "delete" && edit.type !== "unchanged") return reject(session, "unsupported");
  }
  const input = segmentText(acceptedText, session.exercise.comparison);
  if (input.units.length > session.target.units.length) return reject(session, "capacity");
  const previousLength = session.input.units.length;
  if (command.type === "delete" && input.units.length > previousLength) return reject(session, "unsupported");
  const flags = session.retainedErrorFlags.slice(0, input.units.length);
  const statistics = { ...session.characterStatistics };
  let attempts = session.attempts;
  let errors = session.errors;
  if (command.type === "insert") {
    for (let index = 0; index < input.units.length; index++) {
      const expected = session.target.units[index].comparison;
      const incorrect = input.units[index].comparison !== expected;
      const isNew = index >= previousLength;
      const changed = input.units[index].comparison !== session.input.units[index]?.comparison;
      if (!isNew && !changed) continue;
      const stat = { ...(statistics[expected] ?? { attempts: 0, errors: 0 }) };
      if (isNew) { attempts++; stat.attempts++; flags[index] = false; }
      // A combining-mark insertion belongs to the existing retained attempt.
      // Count its error at most once without inventing an extra grapheme attempt.
      if (incorrect && !flags[index]) { errors++; stat.errors++; flags[index] = true; }
      statistics[expected] = stat;
    }
  }
  const started = session.startedAt !== null || attempts > session.attempts;
  return { accepted: true, session: { ...session, acceptedText, input, retainedErrorFlags: flags,
    attempts, errors, characterStatistics: statistics, lastTimestamp: now,
    status: started ? "running" : "ready", startedAt: started ? (session.startedAt ?? now) : null,
    runningSince: started ? (session.runningSince ?? now) : null } };
}

export function sessionResult(session: Session): SessionResult | null {
  if ((session.status !== "completed" && session.status !== "abandoned") || session.endedAt === null) return null;
  const view = snapshot(session, session.endedAt);
  return {
    sessionId: session.id, exercise: { ...session.exercise, comparison: { ...session.exercise.comparison }, ...(session.exercise.source ? { source: structuredClone(session.exercise.source) } : {}) },
    metricsVersion: METRICS_VERSION, outcome: session.status, metrics: { ...view.metrics },
    attempts: session.attempts, errors: session.errors, retainedCorrect: view.correct,
    remainingErrors: view.remainingErrors,
    characterStatistics: Object.fromEntries(Object.entries(session.characterStatistics).map(([key, value]) => [key, { ...value }])),
  };
}
