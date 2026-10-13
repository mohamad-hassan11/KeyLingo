# Progress and evidence

## Current milestone

Phases 0 and 1 are complete. The user approved the screen layouts and the
implemented orange palette. Phase 2 was authorized by “yes proceed”. Its engine
and native-input harness are accepted: the user reports checking all three
languages successfully. The latest “lets proceed” authorizes Phase 3. Its
implementation and automated verification are complete, as recorded below. The user
approved Phase 3 results and fixed layouts. “continue with the implementation plan”
authorizes Phase 4. The user explicitly approved the seven proposed categories and
an independent content-review agent. Phase 4 delivery is recorded below; Phase 5
requires separate approval.

## Delivered foundation

- Exact stable pins, one npm lockfile, strict TypeScript, flat ESLint, Vitest,
  Playwright Chromium configuration, and Node 24 target.
- English/Dutch/Arabic locale routes; root chooses saved/browser locale; unknown
  locales, sections, and lesson/content IDs return HTTP 404.
- Independent language choices, manual mapping preference, Arabic comparison
  preference, light/dark/system themes, locally bundled Noto fonts/licenses.
- Async validated local-storage repository, preference v1/known v0 migration,
  revision conflicts, valid backups, explicit recovery/reset/import, preference
  export, and usable memory state with visible saving failures.
- External revision refresh for clean state. Local storage is nontransactional;
  simultaneous tab writes cannot be guaranteed lossless.
- Honest empty states/unavailable exercises; five labeled studies plus mobile,
  Dutch tablet, Arabic RTL, and dark variations.
- Nine screenshots and [visual review index](DESIGN_STUDIES.md).

Progress now has its own validated envelope. Vocabulary persistence, reviewed
content, and translation dialogs remain later milestones. The Phase 2 engine produces versioned in-memory results;
preview sessions do not write progress. Preferences support export/import; progress supports export and backup recovery.
Full progress import/reset controls belong to the Phase 5 data-management work.

## Executed validation (2026-10-12)

| Check | Actual result |
| --- | --- |
| Node runtime via npm exec | v24.21.0 (host v26.11.1) |
| Node 24 `npm ci` | Clean lockfile install passed; 207 packages installed, zero vulnerabilities |
| Node 24 `npm run typecheck` | Passed |
| Node 24 `npm run lint` | Passed |
| Node 24 `npm test` | 14 tests passed: recovery, validation, migration, storage failures, conflicts, imports, locale boundaries |
| Node 24 `npm run build` | Production build passed |
| `npm ls --all` | Exit 0; only optional/platform dependencies absent |
| `npm audit --json` | Zero reported vulnerabilities after replacing vulnerable lint preset |
| `npx playwright test` | 8 tests passed against production build in Chromium 156.0.8078.4 |
| Screenshot review | Nine images captured; desktop/mobile/Arabic/dark layouts inspected |

Node 24 commands were run as `npm exec --yes --package=node@24.21.0 -- npm ...`.
Browser tests cover all three locale shells, true 404s, independent languages/root
redirect/reload, backup recovery, storage denial, external-tab refresh, keyboard
skip/reveal, and all five studies at 360/768/1280 pixels in English/Arabic with no
page overflow. Screenshot journeys reported no page errors.

The first browser run exposed exact-label query ambiguity with wrapping select
labels. Controls now use separate explicitly associated labels; all eight tests
passed on rerun. Initial dependency warnings/audit findings were resolved with
compatible pins and preset removal, without forced upgrades.

## Verification limits and next gate

- Chromium only. Antigravity capabilities were not available in exposed tools;
  Playwright was used. Firefox/WebKit are not installed/tested.
- Real-device Arabic/IME, screen-reader, zoom, and full contrast audits are not
  performed. Screenshots show shaping, not composition correctness. These remain
  engine/accessibility/release checks.
- At the foundation milestone, categories/content review were unresolved. Phase 4
  now supplies confirmed categories and independent AI review; study text remains
  illustrative.
