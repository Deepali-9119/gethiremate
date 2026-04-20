import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { getHistory, type Interview } from "@/lib/hiremate";
import { MetricBar } from "@/components/MetricBar";
import { ArrowRight, RotateCcw, LayoutDashboard } from "lucide-react";
import { useEffect, useState } from "react";

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
      ? { label: "Hire-ready", tone: "text-success" }
      : interview.score >= 70
        ? { label: "Strong, with sharpening to do", tone: "text-coral" }
        : { label: "Good base — let's level it up", tone: "text-warn" };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="max-w-4xl mx-auto px-5 py-10">
        {/* Hero */}
        <div className="rounded-[2rem] border border-border/70 bg-card p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-grain opacity-50 pointer-events-none" />
          <div className="relative">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              {new Date(interview.date).toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}{" "}
              · {interview.level} · {interview.role}
            </p>
            <h1 className="font-display text-5xl sm:text-6xl font-semibold leading-none">
              {interview.score}
              <span className="text-2xl text-muted-foreground">/100</span>
            </h1>
            <p className={`mt-3 text-lg font-medium ${verdict.tone}`}>{verdict.label}</p>

            <div className="mt-8 grid sm:grid-cols-4 gap-5 max-w-2xl">
              <MetricBar label="Clarity" value={interview.overall.clarity} />
              <MetricBar label="Structure" value={interview.overall.structure} />
              <MetricBar label="Confidence" value={interview.overall.confidence} />
              <MetricBar label="Relevance" value={interview.overall.relevance} />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/onboarding"
                className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-3 text-sm font-medium hover:opacity-90 transition shadow-warm"
              >
                <RotateCcw className="h-4 w-4" /> Run it again
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-sm font-medium hover:bg-secondary transition"
              >
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Strengths + Improvements */}
        <div className="mt-10 grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="font-display text-2xl font-semibold mb-1">Top 3 strengths</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Lean into these — they're already landing.
            </p>
            <div className="space-y-3">
              {topStrengths(interview).map((tip, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-card border border-border/70 p-5 hover:shadow-warm transition flex gap-4"
                >
                  <div className="text-2xl font-display text-success shrink-0">{i + 1}</div>
                  <p className="text-sm leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold mb-1">Top 3 to improve</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Specific, doable, and based on what you actually said.
            </p>
            <div className="space-y-3">
              {topInsights(interview).map((tip, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-card border border-border/70 p-5 hover:shadow-warm transition flex gap-4"
                >
                  <div className="text-2xl font-display text-coral shrink-0">{i + 1}</div>
                  <p className="text-sm leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Per-question breakdown */}
        <div className="mt-10">
          <h2 className="font-display text-2xl font-semibold mb-4">Per-question breakdown</h2>
          <div className="space-y-4">
            {interview.qas.map((qa, i) => (
              <details
                key={qa.id}
                className="group rounded-2xl bg-card border border-border/70 overflow-hidden"
              >
                <summary className="cursor-pointer p-5 flex items-start justify-between gap-4 list-none">
                  <div className="flex-1">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                      Q{i + 1} · {qa.difficulty}
                    </div>
                    <p className="font-display text-lg leading-snug">{qa.question}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-display font-semibold tabular-nums">
                      {Math.round(
                        (qa.metrics.clarity + qa.metrics.structure + qa.metrics.confidence + qa.metrics.relevance) /
                          4,
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 inline text-muted-foreground group-open:rotate-90 transition" />
                  </div>
                </summary>
                <div className="px-5 pb-5 space-y-4 border-t border-border/60 pt-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Your answer</p>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{qa.answer}</p>
                  </div>
                  <p className="text-sm">
                    <span className="text-success font-medium">What worked: </span>
                    {qa.highlight}
                  </p>
                  <p className="text-sm">
                    <span className="text-coral font-medium">Try next time: </span>
                    {qa.improve}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                    <MetricBar label="Clarity" value={qa.metrics.clarity} />
                    <MetricBar label="Structure" value={qa.metrics.structure} />
                    <MetricBar label="Confidence" value={qa.metrics.confidence} />
                    <MetricBar label="Relevance" value={qa.metrics.relevance} />
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function topInsights(i: Interview): string[] {
  const m = i.overall;
  const entries = Object.entries(m).sort((a, b) => a[1] - b[1]) as [keyof typeof m, number][];
  const tips: Record<string, string> = {
    clarity: "Tighten your sentences. Aim for one idea per sentence — your interviewer should never re-read.",
    structure: "Use STAR (Situation → Task → Action → Result) to frame stories. It feels formal, but it works.",
    confidence: "Cut hedges like 'I think', 'kinda', 'maybe'. Replace with 'I led', 'I decided', 'I shipped'.",
    relevance: "Mirror the question's keywords in your opening sentence — it signals you actually heard it.",
  };
  return entries.slice(0, 3).map(([k]) => tips[k]);
}
