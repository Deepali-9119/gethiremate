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

/* ---------- long-term coaching stats ---------- */

export function questionsAnswered(history: Interview[]): number {
  return history.reduce((n, h) => n + (h.qas?.length ?? 0), 0);
}

/** Total practice time in minutes; null when no session has a recorded duration. */
export function totalPracticeMinutes(history: Interview[]): number | null {
  const timed = history.filter((h) => typeof h.durationSec === "number");
  if (!timed.length) return null;
  return Math.max(1, Math.round(timed.reduce((s, h) => s + (h.durationSec ?? 0), 0) / 60));
}

export function formatDuration(sec?: number): string {
  if (typeof sec !== "number" || !isFinite(sec)) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  if (m === 0) return `${s}s`;
  return s ? `${m}m ${s}s` : `${m}m`;
}

/** Last 7 days (oldest → newest) of session counts. */
export function weeklySeries(history: Interview[]): { label: string; date: string; count: number }[] {
  const out: { label: string; date: string; count: number }[] = [];
  const counts = new Map<string, number>();
  for (const h of history) {
    const k = dayKey(new Date(h.date));
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = dayKey(d);
    out.push({
      label: d.toLocaleDateString(undefined, { weekday: "narrow" }),
      date: k,
      count: counts.get(k) ?? 0,
    });
  }
  return out;
}

export type MonthStats = {
  sessions: number;
  avg: number;
  prevSessions: number;
  prevAvg: number;
};

export function monthlyStats(history: Interview[]): MonthStats {
  const now = new Date();
  const inMonth = (d: Date, offset: number) => {
    const ref = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
  };
  const cur = history.filter((h) => inMonth(new Date(h.date), 0));
  const prev = history.filter((h) => inMonth(new Date(h.date), 1));
  const avg = (a: Interview[]) => (a.length ? Math.round(a.reduce((s, h) => s + h.score, 0) / a.length) : 0);
  return { sessions: cur.length, avg: avg(cur), prevSessions: prev.length, prevAvg: avg(prev) };
}

export const METRIC_LABELS: Record<keyof Metric, string> = {
  clarity: "Communication",
  structure: "Structure",
  confidence: "Confidence",
  relevance: "Relevance",
};

export const METRIC_KEYS: (keyof Metric)[] = ["clarity", "structure", "confidence", "relevance"];

export function metricAverage(history: Interview[], key: keyof Metric): number {
  if (!history.length) return 0;
  return Math.round(history.reduce((s, h) => s + h.overall[key], 0) / history.length);
}

/** Per-metric series in chronological order (history is newest-first). */
export function metricSeries(history: Interview[], key: keyof Metric): number[] {
  return [...history].reverse().map((h) => h.overall[key]);
}

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

export function mostImprovedSkill(
  history: Interview[],
): { key: keyof Metric; delta: number; avg: number } | null {
  if (history.length < 2) return null;
  const ranked = METRIC_KEYS.map((k) => ({
    key: k,
    delta: metricTrend(history, k)?.delta ?? 0,
    avg: metricAverage(history, k),
  })).sort((a, b) => b.delta - a.delta);
  return ranked[0] ?? null;
}

export function weakestSkill(history: Interview[]): { key: keyof Metric; avg: number } | null {
  if (!history.length) return null;
  const ranked = METRIC_KEYS.map((k) => ({ key: k, avg: metricAverage(history, k) })).sort(
    (a, b) => a.avg - b.avg,
  );
  return ranked[0] ?? null;
}

export type Readiness = { score: number; band: string; blurb: string };

/** Blend of score quality, volume of practice and consistency. */
export function readiness(history: Interview[]): Readiness {
  if (!history.length) {
    return { score: 0, band: "Getting started", blurb: "Run your first mock to set a baseline." };
  }
  const recent = history.slice(0, 3);
  const avgRecent = recent.reduce((s, h) => s + h.score, 0) / recent.length;
  const volume = Math.min(1, history.length / 8); // 8 sessions = full credit
  const consistency = Math.min(1, uniqueDays(history).length / 5);
  const score = Math.round(avgRecent * 0.7 + volume * 100 * 0.18 + consistency * 100 * 0.12);
  const band =
    score >= 85
      ? "Interview ready"
      : score >= 70
        ? "Nearly ready"
        : score >= 50
          ? "Building"
          : "Getting started";
  const blurb =
    score >= 85
      ? "You're performing at hire-ready level. Keep sharp with light reps."
      : score >= 70
        ? "Close. A few more focused reps on your weakest skill will get you there."
        : score >= 50
          ? "Solid foundation — consistency is what moves this number now."
          : "Early days. Practice little and often; the curve rises fast.";
  return { score: Math.min(100, score), band, blurb };
}

