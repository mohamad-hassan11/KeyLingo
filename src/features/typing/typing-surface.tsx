"use client";
import { useEffect, useRef, useState } from "react";
import type { Session, Snapshot } from "@/domain/typing/engine";

type Highlight = { x: number; y: number; width: number; height: number; state: string };

export function TypingSurface({ session, view, label }: { session: Session; view: Snapshot; label: string }) {
  const stage = useRef<HTMLDivElement>(null);
  const target = useRef<HTMLParagraphElement>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const feedback = view.states.join(",");

  useEffect(() => {
    let live = true;
    const measure = () => {
      if (!live || !target.current?.firstChild || !stage.current) return;
      const node = target.current.firstChild;
      const bounds = stage.current.getBoundingClientRect();
      const marks: Highlight[] = [];
      const states = feedback.split(",");
      for (let index = 0; index < session.target.units.length; index++) {
        const state = states[index] === "pending" ? (index === view.position ? "current" : null) : states[index];
        if (!state) continue;
        const unit = session.target.units[index];
        const range = document.createRange();
        range.setStart(node, unit.originalStart); range.setEnd(node, unit.originalEnd);
        for (const rect of range.getClientRects()) {
          marks.push({ x: rect.left - bounds.left, y: rect.top - bounds.top,
            width: Math.max(3, rect.width), height: rect.height, state });
        }
      }
      setHighlights(marks);
    };
    const resize = new ResizeObserver(measure);
    if (stage.current) resize.observe(stage.current);
    void document.fonts.ready.then(measure);
    measure();
    return () => { live = false; resize.disconnect(); };
  }, [session.target, feedback, view.position]);

  return <section className="typing-target-panel" aria-labelledby="typing-target-label">
    <p className="eyebrow" id="typing-target-label">{label}</p>
    <div className="typing-text-stage" ref={stage}>
      <div className="typing-highlights" aria-hidden="true">{highlights.map((mark, index) => <span
        key={index} className={`typing-highlight ${mark.state}`}
        style={{ left: mark.x, top: mark.y, width: mark.width, height: mark.height }}/>)}</div>
      <p id="typing-target" className="typing-target-text" ref={target} lang={session.exercise.language}
        dir={session.exercise.direction} translate="no">{session.exercise.text}</p>
    </div>
  </section>;
}
