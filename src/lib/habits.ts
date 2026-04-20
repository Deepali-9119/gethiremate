import type { Interview, Metric } from "./hiremate";

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export function uniqueDays(history: Interview[]): string[] {
  return Array.from(new Set(history.map((h) => dayKey(new Date(h.date))))).sort();
}

export function streakDays(history: Interview[]): number {
  const days = new Set(uniqueDays(history));
  if (!days.size) return 0;
  let streak = 0;
  const cursor = new Date();
  // If today not done, allow streak counting from yesterday so user keeps yesterday's streak today
  if (!days.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function doneToday(history: Interview[]): boolean {
  const today = dayKey(new Date());
  return history.some((h) => dayKey(new Date(h.date)) === today);
}

export function sessionsThisWeek(history: Interview[]): number {
  const now = new Date();
  const start = new Date(now);
  const day = (start.getDay() + 6) % 7; // Monday = 0
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return history.filter((h) => new Date(h.date) >= start).length;
}

export const WEEKLY_GOAL = 5;

export function metricTrend(
  history: Interview[],
  key: keyof Metric,
): { delta: number; from: number; to: number } | null {
  if (history.length < 2) return null;
  // history is newest-first
  const recent = history.slice(0, Math.min(3, history.length));
  const older = history.slice(-Math.min(3, history.length));
  const avg = (arr: Interview[]) =>
    arr.reduce((s, h) => s + h.overall[key], 0) / arr.length;
  const to = Math.round(avg(recent));
  const from = Math.round(avg(older));
  return { from, to, delta: to - from };
}

export function smartNudges(history: Interview[]): string[] {
  const nudges: string[] = [];
  if (!history.length) {
    return ["Run your first mock — 10 minutes is all it takes to set a baseline."];
  }
  const weekDone = sessionsThisWeek(history);
  const remaining = Math.max(0, WEEKLY_GOAL - weekDone);
  if (remaining > 0 && remaining <= 2) {
    nudges.push(`You're ${remaining} session${remaining === 1 ? "" : "s"} away from your weekly goal.`);
  }
  const keys: (keyof Metric)[] = ["clarity", "structure", "confidence", "relevance"];
  const improved = keys
    .map((k) => ({ k, t: metricTrend(history, k) }))
    .filter((x) => x.t && x.t.delta >= 5)
    .sort((a, b) => (b.t!.delta - a.t!.delta));
  if (improved.length) {
    const top = improved[0];
    nudges.push(`You improved your ${top.k} by ${top.t!.delta} points — let's keep going.`);
  }
  const s = streakDays(history);
  if (s >= 2) nudges.push(`${s}-day streak. One more session today to keep the chain.`);
  if (!doneToday(history) && history.length >= 1) {
    nudges.push("You haven't practiced today — even one question keeps the habit alive.");
  }
  return nudges.slice(0, 3);
}

export type PlanDay = {
  day: number;
  title: string;
  focus: keyof Metric | "mixed";
  brief: string;
  drill: string;
};

const PLAN_TEMPLATES: Record<keyof Metric, Omit<PlanDay, "day">[]> = {
  confidence: [
    { title: "Own your verbs", focus: "confidence", brief: "Cut every hedge — 'I think', 'kinda', 'maybe'.", drill: "Re-record yesterday's weakest answer using only ownership verbs." },
    { title: "Power posture", focus: "confidence", brief: "Stand up. Speak slower than feels natural.", drill: "3 behavioral questions, video on, eye-level camera." },
  ],
  structure: [
    { title: "STAR everything", focus: "structure", brief: "Force STAR on every behavioral answer today.", drill: "5 questions, label S/T/A/R out loud as you go." },
    { title: "Headline first", focus: "structure", brief: "Lead with the result, then explain.", drill: "Rewrite 3 past answers headline-first." },
  ],
  clarity: [
    { title: "One idea per sentence", focus: "clarity", brief: "Short sentences. No 'and also'.", drill: "3 questions — cap every sentence at 15 words." },
    { title: "Cut the throat-clearing", focus: "clarity", brief: "Skip 'so basically', 'I guess what I mean'.", drill: "Re-do your weakest answer in under 60 seconds." },
  ],
  relevance: [
    { title: "Mirror the question", focus: "relevance", brief: "Echo a keyword from the question in your opening line.", drill: "5 questions, write the keyword down before answering." },
    { title: "Anchor with metrics", focus: "relevance", brief: "Every answer needs one number.", drill: "3 answers — each with at least one %, $, or count." },
  ],
};

export function buildPracticePlan(history: Interview[]): PlanDay[] {
  // Determine top 2 weak areas; fall back sensibly if no history
  const keys: (keyof Metric)[] = ["clarity", "structure", "confidence", "relevance"];
  const ranked = history.length
    ? keys
        .map((k) => ({
          k,
          avg: history.reduce((s, h) => s + h.overall[k], 0) / history.length,
        }))
        .sort((a, b) => a.avg - b.avg)
        .map((x) => x.k)
    : (["structure", "confidence", "clarity", "relevance"] as (keyof Metric)[]);

  const top = ranked[0];
  const second = ranked[1];

  const days: PlanDay[] = [
    { day: 1, ...PLAN_TEMPLATES[top][0] },
    { day: 2, ...PLAN_TEMPLATES[second][0] },
    { day: 3, ...PLAN_TEMPLATES[top][1] },
    {
      day: 4,
      title: "Mixed mock",
      focus: "mixed",
      brief: "Full 5-question mock — no theme, just performance.",
      drill: "Run a normal interview. Aim to beat your last score by 5.",
    },
    { day: 5, ...PLAN_TEMPLATES[second][1] },
  ];
  return days;
}
