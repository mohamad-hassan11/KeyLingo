"use client";
import { useEffect, useRef, type RefObject } from "react";
import { inferNativeEdit } from "@/domain/typing/text";
import type { Command, Rejection, Session, Transition } from "@/domain/typing/engine";

export type InputNotice = Rejection | "paste";
const insertions = new Set(["insertText", "insertLineBreak", "insertParagraph", "insertCompositionText", "insertFromComposition"]);
const deletions = new Set(["deleteContentBackward", "deleteWordBackward", "deleteSoftLineBackward", "deleteHardLineBackward"]);
const isTransfer = (type: string) => type.includes("Paste") || type.includes("Drop");

export function TypingInput({ session, inputRef, getSession, command, onNotice, label, helpId, placeholder }: {
  session: Session; inputRef: RefObject<HTMLTextAreaElement | null>;
  getSession: () => Session; command: (action: Command) => Transition;
  onNotice: (notice: InputNotice | null) => void; label: string; helpId: string; placeholder: string;
}) {
  const composing = useRef(false);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    let pendingRejection = false;
    let rejectedComposition = false;
    const sync = (moveCaret = false) => {
      if (composing.current) return;
      const value = getSession().acceptedText;
      const changed = input.value !== value;
      if (changed) input.value = value;
      if (changed || moveCaret) input.setSelectionRange(value.length, value.length);
    };
    const commit = () => {
      const edit = inferNativeEdit(getSession().acceptedText, input.value);
      if (edit.type === "unsupported") { onNotice("unsupported"); sync(true); return; }
      if (edit.type !== "unchanged") {
        const result = command(edit);
        onNotice(result.accepted ? null : result.reason);
      }
      sync();
    };
    const beforeInput = (event: InputEvent) => {
      const transfer = isTransfer(event.inputType);
      if (composing.current && !transfer) return;
      const state = getSession();
      const atEnd = input.selectionStart === input.value.length && input.selectionEnd === input.value.length;
      const supported = !event.inputType || insertions.has(event.inputType) || deletions.has(event.inputType);
      const blocked = transfer || !supported || !atEnd || state.pauseReasons.length > 0
        || state.status === "completed" || state.status === "abandoned";
      pendingRejection = blocked && !event.cancelable;
      if (blocked) {
        if (event.cancelable) event.preventDefault();
        else if (composing.current) rejectedComposition = true;
        onNotice(transfer ? "paste" : "unsupported");
        sync(true);
      }
    };
    const onInput = (event: InputEvent) => {
      if (isTransfer(event.inputType)) {
        pendingRejection = false;
        if (composing.current) rejectedComposition = true;
        onNotice("paste"); sync(true); return;
      }
      if (composing.current || event.isComposing) return;
      const supported = !event.inputType || insertions.has(event.inputType) || deletions.has(event.inputType);
      if (pendingRejection || !supported) { pendingRejection = false; onNotice("unsupported"); sync(true); return; }
      commit();
    };
    const compositionStart = () => {
      rejectedComposition = input.selectionStart !== input.value.length || input.selectionEnd !== input.value.length;
      pendingRejection = false;
      composing.current = true;
    };
    const compositionEnd = () => {
      composing.current = false;
      if (rejectedComposition) { rejectedComposition = false; onNotice("unsupported"); sync(true); }
      else commit();
    };
    const transfer = (event: Event) => { event.preventDefault(); onNotice("paste"); sync(true); };
    const windowFocus = () => { if (document.activeElement === input) command({ type: "resume", reason: "focus" }); };
    input.addEventListener("beforeinput", beforeInput);
    input.addEventListener("input", onInput);
    input.addEventListener("compositionstart", compositionStart);
    input.addEventListener("compositionend", compositionEnd);
    input.addEventListener("paste", transfer);
    input.addEventListener("drop", transfer);
    window.addEventListener("focus", windowFocus);
    sync();
    return () => {
      composing.current = false;
      input.removeEventListener("beforeinput", beforeInput);
      input.removeEventListener("input", onInput);
      input.removeEventListener("compositionstart", compositionStart);
      input.removeEventListener("compositionend", compositionEnd);
      input.removeEventListener("paste", transfer);
      input.removeEventListener("drop", transfer);
      window.removeEventListener("focus", windowFocus);
    };
  }, [inputRef, getSession, command, onNotice]);

  useEffect(() => {
    if (!composing.current && inputRef.current && inputRef.current.value !== session.acceptedText) {
      inputRef.current.value = session.acceptedText;
      inputRef.current.setSelectionRange(session.acceptedText.length, session.acceptedText.length);
    }
  }, [session.acceptedText, session.id, inputRef]);

  return <div className="typing-input-field">
    <label htmlFor="typing-input">{label}</label>
    <textarea id="typing-input" ref={inputRef} defaultValue="" lang={session.exercise.language}
      dir={session.exercise.direction} spellCheck={false} autoCorrect="off" autoCapitalize="off"
      autoComplete="off" inputMode="text" translate="no" placeholder={placeholder}
      aria-describedby={`${helpId} typing-target`} readOnly={session.pauseReasons.length > 0 || session.status === "completed" || session.status === "abandoned"}
      onFocus={() => command({ type: "resume", reason: "focus" })}
      onBlur={() => command({ type: "pause", reason: "focus" })}
      onKeyDown={event => { if (event.key === "Escape" && !event.nativeEvent.isComposing) { event.preventDefault(); command({ type: "pause", reason: "manual" }); } }}/>
  </div>;
}