export function recommendations(history: Interview[], role?: string): string[] {
  const r = role ?? "your target role";
  if (!history.length) {
    return [
      "Run a 5-question mock to set your baseline.",
      "Prepare two stories you can reuse across behavioral questions.",
      "Practice out loud — reading answers hides pacing problems.",
    ];
  }
  const ranked = METRIC_KEYS.map((k) => ({ k, avg: metricAverage(history, k) })).sort(
    (a, b) => a.avg - b.avg,
  );
  const tips: Record<keyof Metric, string[]> = {
    clarity: [
      "Cap every sentence at about 15 words — one idea per sentence.",
      "Open each answer with a one-line headline before the detail.",
    ],
    structure: [
      "Force STAR on every behavioral answer: Situation, Task, Action, Result.",
      "Say the result first, then explain how you got there.",
    ],
    confidence: [
      "Remove hedges — 'I think', 'kinda', 'maybe' — and use ownership verbs.",
      "Slow down by 10%: pauses read as confidence, speed reads as nerves.",
    ],
    relevance: [
      `Mirror a keyword from the question in your first line — especially in ${r} interviews.`,
      "Add one number to every answer: %, hours saved, users, revenue.",
    ],
  };
  return [tips[ranked[0].k][0], tips[ranked[1].k][0], tips[ranked[0].k][1]];
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
  const improved = METRIC_KEYS
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

/* ---------- 5-day practice plan ---------- */

export type PlanDay = {
  day: number;
  title: string;
  focus: keyof Metric | "mixed";
  brief: string;
  drill: string;
};

const PLAN_TEMPLATES: Record<keyof Metric, Omit<PlanDay, "day">[]> = {
  confidence: [
    { title: "Confidence & ownership", focus: "confidence", brief: "Cut every hedge — 'I think', 'kinda', 'maybe'.", drill: "Re-record your weakest answer using only ownership verbs." },
    { title: "Leadership stories", focus: "confidence", brief: "Show decisions you owned and the people you moved.", drill: "3 leadership questions — each must name a decision you made alone." },
  ],
  structure: [
    { title: "Behavioral questions", focus: "structure", brief: "Force STAR on every behavioral answer today.", drill: "5 questions, label S/T/A/R out loud as you go." },
    { title: "Headline first", focus: "structure", brief: "Lead with the result, then explain.", drill: "Rewrite 3 past answers headline-first." },
  ],
  clarity: [
    { title: "Communication", focus: "clarity", brief: "Short sentences. One idea each. No 'and also'.", drill: "3 questions — cap every sentence at 15 words." },
    { title: "Cut the throat-clearing", focus: "clarity", brief: "Skip 'so basically', 'I guess what I mean'.", drill: "Re-do your weakest answer in under 60 seconds." },
  ],
  relevance: [
    { title: "Role-specific thinking", focus: "relevance", brief: "Answer the question that was asked — mirror its keywords.", drill: "5 role questions, write the keyword down before answering." },
    { title: "Anchor with metrics", focus: "relevance", brief: "Every answer needs one number.", drill: "3 answers — each with at least one %, $, or count." },
  ],
};

function roleThemeDay(role?: string): Omit<PlanDay, "day"> {
  const r = (role ?? "").toLowerCase();
  if (r.includes("product")) return { title: "Product thinking", focus: "relevance", brief: "Users, tradeoffs, metrics — in that order.", drill: "2 product-sense questions; end each with the metric you'd watch." };
  if (r.includes("engineer") || r.includes("developer") || r.includes("swe")) return { title: "Technical depth", focus: "relevance", brief: "Explain the tradeoff, not just the solution.", drill: "2 system/design questions; state one alternative you rejected and why." };
  if (r.includes("data")) return { title: "Analytical thinking", focus: "relevance", brief: "Define the metric before you analyse it.", drill: "2 case questions; name the data you'd pull first." };
  if (r.includes("design") || r.includes("ux")) return { title: "Design thinking", focus: "relevance", brief: "Problem → user → decision → outcome.", drill: "Walk through one case study in under 4 minutes." };
  if (r.includes("business") || r.includes("analyst")) return { title: "Business framing", focus: "relevance", brief: "Tie every answer to a business outcome.", drill: "2 stakeholder questions; quantify the impact in each." };
  return { title: "Role-specific thinking", focus: "relevance", brief: "Answer in the language of the job you want.", drill: "2 role questions; mirror a keyword from each question." };
}

export function buildPracticePlan(history: Interview[], role?: string): PlanDay[] {
  const ranked = history.length
    ? METRIC_KEYS.map((k) => ({ k, avg: metricAverage(history, k) }))
        .sort((a, b) => a.avg - b.avg)
        .map((x) => x.k)
    : (["structure", "clarity", "confidence", "relevance"] as (keyof Metric)[]);

  const top = ranked[0];
  const second = ranked[1];

  return [
    { day: 1, ...PLAN_TEMPLATES[top][0] },
    { day: 2, ...PLAN_TEMPLATES[second][0] },
    { day: 3, ...roleThemeDay(role) },
    { day: 4, ...PLAN_TEMPLATES[top][1] },
    {
      day: 5,
      title: "Full mock interview",
      focus: "mixed",
      brief: "Full 5-question mock — no theme, just performance.",
      drill: "Run a normal interview. Aim to beat your last score by 5.",
    },
  ];
}

/* ---------- plan completion tracking (localStorage) ---------- */

const PLAN_KEY = "hiremate.plan_progress";

export function planSignature(plan: PlanDay[]): string {
  return plan.map((d) => d.title).join("|");
}

type PlanProgress = { signature: string; done: number[] };

export function getPlanProgress(signature: string): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PlanProgress;
    return parsed.signature === signature && Array.isArray(parsed.done) ? parsed.done : [];
  } catch {
    return [];
  }
}

export function setPlanProgress(signature: string, done: number[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PLAN_KEY, JSON.stringify({ signature, done } satisfies PlanProgress));
}
