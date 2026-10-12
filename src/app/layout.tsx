import type { Metadata } from "next";
import "@fontsource/noto-sans/latin-400.css";
import "@fontsource/noto-sans/latin-500.css";
import "@fontsource/noto-sans/latin-600.css";
import "@fontsource/noto-sans/latin-700.css";
import "@fontsource/noto-sans-arabic/arabic-400.css";
import "@fontsource/noto-sans-arabic/arabic-600.css";
import "./globals.css";
export const metadata: Metadata = { title: { default: "KeyLingo — Your language studio", template: "%s · KeyLingo" }, description: "A calm place to practice typing and discover words in English, Dutch, and Modern Standard Arabic." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" suppressHydrationWarning><body>{children}</body></html>;
}
