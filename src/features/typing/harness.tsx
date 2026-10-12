"use client";
import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { languageNames, messages } from "@/lib/i18n";
import { locales, type Locale, type Preferences } from "@/lib/preferences";
import { sessionResult, type Exercise, type SessionResult, type Command } from "@/domain/typing/engine";
import { usePreferences } from "../preferences-provider";
import { useTypingSession } from "./use-typing-session";
import { TypingInput, type InputNotice } from "./typing-input";
import { TypingSurface } from "./typing-surface";
import { typingMessages } from "./messages";

import { defaultMappingForLanguage } from "@/domain/keyboard";
const samples: Record<Locale, Record<"sentence" | "unicode", string>> = {
  en: { sentence: "Every small step makes a difference.", unicode: "A café — خطوة 12.\nA fresh start!" },
  nl: { sentence: "Elke kleine stap maakt een verschil.", unicode: "Een café, een idee.\nEen kleine stap." },
  ar: { sentence: "كُلّ خطوة صغيرة تصنع فرقًا.", unicode: "أهلاً! لا، نعم — 12.\nخطوة جديدة." },
};

export function Harness({ locale }: { locale: Locale }) {
  const { preferences, ready } = usePreferences();
  if (!ready) return <p role="status">{messages[locale].loading}</p>;
  return <ConfiguredHarness locale={locale} initialPreferences={preferences}/>;
}

function ConfiguredHarness({ locale, initialPreferences }: { locale: Locale; initialPreferences: Preferences }) {
  // Capture preferences once. External storage revisions cannot replace an active exercise.
  const [language, setLanguage] = useState(initialPreferences.practiceLanguage);
  const [diacritics, setDiacritics] = useState(initialPreferences.diacritics);
  const [sample, setSample] = useState<"sentence" | "unicode">("sentence");
  const [mode, setMode] = useState<Exercise["mode"]>("vocabulary");
  const mapping = defaultMappingForLanguage(language);
  const t = typingMessages[locale]; const shared = messages[locale];
  const exercise = useMemo<Exercise>(() => ({ id: `preview-${language}-${sample}`, version: 1,
    mode, text: samples[language][sample], language, direction: language === "ar" ? "rtl" : "ltr",
    comparison: { language, diacritics }, keyboardMapping: mapping }), [language, sample, mode, diacritics, mapping]);
  return <><div className="page-heading"><p className="eyebrow">{t.preview}</p><h1>{t.title}</h1><p>{t.intro}</p></div>
    <section className="panel harness-configuration"><div className="harness-selects">
      <div><label htmlFor="harness-language">{shared.practiceLanguage}</label><select id="harness-language" value={language} onChange={event => setLanguage(event.target.value as Locale)}>{locales.map(value => <option value={value} key={value}>{languageNames[value]}</option>)}</select></div>
      <div><label htmlFor="harness-sample">{t.exercise}</label><select id="harness-sample" value={sample} onChange={event => setSample(event.target.value as typeof sample)}><option value="sentence">{t.sentence}</option><option value="unicode">{t.unicode}</option></select></div>
      <div><label htmlFor="harness-mode">{t.mode}</label><select id="harness-mode" value={mode} onChange={event => setMode(event.target.value as Exercise["mode"])}>{(["vocabulary", "guided", "reflex"] as const).map(value => <option value={value} key={value}>{t[value]}</option>)}</select></div>
      {language === "ar" && <div><label htmlFor="harness-marks">{shared.diacritics}</label><select id="harness-marks" value={diacritics} onChange={event => setDiacritics(event.target.value as typeof diacritics)}><option value="optional">{shared.optional}</option><option value="strict">{shared.strict}</option></select></div>}
    </div><p className="muted">{t.changeNote}</p></section>
    <PracticeHarness key={`${exercise.id}-${mode}-${diacritics}`} locale={locale} exercise={exercise}/>
  </>;
}

const LookupContext = createContext<{ pause: () => void; resume: () => void } | null>(null);
export function usePracticeLookup() { const controls = useContext(LookupContext); if (!controls) throw new Error("Practice lookup context required"); return controls; }

