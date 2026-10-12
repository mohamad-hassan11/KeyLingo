"use client";
import { useMemo, useState } from "react";
import { keyboardMappings, physicalKeyboard, keys, type MappingId, type Recipe } from "@/domain/keyboard";
import { segmentText } from "@/domain/typing/text";
import { practiceMessages } from "./messages";
import type { Locale } from "@/lib/preferences";
export function KeyboardGuide({ locale, mappingId, recipeIds, position }: { locale: Locale; mappingId: MappingId; recipeIds: string[]; position: number }) {
  const mapping = keyboardMappings[mappingId]; const t = practiceMessages[locale];
  const [layer, setLayer] = useState<"next" | "base" | "shift">("next");
  const tokens = useMemo(() => {
    let offset = 0;
    const result: { recipe: Recipe; start: number; end: number }[] = [];
    for (const id of recipeIds) {
      const recipe = mapping.recipes.find(item => item.id === id)!;
      const start = offset;
      offset += segmentText(recipe.output, { language: mappingId === "arabic-101" ? "ar" : "en", diacritics: "strict" }).units.length;
      result.push({ recipe, start, end: offset });
    }
    return result;
  }, [mapping, mappingId, recipeIds]);
  const next: Recipe | undefined = tokens.find(token => position >= token.start && position < token.end)?.recipe;
  const highlighted = next?.steps.flatMap(step => [step.keyId, ...(step.modifier === "shift" ? [keys.find(key => key.id === step.keyId)?.hand === "left" ? "ShiftRight" : "ShiftLeft"] : [])]) ?? [];
  const showLayer = layer === "next" ? next?.steps[0].modifier ?? "base" : layer;
  return <section className="panel keyboard-guide"><h2>{t.keyboard} · <bdi>{mapping.name}</bdi></h2>
    <p className="muted">{t.instructions}</p>
    {next && <><p>{t.sequence}: <bdi dir="ltr">{next.steps.map(step => `${step.modifier === "base" ? "" : `Shift + `}${step.keyId.replace("Key", "")}`).join(" → ")}</bdi> → <bdi dir={mappingId === "arabic-101" ? "rtl" : "ltr"}>{next.output === " " ? "␣" : next.output}</bdi></p>
      <p>{t.finger}: {next.steps.map((step, i) => { const key = keys.find(k => k.id === step.keyId)!; return <span key={i}>{i ? " → " : ""}{t[key.hand]} · {t[key.finger]}</span>; })}</p></>}
    <label htmlFor="keyboard-layer">{t.modifier}</label><select id="keyboard-layer" value={layer} onChange={event => setLayer(event.target.value as typeof layer)}>{(["next", "base", "shift"] as const).map(value => <option key={value} value={value}>{value === "next" ? t.nextLayer : t[value]}</option>)}</select>
    <p className="muted">{t.directions}</p>
    <div className="keyboard-scroll" tabIndex={0} role="region" aria-label={t.keyboard} dir="ltr"><div className="physical-keyboard" aria-hidden="true">{physicalKeyboard.map((row, i) => <div className="physical-row" key={i}>{row.map(key => {
      const output = mapping.recipes.find(r => r.id === `${key.id}:${showLayer}`)?.output;
      return <span key={key.id} className={`physical-key ${highlighted.includes(key.id) ? "highlighted" : ""}`} style={{ flex: key.width }} data-key={key.id}><bdi>{output === " " ? "Space" : output === "\n" ? "Enter" : output && /^[\p{M}]+$/u.test(output) ? `◌${output}` : output ?? (key.id === "ContextMenu" ? "Menu" : key.id.replace("Left", "").replace("Right", ""))}</bdi></span>;
    })}</div>)}</div></div>
    <p className="muted">{t.recipeNote}</p>
  </section>;
}
