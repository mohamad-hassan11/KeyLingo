"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { categories, entries } from "@/content";
import { contentExercise, type ContentEntry } from "@/domain/content";
import { savedWord, type SavedWord } from "@/domain/content/vocabulary";
import { defaultMappingForLanguage, mappingName } from "@/domain/keyboard";
import { BundledTranslationProvider, dictionaryURL, type LookupRequest, type TranslationResult } from "@/lib/translation";
import { languageNames, messages } from "@/lib/i18n";
import { locales, type Locale } from "@/lib/preferences";
import { usePreferences } from "../preferences-provider";
import { usePracticeActivity, useProgress } from "../progress-provider";
import { PracticeHarness, usePracticeLookup } from "../typing/harness";
import { useVocabulary } from "./provider";
import { practiceMessages } from "../practice/messages";
import { vocabularyMessages } from "./messages";
const provider = new BundledTranslationProvider(entries);
function download(raw: string) {
  const url = URL.createObjectURL(new Blob([raw], { type: "application/json" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = "keylingo-vocabulary.json"; anchor.click(); URL.revokeObjectURL(url);
}
function ProgressNotice({ locale }: { locale: Locale }) {
  const { issue } = useProgress();
  return issue ? <p role="alert">{practiceMessages[locale].savingFailed} <Link href={`/${locale}/progress`}>{messages[locale].progress}</Link></p> : null;
}
function StorageNotice({ locale }: { locale: Locale }) {
  const { issue, exportJSON } = useVocabulary(); const t = vocabularyMessages[locale];
  if (!issue) return null;
  return <section className="panel storage-warning" role="status"><p>{t.storage} <bdi>({issue})</bdi></p><div className="button-row"><button className="button secondary" onClick={() => download(exportJSON())}>{t.export}</button></div></section>;
}
export function VocabularyLibrary({ locale }: { locale: Locale }) {
  const { preferences, ready, update } = usePreferences(); const t = vocabularyMessages[locale];
  const selected = entries.filter(entry => entry.language === preferences.practiceLanguage && entry.level === preferences.cefr && (!preferences.category || entry.category === preferences.category));
  return <><div className="page-heading"><p className="eyebrow">{messages[locale].practice}</p><h1>{t.title}</h1><p>{t.intro}</p><p className="muted">{t.pilot}</p></div>
    <section className="panel harness-configuration"><div className="harness-selects">
      <div><label htmlFor="vocabulary-language">{t.language}</label><select id="vocabulary-language" disabled={!ready} value={preferences.practiceLanguage} onChange={event => void update({ practiceLanguage: event.target.value as Locale })}>{locales.map(language => <option key={language} value={language}>{languageNames[language]}</option>)}</select></div>
      <div><label htmlFor="vocabulary-level">{t.level}</label><select id="vocabulary-level" disabled={!ready} value={preferences.cefr} onChange={event => void update({ cefr: event.target.value as typeof preferences.cefr })}>{["A1", "A2", "B1", "B2", "C1", "C2"].map(level => <option value={level} key={level}>{level}{["C1", "C2"].includes(level) ? " — 0" : ""}</option>)}</select></div>
      <div><label htmlFor="vocabulary-category">{t.category}</label><select id="vocabulary-category" disabled={!ready} value={preferences.category ?? ""} onChange={event => void update({ category: event.target.value || null })}><option value="">{t.all}</option>{categories.map(category => <option key={category} value={category}>{t.categories[category]}</option>)}</select></div>
    </div><p className="muted"><bdi>{entries.filter(entry => entry.language === preferences.practiceLanguage).length} / 28 · {selected.length}</bdi> · {t.advanced}</p></section>
    {!ready ? <p role="status">{messages[locale].loading}</p> : selected.length === 0 ? <section className="empty-state"><h2>{t.unavailable}</h2></section> : <div className="lesson-grid">{selected.map(entry => <article className="lesson-card" key={entry.id}><span className="pill"><bdi>{entry.level}</bdi> · {t.categories[entry.category as typeof categories[number]]}</span><h2 lang={entry.language} dir={entry.language === "ar" ? "rtl" : "ltr"}>{entry.text}</h2><Link className="button secondary" href={`/${locale}/practice/${entry.id}`}>{t.start} ↗</Link></article>)}</div>}
  </>;
}
export function VocabularyPractice({ locale, entry }: { locale: Locale; entry: ContentEntry }) {
  const { preferences, ready } = usePreferences();
  if (!ready) return <p role="status">{messages[locale].loading}</p>;
  return <ConfiguredPractice locale={locale} entry={entry} initialDiacritics={preferences.diacritics} initialTarget={preferences.translationLanguage}/>;
}
function ConfiguredPractice({ locale, entry, initialDiacritics, initialTarget }: { locale: Locale; entry: ContentEntry; initialDiacritics: "optional" | "strict"; initialTarget: Locale }) {
  const [diacritics] = useState(initialDiacritics); const t = vocabularyMessages[locale];
  const exercise = useMemo(() => contentExercise(entry, diacritics), [entry, diacritics]);
  const { record } = useProgress(); const setSessionActive = usePracticeActivity();
  return <><div className="page-heading"><Link className="preview-link" href={`/${locale}/practice`}>{t.back} ←</Link><h1>{t.title} · <bdi>{entry.level}</bdi></h1><p className="pill"><bdi>{languageNames[entry.language]} · {mappingName(exercise.keyboardMapping)}</bdi></p><p>{t.pilot}</p>{entry.register === "informal-msa" && <p>{t.register}</p>}</div><StorageNotice locale={locale}/><ProgressNotice locale={locale}/>
    <PracticeHarness locale={locale} exercise={exercise} onResult={record} onActiveChange={setSessionActive} resultNote={messages[locale].progress} lookup={<Lookup locale={locale} entry={entry} initialTarget={initialTarget}/>}/>
  </>;
}
function Lookup({ locale, entry, initialTarget }: { locale: Locale; entry: ContentEntry; initialTarget: Locale }) {
  const controls = usePracticeLookup();
  const t = vocabularyMessages[locale]; const { update } = usePreferences();
  const [target, setTarget] = useState(initialTarget); const [query, setQuery] = useState("");
  const [result, setResult] = useState<TranslationResult | null>(null); const [open, setOpen] = useState(false); const [loading, setLoading] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null); const request = useRef<LookupRequest | null>(null); const sequence = useRef(0);
  const { vocabulary, save, ready, issue } = useVocabulary();
  useEffect(() => { if (open && dialog.current && !dialog.current.open) dialog.current.showModal(); }, [open]);
  const lookup = async (next: LookupRequest) => {
    request.current = next; const ticket = ++sequence.current; setLoading(true); setResult(null);
    try { const found = await provider.lookup(next); if (ticket === sequence.current) setResult(found); }
    catch { if (ticket === sequence.current) setResult({ status: "error", message: t.error }); }
    finally { if (ticket === sequence.current) setLoading(false); }
  };
  const show = (kind: "sentence" | "word", surface: string, senseId?: string) => {
    controls.pause(); setOpen(true); setQuery(kind === "word" ? surface : ""); void lookup({ sourceLanguage: entry.language, targetLanguage: target, kind, query: surface, contentId: entry.id, senseId });
  };
  const word = result?.status === "found" ? savedWord(result, target, new Date().toISOString()) : null;
  const alreadySaved = word && vocabulary.items.some(item => item.id === word.id);
  return <section className="panel vocabulary-lookup"><div className="button-row"><button className="button secondary" onClick={() => show("sentence", entry.text)}>{t.sentence}</button><button className="text-button" onClick={() => show("word", "")}>{t.lookup}</button></div><p>{t.words}</p><div className="button-row">{entry.annotations.map(annotation => <button className="button secondary" lang={entry.language} dir={entry.language === "ar" ? "rtl" : "ltr"} key={annotation.senseId} onClick={() => show("word", annotation.surface, annotation.senseId)}>{annotation.surface}</button>)}</div>
    <dialog className="typing-tips-dialog vocabulary-dialog" ref={dialog} aria-labelledby="translation-title" onClose={() => { sequence.current++; setOpen(false); controls.resume(); }}>
      <h2 id="translation-title">{t.translation}</h2><p lang={entry.language} dir={entry.language === "ar" ? "rtl" : "ltr"}>{entry.text}</p>
      <label htmlFor="lookup-language">{messages[locale].translationLanguage}</label><select id="lookup-language" value={target} onChange={event => { const language = event.target.value as Locale; setTarget(language); void update({ translationLanguage: language }); if (request.current) void lookup({ ...request.current, targetLanguage: language }); }}>{locales.map(language => <option key={language} value={language}>{languageNames[language]}</option>)}</select>
      <form onSubmit={event => { event.preventDefault(); void lookup({ sourceLanguage: entry.language, targetLanguage: target, kind: "word", query: query.trim() }); }}><label htmlFor="lookup-query">{t.query}</label><div className="button-row"><input id="lookup-query" value={query} lang={entry.language} dir={entry.language === "ar" ? "rtl" : "ltr"} onChange={event => { setQuery(event.target.value); request.current = null; sequence.current++; setResult(null); setLoading(false); }}/><button className="button secondary" type="submit">{t.search}</button></div></form>
      <div role="status">{loading ? messages[locale].loading : result?.status === "found" ? <><p className="translation-result" lang={target} dir={target === "ar" ? "rtl" : "ltr"}>{result.text}</p>{result.sameLanguage && <p>{t.same}</p>}{result.annotation && <>{result.source.id !== entry.id && <><p>{t.context}</p><p lang={result.source.language} dir={result.source.language === "ar" ? "rtl" : "ltr"}>{result.source.text}</p></>}<p lang="en" dir="ltr">{result.annotation.definition}</p><button className="button secondary" disabled={!ready || Boolean(alreadySaved)} onClick={() => { if (word) save({ ...word, savedAt: new Date().toISOString() }); }}>{alreadySaved ? t.saved : t.save}</button></>}<p className="muted">{t.pilot}</p></> : result?.status === "missing" ? <><p>{result.reason === "ambiguous" ? t.ambiguous : t.missing}</p>{result.choices.map(choice => <button className="button secondary" key={`${choice.contentId}-${choice.senseId}`} onClick={() => void lookup({ sourceLanguage: entry.language, targetLanguage: target, kind: "word", query, ...choice })}>{choice.context}</button>)}</> : result?.status === "error" ? <p>{t.error}</p> : null}</div>
      {issue && <p role="alert">{t.storage}</p>}
      {query.trim() && <p><a className="preview-link" target="_blank" rel="noopener noreferrer" href={dictionaryURL(query.trim(), entry.language)}>{t.dictionary} ↗</a></p>}
      <button className="button" autoFocus onClick={() => dialog.current?.close()}>{t.close}</button>
    </dialog>
  </section>;
}
export function VocabularyReview({ locale }: { locale: Locale }) {
  const { vocabulary, ready, remove, exportJSON, recover } = useVocabulary(); const { preferences } = usePreferences();
  const [query, setQuery] = useState(""); const [selected, setSelected] = useState<(SavedWord & { diacritics: "optional" | "strict" }) | null>(null); const t = vocabularyMessages[locale];
  const [notice, setNotice] = useState(""); const file = useRef<HTMLInputElement>(null);
  const { record, activeSessions } = useProgress(); const setSessionActive = usePracticeActivity();
  const exercise = useMemo(() => selected ? { id: `${selected.contentId}-review-${selected.senseId}`, version: selected.contentVersion, mode: "vocabulary" as const, text: selected.surface, language: selected.language, direction: selected.language === "ar" ? "rtl" as const : "ltr" as const, comparison: { language: selected.language, diacritics: selected.diacritics }, keyboardMapping: defaultMappingForLanguage(selected.language) } : null, [selected]);
  const visible = vocabulary.items.filter(item => [item.surface, item.translation, item.context].some(value => value.toLocaleLowerCase(item.language).includes(query.toLocaleLowerCase(item.language))));
  async function dataAction(action: "backup" | "reset" | "import", raw?: string) {
    if (activeSessions > 0) { setNotice(t.dataFailed); return; }
    if (action === "reset" && !window.confirm(t.resetConfirm)) return;
    setNotice(await recover(action, raw) ? t.dataDone : t.dataFailed);
  }
  return <><div className="page-heading"><h1>{t.review}</h1><p>{t.pilot}</p></div><StorageNotice locale={locale}/><ProgressNotice locale={locale}/>
    {exercise ? <><button className="button secondary" onClick={() => setSelected(null)}>{t.back}</button><PracticeHarness key={exercise.id} locale={locale} exercise={exercise} onResult={record} onActiveChange={setSessionActive}/></> : <><div className="panel vocabulary-search"><label htmlFor="saved-search">{t.searchSaved}</label><input id="saved-search" value={query} onChange={event => setQuery(event.target.value)}/><button className="button secondary" onClick={() => download(exportJSON())}>{t.export}</button></div>
      {!ready ? <p role="status">{messages[locale].loading}</p> : visible.length === 0 ? <section className="empty-state"><p>{t.empty}</p></section> : <div className="lesson-grid">{visible.map(item => <article className="review-card" key={item.id}><p className="eyebrow"><bdi>{languageNames[item.language]} → {languageNames[item.targetLanguage]}</bdi></p><h2 lang={item.language} dir={item.language === "ar" ? "rtl" : "ltr"}>{item.surface}</h2><p lang={item.language} dir={item.language === "ar" ? "rtl" : "ltr"}>{item.context}</p><details><summary className="button secondary">{t.reveal}</summary><p className="translation-result" lang={item.targetLanguage} dir={item.targetLanguage === "ar" ? "rtl" : "ltr"}>{item.translation}</p><p lang="en" dir="ltr">{item.definition}</p></details><div className="button-row"><button className="button secondary" onClick={() => setSelected({ ...item, diacritics: preferences.diacritics })}>{t.retype}</button><button className="text-button" onClick={() => remove(item.id)}>{t.remove}</button></div></article>)}</div>}
    </>}
    <section className="panel"><h2>{t.dataManagement}</h2><p>{t.dataManagementNote}</p><div className="button-row"><button className="button secondary" onClick={() => download(exportJSON())}>{t.export}</button><button className="button secondary" disabled={!ready || activeSessions > 0} onClick={() => file.current?.click()}>{t.import}</button><button className="button secondary" disabled={!ready || activeSessions > 0} onClick={() => void dataAction("backup")}>{t.recover}</button><button className="text-button danger" disabled={!ready || activeSessions > 0} onClick={() => void dataAction("reset")}>{t.reset}</button></div><input ref={file} type="file" accept="application/json,.json" className="visually-hidden" aria-label={t.import} onChange={async event => { const selectedFile = event.target.files?.[0]; if (!selectedFile) return; try { if (selectedFile.size > 5000000) setNotice(t.dataFailed); else await dataAction("import", await selectedFile.text()); } catch { setNotice(t.dataFailed); } finally { event.target.value = ""; } }}/><p role="status">{notice}</p></section>
  </>;
}
