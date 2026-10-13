# Confirmed decisions

The supplied plan is the source of product intent. Phase 0 documentation was
completed, and the user's subsequent “plan approved” response authorized Phase 1
including dependency installation. The user's subsequent “yes proceed” authorized
Phase 2 (typing engine and native-input harness). Phase 3 is implemented and its progress/results are user-approved; fixed language layouts are authorized. “continue with the implementation plan” authorizes Phase 4. The user authorized Phase 5 and remaining application UI/implementation, while expressly deferring testing.
No automatic commit, push, or deployment is authorized.

| Decision | Rationale / consequence |
| --- | --- |
| Standard online app; no PWA guarantee | Keep delivery simple; local preferences/progress still persist |
| English, Dutch, and MSA | Separate interface, practice, and translation preferences |
| Fixed layouts: en/nl US, ar Arabic 101 | Remove layout choices; hardcoded defaults replace OS detection; US International retired |
| Incorrect input advances; Backspace corrects | Preserve flow and historical error accuracy |
| Native textarea with append/backward editing | Accessible input and composition support with explicit editing boundaries |
| NFC and grapheme comparison in logical order | Support accents, combining marks, multi-character recipes, and RTL |
| Optional Arabic marks ignored by default; strict option | Preserve readable source and meaningful letter distinctions |
| Net WPM uses retained correct graphemes | Deterministic documented metric, versioned in results |
| 12 lessons per mapping; corrected target and 95% accuracy | Completion teaches correctness without a speed threshold |
| Seeded supported-output reflex generation | Reproducible baseline before adaptive weighting |
| 28 entries/language, 84 total | One per A1–B2/category pair; small explicitly labeled pilot |
| Independent AI review, no human-validation claim | Drafting agent cannot certify its own linguistic review |
| Informal conversational MSA for casual/street | No Arabic dialect claim |
| Curated offline-bundled translations, no automatic lookup | Six directions with honest missing results and explicit dictionary action |
| Local repository with validation, backup, migration | Recoverable data and future replaceable account storage |
| 500 recent sessions plus aggregates; session-ID deduplication | Bound storage without losing cumulative statistics |
| No active-session reload recovery | Keep MVP persistence focused; in-memory lookup preserves sessions |
| Next.js/React/TypeScript/Tailwind/Vitest/Playwright; npm | Preferred stack; exact stable versions are resolved in Phase 1 |
| Calm studio, dark theme, natural Arabic shaping | Readability and accessibility before decorative effects |
| Visual approval before extensive UI | Phase 1 studies establish reviewable visual direction |

## Phase 1 confirmed implementation decisions (2026-10-12)

- Pin stable registry releases: Next 16.4.0, React/React DOM 19.3.0, Tailwind/PostCSS
  4.3.3, TypeScript 6.0.3, Vitest 5.0.4, Vite 8.3.4, Playwright 1.64.0,
  ESLint 10.12.0, TypeScript ESLint 8.71.2, and React Hooks plugin 7.1.1.
  `npm view` verified release/peer metadata; `npm ls --all` exited successfully.
- Use TypeScript 6.0.3 instead of 7.0 because the stable lint parser supports
  TypeScript below 6.1. No forced peer resolution remains.
- Replace the Next ESLint preset with flat TypeScript/React Hooks lint rules.
  Its braces dependency was vulnerable to stack exhaustion with no patched stable
  release available ([advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)).
  Next-specific lint rules are omitted; typecheck, builds, and route/browser checks
  remain required. Final npm audit reports zero vulnerabilities.
- Target Node 24.21.0 despite host Node 26.11.1. Clean install, typecheck, lint,
  unit tests, and build were executed with Node 24 via npm exec.
- Bundle Noto Sans/Noto Sans Arabic npm fonts and license notices in
  `public/licenses/`; no external font fetch is needed at build.
- Use the generic repository with preference schema v1 and a tested known v0
  migration. Reserve separate progress/vocabulary keys; introduce their domain
  payloads with the engine/content milestones rather than inventing them now.
- Implement local-only Next.js per the approved architecture. Sites hosting and
  its alternative starter are unused because publication is not authorized.

