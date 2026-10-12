export const locales = ["en", "nl", "ar"] as const;
export type Locale = typeof locales[number];
export const PREFERENCES_VERSION = 2;
export type Preferences = {
  interfaceLanguage: Locale; practiceLanguage: Locale; translationLanguage: Locale;
  theme: "light" | "dark" | "system";
  cefr: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"; category: string | null;
  diacritics: "optional" | "strict";
  reflex: { length: number; difficulty: "easy" | "medium" | "hard"; seed: string; pattern?: "random" | "adjacent" | "alternating" | "repeated"; punctuation?: boolean; shift?: boolean };
};
export function isLocale(value: unknown): value is Locale {
  return locales.includes(value as Locale);
}
export function defaultPreferences(locale: Locale = "en"): Preferences {
  return { interfaceLanguage: locale, practiceLanguage: "en", translationLanguage: "nl",
    theme: "system", cefr: "A1", category: null,
    diacritics: "optional", reflex: { length: 60, difficulty: "easy", seed: "keylingo" } };
}
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
export function isPreferences(value: unknown): value is Preferences {
  if (!isRecord(value) || !isRecord(value.reflex)) return false;
  return isLocale(value.interfaceLanguage) && isLocale(value.practiceLanguage) && isLocale(value.translationLanguage)
    && !("keyboardMapping" in value)
    && typeof value.theme === "string" && ["light", "dark", "system"].includes(value.theme)
    && typeof value.cefr === "string" && ["A1", "A2", "B1", "B2", "C1", "C2"].includes(value.cefr)
    && (value.category === null || (typeof value.category === "string" && value.category.length <= 100))
    && typeof value.diacritics === "string" && ["optional", "strict"].includes(value.diacritics)
    && Number.isInteger(value.reflex.length) && Number(value.reflex.length) >= 10 && Number(value.reflex.length) <= 1000
    && typeof value.reflex.difficulty === "string" && ["easy", "medium", "hard"].includes(value.reflex.difficulty)
    && typeof value.reflex.seed === "string" && value.reflex.seed.length <= 100
    && (value.reflex.pattern === undefined || ["random", "adjacent", "alternating", "repeated"].includes(String(value.reflex.pattern)))
    && (value.reflex.punctuation === undefined || typeof value.reflex.punctuation === "boolean")
    && (value.reflex.shift === undefined || typeof value.reflex.shift === "boolean");
}
// Foundation schema v0 lacked a theme. Migrate only this known shape, never unknown data.
export function migratePreferences(version: number, payload: unknown): unknown {
  if (!isRecord(payload)) return undefined;
  if (version === 0 && !("theme" in payload)) return { ...payload, theme: "system" };
  if (version === 1) {
    if (!["us", "us-international", "arabic-101"].includes(String(payload.keyboardMapping))) return undefined;
    const remaining = { ...payload };
    delete remaining.keyboardMapping;
    return isPreferences(remaining) ? remaining : undefined;
  }
  return undefined;
}
export function browserLocale(languages: readonly string[]): Locale {
  return languages.map(language => language.toLowerCase().split("-")[0]).find(isLocale) ?? "en";
}
