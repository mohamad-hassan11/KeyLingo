import { notFound } from "next/navigation";
import Link from "next/link";
import { isLocale } from "@/lib/preferences";
import { messages } from "@/lib/i18n";
import { HomeView, CurriculumView, PracticeStudy, VocabularyStudy, ProgressStudy } from "@/features/studio-views";
export default async function Study({ params }: { params: Promise<{ locale: string; screen: string }> }) {
  const { locale, screen } = await params; if (!isLocale(locale)) notFound();
  const t = messages[locale]; const views = { home: HomeView, learn: CurriculumView, practice: PracticeStudy, vocabulary: VocabularyStudy, progress: ProgressStudy };
  if (!(screen in views)) notFound();
  const View = views[screen as keyof typeof views];
  return <><div className="study-banner"><p>{t.studyNote}</p><Link href={`/${locale}/studies`}>{t.studies} ↗</Link></div><View locale={locale} study/></>;
}
