"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { keyboardMappings, defaultMappingForLanguage, mappingName, type MappingId } from "@/domain/keyboard";
import { lessons, generate, GENERATOR_VERSION, type GeneratorConfig, type Generated, type Lesson } from "@/domain/practice";
import { completionKey } from "@/domain/practice/progress";
import { usePreferences } from "../preferences-provider";
import { usePracticeActivity, useProgress } from "../progress-provider";
import { PracticeHarness } from "../typing/harness";
import { KeyboardGuide } from "./keyboard";
import { practiceMessages } from "./messages";
import { messages, lessonLabels } from "@/lib/i18n";
import { locales, type Locale } from "@/lib/preferences";
import { languageNames } from "@/lib/i18n";

function PracticeLanguageSelect({ locale }: { locale: Locale }) {
  const { preferences, update } = usePreferences();
  return <div><label htmlFor="curriculum-language">{messages[locale].practiceLanguage}</label><select id="curriculum-language" value={preferences.practiceLanguage} onChange={event => void update({ practiceLanguage: event.target.value as Locale })}>{locales.map(language => <option value={language} key={language}>{languageNames[language]}</option>)}</select><p className="muted">{practiceMessages[locale].mappingNote} · <bdi>{mappingName(defaultMappingForLanguage(preferences.practiceLanguage))}</bdi></p></div>;
}
export function Curriculum({ locale }: { locale: Locale }) {
  const { preferences, ready } = usePreferences(); const { progress, ready: loaded } = useProgress(); const t = practiceMessages[locale];
  if (!ready || !loaded) return <p role="status">{t.unavailable}</p>;
  const available = lessons.filter(lesson => lesson.mapping === defaultMappingForLanguage(preferences.practiceLanguage));
  return <><div className="page-heading"><p className="eyebrow">KeyLingo</p><h1>{messages[locale].learn}</h1><p>{t.instructions}</p></div><section className="panel"><PracticeLanguageSelect locale={locale}/></section><div className="lesson-grid">{available.map(lesson => {
    const done = Boolean(progress.lessonCompletions[completionKey(lesson)]);
  const unlocked = lesson.prerequisites.every(id => progress.lessonCompletions[completionKey(lessons.find(l => l.id === id)!)]);
    return <article className="lesson-card" key={lesson.id}><span className="eyebrow"><bdi>{lesson.index + 1} / 12</bdi> · {done ? t.complete : keyboardMappings[lesson.mapping].name}</span><h2>{messages[locale][lessonLabels[lesson.index]]}</h2>{unlocked ? <Link className="button" href={`/${locale}/learn/${lesson.id}`}>{t.start}</Link> : <p className="muted">{t.locked}</p>}</article>;
  })}</div></>;
}
function SavedPractice({ locale, exercise, recipeIds, onActiveChange }: { locale: Locale; exercise: Lesson["exercise"]; recipeIds: string[]; onActiveChange?: (active: boolean) => void }) {
  const { record, issue } = useProgress(); const t = practiceMessages[locale]; const setSessionActive = usePracticeActivity();
  const onActivityChange = useCallback((active: boolean) => { setSessionActive(active); onActiveChange?.(active); }, [setSessionActive, onActiveChange]);
  return <><PracticeHarness locale={locale} exercise={exercise} onResult={record} onActiveChange={onActivityChange} guidance={position => <KeyboardGuide locale={locale} mappingId={exercise.keyboardMapping as MappingId} recipeIds={recipeIds} position={position}/>} resultNote={<><p role="status">{issue ? t.savingFailed : t.saved}</p><Link href={`/${locale}/progress`}>{t.returnProgress}</Link> · <Link href={`/${locale}/learn`}>{t.back}</Link></>}/>{issue && <p role="alert">{t.savingFailed} <Link href={`/${locale}/progress`}>{t.returnProgress}</Link></p>}</>;
}
export function LessonPractice({ locale, lesson }: { locale: Locale; lesson: Lesson }) {
  const { preferences, ready } = usePreferences();
  if (!ready) return <p role="status">{practiceMessages[locale].unavailable}</p>;
  return <LessonForLanguage locale={locale} lesson={lesson} initialLanguage={preferences.practiceLanguage}/>;
}
function LessonForLanguage({ locale, lesson, initialLanguage }: { locale: Locale; lesson: Lesson; initialLanguage: Locale }) {
  const [language] = useState(initialLanguage);
  const router = useRouter();
  const mapping = defaultMappingForLanguage(language);
  useEffect(() => {
    if (mapping !== lesson.mapping) router.replace(`/${locale}/learn/${mapping}-${lesson.id.slice(lesson.mapping.length + 1)}`);
  }, [mapping, lesson, locale, router]);
  const { progress, ready } = useProgress(); const t = practiceMessages[locale];
  if (!ready) return <p role="status">{t.unavailable}</p>;
  if (mapping !== lesson.mapping) return <p role="status">{t.unavailable}</p>;
  const exercise = { ...lesson.exercise, language, comparison: { ...lesson.exercise.comparison, language } };
  const unlocked = lesson.prerequisites.every(id => progress.lessonCompletions[completionKey(lessons.find(l => l.id === id)!)]);
  return <><div className="page-heading"><Link href={`/${locale}/learn`}>← {t.back}</Link><h1>{messages[locale][lessonLabels[lesson.index]]}</h1><p><bdi>{keyboardMappings[lesson.mapping].name}</bdi> · <bdi>{lesson.index + 1} / 12</bdi></p><p>{t.introduced}: <bdi dir="ltr">{lesson.practicedKeys.map(key => key.replace("Key", "")).join(" · ")}</bdi></p></div>{unlocked ? <SavedPractice locale={locale} exercise={exercise} recipeIds={lesson.recipeIds}/> : <section className="panel"><p>{t.locked}</p><Link className="button" href={`/${locale}/learn/${lesson.prerequisites[0]}`}>{t.prerequisites}</Link></section>}</>;
}
export function Reflex({ locale }: { locale: Locale }) {
  const { preferences, ready } = usePreferences(); const { ready: loaded } = useProgress();
  if (!ready || !loaded) return <p role="status">{practiceMessages[locale].unavailable}</p>;
  return <ReflexConfiguration locale={locale} initial={{ language: preferences.practiceLanguage, mapping: defaultMappingForLanguage(preferences.practiceLanguage), ...preferences.reflex, version: GENERATOR_VERSION, pattern: preferences.reflex.pattern ?? "random", punctuation: preferences.reflex.punctuation ?? false, shift: preferences.reflex.shift ?? false }}/>;
}
function ReflexConfiguration({ locale, initial }: { locale: Locale; initial: GeneratorConfig }) {
  const [active, setActive] = useState(false);
  const [config, setConfig] = useState(initial); const [generated, setGenerated] = useState<Generated | null>(null); const [run, setRun] = useState(0);
  const { update } = usePreferences(); const t = practiceMessages[locale];
  return <><div className="page-heading"><h1>{t.reflex}</h1><p>{t.reproducible}</p><p>{t.version}: {GENERATOR_VERSION}</p></div><form className="panel" onSubmit={event => { event.preventDefault(); if (active) return; setGenerated(generate(config)); setRun(run + 1); update({ practiceLanguage: config.language!, reflex: { seed: config.seed, length: config.length, difficulty: config.difficulty, pattern: config.pattern, punctuation: config.punctuation, shift: config.shift } }); }}>
    <fieldset disabled={active}><div className="harness-selects"><div><label htmlFor="reflex-language">{messages[locale].practiceLanguage}</label><select id="reflex-language" value={config.language} onChange={event => { const language = event.target.value as Locale; setConfig({ ...config, language, mapping: defaultMappingForLanguage(language) }); }}>{locales.map(language => <option key={language} value={language}>{languageNames[language]}</option>)}</select></div>
      <div><label htmlFor="reflex-seed">{t.seed}</label><input id="reflex-seed" maxLength={100} value={config.seed} onChange={event => setConfig({ ...config, seed: event.target.value })}/></div>
      <div><label htmlFor="reflex-length">{t.length}</label><input id="reflex-length" type="number" min={10} max={1000} required value={config.length} onChange={event => setConfig({ ...config, length: Number(event.target.value) })}/></div>
      <div><label htmlFor="reflex-difficulty">{t.difficulty}</label><select id="reflex-difficulty" value={config.difficulty} onChange={event => setConfig({ ...config, difficulty: event.target.value as GeneratorConfig["difficulty"] })}>{(["easy", "medium", "hard"] as const).map(value => <option key={value} value={value}>{t[value]}</option>)}</select></div>
      <div><label htmlFor="reflex-pattern">{t.pattern}</label><select id="reflex-pattern" value={config.pattern} onChange={event => setConfig({ ...config, pattern: event.target.value as GeneratorConfig["pattern"] })}>{(["random", "adjacent", "alternating", "repeated"] as const).map(value => <option value={value} key={value}>{t[value]}</option>)}</select></div></div>
    <div className="button-row"><label><input type="checkbox" checked={config.punctuation} onChange={event => setConfig({ ...config, punctuation: event.target.checked })}/>{t.punctuation}</label><label><input type="checkbox" checked={config.shift} onChange={event => setConfig({ ...config, shift: event.target.checked })}/>{t.shifted}</label></div><p className="muted">{t.mappingNote}</p><p className="muted">{t.activeNote}</p><button className="button" type="submit">{t.generate}</button></fieldset>
  </form>{generated && (generated.ok ? <SavedPractice key={run} locale={locale} exercise={generated.exercise} recipeIds={generated.recipeIds} onActiveChange={setActive}/> : <p role="alert">{t.noOutputs}</p>)}</>;
}
export function ProgressView({ locale }: { locale: Locale }) {
  const { progress, ready, issue, recover, exportJSON, activeSessions } = useProgress(); const t = practiceMessages[locale];
  const [language, setLanguage] = useState<Locale | "all">("all");
  const [mode, setMode] = useState<"all" | Lesson["exercise"]["mode"]>("all");
  const [outcome, setOutcome] = useState<"all" | "completed" | "abandoned">("all");
  const [limit, setLimit] = useState(20); const [notice, setNotice] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const filtered = progress.sessions.filter(({ result }) => (language === "all" || result.exercise.language === language) && (mode === "all" || result.exercise.mode === mode) && (outcome === "all" || result.outcome === outcome));
  const comparisons = locales.filter(item => language === "all" || language === item).map(item => {
    const stats = filtered.filter(({ result }) => result.exercise.language === item).reduce((sum, { result }) => ({ attempts: sum.attempts + result.attempts, errors: sum.errors + result.errors, retained: sum.retained + result.retainedCorrect, activeMs: sum.activeMs + result.metrics.activeMs, sessions: sum.sessions + 1 }), { attempts: 0, errors: 0, retained: 0, activeMs: 0, sessions: 0 });
    const rate = (characters: number) => stats.activeMs ? (characters / (5 * stats.activeMs / 60000)).toFixed(1) : "—";
    return { language: item, ...stats, net: rate(stats.retained), gross: rate(stats.attempts), accuracy: stats.attempts ? `${(100 * (stats.attempts - stats.errors) / stats.attempts).toFixed(1)}%` : "—" };
  });
  const weeks = (() => {
    const date = new Date();
    const monday = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    const day = (date.getUTCDay() + 6) % 7;
    const currentWeek = monday - day * 86400000;
    return Array.from({ length: 8 }, (_, index) => { const start = currentWeek - (7 - index) * 7 * 86400000; const end = start + 7 * 86400000;
      const sessions = filtered.filter(item => { const saved = Date.parse(item.savedAt); return saved >= start && saved < end; });
      return { start, sessions: sessions.length, activeMs: sessions.reduce((sum, item) => sum + item.result.metrics.activeMs, 0) };
    });
  })();
  const difficult = Object.entries(progress.characterStatistics).flatMap(([key, stats]) => {
    const [mapping, lang, version] = key.split(":");
    if (version !== "v1" || (language !== "all" && language !== lang) || mapping !== defaultMappingForLanguage(lang as Locale)) return [];
    return Object.entries(stats).filter(([, value]) => value.attempts >= 3).map(([character, value]) => ({ character, language: lang as Locale, ...value }));
  }).sort((a, b) => b.errors / b.attempts - a.errors / a.attempts || b.attempts - a.attempts).slice(0, 12);
  if (!ready) return <p role="status">{t.unavailable}</p>;
  const saveFile = () => { const url = URL.createObjectURL(new Blob([exportJSON()], { type: "application/json" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "keylingo-progress.json"; anchor.click(); URL.revokeObjectURL(url); };
  async function dataAction(action: "backup" | "reset" | "import", raw?: string) {
    if (activeSessions) { setNotice(t.activeDataAction); return; }
    if (action === "reset" && !window.confirm(t.resetProgressConfirm)) return;
    setNotice(await recover(action, raw) ? t.dataActionDone : t.dataActionFailed);
  }
  return <><div className="page-heading"><h1>{t.progress}</h1><p>{t.progressScope}</p></div>{issue && <section className="panel" role="alert"><p>{t.savingFailed}</p><p>{t.recoveryNote}</p></section>}
    <section className="panel progress-filters"><div><label htmlFor="progress-language">{messages[locale].practiceLanguage}</label><select id="progress-language" value={language} onChange={event => { setLanguage(event.target.value as Locale | "all"); setLimit(20); }}><option value="all">{t.allLanguages}</option>{locales.map(item => <option key={item} value={item}>{languageNames[item]}</option>)}</select></div><div><label htmlFor="progress-mode">{t.filterMode}</label><select id="progress-mode" value={mode} onChange={event => { setMode(event.target.value as typeof mode); setLimit(20); }}><option value="all">{t.allModes}</option>{(["guided", "reflex", "vocabulary"] as const).map(item => <option key={item} value={item}>{messages[locale][item === "guided" ? "learn" : item === "reflex" ? "reflex" : "practice"]}</option>)}</select></div><div><label htmlFor="progress-outcome">{t.filterOutcome}</label><select id="progress-outcome" value={outcome} onChange={event => { setOutcome(event.target.value as typeof outcome); setLimit(20); }}><option value="all">{t.allOutcomes}</option><option value="completed">{t.completed}</option><option value="abandoned">{t.abandoned}</option></select></div></section>
    <section className="live-metrics"><div><span>{t.total}</span><strong>{progress.totalSessions}</strong></div><div><span>{t.finished}</span><strong>{progress.completedSessions}</strong></div><div><span>{t.practiceHours}</span><strong><bdi>{(progress.activeMs / 3600000).toFixed(1)}</bdi></strong></div><div><span>{t.lifetimeAccuracy}</span><strong><bdi>{progress.attempts ? `${(100 * (progress.attempts - progress.errors) / progress.attempts).toFixed(1)}%` : "—"}</bdi></strong></div></section>
    <div className="comparison-grid">{comparisons.map(item => <section className="panel comparison-card" key={item.language}><h2>{languageNames[item.language]}</h2><p>{t.filteredSessions}: <bdi>{item.sessions}</bdi></p><div><span>{t.net}</span><strong><bdi>{item.net}</bdi></strong></div><div><span>{t.gross}</span><strong><bdi>{item.gross}</bdi></strong></div><div><span>{t.accuracy}</span><strong><bdi>{item.accuracy}</bdi></strong></div></section>)}</div>
    <p className="muted">{t.retainedScope} <bdi>{progress.totalSessions}</bdi></p>
    <section className="panel"><h2>{t.weeklyTrend}</h2><p className="muted">{t.activeTimeTrend}</p><div className="trend-chart"><ol className="trend-bars" aria-label={t.weeklyTrend}>{weeks.map(week => <li className="trend-column" key={week.start}><span aria-hidden="true" className="trend-bar" style={{ height: `${Math.max(week.activeMs ? 4 : 0, weeks.some(item => item.activeMs) ? week.activeMs / Math.max(...weeks.map(item => item.activeMs)) * 100 : 0)}%` }}/><small><bdi>{new Date(week.start).toLocaleDateString(locale, { month: "short", day: "numeric", timeZone: "UTC" })}</bdi></small><span className="visually-hidden"><bdi>{week.sessions}</bdi> · <bdi>{(week.activeMs / 60000).toFixed(0)}</bdi> {t.minutes}</span></li>)}</ol></div><p className="muted">{weeks.reduce((sum, week) => sum + week.sessions, 0)} · {t.sessionsInRange}</p></section>
    <section className="panel"><h2>{t.difficultCharacters}</h2><p className="muted">{t.difficultScope}</p>{difficult.length ? <div className="character-grid">{difficult.map((item, index) => <div className="character-item" key={`${item.language}-${item.character}-${index}`}><bdi lang={item.language} dir={item.language === "ar" ? "rtl" : "ltr"}>{item.character}</bdi><span><bdi>{(100 * item.errors / item.attempts).toFixed(0)}%</bdi> · {item.attempts}</span><progress value={item.errors} max={item.attempts} aria-label={`${item.language}: ${item.character}`}/></div>)}</div> : <p>{t.noDifficultCharacters}</p>}</section>
    <section className="panel"><h2>{t.history}</h2>{filtered.length ? <><ul className="session-history">{[...filtered].reverse().slice(0, limit).map(({ result, savedAt }) => <li key={result.sessionId}><bdi>{languageNames[result.exercise.language]} · {mappingName(result.exercise.keyboardMapping)}</bdi> · {messages[locale][result.exercise.mode === "guided" ? "learn" : result.exercise.mode === "reflex" ? "reflex" : "practice"]} · {t[result.outcome]} · {t.accuracy}: <bdi>{result.metrics.accuracy?.toFixed(1) ?? "—"}%</bdi> · {t.net}: <bdi>{result.metrics.netWpm?.toFixed(1) ?? "—"}</bdi><br/><time dateTime={savedAt}>{new Date(savedAt).toLocaleString(locale)}</time>{result.exercise.source?.kind === "reflex" && <p>{t.seed}: <bdi>{result.exercise.source.config.seed}</bdi> · {t.version}: {result.exercise.source.config.version}</p>}</li>)}</ul>{filtered.length > limit && <button className="button secondary" onClick={() => setLimit(value => Math.min(value + 20, 500))}>{t.showMore} · <bdi>{filtered.length - limit}</bdi></button>}</> : <p>{t.empty}</p>}</section>
    <section className="panel"><h2>{t.progressData}</h2><p>{t.progressDataNote}</p><div className="button-row"><button className="button secondary" onClick={saveFile}>{t.export}</button><button className="button secondary" disabled={activeSessions > 0} onClick={() => file.current?.click()}>{t.import}</button><button className="button secondary" disabled={activeSessions > 0} onClick={() => void dataAction("backup")}>{t.recover}</button><button className="text-button danger" disabled={activeSessions > 0} onClick={() => void dataAction("reset")}>{t.resetProgress}</button></div><input ref={file} type="file" accept="application/json,.json" className="visually-hidden" aria-label={t.import} onChange={async event => { const selected = event.target.files?.[0]; if (!selected) return; try { if (selected.size > 25000000) setNotice(t.dataActionFailed); else await dataAction("import", await selected.text()); } catch { setNotice(t.dataActionFailed); } finally { event.target.value = ""; } }}/><p role="status">{notice}</p></section>
  </>;
}
export function ContinueLearning({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  const { preferences } = usePreferences(); const { progress, ready } = useProgress(); const t = practiceMessages[locale];
  const next = lessons.find(lesson => lesson.mapping === defaultMappingForLanguage(preferences.practiceLanguage) && !progress.lessonCompletions[completionKey(lesson)]);
  if (!ready) return null;
  return <section className={compact ? "" : "panel"}><h2>{t.continue}</h2>{next ? <><p>{t.next}: {messages[locale][lessonLabels[next.index]]} · <bdi>{keyboardMappings[next.mapping].name}</bdi></p><Link className="button" href={`/${locale}/learn/${next.id}`}>{t.start}</Link></> : <p>{t.allDone}</p>}</section>;
}
