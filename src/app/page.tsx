"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { browserLocale, isPreferences, migratePreferences, PREFERENCES_VERSION } from "@/lib/preferences";
import { LocalRepository, storageKeys } from "@/lib/repository";
export default function Entry() {
  const router = useRouter();
  useEffect(() => {
    async function choose() {
      let locale = browserLocale(navigator.languages);
      try { const result = await new LocalRepository(localStorage, storageKeys.preferences, isPreferences, PREFERENCES_VERSION, migratePreferences).load(); if (result.status === "ok") locale = result.envelope.payload.interfaceLanguage; } catch { /* Browser default remains usable when storage is denied. */ }
      router.replace(`/${locale}`);
    }
    void choose();
  }, [router]);
  return <main className="entry"><span className="brand">KeyLingo.</span><p>English · Nederlands · العربية</p><nav><a href="/en">English</a><a href="/nl">Nederlands</a><a href="/ar">العربية</a></nav></main>;
}
