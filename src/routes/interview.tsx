import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { useEffect, useRef, useState } from "react";
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
import { MetricBar } from "@/components/MetricBar";
import { ArrowRight, Send, Sparkles, Flag, RotateCcw, Mic, Square } from "lucide-react";

const SAMPLE_TRANSCRIPTS = [
  "So, in my last role I led the redesign of our onboarding flow. The drop-off was around 38% on step two, so I partnered with design and analytics to run a quick research sprint, then shipped a simplified two-step version. Activation jumped 22% in the first month, and we kept the lift through the next quarter.",
  "I'd start by clarifying the goal — are we optimizing for engagement, retention, or revenue. Then I'd map the user journey and find the highest-friction step. Once I had a hypothesis, I'd run a small A/B test, watch the leading indicators for two weeks, and only roll out broadly if the metric moved by at least 5%.",
  "Honestly, the proudest moment was shipping our payments rewrite. We had three weeks, two engineers, and a strict reliability target. I cut scope on the lowest-impact piece, paired daily with the team, and we landed on time with zero production incidents in the first month.",
  "I think the biggest lesson was learning to push back earlier. I used to absorb scope without questioning it, and that hurt the team. Now I ask two questions up front: what's the success metric, and what are we explicitly not doing. It's saved us weeks more than once.",
];

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
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcribeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // Cleanup voice timers on unmount
  useEffect(() => {
    return () => {
      if (recTimerRef.current) clearInterval(recTimerRef.current);
      if (transcribeTimerRef.current) clearTimeout(transcribeTimerRef.current);
    };
  }, []);

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

  const startRecording = () => {
    if (recording || transcribing || thinking) return;
    setRecording(true);
    setRecSeconds(0);
    recTimerRef.current = setInterval(() => setRecSeconds((s) => s + 1), 1000);
  };

  const stopRecording = () => {
    if (!recording) return;
    setRecording(false);
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    recTimerRef.current = null;
    setTranscribing(true);
    // Simulate transcription stream into the input
    const sample = SAMPLE_TRANSCRIPTS[Math.floor(Math.random() * SAMPLE_TRANSCRIPTS.length)];
    const words = sample.split(" ");
    let i = 0;
    setInput("");
    const tick = () => {
      i += 1;
      setInput(words.slice(0, i).join(" "));
      if (i < words.length) {
        transcribeTimerRef.current = setTimeout(tick, 35);
      } else {
        transcribeTimerRef.current = setTimeout(() => {
          setTranscribing(false);
          submit(sample);
        }, 450);
      }
    };
    transcribeTimerRef.current = setTimeout(tick, 350);
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
              return (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-foreground text-background px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
                    {t.text}
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
                  <p className="text-sm mb-1">
                    <span className="text-success font-medium">What worked: </span>
                    {t.qa.highlight}
                  </p>
                  <p className="text-sm mb-3">
                    <span className="text-coral font-medium">Try next time: </span>
                    {t.qa.improve}
                  </p>

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

                  <div className="rounded-2xl bg-coral-soft/60 border border-coral/20 p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-ink text-background font-semibold">
                        Top candidate answer
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed font-display text-ink/90">
                      {t.qa.improvedAnswer}
                    </p>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                      How to improve
                    </p>
                    <ul className="space-y-1.5">
                      {t.qa.howToImprove.map((tip, idx) => (
                        <li key={idx} className="text-sm flex gap-2">
                          <span className="text-coral mt-1.5 h-1 w-1 rounded-full bg-coral shrink-0" />
                          <span className="leading-relaxed">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border/60">
                    <MetricBar label="Clarity" value={m.clarity} />
                    <MetricBar label="Structure" value={m.structure} />
                    <MetricBar label="Confidence" value={m.confidence} />
                    <MetricBar label="Relevance" value={m.relevance} />
                  </div>
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
            {/* Voice mode hint */}
            <div className="mb-2 px-2 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <span aria-hidden>🎙</span>
                <span>
                  Try voice mode — practice answering out loud like a real interview
                </span>
              </span>
            </div>

            {recording || transcribing ? (
              <RecordingPanel
                recording={recording}
                transcribing={transcribing}
                seconds={recSeconds}
                preview={input}
                onStop={stopRecording}
              />
            ) : (
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
                  placeholder="Type your answer, or tap the mic to speak…"
                  className="flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
                />
                <button
                  onClick={startRecording}
                  disabled={thinking}
                  className="rounded-2xl border border-coral/30 bg-peach text-ink h-11 w-11 flex items-center justify-center disabled:opacity-30 hover:bg-coral-soft hover:border-coral transition"
                  aria-label="Record voice answer"
                  title="Speak your answer"
                >
                  <Mic className="h-4 w-4" />
                </button>
                <button
                  onClick={() => submit()}
                  disabled={!input.trim() || thinking}
                  className="rounded-2xl bg-foreground text-background h-11 w-11 flex items-center justify-center disabled:opacity-30 hover:opacity-90 transition"
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            )}

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

function RecordingPanel({
  recording,
  transcribing,
  seconds,
  preview,
  onStop,
}: {
  recording: boolean;
  transcribing: boolean;
  seconds: number;
  preview: string;
  onStop: () => void;
}) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return (
    <div className="rounded-3xl border border-coral/30 bg-gradient-to-br from-peach to-coral-soft p-4 sm:p-5">
      <div className="flex items-center gap-4">
        {recording ? (
          <>
            <div className="relative h-10 w-10 shrink-0">
              <span className="absolute inset-0 rounded-full bg-coral/30 animate-ping" />
              <span className="relative h-10 w-10 rounded-full bg-coral grid place-items-center">
                <span className="h-2.5 w-2.5 rounded-full bg-background" />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-ink">Listening… speak your answer</p>
                <span className="text-xs text-ink/60 tabular-nums">{mm}:{ss}</span>
              </div>
              <Waves />
            </div>
            <button
              onClick={onStop}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition shrink-0"
            >
              <Square className="h-3.5 w-3.5" fill="currentColor" /> Stop
            </button>
          </>
        ) : (
          <>
            <div className="h-10 w-10 shrink-0 rounded-full bg-ink/10 grid place-items-center">
              <span className="flex gap-0.5">
                <Dot /> <Dot delay={0.15} /> <Dot delay={0.3} />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wider text-ink/60 font-medium mb-1">
                Transcribing…
              </p>
              <p className="text-sm text-ink leading-relaxed line-clamp-2">
                {preview || "…"}
              </p>
            </div>
          </>
        )}
      </div>
      {transcribing && (
        <p className="mt-3 text-[11px] text-ink/60">
          We'll auto-send once it's done.
        </p>
      )}
    </div>
  );
}

function Waves() {
  return (
    <div className="flex items-center gap-1 h-5">
      {[0, 0.1, 0.2, 0.3, 0.4, 0.3, 0.2, 0.1, 0, 0.15].map((d, i) => (
        <span
          key={i}
          className="w-1 rounded-full bg-coral animate-pulse"
          style={{
            height: `${30 + (i % 4) * 18}%`,
            animationDelay: `${d}s`,
            animationDuration: "0.9s",
          }}
        />
      ))}
    </div>
  );
}