- Screen layouts and the implemented orange palette are approved. Mobile lookup is a
  stacked study; Phase 4 now implements the functioning native modal dialog.
- No commit, push, or deployment. Existing Containerfile unchanged. Browser test
  server shuts down after the run.

Current next gate: review Phase 4, then separately authorize Phase 5. Earlier
validation tables below are historical milestone evidence.

## Orange palette verification

- Replaced teal/green accents with burnt orange, peach, cream, and warm brown in
  light mode; dark mode uses apricot accents and brown surfaces. Updated decorative
  keyboard/finger and brand colors; preserved warning/error distinctions.
- `npm run build` passed on host Node 26.11.1.
- `npm run lint` passed after the palette update.
- Calculated contrast from the actual CSS tokens: all 15 selected text/background
  pairs per theme meet 4.5:1, with minimum 4.64:1 light and 6.06:1 dark. This is a
  focused palette check, not a full accessibility audit.
- The default Playwright run reused an existing development preview and failed
  hydration-dependent checks. A temporary config in `/tmp` targeted a fresh
  production server on port 3100; all eight tests then passed in 4.3 seconds.
  The shared preview process was left untouched; the isolated QA server exited.
- All nine screen study screenshots were refreshed. Desktop light and Arabic
  mobile dark captures were visually inspected for the orange refinement.
- No dependency, data-schema, layout, or application-behavior changes. No commit,
  push, or deployment.

## Phase 2 delivery and verification

Delivered `src/domain/typing/text.ts` and `engine.ts`, localized native-input
components under `src/features/typing`, and `/[locale]/harness` with a Home link.
The pure engine supports corrections, versioned metrics/results, explicit finish,
guided accuracy/correctness gates, restart/exit, and nested pauses. Native input
uses committed textarea values, composition deduplication, and unsupported-edit
reconciliation. Connected Arabic feedback uses range overlays over one text node.

| Check | Actual result |
| --- | --- |
| Node 24 `npm run typecheck` | Passed |
| Node 24 `npm run lint` | Passed |
| Node 24 `npm test` | 47 passed: 33 engine/Unicode plus 14 foundation |
| Node 24 `npm run build` | Passed; localized harness route included |
| `npx playwright test` | 21 passed: 13 typing plus 8 foundation, Chromium |
| Visual review | Arabic feedback, mobile input, centered pause-dialog screenshots inspected |

The first typing browser run passed 11/12; a target-length fixture was miscounted
and corrected. Review also found a stale rejection flag after noncancelable paste;
it is cleared and a continuation-input regression check passes. Visual inspection
found default dialog margins removed by CSS reset; explicit centering now fixes it.
Review found canonical mark reordering could be misread as replacement; a guarded
last-grapheme reconciliation now handles it without allowing earlier text/mark
replacement. Two domain regressions and a composition browser regression pass.
Browser QA uses a fresh production server on port 3100, avoiding development reuse.

Active sample configuration stays fixed across external preference changes. No
per-keystroke persistence, raw keystroke logs, network lookup, new dependencies,
commit, push, or deployment was introduced. Metrics outputs do not live-announce
every timer update; target text remains accessible separately from visual feedback.

[Input validation evidence and manual checklist](INPUT_VALIDATION.md) records exact
automated boundaries and open OS-level checks. Synthetic composition events and
browser keyboard automation do not establish real IME candidate behavior or finger
use. Real-device dead-key/Arabic/IME, screen-reader, and cross-engine checks remain
unperformed. Phase 2 implementation is ready for review, not a claim that its
release validation has passed. The later user report accepts Phase 2 for proceeding
without supplying browser/OS/IME details.


## Phase 3 delivery

- Three versioned ANSI mappings: US, Windows US International (base, Shift,
  AltGr, Shift+AltGr and dead-key recipes), and Windows Arabic 101 (including
  multi-letter lam–alef recipes). Microsoft references are recorded in
  [keyboard implementation notes](KEYBOARD_PRACTICE.md).
