import { adjacent, keyboardMappings, keys, mappingIds, type MappingId, type Recipe } from "../keyboard";
import { defaultMappingForLanguage } from "../keyboard";
import { segmentText, type Language } from "../typing/text";
import type { Exercise } from "../typing/engine";
export const GENERATOR_VERSION = 1;
export const LESSON_VERSION = 1;
export const lessonSlugs = ["home", "left", "right", "alternating", "upper", "lower", "mixed", "shift", "numbers", "symbols", "recipes", "cumulative"] as const;
export type Lesson = { id: string; version: number; mapping: MappingId; index: number; prerequisites: string[]; introducedKeys: string[]; practicedKeys: string[]; recipeIds: string[]; exercise: Exercise };
const home = "ASDFGHJKL".split("").map(c => `Key${c}`);
const upper = "QWERTYUIOP".split("").map(c => `Key${c}`);
const lower = "ZXCVBNM".split("").map(c => `Key${c}`);
const numbers = Array.from({ length: 10 }, (_, i) => `Digit${i}`);
const punctuation = ["Semicolon", "Quote", "Comma", "Period", "Slash", "Minus", "Equal", "BracketLeft", "BracketRight", "Backslash"];
function makeLessons(mappingId: MappingId): Lesson[] {
  const mapping = keyboardMappings[mappingId];
  const groups = [home, home.slice(0, 5), home.slice(5), ["KeyF", "KeyJ", "KeyD", "KeyK", "KeyS", "KeyL"], upper, lower, [...home, ...upper, ...lower], [...home, ...upper, ...lower, ...punctuation], numbers, punctuation, [], [...home, ...upper, ...lower, ...numbers, ...punctuation]];
  const known = new Set<string>();
  return lessonSlugs.map((slug, index) => {
    let pool = mapping.recipes.filter(recipe => groups[index].includes(recipe.steps[0].keyId) && recipe.steps[0].modifier === (index === 7 ? "shift" : "base") && !/^[\p{M}\u0640]+$/u.test(recipe.output));
    if (index === 10) pool = mappingId === "arabic-101" ? mapping.recipes.filter(recipe => ["لا", "لأ", "لإ", "لآ", "أ", "إ", "آ"].includes(recipe.output)) : mapping.recipes.filter(recipe => ["@", "#", "&", "(", ")", "_"].includes(recipe.output));
    const sequence: Recipe[] = [];
    for (let round = 0; round < 4; round++) {
      pool.forEach((recipe, i) => { sequence.push(recipe); if (i % 4 === 3) sequence.push(mapping.recipes.find(r => r.output === " ")!); });
      if (round < 3) sequence.push(mapping.recipes.find(r => r.output === " ")!);
    }
    const practicedKeys = [...new Set(pool.flatMap(recipe => recipe.steps.map(step => step.keyId)))];
    const introducedKeys = practicedKeys.filter(key => !known.has(key));
    practicedKeys.forEach(key => known.add(key));
    const id = `${mappingId}-${slug}`;
    const language = mappingId === "arabic-101" ? "ar" : "en";
    return { id, version: LESSON_VERSION, mapping: mappingId, index, prerequisites: index ? [`${mappingId}-${lessonSlugs[index - 1]}`] : [], introducedKeys, practicedKeys, recipeIds: sequence.map(recipe => recipe.id), exercise: { id, version: LESSON_VERSION, mode: "guided", text: sequence.map(recipe => recipe.output).join(""), language, direction: language === "ar" ? "rtl" : "ltr", comparison: { language, diacritics: "strict" }, keyboardMapping: mappingId, source: { kind: "lesson", lessonId: id, lessonVersion: LESSON_VERSION, mappingVersion: mapping.version } } };
  });
}
export const lessons = mappingIds.flatMap(makeLessons);
export type GeneratorConfig = { mapping: MappingId; language?: Language; seed: string; version: number; length: number; difficulty: "easy" | "medium" | "hard"; pattern: "random" | "adjacent" | "alternating" | "repeated"; punctuation: boolean; shift: boolean };
export type Generated = { ok: true; exercise: Exercise; recipeIds: string[] } | { ok: false; reason: "invalid-config" | "no-eligible-outputs" };
export function generate(config: GeneratorConfig): Generated {
  if (!mappingIds.includes(config.mapping) || config.version !== GENERATOR_VERSION || !Number.isInteger(config.length) || config.length < 10 || config.length > 1000 || typeof config.seed !== "string" || config.seed.length > 100 || !["easy", "medium", "hard"].includes(config.difficulty) || !["random", "adjacent", "alternating", "repeated"].includes(config.pattern) || typeof config.punctuation !== "boolean" || typeof config.shift !== "boolean") return { ok: false, reason: "invalid-config" };
  if (config.language !== undefined && (!["en", "nl", "ar"].includes(config.language) || defaultMappingForLanguage(config.language) !== config.mapping)) return { ok: false, reason: "invalid-config" };
  const mapping = keyboardMappings[config.mapping];
  const language = config.language ?? (config.mapping === "arabic-101" ? "ar" : "en");
  const policy = { language, diacritics: "strict" } as const;
  const pool = mapping.recipes.filter(recipe => {
    const step = recipe.steps[0]; const key = keys.find(k => k.id === step.keyId)!;
    if (/^[\p{M}\u0640]+$/u.test(recipe.output) || ["Space", "Enter"].includes(step.keyId)) return false;
    if (step.modifier === "shift" && !config.shift) return false;
    if (!config.punctuation && !/[\p{L}\p{N}]/u.test(recipe.output)) return false;
    if (config.difficulty === "easy" && !home.includes(key.id)) return false;
    if (config.difficulty === "medium" && !key.id.startsWith("Key")) return false;
    return true;
  });
  if (!pool.length) return { ok: false, reason: "no-eligible-outputs" };
  let state = 2166136261;
  for (const char of JSON.stringify([config.mapping, config.seed, config.version, config.length, config.difficulty, config.pattern, config.punctuation, config.shift])) state = Math.imul(state ^ char.charCodeAt(0), 16777619) >>> 0;
  const random = () => { state = (state + 0x6d2b79f5) >>> 0; let n = Math.imul(state ^ state >>> 15, 1 | state); n ^= n + Math.imul(n ^ n >>> 7, 61 | n); return ((n ^ n >>> 14) >>> 0) / 4294967296; };
  const sizes = new Map(pool.map(recipe => [recipe.id, segmentText(recipe.output, policy).units.length]));
  const sequence: Recipe[] = []; let size = 0;
  while (size < config.length) {
    const previous = sequence.at(-1);
    const candidates = pool.filter(recipe => {
      if (sizes.get(recipe.id)! > config.length - size) return false;
      if (!previous || config.pattern === "random") return true;
      const a = previous.steps[0].keyId, b = recipe.steps[0].keyId;
      if (config.pattern === "adjacent") return adjacent(a, b);
      if (config.pattern === "alternating") return keys.find(key => key.id === a)!.hand !== keys.find(key => key.id === b)!.hand;
      return sequence.length % 3 === 0 || a === b;
    });
    if (!candidates.length) return { ok: false, reason: "no-eligible-outputs" };
    const recipe = candidates[Math.floor(random() * candidates.length)]; sequence.push(recipe); size += sizes.get(recipe.id)!;
  }
  return { ok: true, recipeIds: sequence.map(recipe => recipe.id), exercise: { id: `reflex-v${config.version}-${config.seed}`, version: config.version, mode: "reflex", text: sequence.map(recipe => recipe.output).join(""), language, direction: language === "ar" ? "rtl" : "ltr", comparison: policy, keyboardMapping: config.mapping, source: { kind: "reflex", config: { ...config }, mappingVersion: mapping.version } } };
}
