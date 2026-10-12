# KeyLingo product specification

## Scope

KeyLingo is a standard online web application for touch typing and vocabulary
practice in English, Dutch, and Modern Standard Arabic (MSA). Desktop hardware
keyboards are the primary training environment. Mobile supports vocabulary,
review, and progress. No installed PWA or guaranteed offline loading is promised.
Preferences and progress persist locally; accounts and synchronization are future work.

The MVP includes guided lessons, reflex exercises, vocabulary exercises, virtual
keyboard/finger recommendations, contextual translation, saved vocabulary,
progress, themes, recovery, accessibility, and three interface languages.
Interface, practice, and translation language are independent preferences.
Keyboard layouts are fixed by practice language: English and Dutch use US;
Arabic uses Arabic 101. These are hardcoded product defaults, not OS detection.
No layout editor or selector is available. US International is retired.

## Practice behavior

- Incorrect committed input advances the logical position and stays visible.
  Backspace corrects retained output but never erases historical errors.
- Editing permits append and backward deletion. Reject paste/drop and unsupported
  cursor editing, replacement, and undo with clear guidance and input reconciliation.
- Use a labeled, focusable textarea with visible focus and an accessible plain-text
  target. Interim composition is unscored; multi-character composition is supported.
- Start timing on the first accepted committed input. Lookup, focus loss, hidden
  tabs, and manual pause exclude time. Nested reasons prevent accidental resume.
- At target length enable Finish while permitting correction. Guided completion
  requires a full corrected target and at least 95% historical accuracy, with no
  minimum speed. Reflex/vocabulary may finish with remaining errors.
- Opening translation preserves text and accuracy, pauses the session, and returns
  typing focus on close. Resume only when all pause reasons clear.
- Restart creates a fresh session. Explicit exit records abandonment. Reload does
  not restore an active exercise in the MVP.

Phase 2's `/[locale]/harness` exposes these behaviors with illustrative samples.
It does not persist results or present samples as reviewed pilot content. It is
reachable from the Home preview note. Production lessons, reflex and vocabulary
exercises persist ended sessions to progress.

## Unicode and metrics

Normalize NFC and CRLF to LF; segment graphemes with `Intl.Segmenter`. Preserve
spaces, punctuation, and line breaks. Keep original offsets, logical positions,
and comparison units mapped. Never reverse RTL text or index characters by UTF-16.

Arabic vocabulary ignores optional tashkeel and tatweel by default while retaining
display text; strict diacritics practice is selectable. Preserve hamza, alef
variants, and ya/alef maqsura distinctions. Combining marks modifying an existing
grapheme must reconcile without unrelated insertion attempts. Support dead keys
and outputs containing multiple logical characters.

Let A be committed grapheme insertion attempts including retyping, E incorrect
attempts, C currently retained correct target graphemes, and M active minutes.

| Metric | Definition |
| --- | --- |
| Gross WPM | A / (5 × M) |
| Net WPM | C / (5 × M) |
| Accuracy | 100 × (A − E) / A |

Unstarted metrics are unavailable; zero elapsed time must never yield nonfinite
values. Count spaces and line breaks; exclude deletion, modifiers, rejected paste,
ignored marks, and interim composition. WPM uses five graphemes, not linguistic
words, and is unsuitable for direct cross-language ranking. Expected-character
errors are separate from optional physical-key observations; ambiguous mappings
remain unattributed. Finger use and physical layout cannot be verified by the browser.

Ignore-only input does not start timing. Combining additions belong to their
existing grapheme attempt; a newly incorrect modification can mark that attempt
incorrect once, and later correction does not erase its historical error. In
strict practice, committing a bare letter before its required accent can therefore
record an error; an interim composition is not a committed bare-letter attempt.
Insertion exceeding remaining logical capacity is rejected atomically and unscored.

## Guided and reflex modes

Each mapping has 12 ordered lessons: home row, left hand, right hand, alternating
hands, upper row, lower row, mixed rows, Shift, numbers, punctuation/symbols,
mapping-specific output recipes, and cumulative practice. Completion is specific
to mapping and lesson version.

Reflex generation is deterministic from mapping, seed, generator version, length,
difficulty, and pattern configuration. Support adjacency derived from geometry,
alternating hands, repetitions, punctuation, and Shift. Emit supported recipes only;
reject configurations without eligible outputs. Adaptive weighting is deferred.

## Content and translation