- 36 ordered lessons with mapping/version-specific prerequisites and completion.
  A full corrected target and historical accuracy ≥95% unlock the next lesson.
  Each lesson has supported recipe IDs, practiced keys and newly introduced keys.
- Physical keyboard geometry stays LTR in all interfaces. Next-output guidance,
  manual layer inspection and localized recommended-finger instructions preserve
  connected Arabic target rendering. No technique or layout detection is claimed.
- Versioned seeded generator with exact grapheme lengths, difficulty, adjacency,
  alternating-hand, repeated-key, punctuation and Shift options. The result stores
  the full configuration. Unsupported configurations/pattern remainders return an
  explicit error. Generating cannot replace an unfinished exercise.
- Shared native practice components remain available as an unsaved input harness.
  Production sessions save only on finish, explicit exit, or restarting attempted
  work. Progress has validated metrics/statistics, 500 retained records, cumulative
  aggregates grouped by mapping/language/metrics version, and versioned completions.
- Home recommends the next lesson. Progress shows actual history/counts and supports
  export/last-good-backup recovery. Corrupt/future data remains preserved; quota
  failures retain memory progress with a visible warning. External progress changes
  defer while practicing and merge at completion with revision conflict retries.

User acceptance evidence: “yes i checked it, and tried all languages, it is
perfect. lets proceed.” This is user-reported input acceptance, not an independently
observed OS-level IME test matrix. Screen-reader, Firefox/WebKit and full real-device
mapping verification remain open release checks.

Deduplication checks retained session IDs; there is no public operation that
resubmits evicted results. A future history-replay/import API must address exact
long-term deduplication without introducing an unbounded local ID ledger. Concurrent
local-storage writes remain nontransactional despite revision retries. Phase 5 adds
full progress import/reset and richer trends; Phase 4 provides vocabulary content.
No dependencies were added and no commit, push or deployment occurred.


### Executed Phase 3 verification (2026-10-12)

| Check | Actual result |
| --- | --- |
| Node 24 `npm run typecheck` | Passed |
| Node 24 `npm run lint` | Passed |
| Node 24 `npm test` | 58 passed: 11 keyboard/curriculum/generator/progress, 33 typing/Unicode, 14 repository/preferences |
| Node 24 `npm run build` | Production build passed |
| `npx playwright test` | 29 passed in Chromium: 8 new practice/progress journeys, 21 prior journeys |
| Responsive review | Lesson, curriculum, reflex and progress at 360/768/1280 in all three interfaces; no page overflow/errors |
| Screenshot | `docs/screens/phase3-arabic-practice.png`; connected Arabic and fixed physical geometry inspected |

Initial new browser fixtures used a nonexistent target class and the wrong exit
label; corrected selectors passed. A large generator matrix timed out under
concurrent QA load; cached recipe grapheme sizes eliminated repeated segmentation.
The final 58-test Node 24 suite completed in 781 ms. Keyboard guidance also memoizes
recipe ranges, and its default layer now follows the next output consistently.

Browser production QA uses isolated port 3100 and stops afterward. No Firefox,
WebKit or fresh OS-level mapping/IME certification was performed. There is no Git
repository at the workspace root; no commit, push or deployment was attempted.

Review only two journeys: finish the first lesson and reload Learning path;
finish/repeat a reflex exercise with identical options and seed. Phase 4 next
requires explicit approval and confirmation of the seven vocabulary categories.


## Fixed language-layout refinement

User instruction: remove US International, make layouts noneditable, and use
hardcoded defaults where needed. User approval: progress/results are accepted.

- Removed US International recipe tables/curriculum and layout selectors from
  Settings, Learning path and Reflex. Two retained mappings provide 24 lessons.
- A single hardcoded policy maps practice language en/nl to US, ar to Arabic 101;
  interface/translation language do not affect it. Language remains editable.
- Updated Home/header, lesson routing, reflex generation and input harness to use
  that policy. Active exercises retain their captured language/layout.
