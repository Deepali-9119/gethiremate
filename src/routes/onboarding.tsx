import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { useEffect, useRef, useState } from "react";
import { saveProfile, type Level, type Profile } from "@/lib/hiremate";
import { ArrowRight, Paperclip, Check } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your interview — HireMate" },
      { name: "description", content: "Tell HireMate the role, level, and focus areas. Optional resume upload for sharper questions." },
      { property: "og:title", content: "Set up your interview — HireMate" },
      { property: "og:description", content: "Three quick questions and we'll tailor your mock interview." },
    ],
  }),
  component: Onboarding,
});

type Step = "role" | "level" | "focus" | "resume" | "ready";
type Bubble = { from: "ai" | "user"; text: string };

const FOCUS_OPTIONS = ["Behavioral", "Technical", "System design", "Product sense", "Leadership"];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("role");
  const [bubbles, setBubbles] = useState<Bubble[]>([
    { from: "ai", text: "Hey — I'm HireMate 👋 I'll run your mock interview in a sec. First, what role are you preparing for?" },
  ]);
  const [role, setRole] = useState("");
  const [level, setLevel] = useState<Level | null>(null);
  const [focus, setFocus] = useState<string[]>([]);
  const [resumeName, setResumeName] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [bubbles, step]);

  const pushAi = (text: string) => setBubbles((b) => [...b, { from: "ai", text }]);
  const pushUser = (text: string) => setBubbles((b) => [...b, { from: "user", text }]);

  const submitRole = () => {
    const v = input.trim();
    if (!v) return;
    setRole(v);
    pushUser(v);
    setInput("");
    setTimeout(() => {
      pushAi(`Got it — ${v}. And how would you describe your experience level?`);
      setStep("level");
    }, 350);
  };

  const pickLevel = (lv: Level) => {
    setLevel(lv);
    pushUser(lv);
    setTimeout(() => {
      pushAi("Nice. Which areas should I lean into? Pick as many as you like.");
      setStep("focus");
    }, 300);
  };

  const toggleFocus = (f: string) =>
    setFocus((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  const confirmFocus = () => {
    if (!focus.length) return;
    pushUser(focus.join(" • "));
    setTimeout(() => {
      pushAi("Optional: drop your resume so I can tailor questions to your experience. Or skip — totally fine.");
      setStep("resume");
    }, 300);
  };

  const handleResume = (name?: string) => {
    if (name) {
      setResumeName(name);
      pushUser(`📎 ${name}`);
    } else {
      pushUser("Skip for now");
    }
    setTimeout(() => {
      pushAi("Perfect. I'll start easy and ramp up based on how you answer. Ready?");
      setStep("ready");
    }, 350);
  };

  const begin = () => {
    const profile: Profile = {
      role,
      level: level!,
      focus,
      resumeName,
    };
    saveProfile(profile);
    navigate({ to: "/interview" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex flex-col max-w-2xl w-full mx-auto px-5 py-8">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Onboarding</p>
          <h1 className="font-display text-3xl font-semibold">Let's tailor your session</h1>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto rounded-3xl border border-border/70 bg-card p-5 sm:p-6 space-y-4"
        >
          {bubbles.map((b, i) => (
            <Bubble key={i} from={b.from}>
              {b.text}
            </Bubble>
          ))}

          {step === "level" && (
            <div className="flex flex-wrap gap-2 pl-11">
              {(["Junior", "Mid", "Senior"] as Level[]).map((lv) => (
                <button
                  key={lv}
                  onClick={() => pickLevel(lv)}
                  className="rounded-full border border-border bg-background hover:bg-coral-soft hover:border-coral transition px-4 py-2 text-sm"
                >
                  {lv}
                </button>
              ))}
            </div>
          )}

          {step === "focus" && (
            <div className="pl-11 space-y-3">
              <div className="flex flex-wrap gap-2">
                {FOCUS_OPTIONS.map((f) => {
                  const active = focus.includes(f);
                  return (
                    <button
                      key={f}
                      onClick={() => toggleFocus(f)}
                      className={`rounded-full border px-4 py-2 text-sm transition flex items-center gap-1.5 ${
                        active
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background border-border hover:border-coral"
                      }`}
                    >
                      {active && <Check className="h-3.5 w-3.5" />}
                      {f}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={confirmFocus}
                disabled={!focus.length}
                className="text-sm text-coral font-medium disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
              >
                Continue <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {step === "resume" && (
            <div className="pl-11 flex flex-wrap items-center gap-2">
              <label className="cursor-pointer rounded-full border border-border bg-background hover:bg-coral-soft hover:border-coral transition px-4 py-2 text-sm inline-flex items-center gap-2">
                <Paperclip className="h-3.5 w-3.5" />
                Upload resume
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => handleResume(e.target.files?.[0]?.name)}
                />
              </label>
              <button
                onClick={() => handleResume()}
                className="rounded-full border border-border bg-background hover:bg-secondary px-4 py-2 text-sm"
              >
                Skip for now
              </button>
            </div>
          )}

          {step === "ready" && (
            <div className="pl-11">
              <button
                onClick={begin}
                className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-3 text-sm font-medium hover:opacity-90 transition shadow-warm"
              >
                Begin interview <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {step === "role" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitRole();
            }}
            className="mt-4 flex gap-2"
          >
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer at a fintech"
              className="flex-1 rounded-full border border-border bg-card px-5 py-3.5 text-sm outline-none focus:border-coral transition"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="rounded-full bg-foreground text-background px-5 py-3.5 text-sm font-medium disabled:opacity-40 transition"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

function Bubble({ from, children }: { from: "ai" | "user"; children: React.ReactNode }) {
  if (from === "ai") {
    return (
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 shrink-0 rounded-full gradient-warm flex items-center justify-center text-xs font-display font-semibold text-ink">
          H
        </div>
        <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-secondary px-4 py-2.5 text-sm leading-relaxed">
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-foreground text-background px-4 py-2.5 text-sm leading-relaxed">
        {children}
      </div>
    </div>
  );
}
