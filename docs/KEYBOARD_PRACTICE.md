# Keyboard practice implementation

Mappings v1 use fixed ANSI geometry and hardcoded Windows reference outputs chosen by practice language (en/nl US, ar Arabic 101). Physical locations, recommended fingers and output recipes are distinct.
Services/modifiers do not become typing attempts. Caps Lock and control-character
layers are outside teaching output; use Shift for uppercase challenges.

Primary references:

- [Microsoft US layout](https://learn.microsoft.com/en-us/globalization/keyboards/kbdus)
- [Microsoft US International layout](https://learn.microsoft.com/en-us/globalization/keyboards/kbdusx)
  and its [modifier/dead-key tables](https://learn.microsoft.com/en-us/globalization/keyboards/kbdusx.html)
- [Microsoft Arabic 101 layout](https://learn.microsoft.com/en-us/globalization/keyboards/kbda1)
  and its [modifier tables](https://learn.microsoft.com/en-us/globalization/keyboards/kbda1.html)
- [Unicode CLDR Arabic Windows reference](https://raw.githubusercontent.com/unicode-org/cldr/release-43/keyboards/windows/ar-t-k0-windows.xml)

Arabic lam–alef outputs remain a single physical
recipe with two logical characters. Next-output hints use recipe ranges rather
than assuming one physical key per grapheme. Standalone marks/tatweel are excluded
from generation; required combining-mark lessons would need their own carefully
reviewed comparison/input policy.

All 12 lesson stages are available per mapping. Completion records include lesson
and mapping versions. Direct navigation to a known locked lesson explains its
prerequisite; unknown IDs return 404. Generator v1 hashes a canonical parameter
sequence, uses deterministic integer PRNG state, derives adjacency from key-center
geometry, and filters supported recipes before choosing outputs. It rejects a
remaining-length/pattern combination with no eligible recipe instead of silently
changing the requested pattern or output length. Choose a different seed/options
if this happens. Output lengths are comparison graphemes, not keypress counts.

Practice captures its mapping and configuration at creation. External storage
updates cannot replace its target. The generator form remains disabled until the
current exercise ends. Progress saves on finish, explicit exit or restarting
attempted work. Ordinary navigation abandons in-memory active input without
creating a result; active-exercise recovery after reload is outside the MVP.

For review: complete the first lesson, reload Learning path, then generate a
reflex exercise twice with the same seed/options. The next lesson should unlock,
progress should remain, and the reflex target should repeat. Inspect the keyboard
sequence for Arabic lam–alef where those lessons
become available. Guidance remains recommended technique, never measured finger use.


US International is retired. Its reference above documents historical records only;
no mapping recipes, lessons, or selector remain. Preferences migrate to v2 without
an editable mapping. Old results remain readable and contribute to existing totals.