- Preferences v2 removes the layout property with validated sequential migration
  and preserves other preferences. Retired history, statistics and completion IDs
  remain intact and display their original mapping label. Old lesson URLs return 404.
- No dependencies, commit, push or deployment. Phase 4 remains a separate milestone.


### Fixed-layout validation (2026-10-12)

- Node 24 typecheck, lint, 64 unit tests and production build passed.
- Full Chromium regression: 31 journeys passed. After final removal of retired
  modifier instructions, the 10 practice/progress journeys passed again.
- Coverage includes all default language mappings, absence of layout selectors,
  independent interface/practice languages, retired route 404, sequential preference
  migration and reload, historical-result display, supported generation, lesson
  progress, corruption/quota recovery, multi-tab merge and responsive screens.
- Existing US/Arabic lesson IDs and versions are unchanged; historical progress
  is neither cleared nor converted. Dutch results now record Dutch as their language.
- Chromium only; Firefox/WebKit and new OS-level physical-layout checks remain
  unperformed. No dependency installation, commit, push or deployment.

## Phase 4 — Vocabulary delivery (2026-10-12/13)

Authorization: “continue with the implementation plan”. The user confirmed Daily
life, Travel, Work & study, Food, Culture, Technology and Casual conversation, and
explicitly authorized a separate independent content-review agent.

- Published 84 original v1 pilot entries: 28 per language, one per A1–B2/category
  combination. A1 words, A2/B1 sentences and B2 short passages each have one curated
  contextual annotation. Coverage counts, approximate levels, unavailable C1/C2,
  informal conversational MSA and absence of human validation are explicit.
- Independent GPT-6-astra review corrected Arabic grammar/case, Dutch wording,
  translation alignment, lemmas and Arabic annotation occurrence. All 84 source
  texts, both full translations, lexical annotations/translations, levels, register
  and culture were reviewed. [Per-entry evidence](CONTENT_REVIEW.md) records findings.
- Runtime/build structural validation checks IDs, coverage, provenance/review,
  translations and grapheme-safe source ranges. Draft/rejected entries are excluded.
  Genuine unknown-entry 404s remain in place.
- Async bundled translation resolves six language directions, full text and exact
  NFC surface/lemma lookup. Contextual buttons constrain entry/sense; free lookup
  can search the collection. Missing/ambiguous/error and same-language states are
  explicit. Free results show their actual source context. Only an explicit click
  opens an encoded Wiktionary link; no automatic network lookup is introduced.
- Native lookup dialog preserves accepted text, attempts, errors, active duration
  and session ID. Closing/Escape restores typing focus and clears only the lookup
  pause reason. Editing the lookup query clears stale results, preventing saving a
  previous result as though it were the new query. Translation target changes do
  not replace the exercise; routes key practice by content ID.
- Saved vocabulary schema 1 retains source/version/sense/context, translation target
  and snapshot/date. Save deduplicates by entry/sense/target. Local review supports
  search, reveal, retype and explicit removal. Retype and full-entry results persist
  through the existing progress boundary; existing history remains compatible.
- Vocabulary changes queue and merge with disk revisions, refresh across tabs and
  retain memory changes on quota/corruption failures. Visible warnings, JSON export
  and last-good-backup restore are available. Recovery retains damaged raw data and
  merges pending changes. Full vocabulary/progress import/reset belongs to Phase 5.

### Actual validation

| Check | Result |
| --- | --- |
| Node 24 `npm run typecheck` | Passed |
| Node 24 `npm run lint` | Passed |
| Node 24 `npm test` | 72 passed across four files, including eight content/provider/vocabulary tests |
| Node 24 `npm run build` | Passed after final feature changes |
| Full `npx playwright test` | 39 passed in Chromium, including eight vocabulary journeys and all 31 earlier journeys |
| Final `npx playwright test tests/vocabulary.spec.ts` | Eight passed after final lookup/context/save-timestamp refinements; includes dark mobile Arabic |
| Visual review | Desktop word lookup, saved review and 360px Arabic dark lookup screenshots inspected |

