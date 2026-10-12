"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { changeVocabulary, emptyVocabulary, isVocabulary, type SavedWord, type Vocabulary, type VocabularyChange } from "@/domain/content/vocabulary";
import { LocalRepository, storageKeys } from "@/lib/repository";
type State = { vocabulary: Vocabulary; ready: boolean; issue: string | null; save: (item: SavedWord) => void; remove: (id: string) => void; recover: (action?: "backup" | "reset" | "import", raw?: string) => Promise<boolean>; exportJSON: () => string };
const Context = createContext<State | null>(null);
export function VocabularyProvider({ children }: { children: React.ReactNode }) {
  const [vocabulary, setVocabulary] = useState(emptyVocabulary); const current = useRef(vocabulary);
  const [ready, setReady] = useState(false); const [issue, setIssue] = useState<string | null>(null);
  const repo = useRef<LocalRepository<Vocabulary> | null>(null); const queue = useRef(Promise.resolve());
  const pending = useRef<VocabularyChange[]>([]);
  const apply = useCallback((value: Vocabulary) => { current.current = value; setVocabulary(value); }, []);
  useEffect(() => {
    let live = true;
    const refresh = async () => {
      const result = await repo.current?.load(); if (!live) return;
      if (result?.status === "ok" || result?.status === "empty") {
        let value = result.status === "ok" ? result.envelope.payload : emptyVocabulary();
        for (const change of pending.current) value = changeVocabulary(value, change);
        apply(value); if (!pending.current.length) setIssue(null);
      } else if (result) setIssue(result.status);
      setReady(true);
    };
    try { repo.current = new LocalRepository(localStorage, storageKeys.vocabulary, isVocabulary); void refresh(); }
    catch { queueMicrotask(() => { if (live) { setReady(true); setIssue("unavailable"); } }); }
    const external = (event: StorageEvent) => { if (event.key === storageKeys.vocabulary || event.key === null) void refresh(); };
    window.addEventListener("storage", external);
    return () => { live = false; window.removeEventListener("storage", external); };
  }, [apply]);
  const persist = useCallback(() => {
    queue.current = queue.current.then(async () => {
      if (!repo.current) { setIssue("unavailable"); return; }
      for (let attempt = 0; attempt < 3; attempt++) {
        const loaded = await repo.current.load();
        if (loaded.status !== "ok" && loaded.status !== "empty") { setIssue(loaded.status); return; }
        const batch = [...pending.current];
        let merged = loaded.status === "ok" ? loaded.envelope.payload : emptyVocabulary();
        for (const change of batch) merged = changeVocabulary(merged, change);
        const result = await repo.current.save(merged, loaded.status === "ok" ? loaded.envelope.revision : 0);
        if (result.status === "conflict") continue;
        if (result.status !== "ok") { setIssue(result.status); return; }
        pending.current.splice(0, batch.length);
        for (const change of pending.current) merged = changeVocabulary(merged, change);
        apply(merged); setIssue(null); return;
      }
      setIssue("conflict");
    }).catch(() => setIssue("unavailable"));
  }, [apply]);
  const change = useCallback((value: VocabularyChange) => { apply(changeVocabulary(current.current, value)); pending.current.push(value); persist(); }, [apply, persist]);
  const save = useCallback((item: SavedWord) => change({ type: "save", item }), [change]);
  const remove = useCallback((id: string) => change({ type: "remove", id }), [change]);
  const recover = useCallback(async (action: "backup" | "reset" | "import" = "backup", raw?: string) => {
    await queue.current; const repository = repo.current;
    if (!repository) { setIssue("unavailable"); return false; }
    const result = action === "backup" ? await repository.restoreBackup()
      : action === "reset" ? await repository.reset(emptyVocabulary())
      : await repository.importJSON(raw ?? "");
    if (result.status !== "ok") { setIssue(result.status); return false; }
    let value = result.envelope.payload;
    if (action === "backup") {
      for (const item of pending.current) value = changeVocabulary(value, item);
      const saved = await repository.save(value, result.envelope.revision);
      if (saved.status !== "ok") { setIssue(saved.status); return false; }
      value = saved.envelope.payload;
    }
    pending.current = []; apply(value); setIssue(null); return true;
  }, [apply]);
  const exportJSON = useCallback(() => JSON.stringify({ schemaVersion: 1, revision: 1, savedAt: new Date().toISOString(), payload: current.current }, null, 2), []);
  return <Context.Provider value={{ vocabulary, ready, issue, save, remove, recover, exportJSON }}>{children}</Context.Provider>;
}
export function useVocabulary() { const value = useContext(Context); if (!value) throw new Error("VocabularyProvider required"); return value; }
