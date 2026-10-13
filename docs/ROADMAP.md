# Milestones and validation gates

Implement one approved milestone at a time. Every phase ends with updated documents,
actual validation evidence, known limitations, and a review handoff. Phases 0 and 1
are authorized and complete. Phase 1 screen layouts and orange palette are approved.
Phase 2 is accepted: the user reports successful checks in all three languages.
Phase 3 is authorized by “lets proceed” and implemented. Detailed OS/IME metadata
was not provided; cross-engine/device certification remains a release check.
Phase 3 progress/results are user-approved. The fixed language-layout refinement
is complete. “continue with the implementation plan” authorizes Phase 4; category
names and independent content review are explicitly approved. Phase 4 is implemented and verified.
Phase 5 functionality and data management, and Phase 6 release testing/validation suites,
are fully implemented and verified with 74 unit tests and 41 Playwright journeys.
Do not automatically commit, push, or deploy.

| Phase | Deliverables | Exit gate |
| --- | --- | --- |
| 0 — Planning | Six shared documents | Behaviors, formulas, boundaries, gates, and unresolved inputs recorded |
| 1 — Foundation | Verified pinned stack, locale routes, themes, persistence skeleton, static screen studies | Clean install/typecheck/lint/build; routes and recovery smoke checks; visual approval before broad UI |
| 2 — Engine | Pure typing engine and native input harness | Domain fixtures and browser committed-input checks; manual Arabic/IME shaping/event evidence |
| 3 — Guided/reflex | Two fixed mappings, 24 lessons, keyboard/finger guidance, deterministic generator | Reachable lesson completion; supported/reproducible generation; persisted progress |
| 4 — Vocabulary | 84 pilot entries, curated provider, lookup/save/review | Structural and independent AI review; six translation directions; pause/text/focus preservation; honest unavailable content |
| 5 — Progress/polish | History/trends/errors, settings/recovery, responsive polish | Deduplicated results; meaningful comparison groups; migration/failure checks; accessible responsive journeys |
| 6 — Release review | Independent review, production validation, evidence/checklist | Chromium/Firefox/WebKit journeys; real-device Arabic/IME evidence; no unresolved critical/high defects; deployment separately approved |

Phase 1 must check candidate package versions rather than assume the supplied
release families exist or are compatible. Ask before major dependency installation.
Use small verifiable steps inside each phase; preserve the current user instruction
to skip testing until they reverse it. Static studies cover Home, curriculum, practice with lookup, vocabulary
review, and Progress, including mobile, dark, and Arabic RTL.

## Required checks

| Area | Scenarios |
| --- | --- |
| Engine | Incorrect input/correction/repeated errors, empty/exact completion, restart, nested pauses, zero-time guards, metric fixtures |
| Unicode | Decomposed Dutch accents/dead keys, Arabic combining marks, optional/strict marks, multi-character output, RTL/LTR punctuation, spaces/newlines |
| Browser input | Composition commit deduplication, native Backspace, paste/drop rejection, unsupported-edit fallback, visibility/focus pauses |
| Curriculum/generator | All lessons reachable, prerequisites/completion versioning, supported recipes, same seed reproduction, empty eligibility rejection |
| Content | Unique IDs, annotation ranges, references, coverage, review metadata, unavailable C1/C2 |
| Persistence | Sequential migration, corrupt/unknown schema, quota/unavailable storage, backups, validated imports, session deduplication, external revisions |
| Journeys | Complete lesson, reproduce reflex seed, inspect/save mid-exercise, sentence translation, reload progress, vocabulary review, independent language settings |
| Accessibility | Keyboard-only, dialog focus return, screen-reader target, reduced motion, contrast, zoom, 360/768/1280 layouts |
| Release | Production build, Chromium/Firefox/WebKit journeys, independent review, manual real-browser Arabic/IME |

Synthetic composition events alone do not prove OS-level input correctness. Record
browser/tool availability honestly. Antigravity is not established as available;
use Playwright if appropriate and record that limitation. Unperformed or blocked
checks remain explicit, never reported as passed.

## Approval handoff

Each handoff reports delivered files/behavior, executed checks/results, risks and
unverified assumptions, and the concrete next milestone. Phase 0 handoff requests
Phase 1 scope including major dependencies; Phase 1 also requires visual approval
before extensive frontend work. Release review never constitutes deployment approval.

Phase 2 handoff: [input validation evidence and manual checklist](INPUT_VALIDATION.md).
The native-input preview is available at `/en/harness`, `/nl/harness`, and
`/ar/harness`. Do not infer OS-level composition correctness from synthetic events.
