import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { ArrowRight, MessageSquare, BarChart3, Target, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HireMate — AI interview coach that talks back" },
      {
        name: "description",
        content:
          "Practice real interviews with an AI that adapts to you. Get per-answer feedback on clarity, structure, confidence, and relevance.",
      },
      { property: "og:title", content: "HireMate — AI interview coach" },
      {
        property: "og:description",
        content: "Conversational interview practice with adaptive questions and a personal scorecard.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grain opacity-60 pointer-events-none" />
          <div className="max-w-6xl mx-auto px-5 pt-20 pb-24 sm:pt-28 sm:pb-32 relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-coral-soft text-ink px-3 py-1 text-xs font-medium mb-6">
              <Sparkles className="h-3.5 w-3.5" /> Built for nervous, ambitious humans
            </div>
            <h1 className="font-display text-5xl sm:text-7xl font-semibold leading-[1.02] text-balance max-w-4xl">
              Rehearse the interview <em className="text-coral not-italic">before</em> the interview.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl text-balance">
              HireMate is a conversational AI coach that asks the questions you'll actually be asked —
              then tells you, kindly and specifically, how to answer better.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                to="/onboarding"
                className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-6 py-3.5 text-sm font-medium hover:opacity-90 transition shadow-warm"
              >
                Start a mock interview <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3.5 text-sm font-medium hover:bg-secondary transition"
              >
                See your dashboard
              </Link>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">
              No signup. Free while in beta. Takes ~10 minutes.
            </p>
          </div>
        </section>

        {/* Three pillars */}
        <section className="max-w-6xl mx-auto px-5 pb-24">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                icon: MessageSquare,
                title: "Talks like a human",
                body: "A chat that asks one thoughtful question at a time. No forms. No checklists.",
              },
              {
                icon: Target,
                title: "Adapts to you",
                body: "Nail an answer? It pushes harder. Stumble? It coaches you back up gently.",
              },
              {
                icon: BarChart3,
                title: "Tells you why",
                body: "Per-answer scoring on clarity, structure, confidence, and relevance — with fixes.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-3xl bg-card border border-border/70 p-7 hover:shadow-warm transition"
              >
                <div className="h-10 w-10 rounded-2xl bg-coral-soft flex items-center justify-center mb-5">
                  <Icon className="h-5 w-5 text-ink" />
                </div>
                <h3 className="font-display text-2xl font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer CTA */}
        <section className="max-w-6xl mx-auto px-5 pb-24">
          <div className="rounded-[2rem] gradient-warm p-10 sm:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-grain opacity-40" />
            <div className="relative max-w-2xl">
              <h2 className="font-display text-4xl sm:text-5xl font-semibold leading-tight text-ink">
                Your next interview is in 5 days.
              </h2>
              <p className="mt-4 text-ink/80">
                That's nine practice rounds. Let's not waste them.
              </p>
              <Link
                to="/onboarding"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink text-background px-6 py-3.5 text-sm font-medium hover:opacity-90 transition"
              >
                Begin onboarding <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