export function PracticeHarness({ locale, exercise, onResult, guidance, resultNote, onActiveChange, lookup }: { locale: Locale; exercise: Exercise; onResult?: (result: SessionResult) => void; guidance?: (position: number) => React.ReactNode; resultNote?: React.ReactNode; onActiveChange?: (active: boolean) => void; lookup?: React.ReactNode }) {
  const { session, view, command: engineCommand, getSession } = useTypingSession(exercise);
  const command = useCallback((action: Command) => {
    if (action.type === "restart" && getSession().attempts > 0 && !sessionResult(getSession())) {
      const abandoned = engineCommand({ type: "abandon" });
      if (abandoned.accepted) { const result = sessionResult(abandoned.session); if (result) onResult?.(result); }
    }
    const change = engineCommand(action);
    if (change.accepted && (action.type === "finish" || action.type === "abandon")) { const result = sessionResult(change.session); if (result) onResult?.(result); }
    return change;
  }, [engineCommand, getSession, onResult]);
  const [notice, setNotice] = useState<InputNotice | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [tipsOpen, setTipsOpen] = useState(false);
  const t = typingMessages[locale];
  const result = sessionResult(session);
  const ended = session.status === "completed" || session.status === "abandoned";
  useEffect(() => { onActiveChange?.(!ended); }, [ended, onActiveChange]);
  const paused = session.pauseReasons.length > 0;
  const manual = session.pauseReasons.includes("manual");
  const onNotice = useCallback((value: InputNotice | null) => setNotice(value), []);
  const format = (value: number | null) => value === null ? "—" : value.toFixed(1);
  const noticeMessages: Record<InputNotice, string> = { unsupported: t.unsupported, paste: t.paste,
    capacity: t.capacity, ended: t.ended, paused: t.blocked, incomplete: t.incomplete,
    "correct-target": t.correctTarget, accuracy: t.accuracyBlock };

  useEffect(() => { if (tipsOpen && dialog.current && !dialog.current.open) dialog.current.showModal(); }, [tipsOpen]);
  const pauseLookup = useCallback(() => { command({ type: "pause", reason: "lookup" }); }, [command]);
  const resumeLookup = useCallback(() => { command({ type: "resume", reason: "lookup" }); input.current?.focus(); }, [command]);
  const closeTips = () => {
    setTipsOpen(false); command({ type: "resume", reason: "lookup" }); input.current?.focus();
  };
  const restart = () => {
    command({ type: "restart", sessionId: crypto.randomUUID() }); setNotice(null); input.current?.focus();
  };

  return <div className="typing-harness" data-session-id={session.id}>
    <div className="practice-top"><span className="pill" role="status">{paused && !ended ? t.paused : t[session.status]}</span><div className="button-row">
      <button className="button secondary" disabled={ended} onClick={() => { command({ type: manual ? "resume" : "pause", reason: "manual" }); if (manual) input.current?.focus(); }}>{manual ? t.resume : t.pause}</button>
      <button className="button secondary" disabled={ended} onClick={() => { command({ type: "pause", reason: "lookup" }); setTipsOpen(true); }}>{t.tips}</button>
    </div></div>
    <section className="live-metrics" aria-label={t.progress}>
      {([[t.net, view.metrics.netWpm], [t.gross, view.metrics.grossWpm], [t.accuracy, view.metrics.accuracy]] as const).map(([label, value]) => <div key={label}><span>{label}</span><output aria-live="off" aria-label={label}><bdi>{format(value)}{label === t.accuracy && value !== null ? "%" : ""}</bdi></output></div>)}
      <div><span>{t.active}</span><output aria-live="off" aria-label={t.active} data-ms={Math.round(view.metrics.activeMs)}><bdi>{(view.metrics.activeMs / 1000).toFixed(1)}</bdi> {t.seconds}</output></div>
    </section>
    <LookupContext.Provider value={{ pause: pauseLookup, resume: resumeLookup }}>{lookup}</LookupContext.Provider>
    <TypingSurface session={session} view={view} label={t.target}/>
    <section className="panel typing-entry-panel"><TypingInput session={session} inputRef={input} getSession={getSession} command={command} onNotice={onNotice} label={t.input} helpId="typing-help" placeholder={t.placeholder}/><p id="typing-help" className="muted">{t.help}</p><p className="input-notice" role="status">{notice ? noticeMessages[notice] : ""}</p></section>
    <div className="typing-counts"><span>{t.position}: <output aria-live="off" aria-label={t.position}><bdi>{view.position} / {view.targetLength}</bdi></output></span><span>{t.attempts}: <output aria-live="off" aria-label={t.attempts}>{session.attempts}</output></span><span>{t.errors}: <output aria-live="off" aria-label={t.errors}>{session.errors}</output></span><span>{t.remainingErrors}: <output aria-live="off" aria-label={t.remainingErrors}>{view.remainingErrors}</output></span></div>
    <progress aria-label={t.progress} value={view.position} max={view.targetLength}/>
    <p className="muted">{t.correctionNote}</p>
    {exercise.mode === "guided" && <p className="muted">{t.guidedNote}</p>}
    <div className="button-row spread"><div className="button-row"><button className="button secondary" onClick={restart}>{t.restart}</button><button className="text-button" disabled={ended} onClick={() => command({ type: "abandon" })}>{t.exit}</button></div><button className="button" disabled={view.finishBlock !== null} onClick={() => { const result = command({ type: "finish" }); if (!result.accepted) setNotice(result.reason); }}>{t.finish}</button></div>
    {result && <section className="panel result-summary" aria-live="polite"><h2>{t[result.outcome]}</h2><div>{resultNote ?? t.resultNote}</div></section>}
    {guidance?.(view.position)}
    <p className="muted metric-definition">{t.metricNote}</p>
    <dialog className="typing-tips-dialog" ref={dialog} aria-labelledby="typing-tips-title" onClose={closeTips}>
      <h2 id="typing-tips-title">{t.tips}</h2><p>{t.tipsText}</p><p>{t.metricNote}</p><button className="button" autoFocus onClick={() => dialog.current?.close()}>{t.close}</button>
    </dialog>
  </div>;
}
