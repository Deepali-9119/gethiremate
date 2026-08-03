# HireMate as a coach: four feedback sections per answer

Every answer's feedback card becomes a compact coaching block with four parts, mobile-first.

## 1. What Worked
Unchanged behaviour — genuine strengths only, no criticism.

## 2. Try Next Time
Unchanged behaviour — precise, gap-derived coaching lines.

## 3. Improved Answer (STAR)
A stronger rewrite of the user's own answer, rebuilt into Situation / Task / Action / Result:
- Reuses the candidate's real content (sentences are classified into STAR slots by the same signals the scorer already uses: context words, ownership verbs, outcome/metric words).
- Missing slots are filled with clearly marked prompts the user can complete, e.g. "Result — [add the measurable outcome: %, time saved, users affected]".
- Hedges and fillers are removed, sentences tightened, one metric placeholder added when none exists.
- Labelled with a note: "Example for learning — don't memorise it. Use the shape, keep your own story."
- Rendered as four short labelled lines (S / T / A / R) so it stays scannable on a phone.

## 4. Before vs After
- Toggle between **Stacked** (default on mobile) and **Side-by-side** (default on wider screens): Original Answer | Improved Answer.
- Under it, a short list of what changed, generated from the actual diff of signals: Added metrics · Improved structure · Stronger impact · Clearer communication · Better storytelling. Only the tags that genuinely apply are shown.

## Button
"Rewrite my answer using STAR" sits at the bottom of the feedback card next to "Redo this answer". Sections 3 and 4 stay collapsed until it's tapped, keeping the card light; tapping expands them inline with no navigation.

## Technical notes
- `src/lib/hiremate.ts`: implement `buildStarRewrite(question, answer, sentences)` returning `{ situation, task, action, result, improvedAnswer, changes: string[] }`; populate the existing (currently empty) `improvedAnswer` field on `QA` and add a `star` field to the `QA` type. Reuse existing helpers (`splitSentences`, hedge/filler/metric regexes) — no new scoring logic, and metrics are unaffected.
- `src/routes/interview.tsx`: extend the feedback card renderer with the collapsible STAR + comparison blocks and the new button; local `useState` per feedback turn.
- Skip sections 3 and 4 entirely for `tooShort` answers.
- No backend, no new dependencies; styling uses existing tokens (coral / success / warn / info) and stacks under `sm:`.
