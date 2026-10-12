"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createSession, transition, snapshot, type Command, type Exercise } from "@/domain/typing/engine";

export function useTypingSession(exercise: Exercise) {
  const [session, setSession] = useState(() => createSession(exercise, "initial", 0));
  const current = useRef(session);
  const [now, setNow] = useState(0);

  const command = useCallback((action: Command) => {
    const time = performance.now();
    const result = transition(current.current, action, time);
    if (result.accepted) { current.current = result.session; setSession(result.session); }
    setNow(time);
    return result;
  }, []);
  const getSession = useCallback(() => current.current, []);

  useEffect(() => {
    if (current.current.id === "initial") command({ type: "restart", sessionId: crypto.randomUUID() });
    const visibility = () => command({ type: document.hidden ? "pause" : "resume", reason: "visibility" });
    const focusLost = () => command({ type: "pause", reason: "focus" });
    visibility();
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", focusLost);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", focusLost);
    };
  }, [command]);

  useEffect(() => {
    if (session.status !== "running") return;
    const timer = window.setInterval(() => setNow(performance.now()), 250);
    return () => window.clearInterval(timer);
  }, [session.status]);

  return { session, view: snapshot(session, Math.max(now, session.lastTimestamp)), command, getSession };
}
