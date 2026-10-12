import type { Annotation, ContentEntry } from "@/domain/content";
import type { Locale } from "./preferences";
export type LookupRequest = { sourceLanguage: Locale; targetLanguage: Locale; kind: "sentence" | "word"; query: string; contentId?: string; senseId?: string };
export type TranslationResult =
  | { status: "found"; text: string; sameLanguage: boolean; source: ContentEntry; annotation?: Annotation; provenance: "bundled-pilot" }
  | { status: "missing"; reason: "not-found" | "ambiguous"; choices: { contentId: string; senseId: string; context: string }[] }
  | { status: "error"; message: string };
export interface TranslationProvider { lookup(request: LookupRequest): Promise<TranslationResult> }
export class BundledTranslationProvider implements TranslationProvider {
  constructor(private entries: readonly ContentEntry[]) {}
  async lookup(request: LookupRequest): Promise<TranslationResult> {
    const available = this.entries.filter(entry => entry.review.status === "approved" && entry.language === request.sourceLanguage && (!request.contentId || entry.id === request.contentId));
    if (request.kind === "sentence") {
      const matches = available.filter(entry => entry.text.normalize("NFC") === request.query.normalize("NFC"));
      if (matches.length !== 1) return { status: "missing", reason: matches.length ? "ambiguous" : "not-found", choices: [] };
      const source = matches[0];
      return { status: "found", text: source.translations[request.targetLanguage], source, sameLanguage: request.sourceLanguage === request.targetLanguage, provenance: "bundled-pilot" };
    }
    const query = request.query.normalize("NFC");
    const matches = available.flatMap(source => source.annotations.filter(annotation => (!request.senseId || annotation.senseId === request.senseId) && [annotation.surface, annotation.lemma].some(value => value.normalize("NFC") === query)).map(annotation => ({ source, annotation })));
    const unique = [...new Map(matches.map(match => [match.annotation.senseId, match])).values()];
    if (unique.length !== 1) return { status: "missing", reason: unique.length ? "ambiguous" : "not-found", choices: unique.map(match => ({ contentId: match.source.id, senseId: match.annotation.senseId, context: match.source.text })) };
    const { source, annotation } = unique[0];
    return { status: "found", text: annotation.translations[request.targetLanguage], source, annotation, sameLanguage: request.sourceLanguage === request.targetLanguage, provenance: "bundled-pilot" };
  }
}
export function dictionaryURL(query: string, language: Locale): string {
  return `https://${language}.wiktionary.org/wiki/${encodeURIComponent(query)}`;
}
