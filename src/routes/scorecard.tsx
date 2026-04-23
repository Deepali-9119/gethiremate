import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { getHistory, type Interview } from "@/lib/hiremate";
import { ArrowRight, Check, Sparkles, Share2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/scorecard")({
  validateSearch: (s: Record<string, unknown>) => ({ id: (s.id as string) ?? "" }),
  head: () => ({
    meta: [
      { title: "Your scorecard — HireMate" },
      { name: "description", content: "See your interview score, what worked, and exactly what to improve next." },
    ],
  }),
  component: Scorecard,
});

function Scorecard() {
  const { id } = Route.useSearch();
  const [interview, setInterview] = useState<Interview | null>(null);

  useEffect(() => {
    const found = getHistory().find((i) => i.id === id) ?? getHistory()[0] ?? null;
    setInterview(found);
  }, [id]);

  const fillerCount = useMemo(() => {
    if (!interview) return 0;
    const re = /\b(um|uh|like|you know|kinda|sort of|i think|i guess|maybe|basically|literally|actually)\b/gi;
    return interview.qas.reduce((n, qa) => n + (qa.answer.match(re)?.length ?? 0), 0);
  }, [interview]);

  if (!interview) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="max-w-2xl mx-auto px-5 py-20 text-center">
          <p className="text-muted-foreground">No interview found.</p>
          <Link to="/onboarding" className="text-coral underline mt-2 inline-block">
            Start one now
          </Link>
        </main>
      </div>
    );
  }

  const verdict =
    interview.score >= 85
      ? "Hire-ready — keep this energy."
      : interview.score >= 70
        ? "Strong session. A few tweaks and you're there."
        : "Great base to build on. Let's level up together.";

  const wins = topWins(interview);
  const improvements = topImprovements(interview, fillerCount);
  const focus = focusForNext(interview);

  const handleShare = async () => {
    const text = `I scored ${interview.score}/100 on a HireMate mock interview 🎯 — practicing my way to the offer.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "HireMate scorecard", text, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
        toast.success("Scorecard copied — paste anywhere.");
      }
    } catch {
      // user cancelled
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-5 py-10 sm:py-14">
        {/* Hero — overall score with ring */}
        <section className="rounded-[2rem] border border-border/70 bg-card p-7 sm:p-12 relative overflow-hidden text-center">
          <div className="absolute inset-0 bg-grain opacity-50 pointer-events-none" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1">
              Session complete
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold mb-8">
              Here's your scorecard
            </h1>

            <ScoreRing score={interview.score} />

            <p className="mt-6 text-base sm:text-lg text-foreground/80 max-w-md mx-auto text-balance">
              {verdict}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {new Date(interview.date).toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}{" "}
              · {interview.level} · {interview.role}
            </p>
          </div>
        </section>

        {/* Breakdown */}
        <section className="mt-8 rounded-3xl border border-border/70 bg-card p-6 sm:p-8">
          <h2 className="font-display text-xl sm:text-2xl font-semibold mb-1">Breakdown</h2>
          <p className="text-sm text-muted-foreground mb-6">How each dimension landed.</p>
          <div className="space-y-5">
            <ScoreRow label="Clarity" value={interview.overall.clarity} />
            <ScoreRow label="Structure" value={interview.overall.structure} />
            <ScoreRow label="Confidence" value={interview.overall.confidence} />
            <ScoreRow label="Relevance" value={interview.overall.relevance} />
          </div>
        </section>

        {/* Two-up: wins + improvements */}
        <section className="mt-6 grid md:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-success/30 bg-success/5 p-6 sm:p-7">
            <h2 className="font-display text-xl font-semibold mb-1">What you did well</h2>
            <p className="text-xs text-muted-foreground mb-5">Lean into these.</p>
            <ul className="space-y-3">
              {wins.map((w, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="mt-0.5 h-6 w-6 rounded-full bg-success/15 grid place-items-center shrink-0">
                    <Check className="h-3.5 w-3.5 text-success" strokeWidth={3} />
                  </span>
                  <span className="text-sm leading-relaxed">{w}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-warn/40 bg-warn/5 p-6 sm:p-7">
            <h2 className="font-display text-xl font-semibold mb-1">Where to improve</h2>
            <p className="text-xs text-muted-foreground mb-5">Small shifts, big lift.</p>
            <ul className="space-y-3">
              {improvements.map((w, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-warn shrink-0" />
                  <span className="text-sm leading-relaxed">{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Focus next session */}
        <section className="mt-6 rounded-3xl gradient-warm border border-coral/20 p-6 sm:p-7 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-coral/15 blur-2xl" />
          <div className="relative flex gap-4 items-start">
            <span className="h-10 w-10 rounded-full bg-ink text-background grid place-items-center shrink-0 shadow-warm">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-ink/70 font-semibold mb-1">
                Focus for next session
              </p>
              <p className="font-display text-lg sm:text-xl text-ink leading-snug">
                {focus}
              </p>
            </div>
          </div>
        </section>

        {/* Per-question (kept, secondary) */}
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold mb-3">Per-question detail</h2>
          <div className="space-y-3">
            {interview.qas.map((qa, i) => (
              <details
                key={qa.id}
                className="group rounded-2xl bg-card border border-border/70 overflow-hidden"
              >
                <summary className="cursor-pointer p-4 sm:p-5 flex items-start justify-between gap-4 list-none">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                      Q{i + 1} · {qa.difficulty}
                    </div>
                    <p className="font-display text-base sm:text-lg leading-snug">{qa.question}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl font-display font-semibold tabular-nums">
                      {Math.round(
                        (qa.metrics.clarity + qa.metrics.structure + qa.metrics.confidence + qa.metrics.relevance) /
                          4,
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 inline text-muted-foreground group-open:rotate-90 transition" />
                  </div>
                </summary>
                <div className="px-4 sm:px-5 pb-5 space-y-4 border-t border-border/60 pt-4">
                  <p className="text-sm">
                    <span className="text-success font-medium">What worked: </span>
                    {qa.highlight}
                  </p>
                  <p className="text-sm">
                    <span className="text-coral font-medium">Try next time: </span>
                    {qa.improve}
                  </p>
                  <div className="rounded-2xl bg-coral-soft/60 border border-coral/20 p-4">
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-ink text-background font-semibold">
                      Top candidate answer
                    </span>
                    <p className="mt-2 text-sm leading-relaxed font-display text-ink/90">
                      {qa.improvedAnswer}
                    </p>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* CTAs */}
        <section className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link
            to="/onboarding"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-ink text-background px-7 py-3.5 text-sm font-semibold hover:opacity-90 transition shadow-warm"
          >
            Practice again
          </Link>
          <button
            onClick={handleShare}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-7 py-3.5 text-sm font-semibold hover:bg-secondary transition"
          >
            <Share2 className="h-4 w-4" /> Share scorecard
          </button>
          <Link
            to="/dashboard"
            className="text-sm font-medium text-muted-foreground hover:text-foreground underline underline-offset-4 px-2 py-2"
          >
            View dashboard
          </Link>
        </section>
      </main>
    </div>
  );
}

/* ---------- bits ---------- */

function ScoreRing({ score }: { score: number }) {
  const size = 200;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, score)) / 100) * c;

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--color-secondary)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--color-coral)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="font-display text-6xl font-semibold leading-none tabular-nums">
            {score}
          </div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground mt-2">
            out of 100
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  // Convert 0–100 → x/10
  const tenth = Math.round(value / 10);
  const tone =
    value >= 80 ? "bg-success" : value >= 60 ? "bg-coral" : "bg-warn";
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-semibold tabular-nums">
          {tenth}<span className="text-muted-foreground font-normal">/10</span>
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full ${tone} rounded-full transition-all duration-700`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

/* ---------- copy generation ---------- */

function topWins(i: Interview): string[] {
  const m = i.overall;
  const ranked = (Object.entries(m) as [keyof typeof m, number][]).sort((a, b) => b[1] - a[1]);
  const wins: Record<string, string> = {
    clarity: "Strong opening with context — interviewers could follow without re-reading.",
    structure: "Good narrative arc — your answers had a real beginning, middle, and end.",
    confidence: "Confident closing statements — you owned your decisions and outcomes.",
    relevance: "Good use of metrics and specifics in your answers.",
  };
  return ranked.slice(0, 3).map(([k]) => wins[k]);
}

function topImprovements(i: Interview, fillers: number): string[] {
  const m = i.overall;
  const ranked = (Object.entries(m) as [keyof typeof m, number][]).sort((a, b) => a[1] - b[1]);
  const tips: Record<string, string> = {
    clarity: "Tighten your sentences — one idea per sentence keeps interviewers locked in.",
    structure: "Structure your answers using the STAR format (Situation → Task → Action → Result).",
    confidence: `Reduce filler words${fillers > 0 ? ` — you used ${fillers} in this session` : ""}.`,
    relevance: "Add more specificity to your examples — names, numbers, outcomes.",
  };
  return ranked.slice(0, 3).map(([k]) => tips[k]);
}

function focusForNext(i: Interview): string {
  const m = i.overall;
  const weakest = (Object.entries(m) as [keyof typeof m, number][]).sort((a, b) => a[1] - b[1])[0][0];
  const map: Record<string, string> = {
    clarity: "Practice structuring answers under 2 minutes — clear, paced, no detours.",
    structure: "Run 3 STAR-format reps tomorrow — Situation, Task, Action, Result.",
    confidence: "Record yourself once and cut every hedge ('I think', 'kinda', 'maybe').",
    relevance: "Open every answer by mirroring two keywords from the question.",
  };
  return map[weakest];
}
