import pilot from "./pilot.json";
import { isContentEntry, validateCollection, type ContentEntry } from "@/domain/content";
export const categories = ["daily-life", "travel", "work-study", "food", "culture", "technology", "casual"] as const;
export const draftEntries: ContentEntry[] = pilot.map(entry => {
  if (!isContentEntry(entry)) throw new Error(`Invalid pilot content: ${entry.id}`);
  return entry;
});
export const entries = draftEntries.filter(entry => entry.review.status === "approved");

const errors = validateCollection(draftEntries, categories, false);
if (errors.length) throw new Error(`Invalid pilot collection: ${errors.join("; ")}`);
