"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { defaultPreferences, isPreferences, migratePreferences, PREFERENCES_VERSION, type Locale, type Preferences } from "@/lib/preferences";
import { LocalRepository, storageKeys, type SaveResult } from "@/lib/repository";

type Context = {
  preferences: Preferences; ready: boolean; issue: boolean;
  update: (patch: Partial<Preferences>) => Promise<void>;
  recover: (action: "backup" | "reset" | "import", raw?: string) => Promise<boolean>;
  exportJSON: () => string;
};
const PreferencesContext = createContext<Context | null>(null);
export function PreferencesProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const [preferences, setPreferences] = useState(() => defaultPreferences(locale));
  const [ready, setReady] = useState(false);
  const [issue, setIssue] = useState(false);
  const repo = useRef<LocalRepository<Preferences> | null>(null);
  const revision = useRef(0);
  const current = useRef(preferences);
  const queue = useRef(Promise.resolve());
  const busy = useRef(false);

  useEffect(() => {
    let live = true;
    async function load() {
      try {
        const repository = new LocalRepository(window.localStorage, storageKeys.preferences, isPreferences, PREFERENCES_VERSION, migratePreferences);
        repo.current = repository;
        const result = await repository.load();
        if (!live) return;
        if (result.status === "ok") {
          revision.current = result.envelope.revision;
          current.current = { ...result.envelope.payload, interfaceLanguage: locale };
          setPreferences(current.current);
        } else if (result.status !== "empty") setIssue(true);
      } catch { if (live) setIssue(true); }
      if (live) setReady(true);
    }
    void load();
    return () => { live = false; };
  }, [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme = preferences.theme === "system" ? (media.matches ? "dark" : "light") : preferences.theme;
    };
    apply(); media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [locale, preferences.theme]);

  useEffect(() => {
    const refresh = async (event: StorageEvent) => {
      if (event.key !== storageKeys.preferences || busy.current || !repo.current) return;
      const result = await repo.current.load();
      if (result.status === "ok" && result.envelope.revision !== revision.current) {
        revision.current = result.envelope.revision;
        current.current = { ...result.envelope.payload, interfaceLanguage: locale };
        setPreferences(current.current); setIssue(false);
      } else if (result.status !== "ok") setIssue(true);
    };
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, [locale]);

  const applyResult = useCallback((result: SaveResult<Preferences>) => {
    if (result.status !== "ok") { setIssue(true); return false; }
    revision.current = result.envelope.revision;
    current.current = result.envelope.payload;
    setPreferences(current.current); setIssue(false); return true;
  }, []);
  const update = useCallback(async (patch: Partial<Preferences>) => {
    const next = { ...current.current, ...patch };
    if (!isPreferences(next)) return;
    current.current = next; setPreferences(next); busy.current = true;
    queue.current = queue.current.then(async () => {
      if (!repo.current) { setIssue(true); return; }
      const result = await repo.current.save(next, revision.current);
      if (result.status === "ok") { revision.current = result.envelope.revision; setIssue(false); }
      else setIssue(true);
    }).finally(() => { busy.current = false; });
    await queue.current;
  }, []);
  const recover = useCallback(async (action: "backup" | "reset" | "import", raw?: string) => {
    await queue.current;
    if (!repo.current) return false;
    const result = action === "backup" ? await repo.current.restoreBackup()
      : action === "reset" ? await repo.current.reset(defaultPreferences(locale))
      : await repo.current.importJSON(raw ?? "");
    return applyResult(result);
  }, [applyResult, locale]);
  const exportJSON = useCallback(() => JSON.stringify({ schemaVersion: PREFERENCES_VERSION, revision: Math.max(1, revision.current),
    savedAt: new Date().toISOString(), payload: current.current }, null, 2), []);
  return <PreferencesContext.Provider value={{ preferences, ready, issue, update, recover, exportJSON }}>{children}</PreferencesContext.Provider>;
}
export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error("PreferencesProvider is required");
  return context;
}
