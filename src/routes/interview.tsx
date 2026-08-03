import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  aggregate,
  generateQuestion,
  getProfile,
  nextDifficulty,
  saveInterview,
  scoreAnswer,
  type Interview,
  type QA,
} from "@/lib/hiremate";
import type { HighlightSpan } from "@/lib/hiremate";
import { appendSession, summarizeQAs } from "@/lib/sessions";
import { MetricBar } from "@/components/MetricBar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowRight, Send, Sparkles, Flag, RotateCcw, Check, AlertTriangle, Info } from "lucide-react";

export const Route = createFileRoute("/interview")({
  head: () => ({
    meta: [
      { title: "Mock interview in progress — HireMate" },
      { name: "description", content: "Live conversational interview with adaptive AI questions and per-answer feedback." },
    ],
  }),
  component: Interview,
});

const TOTAL = 5;

type Turn =
  | { kind: "ai-question"; text: string; difficulty: "easy" | "medium" | "hard" }
  | { kind: "user-answer"; text: string }
  | { kind: "ai-feedback"; qa: QA }
  | { kind: "ai-ack"; text: string };

const ACKS = [
  "Got it ✅ Let's keep going.",
  "Nice detail 👍 Here's the next one.",
  "Good answer. Moving on.",
  "Noted ✅ Next question coming up.",
  "Solid response. Let's continue.",
  "Love that — onto the next.",
  "Heard you. Next up…",
];

function pickAck(prev?: string): string {
  const pool = ACKS.filter((a) => a !== prev);
  return pool[Math.floor(Math.random() * pool.length)];
}

