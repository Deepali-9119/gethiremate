## Landing page cleanup + trust build-out + optional interview date

Preserving the current warm coral/cream palette, typography, spacing, and conversational tone. No visual identity changes — only content structure and one new onboarding step.

### 1. Landing page (`src/routes/index.tsx`)

**Remove:** the hardcoded "Your next interview is in 5 days. That's nine practice rounds." banner (and any logic reading `history`/profile on the anonymous landing).

**Replace with** a small generic motivational strip above/under the hero CTA:
> "Every mock interview brings you closer to your real one."

**New section — "How HireMate Works"** (immediately below hero, above the existing three pillar cards):
- Three steps, horizontal on desktop / stacked on mobile, connected by a light chevron/arrow (`ArrowRight` on desktop, `ArrowDown` on mobile) in the muted coral tone.
  1. **Choose your role** — `Target` icon
  2. **Practice a realistic AI interview** — `MessageSquare` icon
  3. **Get detailed coaching + actionable improvements** — `Sparkles` icon
- Same card treatment as existing pillars (cream surface, subtle border, no new colors).

**New section — Credibility strip** (below "How it works", above final CTA):
- Row 1 — four trust chips, evenly spaced:
  - ★★★★★ Candidate Satisfaction
  - AI-powered interview coaching
  - Role-specific practice
  - Detailed personalized feedback
- Row 2 — "Trusted by candidates preparing for" label + six grayscale wordmark placeholders (Google, Microsoft, Amazon, Meta, Adobe, Spotify) rendered as muted text wordmarks (`opacity-60`, `grayscale`, tracking-wide) — no real logo files, so no trademark risk and no asset dependency.

Keep the landing uncluttered: hero → How it works → Credibility → Pillars (existing) → Final CTA (existing).

### 2. Optional interview date in onboarding (`src/routes/onboarding.tsx` + `src/lib/hiremate.ts`)

- Extend `Profile` type with `interviewDate?: string` (ISO date).
- Add a new step **after `company`, before `ready`**: `"date"`.
  - HireMate bubble: *"One last thing — when's your interview? I'll help you pace your prep."*
  - UI: shadcn `DatePicker` (Popover + Calendar, `pointer-events-auto`) plus a "Skip" link with the same 44px tap padding as existing skip links.
  - On pick → user bubble echoing the formatted date (e.g. "March 12"), then advance to `ready`.
  - On skip → advance silently to `ready`, `interviewDate` stays undefined.
- `saveProfile` already persists the whole object — no storage changes needed beyond the type.

### 3. Dashboard personalization (`src/routes/dashboard.tsx`)

- Read `profile.interviewDate` via existing `loadProfile()`.
- **Only when set and in the future**, show a small warm card near the top: *"Your interview is in **N days**."* (singular/plural handled; "tomorrow" / "today" special cases). No countdown when the field is missing.
- No changes to existing metric cards / chart / recent sessions.

### Technical notes
- No new deps; `Calendar`, `Popover`, `Button` shadcn components already installed.
- Wordmarks are plain styled text spans — no image assets, no external requests, respects the "don't imply we know the user" rule and avoids fake logo trademark issues.
- All copy stays in the current supportive conversational voice.
- No changes to interview engine, scorecard, feedback, or MCP tools.

### Files touched
- `src/routes/index.tsx` — remove personalized banner, add How-it-works + Credibility sections.
- `src/lib/hiremate.ts` — add `interviewDate?: string` to `Profile`.
- `src/routes/onboarding.tsx` — insert optional date step with DatePicker + Skip.
- `src/routes/dashboard.tsx` — conditional "Your interview is in N days" card.
