import { notFound } from "next/navigation";
import Link from "next/link";
import { isLocale } from "@/lib/preferences";
import { messages } from "@/lib/i18n";
import { VocabularyLibrary, VocabularyReview } from "@/features/vocabulary/views";
import { Settings } from "@/features/settings";
import { Curriculum, Reflex, ProgressView } from "@/features/practice/views";
export default async function Section({ params }: { params: Promise<{ locale: string; section: string }> }) {
  const { locale, section } = await params; if (!isLocale(locale)) notFound();
  switch (section) {
    case "settings": return <Settings locale={locale}/>;
    case "learn": return <Curriculum locale={locale}/>;
    case "practice": return <VocabularyLibrary locale={locale}/>;
    case "reflex": return <Reflex locale={locale}/>;
    case "vocabulary": return <VocabularyReview locale={locale}/>;
    case "progress": return <ProgressView locale={locale}/>;
    case "studies": { const t = messages[locale]; return <><div className="page-heading"><p className="eyebrow">{t.foundation}</p><h1>{t.studies}</h1><p>{t.studyNote}</p></div><div className="lesson-grid">{(["home", "learn", "practice", "vocabulary", "progress"] as const).map(screen => <Link className="lesson-card study-link" key={screen} href={`/${locale}/studies/${screen}`}><span className="eyebrow">{t.viewStudies} ↗</span><h2>{t[screen]}</h2></Link>)}</div></>; }
    default: notFound();
  }
}
