import { notFound } from "next/navigation";
import { isLocale } from "@/lib/preferences";
import { lessons } from "@/domain/practice";
import { LessonPractice } from "@/features/practice/views";
export default async function LessonPage({ params }: { params: Promise<{ locale: string; lessonId: string }> }) {
  const { locale, lessonId } = await params;
  const lesson = lessons.find(item => item.id === lessonId);
  if (!isLocale(locale) || !lesson) notFound();
  return <LessonPractice key={lesson.id} locale={locale} lesson={lesson}/>;
}
