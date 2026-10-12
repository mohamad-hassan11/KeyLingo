# KeyLingo engineering guide

Read `docs/PRODUCT_SPEC.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`,
`docs/DECISIONS.md`, and `docs/PROGRESS.md` before changing the project.

## Scope and ownership

- Work on one approved milestone at a time. Phases 0–3 are implemented and approved.
  “continue with the implementation plan” authorizes Phase 4; seven categories
  and an independent content-review agent were explicitly approved. Phase 4 is
  implemented and verified, ready for user review. “continue implementing all the phases except the ones related to testing”
  authorizes Phase 5 implementation. The user expressly requested skipping all
  testing during this work. Phase 6 release and test work remains deferred. Review ownership is limited to pilot.json and
  CONTENT_REVIEW.md; that review is complete.
- Separate exploration from implementation. Propose alternatives for significant
  architectural changes; record confirmed decisions in `docs/DECISIONS.md`.
- Keep changes focused and follow established conventions. Prefer simple,
  maintainable solutions and meaningful tests; avoid speculative abstractions.
- Do not modify files another agent actively owns. Coordinate ownership if
  parallel agent work is explicitly authorized.
- Never automatically commit, push, or deploy. Ask before destructive operations
  or installing major dependencies. Never expose, copy, or log secrets.

## Planned implementation conventions

- Next.js App Router, React, strict TypeScript, Tailwind, npm with one lockfile.
  Exact versions are pinned in `package.json`; use Node 24 (`.nvmrc`).
- Pure domain modules must import neither React nor browser APIs.
- Use stable IDs, versioned metrics/content/generators, discriminated unions,
  injected engine timestamps, and validated persistence boundaries.
- Use native textarea input, grapheme-aware comparison, and logical RTL order.
- Mark the corpus as an AI-reviewed pilot only after independent review exists.
  Do not claim human linguistic validation or physical finger-use measurement.

## Checks and evidence

- Normally run relevant checks after code changes: `npm run typecheck`,
  `npm run lint`, `npm test`, `npm run build`, and `npm run test:e2e` (browser
  checks use the build). The current user explicitly asked to skip all testing;
  respect that instruction and record that no checks were run.
  Use `npm ci` for clean installation. Do not regenerate unrelated lockfiles.
- Test important behavior rather than implementation details. Required scenarios
  and milestone gates are in `docs/ROADMAP.md`.
- Review security, performance, accessibility, and maintainability.
- Update `docs/PROGRESS.md` with actual commands/results, known defects,
  unverified assumptions, browser availability, and the next approval gate.
- Never claim tests passed unless executed. Synthetic composition tests do not
  establish real OS-level IME compatibility.
