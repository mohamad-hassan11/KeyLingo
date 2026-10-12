import type { Locale } from "@/lib/preferences";
import type { TranslationResult } from "@/lib/translation";
export type SavedWord = { id: string; contentId: string; contentVersion: number; senseId: string; language: Locale; surface: string; context: string; targetLanguage: Locale; translation: string; definition: string; savedAt: string };
export type Vocabulary = { items: SavedWord[] };
export const emptyVocabulary = (): Vocabulary => ({ items: [] });
const record = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length <= 10000;
export function isVocabulary(value: unknown): value is Vocabulary {
  if (!record(value) || !Array.isArray(value.items)) return false;
  const ids = new Set<string>();
  return value.items.every(item => {
    if (!record(item) || !["id", "contentId", "senseId", "surface", "context", "translation", "definition"].every(key => text(item[key])) || !Number.isSafeInteger(item.contentVersion) || Number(item.contentVersion) < 1 || !["en", "nl", "ar"].includes(String(item.language)) || !["en", "nl", "ar"].includes(String(item.targetLanguage)) || typeof item.savedAt !== "string" || !Number.isFinite(Date.parse(item.savedAt)) || item.id !== `${item.contentId}:${item.senseId}:${item.targetLanguage}` || ids.has(String(item.id))) return false;
    ids.add(String(item.id)); return true;
  });
}
export function savedWord(result: Extract<TranslationResult, { status: "found" }>, targetLanguage: Locale, savedAt: string): SavedWord | null {
  if (!result.annotation) return null;
  const { source, annotation } = result;
  return { id: `${source.id}:${annotation.senseId}:${targetLanguage}`, contentId: source.id, contentVersion: source.version, senseId: annotation.senseId, language: source.language, surface: annotation.surface, context: source.text, targetLanguage, translation: result.text, definition: annotation.definition, savedAt };
}
export type VocabularyChange = { type: "save"; item: SavedWord } | { type: "remove"; id: string };
export function changeVocabulary(vocabulary: Vocabulary, change: VocabularyChange): Vocabulary {
  const items = vocabulary.items.filter(item => item.id !== (change.type === "save" ? change.item.id : change.id));
  const next = { items: change.type === "save" ? [...items, change.item] : items };
  if (!isVocabulary(next)) throw new Error("Invalid vocabulary change");
  return next;
}