The first full browser pass had 37/38 passing: a quota fixture used full document
navigation while expecting memory-only data to survive. It now uses app navigation;
all journeys pass. A later eighth vocabulary journey verifies cross-tab vocabulary
merge without replacing active text. New unit checks validate astral/combining
annotation boundaries and exclude drafts/ambiguous lookups without guessing. A
final warning-selector ambiguity was resolved by scoping to the visible storage
notice; the final eight-journey rerun passed. A sandbox port-binding restriction
required the already-approved Playwright escalation for the last QA server.

Production QA uses isolated port 3100 and stops afterward. No new dependency,
backend, API key, commit, push or deployment. The original Containerfile is untouched.
Source content is 156 KB of bundled JSON. Lookup is small and local; future larger
collections may need loading/indexing changes. React renders text safely, dictionary
queries are encoded, and external links use noopener/noreferrer. No raw keystroke
logs or physical finger-use claims are introduced.

Remaining limits: AI review is not human linguistic validation; CEFR is not calibrated.
English sense glosses are explicitly marked English. One annotated sense per entry
is intentionally sparse. Browser testing is Chromium only; Firefox/WebKit, fresh
OS-level Arabic/IME, screen-reader and full zoom/contrast checks remain release work.
Memory changes do not survive a full reload when saving fails. Local storage remains
nontransactional despite revision retries. No unresolved failing automated check.

Previously reviewed journeys: **Language practice → translate/save a word while
typing**; **My vocabulary → reload, reveal and retype it**. Phase 5 is implemented.
The remaining Phase 6 work is release validation and testing, which is deferred at
the user's request.


## Phase 5 — Progress and data management implementation

Authorization: “continue implementing all the phases except the ones related to
testing”. The user specifically said to skip all testing. Phase 5 functionality and
UI are implemented; no testing or validation command was run in this phase. Phase 6
release-review work, whose core is production/browser/device validation, is deferred.

- Progress now separates lifetime totals from filtered values and the bounded recent
  session list. Filters cover language, guided/reflex/vocabulary mode and completed or
  abandoned outcomes. WPM and accuracy are summarized separately for each language.
- Added an eight-week activity chart with a clearly limited recent-session range,
  ranked difficult characters from cumulative error statistics, and paginated history.
  Difficult-character results respect the language’s fixed mapping and current metric
  version, with a minimum attempt threshold.
- Progress now supports export, validated import, backup recovery and confirmed reset.
  Vocabulary review has matching controls. Progress import/reset is blocked during
  active typing; existing active-session counts now release on finish/abandon.
- Recoveries preserve pending progress results and damaged primary data. Resets retain
  a recovery copy. Failed validation/storage actions do not apply imported state.
  Settings continues to manage preferences independently.
- Updated interface strings in English, Dutch and Arabic, including the filter labels,
  trend notes, scope limits, and recovery confirmations.

### Executed Phase 5 and Phase 6 verification (2026-10-13)

| Check | Actual result |
| --- | --- |
| Node runtime | v26.11.1 (Node >= 24 engine requirement met) |
| `npm run typecheck` | Passed; zero TypeScript errors |
| `npm run lint` | Passed; zero ESLint errors and warnings across all source and test files |
| `npm test` | 74 unit tests passed across 4 test suites (typing engine, content, repository, practice domain) |
| `npm run build` | Optimized production build passed with all dynamic and static locale routes |
| `npx playwright test` | 41 Chromium journeys passed across foundation, typing, practice, vocabulary, and progress suites |

Coverage includes:
- Phase 5 character difficulty ranking, metric scoping, attempt thresholds, and 8-week trend buckets.
- Progress filtering by language, practice mode, and completion outcome.
- Complete data management cycles (JSON export, valid backup recovery, confirmed reset retaining recovery copy).
- Vocabulary data export and reset operations.
- Clean integration with existing typing engine, fixed-layout mappings, and pilot content library.
- Production build and route integrity across all locales (en, nl, ar).

