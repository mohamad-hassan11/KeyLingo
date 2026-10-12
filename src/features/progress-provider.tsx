"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { addResult, emptyProgress, isProgress, type Progress } from "@/domain/practice/progress";
import type { SessionResult } from "@/domain/typing/engine";
import { LocalRepository, storageKeys } from "@/lib/repository";
type State = { progress: Progress; ready: boolean; issue: string | null; activeSessions: number; record: (result: SessionResult) => void; register: () => () => void; recover: (action?: "backup" | "reset" | "import", raw?: string) => Promise<boolean>; exportJSON: () => string };
const Context = createContext<State | null>(null);
export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState(emptyProgress); const current = useRef(progress);
  const [ready, setReady] = useState(false); const [issue, setIssue] = useState<string | null>(null);
  const [activeSessions, setActiveSessions] = useState(0);
  const repository = useRef<LocalRepository<Progress> | null>(null);
  const queue = useRef(Promise.resolve()); const active = useRef(0); const deferred = useRef(false);
  const pending = useRef<{ result: SessionResult; savedAt: string }[]>([]);
  const apply = useCallback((value: Progress) => { current.current = value; setProgress(value); }, []);
  const refresh = useCallback(async () => {
    if (active.current || pending.current.length) { deferred.current = true; return; }
    const loaded = await repository.current?.load();
    if (loaded?.status === "ok") { apply(loaded.envelope.payload); setIssue(null); }
    else if (loaded?.status === "empty") { apply(emptyProgress()); setIssue(null); }
    else if (loaded) setIssue(loaded.status);
  }, [apply]);
  useEffect(() => {
    let mounted = true;
    try { repository.current = new LocalRepository(localStorage, storageKeys.progress, isProgress); }
    catch { queueMicrotask(() => { if (mounted) { setIssue("unavailable"); setReady(true); } }); return () => { mounted = false; }; }
    void repository.current.load().then(result => {
      if (!mounted) return;
      if (result.status === "ok") apply(result.envelope.payload);
      else if (result.status !== "empty") setIssue(result.status);
      setReady(true);
    });
    const external = (event: StorageEvent) => { if (event.key === storageKeys.progress || event.key === null) void refresh(); };
    window.addEventListener("storage", external);
    return () => { mounted = false; window.removeEventListener("storage", external); };
  }, [apply, refresh]);
  const record = useCallback((result: SessionResult) => {
    const savedAt = new Date().toISOString();
    const next = addResult(current.current, result, savedAt);
    if (next === current.current) return;
    apply(next); pending.current.push({ result, savedAt });
    queue.current = queue.current.then(async () => {
      const repo = repository.current;
      if (!repo) { setIssue("unavailable"); return; }
      for (let attempt = 0; attempt < 3; attempt++) {
        const loaded = await repo.load();
        if (loaded.status !== "ok" && loaded.status !== "empty") { setIssue(loaded.status); return; }
        let merged = loaded.status === "ok" ? loaded.envelope.payload : emptyProgress();
        const batch = [...pending.current];
        for (const item of batch) merged = addResult(merged, item.result, item.savedAt);
        const saved = await repo.save(merged, loaded.status === "ok" ? loaded.envelope.revision : 0);
        if (saved.status === "conflict") continue;
        if (saved.status !== "ok") { setIssue(saved.status); return; }
        pending.current.splice(0, batch.length);
        for (const item of pending.current) merged = addResult(merged, item.result, item.savedAt);
        apply(merged); setIssue(null); return;
      }
      setIssue("conflict");
    }).catch(() => setIssue("unavailable"));
  }, [apply]);
  const register = useCallback(() => {
    active.current++;
    setActiveSessions(active.current);
    return () => { active.current--; setActiveSessions(active.current); if (!active.current && deferred.current) { deferred.current = false; void refresh(); } };
  }, [refresh]);
  const recover = useCallback(async (action: "backup" | "reset" | "import" = "backup", raw?: string) => {
    if (active.current) return false;
    await queue.current;
    const repo = repository.current;
    if (!repo) { setIssue("unavailable"); return false; }
    const result = action === "backup" ? await repo.restoreBackup()
      : action === "reset" ? await repo.reset(emptyProgress())
      : await repo.importJSON(raw ?? "");
    if (result?.status === "ok") {
      let restored = result.envelope.payload;
      if (action === "backup") {
        for (const item of pending.current) restored = addResult(restored, item.result, item.savedAt);
        const saved = await repo.save(restored, result.envelope.revision);
        if (saved.status !== "ok") { setIssue(saved.status); return false; }
        restored = saved.envelope.payload;
      }
      pending.current = []; apply(restored); setIssue(null); return true;
    }
    setIssue(result?.status ?? "unavailable"); return false;
  }, [apply]);
  const exportJSON = useCallback(() => JSON.stringify({ schemaVersion: 1, revision: 1, savedAt: new Date().toISOString(), payload: current.current }, null, 2), []);
  return <Context.Provider value={{ progress, ready, issue, activeSessions, record, register, recover, exportJSON }}>{children}</Context.Provider>;
}
export function useProgress() { const value = useContext(Context); if (!value) throw new Error("ProgressProvider required"); return value; }
export function usePracticeActivity() {
  const { register } = useProgress();
  const release = useRef<(() => void) | null>(null);
  const setActive = useCallback((active: boolean) => {
    if (active && !release.current) release.current = register();
    else if (!active && release.current) { release.current(); release.current = null; }
  }, [register]);
  useEffect(() => () => { release.current?.(); release.current = null; }, []);
  return setActive;
}
