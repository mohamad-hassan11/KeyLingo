import type { Language } from "../typing/text";
import { defaultMappingForLanguage } from "../keyboard";
import type { Exercise } from "../typing/engine";

export type Level = "A1" | "A2" | "B1" | "B2";
export type Annotation = { start: number; end: number; surface: string; lemma: string; senseId: string; definition: string; translations: Record<Language, string> };
export type ContentEntry = {
  id: string; version: number; language: Language; kind: "word" | "sentence" | "passage";
  text: string; level: Level; category: string; register: "neutral" | "informal-msa" | "informal";
  translations: Record<Language, string>; annotations: Annotation[];
  provenance: { author: string; license: "CC0-1.0"; original: true };
  review: { status: "draft" | "approved" | "rejected"; reviewer: string; model: string; date: string; findings: string[]; version: number };
};
const languages = ["en", "nl", "ar"] as const;
const record = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0 && value.length <= 10000;
const translations = (value: unknown): value is Record<Language, string> => record(value) && languages.every(language => text(value[language]));
export function isContentEntry(value: unknown): value is ContentEntry {
  if (!record(value) || !text(value.id) || value.id.length > 200 || !Number.isSafeInteger(value.version) || Number(value.version) < 1 || !languages.includes(value.language as Language) || !["word", "sentence", "passage"].includes(String(value.kind)) || !text(value.text) || !["A1", "A2", "B1", "B2"].includes(String(value.level)) || !text(value.category) || !["neutral", "informal", "informal-msa"].includes(String(value.register)) || !translations(value.translations) || value.translations[value.language as Language] !== value.text || !Array.isArray(value.annotations)) return false;
  if (!record(value.provenance) || !text(value.provenance.author) || value.provenance.license !== "CC0-1.0" || value.provenance.original !== true || !record(value.review) || !["draft", "approved", "rejected"].includes(String(value.review.status)) || typeof value.review.reviewer !== "string" || typeof value.review.model !== "string" || typeof value.review.date !== "string" || !Array.isArray(value.review.findings) || !value.review.findings.every(item => typeof item === "string") || value.review.version !== value.version) return false;
  if (value.review.status === "approved" && (!text(value.review.reviewer) || !text(value.review.model) || !Number.isFinite(Date.parse(value.review.date)))) return false;
  const sourceText = value.text;
  const boundaries = new Set([0, sourceText.length, ...Array.from(new Intl.Segmenter(value.language as Language, { granularity: "grapheme" }).segment(sourceText), item => item.index)]);
  const senses = new Set<string>(); let previousEnd = 0;
  return value.annotations.every(annotation => {
    if (!record(annotation) || !Number.isSafeInteger(annotation.start) || !Number.isSafeInteger(annotation.end) || Number(annotation.start) < previousEnd || Number(annotation.end) <= Number(annotation.start) || !boundaries.has(Number(annotation.start)) || !boundaries.has(Number(annotation.end)) || !text(annotation.surface) || sourceText.slice(Number(annotation.start), Number(annotation.end)) !== annotation.surface || !text(annotation.lemma) || !text(annotation.senseId) || senses.has(annotation.senseId) || !text(annotation.definition) || !translations(annotation.translations) || annotation.translations[value.language as Language] !== annotation.surface) return false;
    senses.add(annotation.senseId); previousEnd = Number(annotation.end); return true;
  });
}
export function validateCollection(entries: readonly ContentEntry[], categories: readonly string[], requireReview = true): string[] {
  const errors: string[] = []; const ids = new Set<string>();
  for (const entry of entries) {
    const id = entry.id;
    if (!isContentEntry(entry)) errors.push(`Invalid entry: ${id}`);
    if (ids.has(entry.id)) errors.push(`Duplicate entry: ${entry.id}`);
    ids.add(entry.id);
    if (!categories.includes(entry.category)) errors.push(`Unknown category: ${entry.id}`);
    if (requireReview && entry.review.status !== "approved") errors.push(`Unreviewed: ${entry.id}`);
  }
  for (const language of languages) for (const level of ["A1", "A2", "B1", "B2"] as const) for (const category of categories) {
    if (entries.filter(entry => entry.language === language && entry.level === level && entry.category === category).length !== 1) errors.push(`Coverage: ${language}/${level}/${category}`);
  }
  return errors;
}
export function contentExercise(entry: ContentEntry, diacritics: "optional" | "strict"): Exercise {
  return { id: entry.id, version: entry.version, mode: "vocabulary", text: entry.text, language: entry.language, direction: entry.language === "ar" ? "rtl" : "ltr", comparison: { language: entry.language, diacritics }, keyboardMapping: defaultMappingForLanguage(entry.language), source: { kind: "content", contentId: entry.id, contentVersion: entry.version } };
}
