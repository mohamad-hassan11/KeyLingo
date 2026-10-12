export type Language = "en" | "nl" | "ar";
export type ComparisonPolicy = { language: Language; diacritics: "optional" | "strict" };

export type Grapheme = {
  text: string;
  originalStart: number;
  originalEnd: number;
  normalizedStart: number;
  normalizedEnd: number;
  comparison: string;
  unitIndex: number | null;
};
export type SegmentedText = { normalized: string; graphemes: Grapheme[]; units: Grapheme[] };

const segmenter = new Intl.Segmenter("und", { granularity: "grapheme" });
// Do not remove hamza/maddah combining marks (0653–0655) or fold letter variants.
// eslint-disable-next-line no-misleading-character-class -- These individual Arabic marks/ranges are intentionally removed independently.
const optionalArabicMarks = /[\u0640\u064b-\u0652\u0656-\u065f\u0670]/gu;

export function normalizeText(text: string): string {
  return text.replace(/\r\n/g, "\n").normalize("NFC");
}

export function segmentText(text: string, policy: ComparisonPolicy): SegmentedText {
  const graphemes: Grapheme[] = [];
  const units: Grapheme[] = [];
  let normalized = "";
  for (const part of segmenter.segment(text)) {
    const value = normalizeText(part.segment);
    const comparison = policy.language === "ar" && policy.diacritics === "optional"
      ? value.replace(optionalArabicMarks, "") : value;
    const grapheme: Grapheme = {
      text: value, originalStart: part.index, originalEnd: part.index + part.segment.length,
      normalizedStart: normalized.length, normalizedEnd: normalized.length + value.length,
      comparison, unitIndex: comparison ? units.length : null,
    };
    normalized += value;
    graphemes.push(grapheme);
    if (comparison) units.push(grapheme);
  }
  return { normalized, graphemes, units };
}

export type NativeEdit = { type: "insert"; text: string }
  | { type: "delete"; retainedText: string }
  | { type: "unchanged" }
  | { type: "unsupported" };

function reorderedMarkAppend(before: string, after: string): string | null {
  const last = [...segmenter.segment(before)].at(-1);
  if (!last) return null;
  const prefix = before.slice(0, last.index);
  if (!after.startsWith(prefix)) return null;
  const suffix = after.slice(prefix.length);
  const first = [...segmenter.segment(suffix)][0];
  if (!first) return null;
  const oldCluster = last.segment.normalize("NFD");
  const newCluster = first.segment.normalize("NFD");
  // Only the final grapheme's marks may change; its base and earlier text stay fixed.
  if (oldCluster.replace(/\p{M}/gu, "") !== newCluster.replace(/\p{M}/gu, "")) return null;
  const remaining = [...newCluster.matchAll(/\p{M}/gu)].map(match => match[0]);
  for (const mark of oldCluster.matchAll(/\p{M}/gu)) {
    const index = remaining.indexOf(mark[0]);
    if (index < 0) return null; // A previous mark was replaced, not extended.
    remaining.splice(index, 1);
  }
  const appended = remaining.join("") + suffix.slice(first.segment.length);
  // This reconstruction check also rejects noncanonical reorder/replacement edits.
  return appended && normalizeText(before + appended) === after ? appended : null;
}

// Text authority stays with the textarea. Infer only append or backward correction.
export function inferNativeEdit(before: string, after: string): NativeEdit {
  const normalized = normalizeText(after);
  if (normalized === before) return { type: "unchanged" };
  if (after.startsWith(before)) return { type: "insert", text: after.slice(before.length) };
  if (before.startsWith(normalized)) return { type: "delete", retainedText: normalized };
  const beforeNFD = before.normalize("NFD");
  const afterNFD = normalized.normalize("NFD");
  if (afterNFD.startsWith(beforeNFD)) return { type: "insert", text: afterNFD.slice(beforeNFD.length) };
  if (beforeNFD.startsWith(afterNFD)) return { type: "delete", retainedText: normalized };
  const appended = reorderedMarkAppend(before, normalized);
  if (appended !== null) return { type: "insert", text: appended };
  if (reorderedMarkAppend(normalized, before) !== null) return { type: "delete", retainedText: normalized };
  return { type: "unsupported" };
}
