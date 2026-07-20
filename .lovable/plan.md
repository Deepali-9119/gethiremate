## Goal

Rebuild the feedback engine so scores, written coaching, and in-answer highlights all reflect the same measurable signals — and so "What worked" never contradicts "Try next time".

## 1. Rewrite scoring in `src/lib/hiremate.ts`

Replace `scoreAnswer` with independent per-metric evaluators. Each returns `{ score, signals, gaps }` used later for coaching and highlights.

**Clarity** — sentence readability + specificity
- Avg sentence length (penalize > 28 words or < 5)
- Filler words (`um`, `like`, `you know`, `basically`, `stuff`, `things`)
- Concrete nouns/proper nouns ratio (specificity signal)

**Confidence** — decisive language + ownership, no hesitation
- Hedges (`I think`, `maybe`, `kinda`, `sort of`, `I guess`, `probably`) lower score
- Ownership verbs (`I led`, `I built`, `I decided`, `I owned`, `I shipped`) raise score
- Passive voice ("was done", "were made") lowers score

**Relevance** — directly answers, no tangents
- Keyword overlap with question (existing `overlap` helper)
- Question-type match: "how would you measure" expects metric words; "walk me through" expects sequencing; "tell me about a time" expects past-tense narrative
- Penalize obvious tangents (long answer, low overlap)

**Structure** — STAR + logical progression + completeness (for behavioral); step sequencing + trade-offs (for technical)
- Detect each STAR component separately: Situation, Task, Action, Result — count how many present (0–4)
- Detect logical connectors (`first`, `then`, `next`, `finally`, `because`, `so`)
- For technical questions, look for constraint-setting → approach → trade-off pattern
- Score is proportional to completeness — missing Result caps Structure at ~60; missing 2+ components caps at ~45

**Guarantee consistency:** if `howToImprove` mentions STAR, Structure must be ≤ 65. Add an assertion in dev that any tip generated has a corresponding low sub-metric.

## 2. Rewrite feedback text

Split into three arrays, populated only from the evaluator outputs:

- `worked: string[]` — one line per metric whose score ≥ 75, describing the specific signal that landed ("You named the Result clearly — a 40% drop in bug rate."). Never contains criticism.
- `tryNext: string[]` — every improvement lives here, sourced from each metric's `gaps`. Precise, references what the user actually said or omitted:
  - Instead of "Add more detail" → "You described the Situation and Action but skipped the Result — say what changed after you shipped."
  - Instead of "Use STAR" → "Your answer jumps straight to Action. Set the Situation in one sentence first (when, where, who)."
- `missing: string[]` — short tags derived from the same gaps ("No result", "Missing metric", "Hedging language").

Drop the old `highlight` / `improve` single-string fields from the render path; keep them as computed joins for backwards compatibility with dashboard/scorecard until those are updated.

## 3. In-answer highlights

Extend `QA` with `spans: { start: number; end: number; type: 'strong' | 'vague' | 'missing-impact'; tip: string }[]`.

Generate spans during scoring:
- **Green `strong`** — sentence containing a metric, ownership verb, or a fully-formed STAR Result
- **Yellow `vague`** — sentence with hedges or generic fillers ("some stuff", "kinda", "I think")
- **Blue `missing-impact`** — sentence that describes Action but no measurable outcome follows

Each span carries a `tip` string used in the tap-to-explain popover.

Render in `src/routes/interview.tsx` inside the user-answer bubble: replace the plain `{t.text}` with a `<HighlightedAnswer>` component that splits the answer by spans and wraps each in a `<Popover>` (shadcn) with a colored underline (`decoration-warn`, `decoration-info`, `decoration-success`). Tap/click opens the tip.

## 4. Update feedback card UI

In `src/routes/interview.tsx`:
- Render `worked` bullets under a green "What worked" header (only genuine strengths).
- Render `tryNext` bullets under a coral "Try next time" header. Remove the old separate "How to improve" section — it collapses into `tryNext`.
- Keep `missing` chips and the 4 MetricBars unchanged.
- Drop `t.qa.highlight` / `t.qa.improve` paragraphs.

## 5. Keep consumers working

- `aggregate`, `weakAreas`, dashboard, scorecard read only `metrics` — untouched.
- `src/lib/mcp/tools/score-answer.ts` — update the `summary` text to join `worked` + `tryNext` instead of `highlight` + `improve`, and expose `worked`, `tryNext`, `spans` in `structuredContent`.
- `src/lib/sessions.ts` `summarizeQAs` — swap `highlight`/`improve` for `worked[0]`/`tryNext[0]`.

## Technical notes

- Behavioral question detection: `/tell me|describe|share|time you|walk me through a time|proud of|failed|disagreed/i`
- Technical question detection: `/design|architect|debug|scale|explain|database|sql|system|implement|complexity/i`
- Sentence split: `answer.split(/(?<=[.!?])\s+/)` with index tracking for span offsets.
- Span offset tracking: iterate sentences with a running cursor so `{start,end}` map to the original string.
- Keep `clamp(20, 98)` bounds.

## Out of scope

No changes to onboarding, dashboard visuals, scorecard visuals, or the MCP route infrastructure. `improvedAnswer` field stays in the type but is no longer rendered (already removed earlier).