import { notFound } from "next/navigation";
import { isLocale } from "@/lib/preferences";
import { AppShell } from "@/features/app-shell";
import { PreferencesProvider } from "@/features/preferences-provider";
import { VocabularyProvider } from "@/features/vocabulary/provider";
import { ProgressProvider } from "@/features/progress-provider";
export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params; if (!isLocale(locale)) notFound();
  return <PreferencesProvider key={locale} locale={locale}><ProgressProvider><VocabularyProvider><AppShell locale={locale}>{children}</AppShell></VocabularyProvider></ProgressProvider></PreferencesProvider>;
}
