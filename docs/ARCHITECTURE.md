# KeyLingo architecture

## Stack and boundaries

One Next.js App Router application with React, strict TypeScript, Tailwind, Vitest,
Playwright, npm, and one lockfile (created locally; no commit performed). Use Node
24.21.0. Phase 1 resolved Next 16.4.0, React 19.3.0, Tailwind 4.3.3, TypeScript
6.0.3, Vitest 5.0.4, Vite 8.3.4, and Playwright 1.64.0 from stable npm releases.
Exact direct dependencies are pinned in `package.json` and transitives in
`package-lock.json`. TypeScript 7 exceeds the lint parser's peer range; ESLint 10
with TypeScript/React Hooks rules avoids the unpatched vulnerable dependency chain
of the Next lint preset. See `DECISIONS.md` for evidence and tradeoffs.

| Location | Responsibility |
| --- | --- |
| `src/domain/typing` | Normalization, segmentation, comparison, lifecycle, metrics |
| `src/domain/keyboard` | Physical geometry, mappings, modifiers, fingers, recipes |
| `src/domain/practice` | Lessons, seeded generation, selection |
| `src/content` | Versioned entries, lexical annotations, translations, review data |
| `src/lib` | Persistence, validation/migrations, translation provider |
| `src/features` | React input adapter, practice, vocabulary, settings, progress |
| `src/app` | Locale routes and server shells |

Domain code imports neither React nor browser APIs. Server components provide
shells/bundled content; clients own practice/local state. Use reducers/component
state with small preferences/persistence contexts. No state library, backend
endpoint, microservice, event bus, or worker is needed.

```text
Lesson / generator / content → Exercise
Native textarea → Browser input adapter → Typing engine
Engine → Rendering + SessionResult → Repository → Progress
Lexical annotation → TranslationProvider → Lookup / SavedVocabulary
```

## Model contracts

All references use stable IDs and versioning where behavior may change.

| Model | Required contract |
| --- | --- |
| Preferences | Independent interface/practice/translation language, theme, CEFR/category, reflex defaults, diacritics policy |
| PhysicalKeyboard | Stable key IDs, geometry/rows, hand/recommended finger, language independent |
| KeyboardMapping | Mapping ID/version, physical keyboard reference, modifier outputs, dead-key/multi-character recipes |
| Lesson | ID/version, mapping, prerequisites, introduced keys, instructions, recipe, completion criteria |
| Exercise | ID, mode, text, language, direction, comparison policy, optional lesson/content reference or seed/generator version |
| TypingSession | Lifecycle, accepted text, logical position/states, timing, attempts/errors, character statistics |
| SessionResult | Unique session ID, config snapshot, metrics version, active duration, outcome, metrics, aggregate errors |
| ContentEntry | ID/version, language/kind/text, estimated CEFR/category, dialect/register, annotations/translations, provenance/review |
| LexicalAnnotation | Logical text range, surface, lemma/sense reference, optional part of speech, definition/context |
| SavedVocabulary | Stable source/sense, context, target language, translation snapshot, date |
| Progress | Mapping/version-specific lesson completion, bounded history, cumulative character/key statistics |
| TranslationResult | Discriminated found/missing/provider-error result, source/provenance |
| StoredEnvelope | Schema version, revision, timestamp, validated payload |

## Engine and browser input

The deterministic engine accepts create/restart, committed insertion/backward
deletion, pause/resume, finish, and snapshot/metrics commands with injected
timestamps. The adapter uses a monotonic browser clock. Lifecycle is ready →
running ↔ paused → completed, with explicit abandonment. Pause reasons form a set;
active duration excludes the union of pause intervals. Product metric definitions
and completion rules live in `PRODUCT_SPEC.md` and require versioned results.

Use `input` and committed textarea changes as text authority; `beforeinput`
enforces supported append/deletion when cancelable. Reconcile/revert unsupported
edits in the input fallback. Track composition start/end, leave interim text
unscored, deduplicate final commits across event orders, and never rewrite during
composition. Multi-character insertion is not automatically paste. Reject paste
and drop via events/input types plus fallback. Disable spellcheck, autocorrection,
capitalization, and autocomplete where supported. Keydown is for shortcuts and
optional physical hints only. Rich feedback is separate from the accessible target.

Use NFC, grapheme segmentation, and original/logical/comparison offset mappings.
Prototype Arabic connected text, highlighting, wrapping, and mixed punctuation
before broad screens. OS-level Arabic/IME behavior requires real manual checks.

Phase 2 implements these contracts in `src/domain/typing/text.ts` and `engine.ts`.
`createSession(exercise, id, now)` constructs a session;
`transition(session, command, now)` returns an accepted state or explicit rejection;
`snapshot(session, now)` derives position, character states, completion eligibility,
and metrics; `sessionResult(session)` returns a versioned frozen completion/exit
summary. Domain code imports no React/browser APIs and stores no wall-clock time.
Each retained grapheme tracks whether its insertion attempt has already counted an
error, while cumulative attempts/errors survive backward correction.

`src/features/typing` owns the monotonic clock, native input reconciliation,
composition transaction, lifecycle controls, modal focus return, and rendering.
Target feedback uses DOM Range rectangles behind a single text node rather than
splitting Arabic letters into independent boxes. Metrics outputs have live
announcements disabled; rejections/session changes provide concise status messages.
The preview is intentionally memory-only. Progress and real lesson/generator/content sources are integrated in Phases 3–4.

## Persistence