Official references checked:
[Next installation](https://nextjs.org/docs/app/getting-started/installation) and
[Vitest requirements](https://vitest.dev/guide/). Registry metadata and executed
checks establish compatibility of the selected versions.

## Unresolved implementation inputs

- Real-device/IME availability is unverified. Chromium is available and tested;
  Firefox/WebKit and manual OS-level Arabic input remain release checks.
- Independent content review was explicitly authorized and completed by a separate
  GPT-6-astra agent. Release review remains a separate milestone; this authorization
  does not grant unrelated delegation.

Significant future architectural deviations require explicit alternatives and a
confirmed decision here. Screen layouts and the implemented orange palette are
approved. Phase 2 is user-accepted across all three languages; detailed OS-level release validation remains open.

## Color palette refinement

In response to contrast and user experience feedback, the theme color system was
enhanced for high contrast (meeting WCAG AA standards across all text and UI elements)
and friendlier, clean presentation:
- Light theme: Clean slate neutral background (`#f8fafc`) and crisp surface (`#ffffff`),
  deep slate body text (`#0f172a`, ~18:1 contrast on white), clear slate muted text
  (`#475569`, >5.5:1 contrast), slate border (`#cbd5e1`), vibrant approachable royal blue
  accent (`#2563eb`, >4.5:1 contrast against white), soft blue highlights (`#eff6ff`),
  warm amber (`#92400e`), and accessible crimson danger (`#b91c1c`, >5.9:1 contrast).
- Dark theme: Deep midnight slate background (`#0f172a`) and slate card surface (`#1e293b`),
  crisp white text (`#f8fafc`, ~13:1 contrast), soft slate muted text (`#94a3b8`, ~6.5:1 contrast),
  subtle border (`#334155`), bright friendly sky blue accent (`#38bdf8`, >8:1 contrast on dark surface),
  soft dark blue accent container (`#1e3a5f`), warning amber (`#fcd34d`), and rose-red danger (`#f87171`).
Finger guides and interactive highlights are calibrated with harmonious sky/indigo/pink tones.
Semantic variable names and preference schema remain intact.

## Phase 2 implementation decisions

- Use pure immutable `createSession`, `transition`, `snapshot`, and `sessionResult`
  functions with injected monotonic timestamps. The browser supplies `performance.now()`
  and unique session IDs. Metrics version is 1; results freeze at completion/exit.
- Keep Unicode source offsets, NFC-normalized offsets, and comparison-unit indices
  explicit. Optional Arabic comparison strips tatweel, U+064B–0652, U+0656–065F,
  and U+0670, preserving hamza/maddah and letter variants.
- Ignore-only input retains displayed input but neither counts attempts nor starts
  timing. A combining insertion updates its existing grapheme attempt; if it makes
  that attempt incorrect, count its error once. Later correction never removes
  historical errors. Backward deletion does not add insertion attempts/errors.
- Treat each insertion as atomic: reject a commit that exceeds remaining logical
  capacity. At target length, permit combining updates/backward corrections before
  explicit Finish. Guided completion additionally needs 95% historical accuracy.
- Use an uncontrolled native textarea and native event listeners. Interim
  composition is unscored, final values reconcile once, and unsupported edits
  revert after `input` when `beforeinput` cannot cancel them.
- Keep Arabic target text in one text node. Highlight measured DOM Range rectangles
  behind it, preserving connected shaping and accessible plain-text reading order.
- Expose a small localized `/[locale]/harness` preview with illustrative samples,
  live metrics, pause/finish/restart/exit, and a modal tips panel exercising the
  future lookup pause/focus contract. No pilot translations or progress storage are
  implied; these preview sessions remain in memory.
- Capture exercise preferences once per preview and change them only through
  explicit sample controls. External tab revisions cannot replace an active target.
- Browser QA uses a fresh production server on port 3100 and never reuses a
  development server. No new dependencies, accounts, backend, commits, or deployment.

Input boundary references:
[beforeinput fallback requirements](https://developer.mozilla.org/en-US/docs/Web/API/Element/beforeinput_event),
[composition/input event ordering](https://www.w3.org/TR/input-events-2/), and
[grapheme segmentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter).


## Phase 3 implementation decisions

- Use Microsoft Windows US, US International and Arabic 101 output tables on fixed
  ANSI geometry. Other operating-system variants require explicit future mappings.
- Keep mapping-based guided/reflex text independent of the vocabulary language;
  disclose this beside mapping controls. Arabic marks/tatweel are visible in keyboard
  inspection but not generated alone or required by the initial Shift lesson.
- Store seed, generator/mapping versions and all options with reflex results;
  retain preference-schema compatibility through validated optional reflex options.
- Group cumulative expected-character statistics by mapping, language and metric
  version. Do not attribute unobserved physical keys or finger technique.
- Save ended production sessions, including attempted sessions explicitly restarted;
  the diagnostic harness remains memory-only. No per-keystroke storage writes.


## Approved layout simplification

The user requested removal of US International and all editable layout choices,
and approved the existing progress/results. Default policy is fixed per practice
language: English and Dutch use US, Arabic uses Arabic 101. Interface and translation
language never choose the layout. This supersedes the earlier manual-mapping and
mapping-independent-language decisions. English/Dutch share the existing US lesson
completion IDs. Retired historical results are preserved, not converted or deleted.
The two retained curricula contain 24 lessons; no new dependencies or deployment.


## Phase 4 confirmed decisions

- User approved Daily life, Travel, Work & study, Food, Culture, Technology, and
  Casual conversation, including informal conversational MSA for Arabic casual.
- User explicitly authorized an independent review agent. The drafting agent
  authored original CC0-labeled pilot text; a separate GPT-6-astra reviewer corrected
  and approved all 84 entries. This is not human validation or CEFR calibration.
  [Review evidence](CONTENT_REVIEW.md) records every entry and remaining limits.
- Each pilot entry has one curated contextual annotation. Do not infer translations
  for unannotated words or guessed Arabic morphology. English sense glosses remain
  explicitly English; source and lexical translations cover all three languages.
- Keep the approved studio styles and native dialog for lookup on desktop/mobile.
  Translation language can change in the dialog without replacing active input.
- Use the existing repository and progress metrics. Add no dependencies, endpoint,
  API key, automatic dictionary request, commit, push or deployment.


## Phase 5 implementation decisions

- Preserve the existing progress envelope and cumulative aggregates. No schema bump
  is needed for insights or data actions. The bounded 500-session list backs weekly
  trends, filtered summaries and history; lifetime character aggregates back
  difficult-character rates. Show the two scopes separately.
- WPM/accuracy are summarized per language, never combined across language groups.
  Character difficulty uses the hardcoded default mapping for that language, metrics
  version 1 and at least three attempts.
- Keep JSON data actions in the existing repository/provider boundary. Confirm reset,
  protect import/reset during active practice, validate imports before state changes,
  and preserve a recovery copy. Vocabulary receives parallel export/import/recovery/reset.
- The user expressly requested skipping testing for this work. No tests, typecheck,
  lint, or build are executed for Phase 5; Phase 6 release validation is deferred.
