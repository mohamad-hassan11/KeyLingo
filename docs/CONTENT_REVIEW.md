# Independent AI editorial review — pilot v1

Review date: 2026-10-12. Reviewer: independent KeyLingo editorial reviewer agent
`/root/content_review`, model **GPT-6-astra**. Drafting provenance is **KeyLingo
drafting agent (GPT-6)**. This reviewer is a separate agent from the drafting agent.
The review is an AI editorial review, **not human linguistic validation**.

All 84 entries were read and reviewed in their 28 parallel English/Dutch/Arabic
triplets. For every entry, review covered its source, both other-language sentence
or word translations, annotation surface and range, lemma, stable contextual sense,
definition and both lexical translations, approximate CEFR, register, and cultural
suitability. Source and lexical translations were then synchronized across each
triplet. All 84 are approved for the version 1 AI-reviewed pilot; no unresolved
editorial rejection is included. Original drafting provenance and CC0-1.0 labels
are retained; no external source text was introduced.

## Coverage and scope

| Language | A1 | A2 | B1 | B2 | Total |
| --- | --- | --- | --- | --- | --- |
| English | 7 | 7 | 7 | 7 | 28 |
| Dutch | 7 | 7 | 7 | 7 | 28 |
| Modern Standard Arabic | 7 | 7 | 7 | 7 | 28 |

Each level has daily-life, travel, work-study, food, culture, technology, and casual.
A1 uses words, A2/B1 sentences, and B2 short passages. Arabic casual entries use
informal conversational MSA; no dialect authenticity is claimed. Arabic optional
vowel marks are generally omitted intentionally. Word and clause difficulty varies
within the estimated bands: CEFR labels describe editorial practice groupings,
not an exam calibration or a comprehensive graded syllabus.

## Corrections and conventions

- Corrected Arabic `لدي خططا` to `لدي خطط`, and simplified the A2 battery sentence.
- Made the B2 casual invitation response more conversational and aligned the
  news-sharing annotation with a complete verb phrase.
- Restored explicit politeness in Dutch B1 feedback and improved Dutch recipe wording.
- Aligned the B2 meal adjective and corrected the food-waste definition across languages.
- Normalized noun lemmas to singular/base forms and removed sentence-initial
  capitalization, Arabic definite articles, and possessive suffixes where appropriate.
  Multiword expressions retain their contextual sense. Arabic `إعداد` is the headword
  for the privacy-control sense; `تبادل الأخبار` is the canonical news-sharing phrase.
- Moved Arabic B2 culture’s annotation to the intended standalone occurrence of
  `أجيال`; the draft had matched the same letters inside `الأجيال` earlier in the text.
- Recomputed all annotation ranges as UTF-16 source offsets. The Arabic backup
  annotation intentionally begins after the attached preposition in `بنسخة احتياطية`:
  its surface is the complete lexical noun phrase `نسخة احتياطية`.
- Lexical translations are contextual equivalents, preserving each target entry’s
  surface form. They can therefore include an article, inflection or possessive
  suffix absent from another language’s annotation. Definitions explain the shared
  sense; lemma fields identify base forms rather than guessing morphology at runtime.
- Shared sense IDs remain stable across parallel entries. Definitions are English
  explanatory glosses under the current schema, not localized interface strings.

## Per-entry evidence

Every row has the full review scope described above, including both translations.
“Retained” means the source was read and accepted, not skipped. Every row is approved.