Initial coverage is 28 entries per language, 84 total: one per A1–B2/category
combination, mixing words, sentences, and short passages. The seven confirmed categories are
Daily life, Travel, Work & study, Food, Culture, Technology, and Casual conversation. CEFR levels are approximate editorial
estimates. C1/C2 filters remain visible and unavailable. Publish coverage counts.

Arabic casual/street content means informal conversational MSA, explicitly labeled,
without dialect claims. Use original or clearly licensed content. Every released
entry needs recorded provenance, license, version, independent AI reviewer identity/
model, findings, and review status covering source, both translations, annotations,
level, register, and cultural suitability. Structural validation is separate from
linguistic review. Exclude unresolved entries. The drafting agent cannot certify its
own review; human validation remains unverified.

Bundled translation supports all six cross-language directions, contextual lexical
annotations and full sentences. Same-language requests return an honest source
explanation. Exact surface/lemma lookup may return choices or missing results for
ambiguity; do not guess Arabic morphology. Missing/provider errors are explicit.
An encoded external dictionary link opens only on user action. No automatic network
lookup or client API key is included.

Save stable source/sense references, context, chosen translation language, translation
snapshot, and date. Saved review supports search, reveal, and retyping.

## Routes and presentation

`/` selects saved interface locale or a supported browser default. Locale-prefixed
routes are home, `/learn`, `/learn/[lessonId]`, `/reflex`, `/practice`,
`/practice/[entryId]`, `/vocabulary`, `/progress`, and `/settings`. Unknown IDs
produce genuine not-found states; unsupported filters show honest empty states.

Use a calm language studio: warm cream/deep brown, burnt-orange accents, restrained borders,
amber/red errors with non-color cues, comfortable spacing, and dark mode. Locally host
Noto Sans and Noto Sans Arabic; allow a suitable Latin monospace face. Arabic retains
natural shaping, generous line height, and no letter spacing or isolated letter boxes.
Set `lang`/`dir`, isolate mixed labels/numbers, and mirror RTL navigation while keeping
keyboard geometry fixed. Mobile stacks content and uses a translation dialog.

Meet keyboard-only, focus-return, screen-reader target, reduced-motion, contrast,
zoom, and responsive acceptance checks at 360/768/1280 pixels. Phase 1 static studies
cover Home, curriculum, lookup practice, vocabulary review, and Progress, including
mobile, dark mode, and Arabic RTL, before broad UI implementation.

## Deferred capabilities

Accounts/sync, additional layouts, dialects, live translation, larger human-reviewed
collections, spaced repetition, adaptive reflex, installed offline support, and
public comparisons/leaderboards are outside the MVP.

## Phase 4 implementation

The bundled v1 collection has 84 independently AI-reviewed entries, one annotated
contextual sense per entry. The library publishes per-language coverage and filtered
counts. A1 uses words, A2/B1 sentences, B2 short passages. C1/C2 are labeled with zero
coverage and produce an explicit unavailable state. Unknown entry IDs return 404.
See [independent review evidence](CONTENT_REVIEW.md).

Annotated-word buttons and full-text translation open a native modal dialog. Free
lookup uses exact NFC surface/lemma matches across the bundled source-language
collection; contextual buttons additionally constrain entry and sense. Ambiguity
requires choosing a context. Same-language output is labeled explicitly. English
sense notes are content glosses, with their language declared, not translated UI.
Dictionary links are encoded and require an explicit click.

Saved words retain entry/version/sense, source context, translation snapshot/target
and save date. Saving the same entry/sense/target updates one item; a different
target is a separate saved item. Review offers search, reveal, retyping and removal.
Vocabulary export and last-good-backup recovery are available; full import/reset
controls belong to Phase 5. Quota/corruption warnings preserve memory changes until
reload and never silently replace protected stored data.

## Phase 5 progress and data management

The Progress page retains lifetime session, completion, active-hour and accuracy
aggregates. Its filters choose language, practice mode and outcome. Filtered WPM
and accuracy summaries are grouped by English, Dutch and Arabic so language measures
are not blended. The eight-week chart uses retained session records (up to 500),
and its range is stated on screen. Difficult-character rates use cumulative character
statistics, the selected language’s fixed mapping, metric version 1 and a minimum
of three attempts. History shows 20 filtered results initially, with explicit
pagination through the retained 500.

Progress offers JSON export/import, last-good-backup recovery and confirmed reset.
Vocabulary offers the same data operations. Imports validate schema and payload
before state changes and refuse to overwrite corrupt or future-version records.
Reset and import are disabled while a practice session is active; reset retains a
recovery copy. User-requested recovery may operate on protected damaged data while
preserving the original raw envelope. A failed operation leaves current state intact.
