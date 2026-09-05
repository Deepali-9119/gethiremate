import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { getHistory, getProfile, weakAreas, type Interview, type Metric, type Profile } from "@/lib/hiremate";
import { getSessions, type StoredSession } from "@/lib/sessions";
import {
  streakDays,
  questionsAnswered,
  totalPracticeMinutes,
  formatDuration,
  weeklySeries,
  monthlyStats,
  mostImprovedSkill,
  weakestSkill,
  metricAverage,
  metricSeries,
  metricTrend,
  readiness,
  buildPracticePlan,
  planSignature,
  getPlanProgress,
  setPlanProgress,
  METRIC_LABELS,
  WEEKLY_GOAL,
  type PlanDay,
} from "@/lib/habits";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Flame,
  TrendingUp,
  Trophy,
  Target,
  Sparkles,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Clock,
  MessageSquare,
  CheckCircle2,
  Circle,
  CalendarRange,
  Gauge,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your dashboard — HireMate" },
      { name: "description", content: "Track your interview prep progress: streak, average score, best score, and recent sessions." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [history, setHistory] = useState<Interview[]>([]);
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  useEffect(() => {
    setHistory(getHistory());
    setSessions(getSessions());
    setProfile(getProfile());
  }, []);

  const daysUntil = useMemo(() => {
    if (!profile?.interviewDate) return null;
    const target = new Date(profile.interviewDate + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000);
    return diff;
  }, [profile]);

  const empty = history.length === 0 && sessions.length === 0;

  const stats = useMemo(() => {
    if (!history.length) return { count: 0, avg: 0, best: 0, streak: 0 };
    const count = history.length;
    const avg = Math.round(history.reduce((s, h) => s + h.score, 0) / count);
    const best = Math.max(...history.map((h) => h.score));
    return { count, avg, best, streak: streakDays(history) };
  }, [history]);

  // Sessions are stored oldest → newest in "hiremate_sessions"
  const latestSession = sessions[sessions.length - 1];
  const previousSession = sessions[sessions.length - 2];
  const scoreDelta =
    latestSession && previousSession
      ? latestSession.overall_score - previousSession.overall_score
      : null;

  const weak = weakAreas(history);
  const topWeak = weak[0];
  const practiceMinutes = useMemo(() => totalPracticeMinutes(history), [history]);
  const month = useMemo(() => monthlyStats(history), [history]);
  const improved = useMemo(() => mostImprovedSkill(history), [history]);
  const weakest = useMemo(() => weakestSkill(history), [history]);
  const ready = useMemo(() => readiness(history), [history]);

  // Chronological for the chart (oldest → newest)
  const chartData = useMemo(() => [...history].reverse(), [history]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="max-w-6xl mx-auto px-5 py-10">
        {/* Welcome */}
        <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-tight">
              Welcome <span className="inline-block">👋</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's your interview prep progress
            </p>
          </div>
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-3 text-sm font-medium hover:opacity-90 transition shadow-warm"
          >
            Start new interview <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {daysUntil !== null && daysUntil >= 0 && (
          <div className="mb-8 rounded-3xl gradient-warm p-6 sm:p-7 relative overflow-hidden">
            <div className="absolute inset-0 bg-grain opacity-40" />
            <div className="relative flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-ink/10 flex items-center justify-center">
                  <CalendarDays className="h-5 w-5 text-ink" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-ink/60 font-semibold">
                    Your interview
                  </p>
                  <p className="font-display text-2xl sm:text-3xl font-semibold text-ink leading-tight">
                    {daysUntil === 0
                      ? "It's today — you've got this."
                      : daysUntil === 1
                      ? "Tomorrow. One more focused rep?"
                      : `In ${daysUntil} days`}
                  </p>
                </div>
              </div>
              <Link
                to="/onboarding"
                className="inline-flex items-center gap-2 rounded-full bg-ink text-background px-5 py-3 text-sm font-medium hover:opacity-90 transition"
              >
                Practice now <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {empty ? (
          <EmptyState />
        ) : (
          <>
            {/* Stats overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <StatCard
                icon={<Flame className="h-5 w-5 text-coral" />}
                value={String(stats.streak)}
                label="Practice streak"
                hint={stats.streak === 1 ? "1 day in a row" : `${stats.streak} days in a row`}
              />
              <StatCard
                icon={<MessageSquare className="h-5 w-5 text-coral" />}
                value={String(questionsAnswered(history))}
                label="Questions answered"
              />
              <StatCard
                icon={<TrendingUp className="h-5 w-5 text-coral" />}
                value={`${stats.avg}`}
                suffix="/100"
                label="Average interview score"
              />
              <StatCard
                icon={<Clock className="h-5 w-5 text-coral" />}
                value={practiceMinutes === null ? "—" : `${practiceMinutes}`}
                suffix={practiceMinutes === null ? undefined : " min"}
                label="Time practiced"
                hint={practiceMinutes === null ? "Tracked from your next session" : undefined}
              />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              <StatCard
                icon={<Trophy className="h-5 w-5 text-coral" />}
                value={String(stats.count)}
                label="Interviews completed"
              />
              <StatCard
                icon={<Star className="h-5 w-5 text-coral" />}
                value={`${stats.best}`}
                suffix="/100"
                label="Best score"
              />
              <StatCard
                icon={<Gauge className="h-5 w-5 text-coral" />}
                value={`${ready.score}`}
                suffix="/100"
                label="Interview readiness"
                hint={ready.band}
              />
              <StatCard
                icon={<CalendarRange className="h-5 w-5 text-coral" />}
                value={`${month.sessions}`}
                label="Sessions this month"
                hint={month.prevSessions ? `${month.prevSessions} last month` : "First month of practice"}
              />
            </div>

            {/* Skill trends */}
            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              <TrendCard title="Confidence trend" metric="confidence" history={history} />
              <TrendCard title="Structure trend" metric="structure" history={history} />
            </div>

            {/* Most improved / weakest */}
            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              <SkillCard
                kind="improved"
                label="Most improved skill"
                name={improved ? METRIC_LABELS[improved.key] : "—"}
                value={improved ? improved.avg : 0}
                delta={improved ? improved.delta : null}
              />
              <SkillCard
                kind="weak"
                label="Weakest skill"
                name={weakest ? METRIC_LABELS[weakest.key] : "—"}
                value={weakest ? weakest.avg : 0}
                delta={null}
              />
            </div>

            {/* Weekly + monthly progress */}
            <div className="grid lg:grid-cols-2 gap-4 mb-10">
              <WeeklyProgress history={history} />
              <MonthlyProgress month={month} />
            </div>

            {/* Progress snapshot — latest vs previous session */}
            {latestSession && (
              <ProgressSnapshot
                latest={latestSession}
                previous={previousSession}
                delta={scoreDelta}
                total={sessions.length}
              />
            )}

            {/* Score trend */}
            <section className="rounded-3xl bg-card border border-border/70 p-6 sm:p-8 mb-10">
              <div className="flex items-end justify-between flex-wrap gap-2 mb-5">
                <div>
                  <h2 className="font-display text-2xl font-semibold">Your score over time</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Each dot is one mock interview, oldest on the left.
                  </p>
                </div>
                {stats.best > 0 && (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-coral-soft px-3 py-1 text-xs font-medium text-ink">
                    <Star className="h-3.5 w-3.5 text-coral" />
                    Personal best: {stats.best}
                  </div>
                )}
              </div>
              <LineChart data={chartData} best={stats.best} />
            </section>

            {/* Interview history */}
            <section className="mb-10">
              <div className="flex items-end justify-between mb-4">
                <h2 className="font-display text-2xl font-semibold">Interview history</h2>
                <span className="text-xs text-muted-foreground">
                  {history.length} session{history.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="rounded-3xl bg-card border border-border/70 overflow-hidden">
                {history.map((h, i) => (
                  <div
                    key={h.id}
                    className={`flex items-center justify-between gap-4 p-5 ${
                      i < history.length - 1 ? "border-b border-border/60" : ""
                    } hover:bg-secondary/40 transition`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        {new Date(h.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {typeof h.durationSec === "number" && ` · ${formatDuration(h.durationSec)}`}
                        {` · ${h.qas.length} question${h.qas.length === 1 ? "" : "s"}`}
                      </p>
                      <p className="font-display text-base sm:text-lg truncate">{h.role}</p>
                    </div>
                    <div className="flex items-center gap-5 shrink-0">
                      <div className="text-right">
                        <div className="font-display text-2xl font-semibold tabular-nums">
                          {h.score}
                          <span className="text-sm text-muted-foreground font-normal">/100</span>
                        </div>
                      </div>
                      <Link
                        to="/scorecard"
                        search={{ id: h.id }}
                        className="text-sm font-medium text-coral hover:underline inline-flex items-center gap-1"
                      >
                        Review <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 5-day practice plan */}
            <PracticePlan history={history} role={history[0]?.role ?? profile?.role} />

            {/* Suggestion */}
            <SuggestionCard topWeak={topWeak} latestRole={history[0]?.role} />

            {/* Session history (from hiremate_sessions) */}
            {sessions.length > 0 && <SessionHistory sessions={sessions} />}

            {/* Bottom CTA */}
            <div className="mt-10 flex justify-center">
              <Link
                to="/onboarding"
                className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-7 py-3.5 text-sm font-semibold hover:opacity-90 transition shadow-warm"
              >
                Start new interview <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({
  icon,
  value,
  suffix,
  label,
  hint,
}: {
  icon: React.ReactNode;
  value: string;
  suffix?: string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="rounded-3xl bg-peach border border-coral/20 p-5 relative overflow-hidden">
      <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-coral/10 blur-xl pointer-events-none" />
      <div className="relative">
        <div className="h-9 w-9 rounded-full bg-background/70 grid place-items-center mb-4">
          {icon}
        </div>
        <div className="font-display text-4xl font-semibold tabular-nums leading-none text-ink">
          {value}
          {suffix && <span className="text-lg text-ink/60 font-normal">{suffix}</span>}
        </div>
        <p className="text-xs sm:text-sm text-ink/70 mt-2 font-medium">{label}</p>
        {hint && <p className="text-[11px] text-ink/55 mt-0.5">{hint}</p>}
      </div>
    </div>
  );
}

function LineChart({ data, best }: { data: Interview[]; best: number }) {
  if (!data.length) return null;

  const W = 800;
  const H = 220;
  const PAD_X = 40;
  const PAD_Y = 30;
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_Y * 2;

  const n = data.length;
  const xFor = (i: number) => PAD_X + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const yFor = (score: number) => PAD_Y + innerH - (score / 100) * innerH;

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(d.score)}`)
    .join(" ");

  const areaPath =
    `M ${xFor(0)} ${PAD_Y + innerH} ` +
    data.map((d, i) => `L ${xFor(i)} ${yFor(d.score)}`).join(" ") +
    ` L ${xFor(n - 1)} ${PAD_Y + innerH} Z`;

  const yTicks = [0, 25, 50, 75, 100];

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H + 30}`}
        className="w-full min-w-[480px]"
        preserveAspectRatio="none"
        role="img"
        aria-label="Score trend over recent sessions"
      >
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-coral)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--color-coral)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* gridlines */}
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={PAD_X}
              x2={W - PAD_X}
              y1={yFor(t)}
              y2={yFor(t)}
              stroke="var(--color-border)"
              strokeDasharray="3 4"
              strokeWidth={1}
            />
            <text
              x={PAD_X - 8}
              y={yFor(t) + 4}
              textAnchor="end"
              className="fill-muted-foreground"
              style={{ fontSize: 11 }}
            >
              {t}
            </text>
          </g>
        ))}

        {/* area */}
        <path d={areaPath} fill="url(#areaGrad)" />
        {/* line */}
        <path
          d={linePath}
          fill="none"
          stroke="var(--color-coral)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* points + labels */}
        {data.map((d, i) => {
          const cx = xFor(i);
          const cy = yFor(d.score);
          const isBest = d.score === best;
          return (
            <g key={d.id}>
              {isBest && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={11}
                  fill="var(--color-coral)"
                  fillOpacity="0.18"
                />
              )}
              <circle
                cx={cx}
                cy={cy}
                r={isBest ? 6 : 5}
                fill="var(--color-background)"
                stroke="var(--color-coral)"
                strokeWidth={isBest ? 3 : 2}
              />
              <text
                x={cx}
                y={cy - 14}
                textAnchor="middle"
                className="fill-foreground"
                style={{ fontSize: 12, fontWeight: 600 }}
              >
                {d.score}
              </text>
              <text
                x={cx}
                y={H + 18}
                textAnchor="middle"
                className="fill-muted-foreground"
                style={{ fontSize: 11 }}
              >
                Session {i + 1}
              </text>
              {isBest && (
                <text
                  x={cx}
                  y={H + 32}
                  textAnchor="middle"
                  className="fill-coral"
                  style={{ fontSize: 10, fontWeight: 600 }}
                >
                  ★ personal best
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function SuggestionCard({
  topWeak,
  latestRole,
}: {
  topWeak?: { key: keyof Metric; avg: number };
  latestRole?: string;
}) {
  const role = latestRole ?? "your role";
  const text = topWeak
    ? `Try a ${topWeak.key === "structure" ? "behavioral" : topWeak.key === "confidence" ? "behavioral" : topWeak.key === "relevance" ? "role-specific" : "behavioral"} question round to sharpen ${topWeak.key} for ${role} interviews.`
    : `Try a behavioral question round for ${role} interviews.`;

  return (
    <section className="rounded-3xl gradient-warm border border-coral/20 p-6 sm:p-7 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-coral/15 blur-3xl pointer-events-none" />
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 justify-between">
        <div className="flex gap-4 items-start sm:items-center">
          <span className="h-10 w-10 rounded-full bg-ink text-background grid place-items-center shrink-0 shadow-warm">
            <Target className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-ink/70 font-semibold mb-1">
              🎯 Suggested next
            </p>
            <p className="font-display text-lg sm:text-xl text-ink leading-snug">
              {text}
            </p>
          </div>
        </div>
        <Link
          to="/onboarding"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-ink text-background px-5 py-3 text-sm font-medium hover:opacity-90 transition shadow-warm shrink-0"
        >
          Start session <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[2rem] gradient-warm p-12 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-grain opacity-40 pointer-events-none" />
      <div className="relative">
        <Sparkles className="h-7 w-7 text-coral mx-auto mb-3" />
        <h2 className="font-display text-3xl font-semibold text-ink mb-2">
          No interview sessions yet.
        </h2>
        <p className="text-ink/80 mb-6">Start your first mock interview — it takes about 10 minutes.</p>
        <Link
          to="/onboarding"
          className="inline-flex items-center gap-2 rounded-full bg-ink text-background px-6 py-3 text-sm font-medium hover:opacity-90 transition"
        >
          Start now <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function ProgressSnapshot({
  latest,
  previous,
  delta,
  total,
}: {
  latest: StoredSession;
  previous?: StoredSession;
  delta: number | null;
  total: number;
}) {
  const trend =
    delta === null ? "neutral" : delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const TrendIcon =
    trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  const trendColor =
    trend === "up"
      ? "text-emerald-600 bg-emerald-50 border-emerald-200"
      : trend === "down"
        ? "text-coral bg-coral-soft border-coral/20"
        : "text-muted-foreground bg-secondary border-border/60";
  const trendLabel =
    delta === null
      ? "First session"
      : delta > 0
        ? `+${delta} pts vs previous`
        : delta < 0
          ? `${delta} pts vs previous`
          : "No change vs previous";

  return (
    <section className="rounded-3xl bg-card border border-border/70 p-6 sm:p-7 mb-10">
      <div className="flex items-end justify-between flex-wrap gap-2 mb-5">
        <div>
          <h2 className="font-display text-2xl font-semibold">Progress snapshot</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} interview{total === 1 ? "" : "s"} saved on this device.
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${trendColor}`}
        >
          <TrendIcon className="h-3.5 w-3.5" />
          {trendLabel}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SnapshotTile label="Latest session" session={latest} accent />
        {previous ? (
          <SnapshotTile label="Previous session" session={previous} />
        ) : (
          <div className="rounded-2xl border border-dashed border-border/70 p-5 grid place-items-center text-center text-sm text-muted-foreground">
            Run another interview to compare your progress.
          </div>
        )}
      </div>
    </section>
  );
}

function SnapshotTile({
  label,
  session,
  accent,
}: {
  label: string;
  session: StoredSession;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 border ${
        accent ? "bg-peach border-coral/20" : "bg-secondary/40 border-border/60"
      }`}
    >
      <p className="text-[11px] uppercase tracking-[0.16em] text-ink/60 font-semibold mb-2">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-4xl font-semibold tabular-nums text-ink">
          {session.overall_score}
        </span>
        <span className="text-sm text-ink/60">/100</span>
      </div>
      <p className="text-sm text-ink/80 mt-1 truncate">{session.role}</p>
      <p className="text-xs text-ink/55 mt-0.5">
        {new Date(session.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </p>
    </div>
  );
}

function SessionHistory({ sessions }: { sessions: StoredSession[] }) {
  // Newest first for the list
  const ordered = [...sessions].reverse();
  return (
    <section className="mt-10">
      <div className="flex items-end justify-between mb-4">
        <h2 className="font-display text-2xl font-semibold">Session history</h2>
        <span className="text-xs text-muted-foreground">
          {sessions.length} total
        </span>
      </div>
      <ol className="rounded-3xl bg-card border border-border/70 overflow-hidden">
        {ordered.map((s, i) => {
          const sessionNumber = sessions.length - i;
          return (
            <li
              key={s.id}
              className={`flex items-center justify-between gap-4 p-4 sm:p-5 ${
                i < ordered.length - 1 ? "border-b border-border/60" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">
                  Session {sessionNumber} — {s.role}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(s.date).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="font-display text-lg font-semibold tabular-nums shrink-0">
                Score: {s.overall_score}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ---------- coaching hub bits ---------- */

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) {
    return <div className="h-12 grid place-items-center text-xs text-muted-foreground">Two sessions needed for a trend</div>;
  }
  const W = 240;
  const H = 48;
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 100);
  const x = (i: number) => (i / (values.length - 1)) * W;
  const y = (v: number) => H - ((v - min) / Math.max(1, max - min)) * H;
  const d = values.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-12" preserveAspectRatio="none" role="img" aria-label="Skill trend">
      <path d={d} fill="none" stroke="var(--color-coral)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r={3.5} fill="var(--color-coral)" />
    </svg>
  );
}

function TrendCard({
  title,
  metric,
  history,
}: {
  title: string;
  metric: keyof Metric;
  history: Interview[];
}) {
  const avg = metricAverage(history, metric);
  const trend = metricTrend(history, metric);
  const delta = trend?.delta ?? null;
  return (
    <div className="rounded-3xl bg-card border border-border/70 p-6">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">{title}</p>
          <p className="font-display text-3xl font-semibold tabular-nums mt-1">
            {avg}
            <span className="text-base text-muted-foreground font-normal">/100</span>
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
            delta === null
              ? "text-muted-foreground bg-secondary border-border/60"
              : delta > 0
                ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                : delta < 0
                  ? "text-coral bg-coral-soft border-coral/20"
                  : "text-muted-foreground bg-secondary border-border/60"
          }`}
        >
          {delta === null ? <Minus className="h-3.5 w-3.5" /> : delta > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : delta < 0 ? <ArrowDownRight className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
          {delta === null ? "New" : delta > 0 ? `+${delta} since you started` : delta < 0 ? `${delta} since you started` : "Holding steady"}
        </span>
      </div>
      <Sparkline values={metricSeries(history, metric)} />
    </div>
  );
}

function SkillCard({
  kind,
  label,
  name,
  value,
  delta,
}: {
  kind: "improved" | "weak";
  label: string;
  name: string;
  value: number;
  delta: number | null;
}) {
  const improved = kind === "improved";
  return (
    <div
      className={`rounded-3xl border p-6 ${
        improved ? "bg-success/5 border-success/30" : "bg-warn/5 border-warn/40"
      }`}
    >
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold mb-1">{label}</p>
      <p className="font-display text-2xl font-semibold">{name}</p>
      <p className="text-sm text-muted-foreground mt-1">
        Averaging {value}/100
        {delta !== null && delta > 0 ? ` · up ${delta} points` : ""}
      </p>
      <div className="h-2.5 rounded-full bg-secondary overflow-hidden mt-4">
        <div
          className={`h-full rounded-full ${improved ? "bg-success" : "bg-warn"}`}
          style={{ width: `${Math.max(4, Math.min(100, value))}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        {improved
          ? "Keep leaning on this — it's your fastest-moving skill."
          : "This is where your next few sessions should focus."}
      </p>
    </div>
  );
}

function WeeklyProgress({ history }: { history: Interview[] }) {
  const series = weeklySeries(history);
  const done = series.reduce((s, d) => s + d.count, 0);
  const max = Math.max(1, ...series.map((d) => d.count));
  const pct = Math.min(100, Math.round((done / WEEKLY_GOAL) * 100));
  return (
    <section className="rounded-3xl bg-card border border-border/70 p-6">
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <h2 className="font-display text-xl font-semibold">Weekly progress</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Last 7 days of practice.</p>
        </div>
        <span className="text-sm font-semibold tabular-nums">
          {done}<span className="text-muted-foreground font-normal">/{WEEKLY_GOAL}</span>
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-secondary overflow-hidden mb-5">
        <div className="h-full bg-coral rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-end justify-between gap-2 h-24">
        {series.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
            <div
              className={`w-full rounded-lg ${d.count ? "bg-coral" : "bg-secondary"}`}
              style={{ height: `${d.count ? Math.max(14, (d.count / max) * 70) : 6}px` }}
              title={`${d.count} session${d.count === 1 ? "" : "s"}`}
            />
            <span className="text-[11px] text-muted-foreground">{d.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function MonthlyProgress({ month }: { month: ReturnType<typeof monthlyStats> }) {
  const sessionDelta = month.sessions - month.prevSessions;
  const avgDelta = month.prevAvg ? month.avg - month.prevAvg : null;
  return (
    <section className="rounded-3xl bg-card border border-border/70 p-6">
      <h2 className="font-display text-xl font-semibold">Monthly progress</h2>
      <p className="text-sm text-muted-foreground mt-0.5 mb-5">This month compared with last.</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-secondary/40 border border-border/60 p-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold mb-2">Sessions</p>
          <p className="font-display text-3xl font-semibold tabular-nums">{month.sessions}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {month.prevSessions ? `${sessionDelta >= 0 ? "+" : ""}${sessionDelta} vs last month` : "No sessions last month"}
          </p>
        </div>
        <div className="rounded-2xl bg-secondary/40 border border-border/60 p-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold mb-2">Average score</p>
          <p className="font-display text-3xl font-semibold tabular-nums">
            {month.avg || "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {avgDelta === null ? "No comparison yet" : `${avgDelta >= 0 ? "+" : ""}${avgDelta} vs last month`}
          </p>
        </div>
      </div>
    </section>
  );
}

function PracticePlan({ history, role }: { history: Interview[]; role?: string }) {
  const plan = useMemo(() => buildPracticePlan(history, role), [history, role]);
  const signature = useMemo(() => planSignature(plan), [plan]);
  const [done, setDone] = useState<number[]>([]);

  useEffect(() => {
    setDone(getPlanProgress(signature));
  }, [signature]);

  const toggle = (day: number) => {
    setDone((prev) => {
      const next = prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day];
      setPlanProgress(signature, next);
      return next;
    });
  };

  const reset = () => {
    setDone([]);
    setPlanProgress(signature, []);
  };

  const pct = Math.round((done.length / plan.length) * 100);

  return (
    <section className="mt-10 rounded-3xl bg-card border border-border/70 p-6 sm:p-8">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="font-display text-2xl font-semibold">Your 5-day practice plan</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Built around your weakest skills. Tick each day as you finish it.
          </p>
        </div>
        <div className="text-sm font-semibold tabular-nums">
          {done.length} of {plan.length} done
          {done.length === plan.length && (
            <button onClick={reset} className="ml-3 text-xs font-medium text-coral hover:underline">
              Start a new plan
            </button>
          )}
        </div>
      </div>
      <div className="h-2.5 rounded-full bg-secondary overflow-hidden mb-6">
        <div className="h-full bg-coral rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>

      <ol className="grid md:grid-cols-2 gap-4">
        {plan.map((d: PlanDay) => {
          const isDone = done.includes(d.day);
          return (
            <li
              key={d.day}
              className={`rounded-2xl border p-5 transition ${
                isDone ? "bg-success/5 border-success/30" : "bg-peach border-coral/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggle(d.day)}
                  aria-pressed={isDone}
                  aria-label={`Mark day ${d.day} ${isDone ? "not done" : "done"}`}
                  className="mt-0.5 shrink-0"
                >
                  {isDone ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <Circle className="h-5 w-5 text-ink/40" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-ink/60 font-semibold">
                    Day {d.day}
                  </p>
                  <p className={`font-display text-lg text-ink leading-snug ${isDone ? "line-through opacity-70" : ""}`}>
                    {d.title}
                  </p>
                  <p className="text-sm text-ink/75 mt-1">{d.brief}</p>
                  <p className="text-xs text-ink/60 mt-2">Drill: {d.drill}</p>
                  <Link
                    to="/onboarding"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-coral hover:underline"
                  >
                    Start this session <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
