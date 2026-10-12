"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { messages, languageNames } from "@/lib/i18n";
import type { Locale } from "@/lib/preferences";
import { usePreferences } from "./preferences-provider";
import { defaultMappingForLanguage, mappingName } from "@/domain/keyboard";
const navigation = [ ["home", "", "⌂"], ["learn", "/learn", "▤"], ["reflex", "/reflex", "↯"], ["practice", "/practice", "文"], ["vocabulary", "/vocabulary", "◇"], ["progress", "/progress", "▥"], ["settings", "/settings", "⚙"] ] as const;
export function AppShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const path = usePathname(); const t = messages[locale];
  const { preferences, issue } = usePreferences();
  return <div className="app-shell" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
    <a href="#main" className="skip-link">{t.skip}</a>
    <aside className="sidebar">
      <Link className="brand" href={`/${locale}`}><span className="brand-mark" aria-hidden="true">k<span>·</span></span>KeyLingo<span className="brand-dot">.</span></Link>
      <p className="sidebar-caption">{t.studio}</p>
      <nav aria-label={t.studio}>{navigation.map(([name, suffix, icon]) => <Link key={name} href={`/${locale}${suffix}`} aria-current={path === `/${locale}${suffix}` ? "page" : undefined}><span aria-hidden="true">{icon}</span>{t[name]}</Link>)}</nav>
      <div className="sidebar-bottom"><div className="language-dots"><bdi>EN</bdi><bdi>NL</bdi><bdi>ع</bdi></div><p>{t.small}</p><Link href={`/${locale}/studies`}>{t.viewStudies} <span aria-hidden="true">↗</span></Link></div>
    </aside>
    <div className="workspace">
      <header className="topbar"><span>{t.homeRow}</span><Link href={`/${locale}/settings`} className="setup-chip"><span className="status-dot" aria-hidden="true"/><bdi>{languageNames[preferences.practiceLanguage]}</bdi><span aria-hidden="true">·</span><bdi>{mappingName(defaultMappingForLanguage(preferences.practiceLanguage))}</bdi></Link></header>
      {issue && <div className="storage-warning" role="status">{t.storageIssue} <Link href={`/${locale}/settings`}>{t.settings}</Link></div>}
      <main id="main" tabIndex={-1}>{children}</main>
      <footer><span>KeyLingo</span><span>{t.small}</span></footer>
    </div>
  </div>;
}
