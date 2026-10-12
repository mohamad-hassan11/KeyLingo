import { ContinueLearning } from "@/features/practice/views";
import { HomeView } from "@/features/studio-views";
import { isLocale } from "@/lib/preferences";
import { notFound } from "next/navigation";
export default async function Home({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; if (!isLocale(locale)) notFound(); return <HomeView locale={locale} recommendation={<ContinueLearning locale={locale} compact/>}/>; }
