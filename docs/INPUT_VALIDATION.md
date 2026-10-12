# Phase 2 typing/input validation

## Implementation and automated evidence

The pure typing engine, Unicode mapping/comparison, native-input adapter, and
localized memory-only harness are implemented. The harness runs at `/en/harness`,
`/nl/harness`, or `/ar/harness` and is linked from Home. Examples are illustrative,
not independently reviewed pilot content. No preview results are persisted.

| Boundary | Verified behavior |
| --- | --- |
| Pure engine | Incorrect advancement/correction, repeated errors, explicit finish/restart/exit, frozen results, 95% guided threshold, nested pauses, zero-time/unstarted metrics |
| Unicode | Original/normalized offsets, NFC accents, CRLF/newlines/spaces, combining updates/deletion, Arabic optional/strict and canonically reordered marks, meaningful letter variants, multi-character output, emoji, logical RTL/LTR |
| Native textarea | Actual browser committed insertion/Backspace/newline, native cursor-edit rejection, undo rejection, transfer-event fallback, noncancelable edits/selection recovery |
| Composition fixtures | Interim text stays unscored/unmodified; final input before/after composition end commits once; repeated final-value input does not duplicate attempts; paused final commit is rejected |
| Timing/focus | First scored input starts time; manual/lookup/focus/visibility pauses exclude their union; dialog close/Escape returns focus and preserves a manual pause |
| State isolation | External preferences cannot replace an active target; preview results stay in memory |
| Rendering | Single connected Arabic text node with background/underline overlays; 360/768/1280 layouts without document overflow; centered native dialog |

Executed: 47 Vitest tests (33 engine/Unicode plus 14 foundation tests), strict
typecheck, ESLint, and production build on Node 24.21.0. Chromium browser suite
contains 21 passing checks (13 typing plus 8 foundation). See `PROGRESS.md` for
the commands and any remaining limitations.

The composition/visibility/window-focus fixtures are synthetic. Native browser
keyboard APIs establish browser input behavior, not physical keyboard layout,
finger use, or OS candidate-window behavior. Real-device acceptance is still open.

## Rendering artifacts

- [Connected Arabic feedback](screens/phase2-arabic-harness.png)
- [Paused dialog](screens/phase2-lookup-pause.png)
- [Mobile typing preview](screens/phase2-harness-mobile.png)

Captured sessions use browser automation and controlled time; displayed speeds
are not human typing benchmarks. Visual inspection verifies connected text,
punctuation, wrapping, feedback placement, and focus affordances in the samples.

## Real-device checklist — not yet performed

Run locally with `npm run dev`, then use a real keyboard and OS input settings.
App mapping selection does not change your OS keyboard layout. Record OS, browser
version, keyboard/IME, selected language/policy, date, and findings for each check.

1. **US International / Dutch dead key:** select the matching OS and app mapping,
   open the harness, choose Dutch and “Accents and mixed text”, and type `Een café`
   with the real dead-key sequence. Confirm one committed accented grapheme,
   correct retained text, Backspace correction, and no duplicate score.
2. **Arabic 101:** select the OS/app mapping, choose Arabic, and type the displayed
   sentence. Default optional marks/tatweel must not add attempts or advance
   position. Check hamza/alef variants remain distinct. Use the mixed-text sample
   to check numbers, punctuation, line breaks, and the key producing `لا`.
3. **Strict Arabic:** select strict comparison. Commit a base letter and then its
   mark; the mark updates the same attempt. A previously committed incomplete
   grapheme retains its historical error after correction. Compare this with a
   complete composed commit, which is scored only after composition ends.
4. **Real IME composition:** use an installed OS composition method. Observe
   candidate/interim text without scored movement, then commit and confirm that
   the final output advances once. Cancel a composition and verify accepted text
   and counters remain unchanged. No rewriting/candidate-window interference is
   allowed while composition is active.
5. **Focus/visibility:** after starting, open tips, switch tabs, and return. Text
   and historical accuracy must remain intact; excluded intervals must not grow
   active time. Repeat with manual pause plus tips, and with a composition ending
   on focus loss. Document the actual event behavior rather than assuming it.
6. **Assistive use:** navigate by keyboard, read the plain target, open/close tips,
   and verify focus return at zoom. Screen-reader and real-device checks remain
   unverified until actually performed.

Do not mark Phase 2's manual gate passed without recording actual results here.
If an event-order defect appears, reproduce it in a browser fixture and fix it
before proceeding to broad practice screens. Firefox/WebKit release checks are
also outstanding; no cross-engine or OS-level assurance is claimed.

## Input contract references

The reconciliation fallback addresses browser edits that omit or cannot cancel
`beforeinput`, as described in [MDN beforeinput](https://developer.mozilla.org/en-US/docs/Web/API/Element/beforeinput_event).
Composition ordering follows the [Input Events specification](https://www.w3.org/TR/input-events-2/).
Logical units use [Intl.Segmenter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter).


## User acceptance after Phase 2

The user reports checking all three languages successfully and approves proceeding
with Phase 3. Browser, operating system, keyboard layouts and specific IME methods
were not supplied. Record this as user acceptance; keep the detailed cross-device
and OS-level composition checks for release review.
