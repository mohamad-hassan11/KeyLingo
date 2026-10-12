"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { languageNames, messages } from "@/lib/i18n";
import { locales, type Locale, type Preferences } from "@/lib/preferences";
import { usePreferences } from "./preferences-provider";
export function Settings({ locale }: { locale: Locale }) {
  const t = messages[locale]; const router = useRouter();
  const { preferences: p, ready, issue, update, recover, exportJSON } = usePreferences();
  const [notice, setNotice] = useState(""); const file = useRef<HTMLInputElement>(null);
  async function changeLanguage(key: "interfaceLanguage" | "practiceLanguage" | "translationLanguage", value: Locale) {
    await update({ [key]: value });
    if (key === "interfaceLanguage") router.push(`/${value}/settings`);
  }
  function download() {
    const url = URL.createObjectURL(new Blob([exportJSON()], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "keylingo-preferences.json"; anchor.click(); URL.revokeObjectURL(url);
  }
  async function restore(action: "backup" | "reset") {
    if (action === "reset" && !window.confirm(t.resetConfirm)) return;
    setNotice(await recover(action) ? t.recovered : t.recoverFailed);
  }
  return <><div className="page-heading"><p className="eyebrow">{t.yourSetup}</p><h1>{t.settings}</h1><p>{t.independent}</p></div>
    <section className="panel"><fieldset disabled={!ready}><legend>{t.yourSetup}</legend><div className="settings-grid">
      {(["interfaceLanguage", "practiceLanguage", "translationLanguage"] as const).map(key => <div key={key}><label htmlFor={key}>{t[key]}</label><select id={key} value={p[key]} onChange={event => void changeLanguage(key, event.target.value as Locale)}>{locales.map(language => <option value={language} key={language}>{languageNames[language]}</option>)}</select></div>)}

      <div><label htmlFor="theme">{t.theme}</label><select id="theme" value={p.theme} onChange={event => void update({ theme: event.target.value as Preferences["theme"] })}>{(["system", "light", "dark"] as const).map(theme => <option value={theme} key={theme}>{t[theme]}</option>)}</select></div>
      <div><label htmlFor="diacritics">{t.diacritics}</label><select id="diacritics" value={p.diacritics} onChange={event => void update({ diacritics: event.target.value as Preferences["diacritics"] })}><option value="optional">{t.optional}</option><option value="strict">{t.strict}</option></select></div>
    </div></fieldset><p className="muted" role="status">{!ready ? t.loading : issue ? t.storageIssue : t.saved}</p></section>
    <section className="panel"><h2>{t.data}</h2><p>{t.dataNote}</p><div className="button-row"><button className="button secondary" disabled={!ready} onClick={download}>{t.export}</button><button className="button secondary" disabled={!ready} onClick={() => file.current?.click()}>{t.import}</button><button className="button secondary" disabled={!ready} onClick={() => void restore("backup")}>{t.restore}</button><button className="text-button danger" disabled={!ready} onClick={() => void restore("reset")}>{t.reset}</button></div>
      <input className="visually-hidden" ref={file} type="file" accept="application/json,.json" aria-label={t.import} onChange={async event => { const selected = event.target.files?.[0]; if (!selected) return; try { if (selected.size > 100000) { setNotice(t.invalid); return; } setNotice(await recover("import", await selected.text()) ? t.recovered : t.invalid); } catch { setNotice(t.invalid); } finally { event.target.value = ""; } }}/><p role="status">{notice}</p>
    </section></>;
}
