# KeyLingo

A calm typing and language studio for English, Dutch, and Modern Standard Arabic.
The foundation provides localized routes, themes, recoverable browser preferences,
and screen studies. Phase 2 adds a memory-only typing preview and deterministic
engine. Phase 3 adds two fixed keyboard mappings, 24 ordered lessons, seeded reflex
practice, finger guidance and recoverable local progress. Phase 4 adds 84 independently AI-reviewed pilot entries, contextual/full-text
translations, saved vocabulary and retype review. Progress includes per-language
trends, difficult characters, and local data import/recovery/reset controls. The pilot has no human linguistic
validation.

## Run locally

Use Node 24.21.0 (`nvm use` if available), then:

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. The entry route uses your saved interface language
or a supported browser language. Direct locale routes are `/en`, `/nl`, and `/ar`.
Screen studies are at `/en/studies`, `/nl/studies`, and `/ar/studies`.
Settings control independent languages, theme, and preference recovery. Layouts
follow practice language automatically: English/Dutch use US; Arabic uses Arabic 101.
Try native input at `/en/harness`, `/nl/harness`, or `/ar/harness`, also linked
from Home. Preview results are not saved. See [input validation](docs/INPUT_VALIDATION.md)
for user-reported acceptance and remaining release-device checks.
Start lessons at `/en/learn` and seeded exercises at `/en/reflex` (also `/nl`
and `/ar`). Production sessions persist at `/en/progress`; finish or explicitly
end a session to save it. Progress export and backup recovery are available there.
See [keyboard practice notes](docs/KEYBOARD_PRACTICE.md) for mappings and recipes.

Practice vocabulary at `/en/practice` and review saved words at `/en/vocabulary`
(also `/nl` and `/ar`). Lookup pauses timing and returns typing focus on close.
Vocabulary supports export and backup recovery. See [content review](docs/CONTENT_REVIEW.md)
for coverage, independent findings and limitations.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
npm audit
```

Browser tests use Chromium and start a fresh production server on port 3100;
keep port 3100 free. They never reuse your development preview. If Chromium
is missing, install it with `npx playwright install chromium`.
The screenshot test writes review artifacts to `docs/screens/`; these are illustrative
studies and practice UI captures, not recorded learner results. Font licenses are in `public/licenses/`.

Read [the project guide](AGENTS.md), [progress/evidence](docs/PROGRESS.md), and
[screen study index](docs/DESIGN_STUDIES.md) before continuing implementation.
No commit, push, or deployment is authorized automatically.
