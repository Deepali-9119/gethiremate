import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { getHistory, weakAreas, type Interview, type Metric } from "@/lib/hiremate";
import {
  buildPracticePlan,
  doneToday,
  sessionsThisWeek,
  smartNudges,
  streakDays,
  WEEKLY_GOAL,
  type PlanDay,
} from "@/lib/habits";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Flame,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Check,
  Target,
  CalendarDays,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your dashboard — HireMate" },
      { name: "description", content: "Track your interview practice progress, streak, weak areas, and 5-day practice plan." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [history, setHistory] = useState<Interview[]>([]);
  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const empty = history.length === 0;
  const last = history[0];
  const prev = history[1];
  const trend = last && prev ? last.score - prev.score : 0;
  const weak = weakAreas(history);
  const avg =
    history.length > 0
      ? Math.round(history.reduce((s, h) => s + h.score, 0) / history.length)
      : 0;
  const streak = streakDays(history);
  const todayDone = doneToday(history);
  const week = sessionsThisWeek(history);
  const nudges = smartNudges(history);
  const plan = buildPracticePlan(history);
  const topWeak = weak[0];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="max-w-6xl mx-auto px-5 py-10">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Your progress</p>
            <h1 className="font-display text-4xl font-semibold">Dashboard</h1>
          </div>
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-3 text-sm font-medium hover:opacity-90 transition shadow-warm"
          >
            New mock interview <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {empty ? (
          <EmptyState />
        ) : (
          <>
            {/* Daily goal + streak strip */}
            <div className="grid lg:grid-cols-3 gap-4 mb-6">
              <DailyGoalCard done={todayDone} streak={streak} />
              <WeeklyGoalCard week={week} />
              <FocusCard weak={topWeak} />
            </div>

            {/* Smart nudges */}
            {nudges.length > 0 && (
              <div className="rounded-3xl bg-coral-soft/60 border border-coral/20 p-5 mb-10">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-coral" />
                  <span className="text-xs uppercase tracking-wider text-ink/70 font-medium">
                    Smart nudges
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {nudges.map((n, i) => (
                    <li key={i} className="text-sm text-ink leading-relaxed">
                      {n}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Top stats */}
            <div className="grid sm:grid-cols-3 gap-4 mb-10">
              <StatCard
                label="Sessions"
                value={String(history.length)}
                hint={history.length === 1 ? "First one — well done." : "Keep the chain alive."}
                icon={<Flame className="h-5 w-5 text-coral" />}
              />
              <StatCard
                label="Average score"
                value={`${avg}`}
                hint={
                  trend > 0
                    ? `▲ ${trend} pts vs last`
                    : trend < 0
                      ? `▼ ${Math.abs(trend)} pts vs last`
                      : "Steady."
                }
                icon={
                  trend >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-success" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-warn" />
                  )
                }
              />
              <StatCard
                label="Latest"
                value={`${last.score}`}
                hint={`${last.role} · ${new Date(last.date).toLocaleDateString()}`}
                icon={<Sparkles className="h-5 w-5 text-coral" />}
              />
            </div>

            {/* Trend + weak areas */}
            <div className="grid lg:grid-cols-3 gap-4 mb-10">
              <div className="rounded-3xl bg-card border border-border/70 p-6 lg:col-span-2">
                <h2 className="font-display text-xl font-semibold mb-1">Score over time</h2>
                <p className="text-xs text-muted-foreground mb-6">
                  Each bar is one mock interview, newest on the right.
                </p>
                <Sparkline history={history} />
              </div>
              <div className="rounded-3xl bg-card border border-border/70 p-6">
                <h2 className="font-display text-xl font-semibold mb-1">Where to focus</h2>
                <p className="text-xs text-muted-foreground mb-5">Your weakest areas across all sessions.</p>
                <ul className="space-y-3">
                  {weak.slice(0, 3).map((w) => (
                    <li key={w.key} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{w.key}</span>
                      <span
                        className={`text-sm font-semibold tabular-nums ${
                          w.avg >= 70 ? "text-success" : w.avg >= 55 ? "text-coral" : "text-warn"
                        }`}
                      >
                        {w.avg}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Practice plan */}
            <PracticePlan plan={plan} topWeak={topWeak?.key} />

            {/* History */}
            <div className="mt-10">
              <h2 className="font-display text-2xl font-semibold mb-4">Past interviews</h2>
              <div className="space-y-3">
                {history.map((h) => (
                  <Link
                    key={h.id}
                    to="/scorecard"
                    search={{ id: h.id }}
                    className="block rounded-2xl bg-card border border-border/70 p-5 hover:shadow-warm hover:border-coral/40 transition"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-display text-lg truncate">{h.role}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {h.level} · {new Date(h.date).toLocaleString()} · {h.qas.length} questions
                        </p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <div className="text-2xl font-display font-semibold tabular-nums">{h.score}</div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">/100</div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function DailyGoalCard({ done, streak }: { done: boolean; streak: number }) {
  return (
    <div className="rounded-3xl bg-card border border-border/70 p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">Today's goal</span>
        <Flame className={`h-5 w-5 ${streak > 0 ? "text-coral" : "text-muted-foreground"}`} />
      </div>
      <p className="font-display text-lg leading-snug mb-3">Complete 1 mock interview today</p>
      {done ? (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-success/15 text-success px-3 py-1 text-xs font-medium">
          <Check className="h-3.5 w-3.5" /> Done — {streak}-day streak
        </div>
      ) : (
        <Link
          to="/onboarding"
          className="inline-flex items-center gap-1.5 rounded-full bg-ink text-background px-3.5 py-1.5 text-xs font-medium hover:opacity-90 transition"
        >
          Start today's session <ArrowRight className="h-3 w-3" />
        </Link>
      )}
      {streak > 0 && !done && (
        <p className="text-xs text-muted-foreground mt-2">
          You're on a {streak}-day streak — don't drop it tonight.
        </p>
      )}
    </div>
  );
}

function WeeklyGoalCard({ week }: { week: number }) {
  const pct = Math.min(100, (week / WEEKLY_GOAL) * 100);
  return (
    <div className="rounded-3xl bg-card border border-border/70 p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">Weekly goal</span>
        <CalendarDays className="h-5 w-5 text-coral" />
      </div>
      <div className="flex items-baseline gap-1.5 mb-3">
        <span className="font-display text-3xl font-semibold tabular-nums">{week}</span>
        <span className="text-sm text-muted-foreground">/ {WEEKLY_GOAL} sessions</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden mb-2">
        <div
          className="h-full bg-coral transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {week >= WEEKLY_GOAL
          ? "Weekly goal hit. Bank an extra one if you're feeling sharp."
          : `${WEEKLY_GOAL - week} to go this week.`}
      </p>
    </div>
  );
}

function FocusCard({ weak }: { weak?: { key: keyof Metric; avg: number } }) {
  if (!weak) return null;
  return (
    <div className="rounded-3xl gradient-warm p-5 text-ink">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-ink/70">Top focus area</span>
        <Target className="h-5 w-5 text-ink" />
      </div>
      <p className="font-display text-2xl capitalize font-semibold mb-1">{weak.key} needs work</p>
      <p className="text-xs text-ink/80 mb-4">Currently averaging {weak.avg}/100.</p>
      <Link
        to="/onboarding"
        className="inline-flex items-center gap-1.5 rounded-full bg-ink text-background px-3.5 py-1.5 text-xs font-medium hover:opacity-90 transition"
      >
        Practice this next <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

function PracticePlan({ plan, topWeak }: { plan: PlanDay[]; topWeak?: keyof Metric }) {
  return (
    <div className="rounded-3xl bg-card border border-border/70 p-6">
      <div className="flex items-end justify-between flex-wrap gap-2 mb-1">
        <h2 className="font-display text-2xl font-semibold">Your 5-day practice plan</h2>
        <span className="text-xs text-muted-foreground">
          {topWeak ? `Built around your weakest area: ${topWeak}` : "A balanced starter plan"}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Twenty minutes a day. Five days. Real measurable lift.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {plan.map((d) => (
          <div
            key={d.day}
            className="rounded-2xl border border-border/70 bg-background p-4 hover:shadow-warm transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Day {d.day}
              </span>
              <span
                className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium ${
                  d.focus === "mixed"
                    ? "bg-secondary text-ink"
                    : "bg-coral-soft text-ink"
                }`}
              >
                {d.focus}
              </span>
            </div>
            <p className="font-display text-base leading-snug mb-2">{d.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">{d.brief}</p>
            <p className="text-xs leading-relaxed">
              <span className="text-coral font-medium">Drill: </span>
              {d.drill}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-end">
        <Link
          to="/onboarding"
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition"
        >
          Start day 1 <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[2rem] gradient-warm p-12 text-center">
      <h2 className="font-display text-3xl font-semibold text-ink mb-2">No sessions yet.</h2>
      <p className="text-ink/80 mb-6">Run your first mock interview — it takes about 10 minutes.</p>
      <Link
        to="/onboarding"
        className="inline-flex items-center gap-2 rounded-full bg-ink text-background px-6 py-3 text-sm font-medium hover:opacity-90 transition"
      >
        Start now <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-card border border-border/70 p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        {icon}
      </div>
      <div className="font-display text-4xl font-semibold tabular-nums">{value}</div>
      <p className="text-xs text-muted-foreground mt-1">{hint}</p>
    </div>
  );
}

function Sparkline({ history }: { history: Interview[] }) {
  const data = [...history].reverse();
  const max = 100;
  return (
    <div className="flex items-end gap-2 h-40">
      {data.map((h, i) => {
        const pct = (h.score / max) * 100;
        return (
          <div
            key={h.id}
            className="flex-1 flex flex-col items-center gap-2 group"
            title={`${h.role}: ${h.score}`}
          >
            <div className="w-full flex-1 flex items-end">
              <div
                className="w-full rounded-t-lg bg-coral/70 group-hover:bg-coral transition-all"
                style={{ height: `${pct}%`, minHeight: "8%" }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground tabular-nums">{i + 1}</span>
          </div>
        );
      })}
      {Array.from({ length: Math.max(0, 8 - data.length) }).map((_, i) => (
        <div key={`p-${i}`} className="flex-1 flex flex-col items-center gap-2 opacity-30">
          <div className="w-full flex-1 flex items-end">
            <div className="w-full rounded-t-lg bg-muted h-2" />
          </div>
          <span className="text-[10px] text-muted-foreground">·</span>
        </div>
      ))}
    </div>
  );
}
