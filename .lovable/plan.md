
## Onboarding flow improvements

Keep the existing chat UI, chip styling, typing bubbles, and step layout. All changes are logic + copy tweaks inside `src/routes/onboarding.tsx`, with a small addition to `src/lib/hiremate.ts` for the expanded Company type.

### 1. Fix duplicate skip acknowledgements

Root cause: `skipRole` says an ack message, then calls `goReady(true)` which fires a second `sayAi` bubble a moment later. Same double-bubble pattern exists in `skipLevel` (ack + follow-up question) and `skipCompany`/`skipDate` (ack + summary).

Fix: consolidate each skip path to exactly one AI bubble that both acknowledges and moves the flow forward.

- **Skip role** → single bubble: *"No problem 👍 I'll run a well-rounded interview suitable for most roles."*, then jump straight to the interview summary (`ready` step) — no separate `goReady` bubble.
- **Skip level** → single bubble that acks and asks the next question in one message: *"Got it 👍 I'll keep the difficulty balanced. Any specific company you're targeting, or just general practice?"*
- **Skip company** → single bubble that transitions to the date step: *"No worries 👍 I'll keep it broad. Last thing — when's your interview? (optional)"*
- **Skip date** → single bubble that leads into the summary: *"All good — you can add it later from the dashboard."* followed only by the ready-summary bubble (that's the intended two-message sequence: ack + summary of what's coming; verify it doesn't double-fire).

Refactor `goReady` so it never emits its own ack — callers own the ack copy. `goReady` just emits the "here's what's coming" summary once.

### 2. Personalization microcopy

Prepend a short framing line to the existing question in each transition bubble:

- Before **experience level** question (in `pickRole` / `submitOther`): *"We'll adjust question difficulty based on your experience. How much experience do you have?"* (replaces the current "How much experience do you have?" tail).
- Before **company** question (in `pickLevel`): *"If you're preparing for a specific company we'll tailor questions accordingly. Any specific company in mind, or just general practice?"*

### 3. Role selection — chips + searchable input

Keep the current chip grid. Add a search input above/below the chips (same step, no new step) with placeholder *"Search your role..."*.

- Expand `ROLE_OPTIONS` to: Product Manager, Software Engineer, Business Analyst, Marketing, Consultant, Designer, Sales, Finance, Teacher, Customer Success, HR.
- As the user types, filter chips live against the list.
- If the query doesn't match any chip, show a single "Use '<query>' as your role →" affordance that submits the custom role (reuses `submitOther` logic path). This removes the need for the separate `roleOther` step, but keep the "Other" chip as a fallback that focuses the search input.
- Hitting Enter in the search input with a non-empty value submits as a custom role.

### 4. Company selection — expanded chips + freeform

Replace `COMPANY_OPTIONS` with: Google, Amazon, Microsoft, Meta, Apple, Netflix, Startup, General Practice, Other.

- All named big-tech companies map to `Company: "Big Tech"`; Startup → `"Startup"`; General Practice → `"General"`; Other → opens a small inline text input (mirrors role search pattern) that accepts any company name.
- Because `Company` is a fixed union today, extend it in `src/lib/hiremate.ts`:
  - Add an optional `companyName?: string` field on `Profile` to store the display label (e.g. "Netflix", "Acme Corp"), while `company` keeps the bucketed value used by scoring/logic.
  - No behavior change downstream — existing consumers keep reading `company`.

### 5. Optional interview date

The `date` step already exists. Two adjustments:

- Reach it from every path (currently `skipCompany` skips it — route the skip-company path through the date step instead, per fix #1 above).
- Keep the skip link copy as-is (already stores nothing when skipped). Confirm the picked date persists to `Profile.interviewDate` (already wired via `saveProfile`).

### Files touched

- `src/routes/onboarding.tsx` — all of the above (state, handlers, chips, search input, microcopy, dedupe).
- `src/lib/hiremate.ts` — add optional `companyName` to `Profile` type.

### Out of scope

- No visual redesign: reuse `Chip`, `ChipGrid`, `StepBlock`, `SkipLink`, bubbles, typing indicator.
- No changes to interview engine, scoring, or dashboard.
- No new routes.