| Entry | Editorial judgment | Corrections / disposition |
| --- | --- | --- |
| `en-daily-life-a1` | A1 dwelling sense is suitable; home/huis/بيت are equivalent here, without the emotional or adverbial senses of home. | Source wording retained after linguistic review. |
| `nl-daily-life-a1` | A1 dwelling sense is suitable; home/huis/بيت are equivalent here, without the emotional or adverbial senses of home. | Source wording retained after linguistic review. |
| `ar-daily-life-a1` | A1 dwelling sense is suitable; home/huis/بيت are equivalent here, without the emotional or adverbial senses of home. | Source wording retained after linguistic review. |
| `en-travel-a1` | A1 ticket sense is clear; kaartje means an admission/travel ticket here, not a small card. | Source wording retained after linguistic review. |
| `nl-travel-a1` | A1 ticket sense is clear; kaartje means an admission/travel ticket here, not a small card. | Source wording retained after linguistic review. |
| `ar-travel-a1` | A1 ticket sense is clear; kaartje means an admission/travel ticket here, not a small card. | Source wording retained after linguistic review. |
| `en-work-study-a1` | A1 reading-object sense is clear; book is a noun here, not a reservation verb. | Source wording retained after linguistic review. |
| `nl-work-study-a1` | A1 reading-object sense is clear; book is a noun here, not a reservation verb. | Source wording retained after linguistic review. |
| `ar-work-study-a1` | A1 reading-object sense is clear; book is a noun here, not a reservation verb. | Source wording retained after linguistic review. |
| `en-food-a1` | A1 bread sense and neutral register are suitable; no culturally specific staple claim is made. | Source wording retained after linguistic review. |
| `nl-food-a1` | A1 bread sense and neutral register are suitable; no culturally specific staple claim is made. | Source wording retained after linguistic review. |
| `ar-food-a1` | A1 bread sense and neutral register are suitable; no culturally specific staple claim is made. | Source wording retained after linguistic review. |
| `en-culture-a1` | A1 music sense is clear and culturally general; no tradition is presented as universal. | Source wording retained after linguistic review. |
| `nl-culture-a1` | A1 music sense is clear and culturally general; no tradition is presented as universal. | Source wording retained after linguistic review. |
| `ar-culture-a1` | A1 music sense is clear and culturally general; no tradition is presented as universal. | Source wording retained after linguistic review. |
| `en-technology-a1` | A1 phone sense is suitable; the device meaning agrees across all three versions. | Source wording retained after linguistic review. |
| `nl-technology-a1` | A1 phone sense is suitable; the device meaning agrees across all three versions. | Source wording retained after linguistic review. |
| `ar-technology-a1` | A1 phone sense is suitable; the device meaning agrees across all three versions. | Source wording retained after linguistic review. |
| `en-casual-a1` | A1 greeting is natural; مرحبا is conversational MSA and does not imply a regional dialect. | Source wording retained after linguistic review. |
| `nl-casual-a1` | A1 greeting is natural; مرحبا is conversational MSA and does not imply a regional dialect. | Source wording retained after linguistic review. |
| `ar-casual-a1` | A1 greeting is natural; مرحبا is conversational MSA and does not imply a regional dialect. | Source wording retained after linguistic review. |
| `en-daily-life-a2` | A2 habitual present and everyday window vocabulary align in all three sentences. | Source wording retained after linguistic review. |
| `nl-daily-life-a2` | A2 habitual present and everyday window vocabulary align in all three sentences. | Source wording retained after linguistic review. |
| `ar-daily-life-a2` | A2 habitual present and everyday window vocabulary align in all three sentences. | Source wording retained after linguistic review. Normalized lemma النافذة → نافذة; retained contextual surface and sense. |
| `en-travel-a2` | A2 departure time aligns; eight/eight o’clock remains deliberately unspecified as morning or evening. | Source wording retained after linguistic review. |
| `nl-travel-a2` | A2 departure time aligns; eight/eight o’clock remains deliberately unspecified as morning or evening. | Source wording retained after linguistic review. |
| `ar-travel-a2` | A2 departure time aligns; eight/eight o’clock remains deliberately unspecified as morning or evening. | Source wording retained after linguistic review. Normalized lemma القطار → قطار; retained contextual surface and sense. |
| `en-work-study-a2` | A2 shared study activity aligns; المكتبة is the library sense here, not a bookshop. | Source wording retained after linguistic review. |
| `nl-work-study-a2` | A2 shared study activity aligns; المكتبة is the library sense here, not a bookshop. | Source wording retained after linguistic review. |
| `ar-work-study-a2` | A2 shared study activity aligns; المكتبة is the library sense here, not a bookshop. | Source wording retained after linguistic review. Normalized lemma المكتبة → مكتبة; retained contextual surface and sense. |
| `en-food-a2` | A2 direct friendly offer is appropriate; Arabic تريد and Dutch wil je are contextual equivalents of would you like. | Source wording retained after linguistic review. |
| `nl-food-a2` | A2 direct friendly offer is appropriate; Arabic تريد and Dutch wil je are contextual equivalents of would you like. | Source wording retained after linguistic review. |
| `ar-food-a2` | A2 direct friendly offer is appropriate; Arabic تريد and Dutch wil je are contextual equivalents of would you like. | Source wording retained after linguistic review. Normalized lemma الحساء → حساء; retained contextual surface and sense. |
| `en-culture-a2` | A2 opening-status statement aligns; museum names and local customs are not assumed. | Source wording retained after linguistic review. |
| `nl-culture-a2` | A2 opening-status statement aligns; museum names and local customs are not assumed. | Source wording retained after linguistic review. |
| `ar-culture-a2` | A2 opening-status statement aligns; museum names and local customs are not assumed. | Source wording retained after linguistic review. Normalized lemma المتحف → متحف; retained contextual surface and sense. |
| `en-technology-a2` | A2 near-empty battery statement aligns; Arabic surface بطاريتي includes the speaker’s possessive suffix. | Source wording retained after linguistic review. |
| `nl-technology-a2` | A2 near-empty battery statement aligns; Arabic surface بطاريتي includes the speaker’s possessive suffix. | Source wording retained after linguistic review. |
| `ar-technology-a2` | A2 near-empty battery statement aligns; Arabic surface بطاريتي includes the speaker’s possessive suffix. | Simplified على وشك النفاد to فارغة تقريبا for the approximate A2 level and closer alignment with almost empty. Normalized lemma بطاريتي → بطارية; retained contextual surface and sense. |
| `en-casual-a2` | A2 farewell is natural across languages; أراك غدا is conversational MSA without dialect claims. | Source wording retained after linguistic review. |
| `nl-casual-a2` | A2 farewell is natural across languages; أراك غدا is conversational MSA without dialect claims. | Source wording retained after linguistic review. |
| `ar-casual-a2` | A2 farewell is natural across languages; أراك غدا is conversational MSA without dialect claims. | Source wording retained after linguistic review. Normalized temporal-adverb surface غدا to nominal base lemma غد. |
| `en-daily-life-b1` | B1 shared household responsibilities and free time align; the sentence assigns no gendered roles. | Source wording retained after linguistic review. Normalized lemma household tasks → household task; retained contextual surface and sense. |
| `nl-daily-life-b1` | B1 shared household responsibilities and free time align; the sentence assigns no gendered roles. | Source wording retained after linguistic review. Normalized lemma Huishoudelijke taken → huishoudelijke taak; retained contextual surface and sense. |
| `ar-daily-life-b1` | B1 shared household responsibilities and free time align; the sentence assigns no gendered roles. | Source wording retained after linguistic review. Normalized lemma الأعمال المنزلية → عمل منزلي; retained contextual surface and sense. |
| `en-travel-b1` | B1 missed train connection is clear in context; القطار التالي is the next train of this journey, not a universal dictionary equivalent of connection. | Source wording retained after linguistic review. |
| `nl-travel-b1` | B1 missed train connection is clear in context; القطار التالي is the next train of this journey, not a universal dictionary equivalent of connection. | Source wording retained after linguistic review. |
| `ar-travel-b1` | B1 missed train connection is clear in context; القطار التالي is the next train of this journey, not a universal dictionary equivalent of connection. | Source wording retained after linguistic review. Normalized lemma القطار التالي → قطار; retained contextual surface and sense. |
| `en-work-study-b1` | B1 request before a meeting aligns; Arabic ملاحظاتك means your feedback/comments here, not private notes. | Source wording retained after linguistic review. |
| `nl-work-study-b1` | B1 request before a meeting aligns; Arabic ملاحظاتك means your feedback/comments here, not private notes. | Restored the explicit politeness of Please / يرجى with alsjeblieft. |
| `ar-work-study-b1` | B1 request before a meeting aligns; Arabic ملاحظاتك means your feedback/comments here, not private notes. | Source wording retained after linguistic review. Normalized lemma ملاحظاتك → ملاحظة; retained contextual surface and sense. |
| `en-food-b1` | B1 recipe and fresh-market-vegetable context align; the sentence is a general cooking example. | Source wording retained after linguistic review. |
| `nl-food-b1` | B1 recipe and fresh-market-vegetable context align; the sentence is a general cooking example. | Replaced literal werkt goed with more natural recipe wording lukt goed. |
| `ar-food-b1` | B1 recipe and fresh-market-vegetable context align; the sentence is a general cooking example. | Source wording retained after linguistic review. Normalized lemma الوصفة → وصفة; retained contextual surface and sense. |
| `en-culture-b1` | B1 exhibition and change over time align; city history is described without a specific cultural claim. | Source wording retained after linguistic review. |
| `nl-culture-b1` | B1 exhibition and change over time align; city history is described without a specific cultural claim. | Source wording retained after linguistic review. |
| `ar-culture-b1` | B1 exhibition and change over time align; city history is described without a specific cultural claim. | Source wording retained after linguistic review. Normalized lemma المعرض → معرض; retained contextual surface and sense. |
| `en-technology-b1` | B1 backup instruction aligns; the Arabic annotation excludes the attached preposition ب in بنسخة, intentionally retaining the complete noun phrase. | Source wording retained after linguistic review. |
| `nl-technology-b1` | B1 backup instruction aligns; the Arabic annotation excludes the attached preposition ب in بنسخة, intentionally retaining the complete noun phrase. | Source wording retained after linguistic review. |
| `ar-technology-b1` | B1 backup instruction aligns; the Arabic annotation excludes the attached preposition ب in بنسخة, intentionally retaining the complete noun phrase. | Source wording retained after linguistic review. |
| `en-casual-b1` | B1 friendly acceptance and a mutually suitable alternative day align; no problem is an expression, not a literal absence-of-problems claim. | Source wording retained after linguistic review. Normalized lemma No problem → no problem; retained contextual surface and sense. |
| `nl-casual-b1` | B1 friendly acceptance and a mutually suitable alternative day align; no problem is an expression, not a literal absence-of-problems claim. | Source wording retained after linguistic review. Normalized lemma Geen probleem → geen probleem; retained contextual surface and sense. |
| `ar-casual-b1` | B1 friendly acceptance and a mutually suitable alternative day align; no problem is an expression, not a literal absence-of-problems claim. | Source wording retained after linguistic review. |
| `en-daily-life-b2` | B2 abstract routine/responsibility language is suitable; the text presents flexibility as a possibility, not a health guarantee. | Source wording retained after linguistic review. Normalized lemma adjustments → adjustment; retained contextual surface and sense. |
| `nl-daily-life-b2` | B2 abstract routine/responsibility language is suitable; the text presents flexibility as a possibility, not a health guarantee. | Source wording retained after linguistic review. Normalized lemma aanpassingen → aanpassing; retained contextual surface and sense. |
| `ar-daily-life-b2` | B2 abstract routine/responsibility language is suitable; the text presents flexibility as a possibility, not a health guarantee. | Source wording retained after linguistic review. Normalized lemma التعديلات → تعديل; retained contextual surface and sense. |
| `en-travel-b2` | B2 cancellation conditions and flexibility align; the passage provides a general travel scenario, not jurisdiction-specific consumer rules. | Source wording retained after linguistic review. Normalized lemma cancellation policies → cancellation policy; retained contextual surface and sense. |
| `nl-travel-b2` | B2 cancellation conditions and flexibility align; the passage provides a general travel scenario, not jurisdiction-specific consumer rules. | Source wording retained after linguistic review. Normalized lemma annuleringsvoorwaarden → annuleringsvoorwaarde; retained contextual surface and sense. |
| `ar-travel-b2` | B2 cancellation conditions and flexibility align; the passage provides a general travel scenario, not jurisdiction-specific consumer rules. | Source wording retained after linguistic review. Normalized lemma شروط الإلغاء → شرط الإلغاء; retained contextual surface and sense. |
| `en-work-study-b2` | B2 constructive-criticism distinction aligns; realistic/haalbaar/واقعيا expresses a practical suggestion in context. | Source wording retained after linguistic review. Normalized lemma Constructive criticism → constructive criticism; retained contextual surface and sense. |
| `nl-work-study-b2` | B2 constructive-criticism distinction aligns; realistic/haalbaar/واقعيا expresses a practical suggestion in context. | Source wording retained after linguistic review. Normalized lemma Opbouwende kritiek → opbouwende kritiek; retained contextual surface and sense. |
| `ar-work-study-b2` | B2 constructive-criticism distinction aligns; realistic/haalbaar/واقعيا expresses a practical suggestion in context. | Source wording retained after linguistic review. Normalized lemma النقد البناء → نقد بناء; retained contextual surface and sense. |
| `en-food-b2` | B2 food-waste discussion aligns; the annotation denotes wasting edible food, not a category of ingredients. | Aligned tasty meal with smakelijke maaltijd / وجبة شهية; satisfying had a broader sense. Corrected definition to the act of wasting edible food, matching voedselverspilling and هدر الطعام. |
| `nl-food-b2` | B2 food-waste discussion aligns; the annotation denotes wasting edible food, not a category of ingredients. | Source wording retained after linguistic review. Normalized lemma Voedselverspilling → voedselverspilling; retained contextual surface and sense. Corrected definition to the act of wasting edible food, matching voedselverspilling and هدر الطعام. |
| `ar-food-b2` | B2 food-waste discussion aligns; the annotation denotes wasting edible food, not a category of ingredients. | Source wording retained after linguistic review. Corrected definition to the act of wasting edible food, matching voedselverspilling and هدر الطعام. |
| `en-culture-b2` | B2 transmission and evolution of traditions align; different generations are acknowledged without stereotyping a culture. | Source wording retained after linguistic review. Normalized lemma generations → generation; retained contextual surface and sense. |
| `nl-culture-b2` | B2 transmission and evolution of traditions align; different generations are acknowledged without stereotyping a culture. | Source wording retained after linguistic review. Normalized lemma generaties → generatie; retained contextual surface and sense. |
| `ar-culture-b2` | B2 transmission and evolution of traditions align; different generations are acknowledged without stereotyping a culture. | Source wording retained after linguistic review. Normalized lemma أجيال → جيل; retained contextual surface and sense. Moved annotation from inside الأجيال in the first sentence to the complete أجيال after الاستماع إلى in the second sentence. |
| `en-technology-b2` | B2 data-collection/privacy discussion aligns; the setting sense denotes user controls, not configuring an entire service. | Source wording retained after linguistic review. Normalized lemma privacy settings → privacy setting; retained contextual surface and sense. |
| `nl-technology-b2` | B2 data-collection/privacy discussion aligns; the setting sense denotes user controls, not configuring an entire service. | Source wording retained after linguistic review. Normalized lemma privacyinstellingen → privacyinstelling; retained contextual surface and sense. |
| `ar-technology-b2` | B2 data-collection/privacy discussion aligns; the setting sense denotes user controls, not configuring an entire service. | Source wording retained after linguistic review. Normalized lemma إعدادات الخصوصية → إعداد; retained contextual surface and sense. |
| `en-casual-b2` | B2 polite refusal and an unhurried future conversation align; catch up means exchanging news. Arabic remains conversational MSA, not dialect. | Used conversational thanks and contractions to fit the informal register and the other-language versions. |
| `nl-casual-b2` | B2 polite refusal and an unhurried future conversation align; catch up means exchanging news. Arabic remains conversational MSA, not dialect. | Source wording retained after linguistic review. |
| `ar-casual-b2` | B2 polite refusal and an unhurried future conversation align; catch up means exchanging news. Arabic remains conversational MSA, not dialect. | Corrected لدي خططا to لدي خطط and made the invitation response more conversational while retaining MSA. Replaced clause fragment نتبادل فيه الأخبار with the complete contextual verb phrase لنتبادل الأخبار; lemma تبادل الأخبار expresses the news-sharing sense, not catching an object. Normalized lemma نتبادل فيه الأخبار → تبادل الأخبار; retained contextual surface and sense. |

## Limits and validation

Human/native-speaker validation, CEFR calibration, dialect assessment, and real OS
Arabic input were not performed. This compact collection provides only one
annotation per entry and is not a general dictionary. Ambiguous words have the
listed contextual senses only. No claims are made about comprehensive morphology,
all possible translations, or universal cultural practices. Structural validation
is a separate check and does not establish linguistic correctness.

Executed on 2026-10-12: a `node --input-type=module` assertion script (host Node
v26.11.1) used TypeScript's installed transpiler to execute the actual
`isContentEntry` / `validateCollection` validator section from
`src/domain/content/index.ts`. It passed all 84 reviewed entries, unique IDs,
coverage, source/grapheme ranges, and required metadata. Additional assertions
passed for all 28 parallel full/lexical translation triplets, 84 independent-review
records, the corrected Arabic culture occurrence, and the Arabic grammar correction.
This did not run the whole application suite; the integrating agent owns the
Node 24 typecheck/lint/unit/build/browser checks and records those separately.
