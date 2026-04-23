import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { useEffect, useRef, useState } from "react";
import { saveProfile, type Company, type Level, type Profile } from "@/lib/hiremate";
import { ArrowRight, Paperclip, Check } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your interview — HireMate" },
      { name: "description", content: "Pick your role, level, and target company. We'll tailor the questions." },
      { property: "og:title", content: "Set up your interview — HireMate" },
      { property: "og:description", content: "A few quick taps and we'll tailor your mock interview." },
    ],
  }),
  component: Onboarding,
});

type Step = "role" | "roleOther" | "level" | "company" | "focus" | "resume" | "ready";
type Bubble = { from: "ai" | "user"; text: string };

const ROLE_OPTIONS = [
  "Product Manager",
  "Software Engineer",
  "Data Analyst",
  "Business Analyst",
  "UX Designer",
  "Other",
];

const LEVEL_OPTIONS: { label: string; value: Level }[] = [
  { label: "Fresher / Student", value: "Junior" },
  { label: "1–3 years", value: "Junior" },
  { label: "3–5 years", value: "Mid" },
  { label: "5+ years", value: "Senior" },
];

const COMPANY_OPTIONS: { label: string; value: Company }[] = [
  { label: "Big Tech (Google, Amazon, Microsoft)", value: "Big Tech" },
  { label: "Startup", value: "Startup" },
  { label: "Consulting", value: "Consulting" },
  { label: "General practice", value: "General" },
];

const FOCUS_OPTIONS = ["Behavioral", "Technical", "System design", "Product sense", "Leadership"];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("role");
  const [bubbles, setBubbles] = useState<Bubble[]>([
    { from: "ai", text: "Hey — I'm HireMate 👋 I'll run your mock interview in a sec. First, what role are you preparing for?" },
  ]);
  const [role, setRole] = useState("");
  const [level, setLevel] = useState<Level | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [focus, setFocus] = useState<string[]>([]);
  const [resumeName, setResumeName] = useState<string | undefined>();
  const [otherInput, setOtherInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [bubbles, step]);

  const pushAi = (text: string) => setBubbles((b) => [...b, { from: "ai", text }]);
  const pushUser = (text: string) => setBubbles((b) => [...b, { from: "user", text }]);

  const pickRole = (r: string) => {
    if (r === "Other") {
      setStep("roleOther");
      return;
    }
    setRole(r);
    pushUser(r);
    setTimeout(() => {
      pushAi(`Great — ${r}. What's your experience level?`);
      setStep("level");
    }, 350);
  };

  const submitOther = () => {
    const v = otherInput.trim();
    if (!v) return;
    setRole(v);
    pushUser(v);
    setOtherInput("");
    setTimeout(() => {
      pushAi(`Got it — ${v}. What's your experience level?`);
      setStep("level");
    }, 350);
  };

  const pickLevel = (opt: { label: string; value: Level }) => {
    setLevel(opt.value);
    pushUser(opt.label);
    setTimeout(() => {
      pushAi("Nice. What type of company are you targeting?");
      setStep("company");
    }, 300);
  };

  const pickCompany = (opt: { label: string; value: Company }) => {
    setCompany(opt.value);
    pushUser(opt.label);
    setTimeout(() => {
      pushAi("Last bit — which areas should I lean into? Pick as many as you like.");
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
      company: company ?? undefined,
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

          {step === "role" && (
            <div className="pl-11">
              <ChipGrid>
                {ROLE_OPTIONS.map((r) => (
                  <Chip key={r} onClick={() => pickRole(r)}>
                    {r}
                  </Chip>
                ))}
              </ChipGrid>
            </div>
          )}

          {step === "roleOther" && (
            <div className="pl-11">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitOther();
                }}
                className="flex gap-2"
              >
                <input
                  autoFocus
                  value={otherInput}
                  onChange={(e) => setOtherInput(e.target.value)}
                  placeholder="Type your role…"
                  className="flex-1 rounded-full border border-border bg-background px-5 py-3 text-sm outline-none focus:border-coral transition"
                />
                <button
                  type="submit"
                  disabled={!otherInput.trim()}
                  className="rounded-full bg-foreground text-background px-5 py-3 text-sm font-medium disabled:opacity-40 transition"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}

          {step === "level" && (
            <div className="pl-11">
              <ChipGrid>
                {LEVEL_OPTIONS.map((opt) => (
                  <Chip key={opt.label} onClick={() => pickLevel(opt)}>
                    {opt.label}
                  </Chip>
                ))}
              </ChipGrid>
            </div>
          )}

          {step === "company" && (
            <div className="pl-11">
              <ChipGrid>
                {COMPANY_OPTIONS.map((opt) => (
                  <Chip key={opt.label} onClick={() => pickCompany(opt)}>
                    {opt.label}
                  </Chip>
                ))}
              </ChipGrid>
            </div>
          )}

          {step === "focus" && (
            <div className="pl-11 space-y-3">
              <ChipGrid>
                {FOCUS_OPTIONS.map((f) => {
                  const active = focus.includes(f);
                  return (
                    <Chip key={f} active={active} onClick={() => toggleFocus(f)}>
                      {active && <Check className="h-3.5 w-3.5" />}
                      {f}
                    </Chip>
                  );
                })}
              </ChipGrid>
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
              <label className="cursor-pointer rounded-full border border-coral/30 bg-peach hover:bg-coral-soft hover:border-coral transition px-4 py-2 text-sm inline-flex items-center gap-2">
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
      </main>
    </div>
  );
}

function ChipGrid({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

function Chip({
  children,
  onClick,
  active = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm transition inline-flex items-center gap-1.5 ${
        active
          ? "bg-foreground text-background border-foreground shadow-warm"
          : "bg-peach border-coral/20 text-ink hover:bg-coral-soft hover:border-coral"
      }`}
    >
      {children}
    </button>
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
