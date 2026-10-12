export const mappingIds = ["us", "arabic-101"] as const;
export type MappingId = typeof mappingIds[number];
export type Finger = "pinky" | "ring" | "middle" | "index" | "thumb";
export type Key = { id: string; row: number; x: number; width: number; hand: "left" | "right"; finger: Finger };
export type Step = { keyId: string; modifier: "base" | "shift" };
export type Recipe = { id: string; output: string; steps: Step[] };
const rows = [
  ["Backquote", ...Array.from({ length: 10 }, (_, i) => `Digit${(i + 1) % 10}`), "Minus", "Equal", "Backspace"],
  ["Tab", ..."QWERTYUIOP".split("").map(c => `Key${c}`), "BracketLeft", "BracketRight", "Backslash"],
  ["CapsLock", ..."ASDFGHJKL".split("").map(c => `Key${c}`), "Semicolon", "Quote", "Enter"],
  ["ShiftLeft", ..."ZXCVBNM".split("").map(c => `Key${c}`), "Comma", "Period", "Slash", "ShiftRight"],
  ["ControlLeft", "MetaLeft", "AltLeft", "Space", "AltRight", "MetaRight", "ContextMenu", "ControlRight"],
];
const leading = [1, 1.5, 1.75, 2.25, 1.25];
export const physicalKeyboard: Key[][] = rows.map((row, r) => {
  let x = 0;
  return row.map((id, i) => {
    const width = id === "Space" ? 6.25 : i === 0 ? leading[r] : i === row.length - 1 ? 15 - x : r === 4 ? 1.25 : 1;
    const leftLast = [5, 5, 5, 5, 3][r];
    const hand: Key["hand"] = i <= leftLast ? "left" : "right";
    const fingers: Finger[][] = [
      ["pinky", "pinky", "ring", "middle", "index", "index", "index", "index", "middle", "ring", "pinky"],
      ["pinky", "pinky", "ring", "middle", "index", "index", "index", "index", "middle", "ring", "pinky"],
      ["pinky", "pinky", "ring", "middle", "index", "index", "index", "index", "middle", "ring"],
      ["pinky", "pinky", "ring", "middle", "index", "index", "index", "index", "middle", "ring"],
    ];
    const finger: Finger = r === 4 ? id === "Space" || id.startsWith("Alt") || id.startsWith("Meta") ? "thumb" : "pinky" : fingers[r][i] ?? "pinky";
    const key = { id, row: r, x, width, hand, finger }; x += width; return key;
  });
});
export const keys = physicalKeyboard.flat();
const printableRows = rows.slice(0, 4).map(row => row.filter(id => !["Backspace", "Tab", "CapsLock", "Enter", "ShiftLeft", "ShiftRight"].includes(id)));
const latinBase = ["`1234567890-=", "qwertyuiop[]\\", "asdfghjkl;'", "zxcvbnm,./"];
const latinShift = ["~!@#$%^&*()_+", "QWERTYUIOP{}|", 'ASDFGHJKL:"', "ZXCVBNM<>?"];
const arabicBase = ["ذ1234567890-=", "ضصثقفغعهخحجد\\", "شسيبلاتنمكط", ["ئ", "ء", "ؤ", "ر", "لا", "ى", "ة", "و", "ز", "ظ"]];
const arabicShift = ["ّ!@#$%^&*)(_+", ["َ", "ً", "ُ", "ٌ", "لإ", "إ", "‘", "÷", "×", "؛", "<", ">", "|"], ["ِ", "ٍ", "]", "[", "لأ", "أ", "ـ", "،", "/", ":", '"'], ["~", "ْ", "}", "{", "لآ", "آ", "’", ",", ".", "؟"]];
export type Mapping = { id: MappingId; version: number; name: string; recipes: Recipe[] };
function build(id: MappingId): Mapping {
  const recipes: Recipe[] = [];
  for (const modifier of ["base", "shift"] as const) {
    const outputs = id === "arabic-101" ? modifier === "base" ? arabicBase : arabicShift : modifier === "base" ? latinBase : latinShift;
    printableRows.forEach((row, r) => row.forEach((keyId, i) => {
      const output = Array.from(outputs[r])[i];
      recipes.push({ id: `${keyId}:${modifier}`, output, steps: [{ keyId, modifier }] });
    }));
  }
  recipes.push({ id: "Space:base", output: " ", steps: [{ keyId: "Space", modifier: "base" }] }, { id: "Enter:base", output: "\n", steps: [{ keyId: "Enter", modifier: "base" }] });
  return { id, version: 1, name: id === "us" ? "US" : "Arabic 101", recipes };
}
export const keyboardMappings = Object.fromEntries(mappingIds.map(id => [id, build(id)])) as Record<MappingId, Mapping>;
export function adjacent(a: string, b: string): boolean {
  const left = keys.find(key => key.id === a), right = keys.find(key => key.id === b);
  if (!left || !right || a === b) return false;
  return Math.hypot(left.x + left.width / 2 - right.x - right.width / 2, left.row - right.row) <= 1.5;
}
export function recipesForText(mapping: Mapping, text: string): Recipe[] {
  const result: Recipe[] = []; let rest = text.normalize("NFC");
  while (rest) {
    const recipe = [...mapping.recipes].sort((a, b) => b.output.length - a.output.length).find(item => rest.startsWith(item.output));
    if (!recipe) throw new Error(`Unsupported output in ${mapping.id}: ${rest}`);
    result.push(recipe); rest = rest.slice(recipe.output.length);
  }
  return result;
}

// Product defaults, independent of interface/translation language and OS detection.
export function defaultMappingForLanguage(language: "en" | "nl" | "ar"): MappingId {
  return language === "ar" ? "arabic-101" : "us";
}
// Historical results retain their original mapping; retired layouts are not selectable.
export function mappingName(id: string): string {
  return id === "us-international" ? "US International" : keyboardMappings[id as MappingId]?.name ?? id;
}
