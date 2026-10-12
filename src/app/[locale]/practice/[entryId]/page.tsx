import { notFound } from "next/navigation";
import { isLocale } from "@/lib/preferences";
import { entries } from "@/content";
import { VocabularyPractice } from "@/features/vocabulary/views";
export default async function Entry({ params }: { params: Promise<{ locale: string; entryId: string }> }) {
  const { locale, entryId } = await params;
  const entry = entries.find(entry => entry.id === entryId);
  if (!isLocale(locale) || !entry) notFound();
  return <VocabularyPractice key={entry.id} locale={locale} entry={entry}/>;
}