function Interview() {
  const navigate = useNavigate();
  const [profile] = useState(() => (typeof window !== "undefined" ? getProfile() : null));
  const [turns, setTurns] = useState<Turn[]>([]);
  const [qas, setQas] = useState<QA[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [done, setDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Bootstrap first question
  useEffect(() => {
    if (!profile) {
      navigate({ to: "/onboarding" });
      return;
    }
    const { question, difficulty } = generateQuestion(profile.role, "medium", []);
    setTurns([{ kind: "ai-question", text: question, difficulty }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, thinking]);

  if (!profile) return null;

  const currentQ = [...turns].reverse().find((t) => t.kind === "ai-question") as
    | { kind: "ai-question"; text: string; difficulty: "easy" | "medium" | "hard" }
    | undefined;
  const lastAnswered = qas.length;
  const canEnd = lastAnswered >= TOTAL;

  const submit = (override?: string) => {
    const v = (override ?? input).trim();
    if (!v || !currentQ || thinking) return;
    setInput("");
    setTurns((t) => [...t, { kind: "user-answer", text: v }]);
    setThinking(true);

    setTimeout(() => {
      const qa = scoreAnswer(currentQ.text, v);
      qa.difficulty = currentQ.difficulty;
      const newQas = [...qas, qa];
      setQas(newQas);
      setTurns((t) => [...t, { kind: "ai-feedback", qa }]);

      if (newQas.length >= TOTAL) {
        setThinking(false);
        setDone(true);
        return;
      }

      // Brief acknowledgment, then next adaptive question
      setTimeout(() => {
        const lastAck = [...turns].reverse().find((tt) => tt.kind === "ai-ack") as
          | { kind: "ai-ack"; text: string }
          | undefined;
        const ack = pickAck(lastAck?.text);
        setTurns((t) => [...t, { kind: "ai-ack", text: ack }]);

        setTimeout(() => {
          const diff = nextDifficulty(qa.metrics);
          const asked = turns
            .filter((t) => t.kind === "ai-question")
            .map((t) => (t as { kind: "ai-question"; text: string }).text);
          const { question } = generateQuestion(profile.role, diff, [...asked, currentQ.text]);
          setTurns((t) => [...t, { kind: "ai-question", text: question, difficulty: diff }]);
          setThinking(false);
        }, 1300);
      }, 500);
    }, 900);
  };


  const redo = (qaId: string) => {
    // Find the answer that produced this feedback and restore it for editing
    const feedbackIdx = turns.findIndex((t) => t.kind === "ai-feedback" && t.qa.id === qaId);
    if (feedbackIdx === -1) return;
    // Walk back to find the user-answer just before
    const answerTurn = turns[feedbackIdx - 1];
    const prevText = answerTurn?.kind === "user-answer" ? answerTurn.text : "";
    // Trim everything from the user answer onward (keeps the question intact)
    setTurns((t) => t.slice(0, feedbackIdx - 1));
    setQas((q) => q.filter((x) => x.id !== qaId));
    setInput(prevText);
    setDone(false);
    setTimeout(() => taRef.current?.focus(), 50);
  };

  const finish = () => {
    const { overall, score } = aggregate(qas);
    const interview: Interview = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      role: profile.role,
      level: profile.level,
      qas,
      overall,
      score,
    };
    saveInterview(interview);

    // Also persist a simplified session entry under "hiremate_sessions"
    const { strengths, improvements } = summarizeQAs(qas);
    appendSession({
      id: interview.id,
      role: profile.role,
      date: interview.date,
      overall_score: score,
      breakdown_scores: overall,
      strengths,
      improvements,
    });

    navigate({ to: "/scorecard", search: { id: interview.id } });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-5 py-6">
        {/* Status bar */}
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {profile.level} · {profile.role}
            </p>
            <h1 className="font-display text-2xl font-semibold">Interview in progress</h1>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground mb-1.5">
              Question {Math.min(lastAnswered + (currentQ && !done ? 1 : 0), TOTAL)} / {TOTAL}
            </div>
            <div className="h-1.5 w-32 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-coral transition-all duration-500"
                style={{ width: `${(lastAnswered / TOTAL) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Chat */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto rounded-3xl border border-border/70 bg-card p-5 sm:p-6 space-y-5 min-h-[400px]"
        >
          {turns.map((t, i) => {
            if (t.kind === "ai-question") {
              return (
                <div key={i} className="flex items-start gap-3">
                  <Avatar />
                  <div className="max-w-[85%]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-coral-soft text-ink font-medium">
                        {t.difficulty}
                      </span>
                    </div>
                    <div className="rounded-2xl rounded-tl-md bg-secondary px-5 py-3.5 text-[15px] leading-relaxed font-display">
                      {t.text}
                    </div>
                  </div>
                </div>
              );
            }
            if (t.kind === "user-answer") {
              // Find matching feedback (next feedback turn) to source spans
              const fb = turns.slice(i + 1).find((x) => x.kind === "ai-feedback") as
                | { kind: "ai-feedback"; qa: QA }
                | undefined;
              return (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-foreground text-background px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
                    <HighlightedAnswer text={t.text} spans={fb?.qa.spans ?? []} />
                  </div>
                </div>
              );
            }
            if (t.kind === "ai-ack") {
              return (
                <div key={i} className="flex items-start gap-3">
                  <Avatar />
                  <div className="max-w-[80%] rounded-2xl rounded-tl-md bg-secondary/60 px-4 py-2 text-sm leading-relaxed text-muted-foreground italic">
                    {t.text}
                  </div>
                </div>
              );
            }
            // feedback card
            const m = t.qa.metrics;
            const last = turns[turns.length - 1]?.kind;
            const secondLast = turns[turns.length - 2]?.kind;
            const isLatestFeedback =
              i === turns.length - 1 ||
              (i === turns.length - 2 && (last === "ai-question" || last === "ai-ack")) ||
              (i === turns.length - 3 && last === "ai-question" && secondLast === "ai-ack");
            return (
              <div key={i} className="flex items-start gap-3">
                <Avatar />
                <div className="max-w-[90%] w-full rounded-2xl rounded-tl-md bg-background border border-border/70 p-5 shadow-warm">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-3.5 w-3.5 text-coral" />
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">
                      Per-answer feedback
                    </span>
                  </div>

                  {t.qa.tooShort ? (
                    <p className="text-sm leading-relaxed text-ink">
                      It looks like your answer is too short. Try giving a more detailed response so I can provide meaningful feedback.
                    </p>
                  ) : (
                    <>
                      {t.qa.worked.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs uppercase tracking-wider text-success mb-2 font-medium">
                            What worked
                          </p>
                          <ul className="space-y-1.5">
                            {t.qa.worked.map((w, idx) => (
                              <li key={idx} className="text-sm flex gap-2">
                                <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                                <span className="leading-relaxed">{w}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {t.qa.tryNext.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs uppercase tracking-wider text-coral mb-2 font-medium">
                            Try next time
                          </p>
                          <ul className="space-y-1.5">
                            {t.qa.tryNext.map((tip, idx) => (
                              <li key={idx} className="text-sm flex gap-2">
                                <ArrowRight className="h-3.5 w-3.5 text-coral shrink-0 mt-0.5" />
                                <span className="leading-relaxed">{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {t.qa.missing.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {t.qa.missing.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-warn/15 text-ink font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {t.qa.spans.length > 0 && (
                        <p className="text-xs text-muted-foreground mb-4 flex items-center gap-3 flex-wrap">
                          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> Strong</span>
                          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warn" /> Vague</span>
                          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-info" /> Missing impact</span>
                          <span className="opacity-70">— tap a highlighted line in your answer for the fix.</span>
                        </p>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border/60">
                        <MetricBar label="Clarity" value={m.clarity} />
                        <MetricBar label="Structure" value={m.structure} />
                        <MetricBar label="Confidence" value={m.confidence} />
                        <MetricBar label="Relevance" value={m.relevance} />
                      </div>
                    </>
                  )}

                  {!t.qa.tooShort && <StarCoaching qa={t.qa} />}

                  {isLatestFeedback && !thinking && (
                    <div className="mt-4 pt-4 border-t border-border/60 flex justify-end">
                      <button
                        onClick={() => redo(t.qa.id)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-medium hover:bg-secondary transition"
                      >
                        <RotateCcw className="h-3 w-3" /> Redo this answer
                      </button>
                    </div>
                  )}

                </div>
              </div>
            );
          })}

          {thinking && (
            <div className="flex items-start gap-3">
              <Avatar />
              <div className="rounded-2xl rounded-tl-md bg-secondary px-4 py-3 text-sm flex items-center gap-1.5">
                <Dot /> <Dot delay={0.15} /> <Dot delay={0.3} />
              </div>
            </div>
          )}

          {done && (
            <div className="flex items-start gap-3">
              <Avatar />
              <div className="max-w-[90%] rounded-2xl rounded-tl-md bg-coral-soft px-5 py-4">
                <p className="font-display text-lg mb-1">That's a wrap. 🎯</p>
                <p className="text-sm text-ink/80 mb-3">
                  Your scorecard is ready — let's see where you shine and what to sharpen.
                </p>
                <button
                  onClick={finish}
                  className="inline-flex items-center gap-2 rounded-full bg-ink text-background px-5 py-2.5 text-sm font-medium hover:opacity-90 transition"
                >
                  See scorecard <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Composer */}
        {!done && (
          <div className="mt-4">
            <div className="flex items-end gap-2 rounded-3xl border border-border/70 bg-card p-2 focus-within:border-coral transition">
              <textarea
                ref={taRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    submit();
                  }
                }}
                rows={2}
                placeholder="Type your answer…"
                className="flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={() => submit()}
                disabled={!input.trim() || thinking}
                className="rounded-2xl bg-foreground text-background h-11 w-11 flex items-center justify-center disabled:opacity-30 hover:opacity-90 transition"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground px-2">
              <span>⌘ + Enter to send</span>
              {canEnd && (
                <button
                  onClick={() => setDone(true)}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  <Flag className="h-3 w-3" /> End early
                </button>
              )}
              {!canEnd && (
                <Link to="/dashboard" className="hover:text-foreground">
                  Save & exit
                </Link>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Avatar() {
  return (
    <div className="h-8 w-8 shrink-0 rounded-full gradient-warm flex items-center justify-center text-xs font-display font-semibold text-ink">
      H
    </div>
  );
}

function Dot({ delay = 0 }: { delay?: number }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
      style={{ animationDelay: `${delay}s`, animationDuration: "1s" }}
    />
  );
}


function HighlightedAnswer({ text, spans }: { text: string; spans: HighlightSpan[] }) {
  if (!spans.length) return <>{text}</>;
  const sorted = [...spans].sort((a, b) => a.start - b.start);
  const parts: ReactNode[] = [];
  let cursor = 0;
  sorted.forEach((s, i) => {
    if (s.start > cursor) parts.push(<span key={`t-${i}`}>{text.slice(cursor, s.start)}</span>);
    const chunk = text.slice(s.start, s.end);
    const styles =
      s.type === "strong"
        ? "underline decoration-2 decoration-success/80 underline-offset-4"
        : s.type === "vague"
          ? "underline decoration-2 decoration-warn underline-offset-4 bg-warn/10 rounded px-0.5"
          : "underline decoration-2 decoration-info underline-offset-4 bg-info/10 rounded px-0.5";
    const Icon = s.type === "strong" ? Check : s.type === "vague" ? AlertTriangle : Info;
    const iconTone = s.type === "strong" ? "text-success" : s.type === "vague" ? "text-warn" : "text-info";
    parts.push(
      <Popover key={`s-${i}`}>
        <PopoverTrigger asChild>
          <button className={`${styles} text-left cursor-pointer`}>{chunk}</button>
        </PopoverTrigger>
        <PopoverContent side="top" className="w-72 text-xs leading-relaxed">
          <div className="flex gap-2 items-start">
            <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${iconTone}`} />
            <p className="text-ink">{s.tip}</p>
          </div>
        </PopoverContent>
      </Popover>,
    );
    cursor = s.end;
  });
  if (cursor < text.length) parts.push(<span key="tail">{text.slice(cursor)}</span>);
  return <>{parts}</>;
}
