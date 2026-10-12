import { notFound } from "next/navigation";
import { isLocale } from "@/lib/preferences";
import { Harness } from "@/features/typing/harness";

export default async function HarnessPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <Harness locale={locale}/>;
}