Expose a small asynchronous load/save repository and implement local storage.
Separate preferences, progress, and vocabulary envelopes. Validate loads/imports
and perform sequential tested migrations. Preserve last-known-good backup before
replacing valid data; never automatically overwrite corrupt/unknown-version data.
Recovery includes backup restore, JSON export/import, and explicit reset.

Storage unavailable/quota failure leaves memory state usable with a visible saving
failure. Save preferences on change, results on completion/explicit exit, never
every keystroke. Deduplicate results by session ID. Keep latest 500 sessions and
cumulative aggregates; vocabulary persists until explicit removal. Detect external
revisions and refresh clean state without modifying active sessions. Concurrent-tab
writes remain a documented limitation; local storage is not transactional sync.

Active exercise recovery is deferred. Imports and recovery must be validated before
changing memory or stored data; failed operations preserve existing state.

## Translation and UI

`TranslationProvider.lookup(request)` is asynchronous and accepts source/target
language, query kind, and optional content/sense context. Bundle curated contextual
and sentence translations. Same-language, missing, ambiguous, and provider failures
are explicit. No unused network endpoint is introduced. Future live providers must
be server-only with secret handling, limits, timeouts, and cache keys including
language pair, sense/context, and provider version.

Shared components: AppShell, PracticeShell, LanguageControls, TypingInput,
TypingSurface, SessionControls, MetricsStrip, VirtualKeyboard, FingerGuide,
TranslationPanel, ResultSummary, and vocabulary/progress views. Lookup integrates
with pause reasons and focus return without reconstructing the session.

## Tradeoffs

Native textarea improves accessibility/composition but restricts editing. Hardcoded language-to-layout defaults avoid layout selection and unreliable browser detection. Bounded local storage keeps
the MVP simple but requires recovery and honest concurrency limits. Next.js permits
future server translation while keeping current practice client-driven. Curated
translation is predictable but incomplete. AI review is not human linguistic
assurance; five-grapheme speed is not a cross-language ranking measure.


## Implemented Phase 3 boundaries

`src/domain/keyboard` owns physical geometry, mapping/version facts and output
recipes. `src/domain/practice` owns curricula and generation; `progress.ts` owns
result validation, retention and aggregates. These modules contain no React or
browser API calls. `src/features/practice` supplies localized views and virtual
keyboard guidance. `ProgressProvider` adapts the existing async repository and
merges pending ended results with current disk revisions, preserving active input.
`Exercise.source` captures a discriminated lesson reference or reflex configuration.
The shared native practice component receives an optional ended-result callback;
preview use does not provide it. UI text never becomes a typing authority.


## Fixed language layouts

`defaultMappingForLanguage` is the single domain policy: en/nl → US, ar → Arabic
101. Preferences v2 removes `keyboardMapping`; tested sequential v0→v1→v2
migration validates known legacy mappings before discarding that preference.
Guided/reflex language controls derive layouts; active exercises keep captured
configuration. Mismatched lesson URLs redirect to the language's corresponding
lesson. Retired US International lesson IDs return 404. Historical results,
statistics and completions retain their original IDs; validation and a display
label support retired records without exposing their mapping for new exercises.


## Implemented vocabulary boundaries

`src/domain/content` owns content validation, exercise construction, saved-item
validation and pure save/remove operations. Annotation ranges use source UTF-16
offsets with verified grapheme boundaries, so native string slicing cannot split
combining sequences. The typing domain continues to score logical graphemes.
`src/content/pilot.json` stores original, versioned, independently reviewed entries;
`index.ts` validates structure/coverage at module load and publishes approved entries
only. The build and unit suite reject invalid bundled content.

`src/lib/translation.ts` implements the async provider contract without network I/O.
It resolves full-text or contextual/free lexical requests, with found/missing/error
unions and explicit ambiguity choices. Same-language results retain the original
text. Dictionary URL construction is separate from lookup.

`src/features/vocabulary` owns localized library, practice, modal lookup and saved
review views. A small context inside the shared practice component exposes lookup
pause/resume plus typing-focus restoration; opening lookup never recreates the
engine. Entry routes key practice by ID. Active comparison settings are captured.
Vocabulary result snapshots add a discriminated content reference; progress schema
1 remains compatible with earlier results. Review sessions store their target
snapshot and do not claim a full content-entry completion.

`VocabularyProvider` adapts the validated vocabulary schema 1 to the existing local
repository. Save/remove commands apply in memory, queue, reload current disk data,
merge pending operations and retry revision conflicts. External changes refresh
words without affecting the typing session. Backups preserve damaged raw data and
merge unsaved changes when restored. Local storage remains nontransactional; this
is not account synchronization or guaranteed lossless simultaneous writing.


## Progress and recovery UI

`ProgressProvider` exposes active-session registration, schema-validated JSON
import, confirmed empty-state reset, backup restore and export. The shared
`usePracticeActivity` hook registers a result session only while its typing lifecycle
is active, so finished work does not unnecessarily block data actions. Import/reset
are refused while an active exercise exists. They run through the progress write
queue and update memory only on repository success. Backup recovery merges pending
in-memory results and preserves the damaged primary envelope; reset preserves a
recovery copy.

The Progress view filters retained results by language, mode and outcome. Per-language
summaries keep WPM comparisons within English, Dutch or Arabic. Weekly bars use the
last eight weeks of the retained history; difficult characters use cumulative
per-language statistics for the fixed mapping and current metrics version. Lifetime
aggregates remain separate from the bounded 500-result history. Both Progress and
Vocabulary views expose validated import, recovery, export and confirmed reset.
