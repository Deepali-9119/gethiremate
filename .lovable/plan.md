# Dashboard as a long-term coaching hub

Keep the current look and feel exactly as it is — same cream/coral cards, same fonts, same rounded shapes. Everything below reuses those existing card, chart and pill styles.

## 1. Practice time needs to be measured

Right now nothing records how long a session takes, so "Time practiced" and "Practice time" can't be shown from past data. The interview screen will start a timer when the first question appears and store the elapsed minutes with each finished session. Older sessions saved before this change will show "—" for time instead of a made-up number.

## 2. Dashboard

A new set of tiles and panels, in the existing peach-card style:

- Practice streak (already there), Questions answered, Average score, Time practiced
- Confidence trend and Structure trend: small sparkline cards with the change since the earliest sessions (e.g. "+8 since you started")
- Most improved skill and Weakest skill: two contrast cards naming the skill, its current average, and one line of coaching
- Weekly progress: sessions this week against the 5-session goal, plus a 7-bar mini chart of the last 7 days
- Monthly progress: sessions and average score this month vs last month
- Interview history: the full list (not just 3), each row with date, role, score and a Review link, newest first
- The existing score-over-time chart stays where it is

## 3. Interview summary after each session

The scorecard page becomes the full summary. It keeps the big score ring and category bars, and adds:

- Communication (clarity), Confidence, Structure, Relevance shown as four scores
- Top three strengths and top three improvement areas (already generated — kept)
- Personalized recommendations: 3 concrete next actions derived from the two weakest areas and the role
- Estimated interview readiness: a labelled band (Getting started / Building / Nearly ready / Interview ready) with a progress bar, based on average score, number of sessions, and consistency
- Practice time and completion date for that session
- Buttons: "Practice again" as the main action, "View dashboard" as the secondary

## 4. Personalized 5-day practice plan

Shown on the dashboard (and linked from the summary). Days are chosen from the user's two weakest skills, in this shape:

```text
Day 1 - Behavioral questions
Day 2 - Communication
Day 3 - Product thinking (role-specific)
Day 4 - Leadership
Day 5 - Full mock interview
```

Each day is a card with a short brief, a drill, a "Start" link into a new interview, and a checkbox to mark it done. Completion is remembered on the device, with a "3 of 5 done" progress bar and a reset link when the plan is finished.

## Technical notes

- `Interview` type gains `durationSec`; `src/routes/interview.tsx` records the session start and passes it to `saveInterview`.
- `src/lib/habits.ts` gains: `questionsAnswered`, `totalPracticeMinutes`, `weeklySeries`, `monthlyStats`, `mostImproved`/`weakest` (reusing `metricTrend`), `readiness`, `recommendations`, and an upgraded `buildPracticePlan` that returns titled day themes including a role-specific day and a final full mock.
- Plan completion stored under `hiremate.plan_progress` keyed by the plan signature (weak areas), so a changed plan resets its ticks.
- Dashboard and scorecard changes are presentational, built from existing components (`StatCard`, `LineChart`, `ScoreRow`) plus small new sparkline/bar helpers in the same SVG style.
- All frontend-only, still localStorage — no backend added.
