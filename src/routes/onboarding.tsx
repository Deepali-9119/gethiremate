import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { useEffect, useRef, useState } from "react";
import { saveProfile, type Company, type Level, type Profile } from "@/lib/hiremate";
import { ArrowRight, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your interview — HireMate" },
      { name: "description", content: "A quick chat to tailor your mock interview — role, experience, and target company." },
      { property: "og:title", content: "Set up your interview — HireMate" },
      { property: "og:description", content: "A few quick taps and we'll tailor your mock interview." },
    ],
  }),
  component: Onboarding,
});

// ---------- types ----------
type StepId = "role" | "roleOther" | "level" | "company" | "date" | "ready" | "done";

type Bubble =
  | { kind: "ai"; text: string }
  | { kind: "user"; text: string }
  | { kind: "typing" };

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
  { label: "Google", value: "Big Tech" },
  { label: "Amazon", value: "Big Tech" },
  { label: "Microsoft", value: "Big Tech" },
  { label: "Flipkart", value: "Big Tech" },
  { label: "Startup", value: "Startup" },
  { label: "General practice", value: "General" },
];

const TYPING_MS = 1000;
const STEP_GAP_MS = 350;

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<StepId>("role");
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [role, setRole] = useState("");
  const [level, setLevel] = useState<Level | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [otherInput, setOtherInput] = useState("");
  const [interviewDate, setInterviewDate] = useState<Date | undefined>(undefined);
  const [skippedAll, setSkippedAll] = useState(false);
  const [allSkipped, setAllSkipped] = useState({ role: false, level: false, company: false });
  const scrollRef = useRef<HTMLDivElement>(null);

  // Bootstrap initial AI welcome (typing → message)
  useEffect(() => {
    setBubbles([{ kind: "typing" }]);
    const t = setTimeout(() => {
      setBubbles([
        {
          kind: "ai",
          text:
            "Hey 👋 I'm HireMate. Let's practice your next interview together.\n\nI'll ask real questions and help you improve your answers.\n\nWhat role are you preparing for?",
        },
      ]);
    }, TYPING_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [bubbles, step]);

  // ---------- chat helpers ----------
  const sayUser = (text: string) =>
    setBubbles((b) => [...b, { kind: "user", text }]);

  const sayAi = (text: string, after?: () => void) => {
    setBubbles((b) => [...b, { kind: "typing" }]);
    setTimeout(() => {
      setBubbles((b) => {
        const copy = [...b];
        // replace last typing with ai message
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].kind === "typing") {
            copy[i] = { kind: "ai", text };
            break;
          }
        }
        return copy;
      });
      after?.();
    }, TYPING_MS);
  };

  // ---------- step handlers ----------
  const pickRole = (r: string) => {
    if (r === "Other") {
      setStep("roleOther");
      return;
    }
    setRole(r);
    sayUser(r);
    setStep("done"); // hide chips immediately
    setTimeout(() => {
      sayAi(
        `Great choice. ${r} interviews can be tricky — but that's exactly what I'm built for. 💪\n\nHow much experience do you have?`,
        () => setStep("level"),
      );
    }, STEP_GAP_MS);
  };

  const submitOther = () => {
    const v = otherInput.trim();
    if (!v) return;
    setRole(v);
    sayUser(v);
    setOtherInput("");
    setStep("done");
    setTimeout(() => {
      sayAi(
        `Great choice. ${v} interviews can be tricky — but that's exactly what I'm built for. 💪\n\nHow much experience do you have?`,
        () => setStep("level"),
      );
    }, STEP_GAP_MS);
  };

  const pickLevel = (opt: { label: string; value: Level }) => {
    setLevel(opt.value);
    sayUser(opt.label);
    setStep("done");
    setTimeout(() => {
      sayAi(
        "Got it. I'll calibrate the questions to your level.\n\nOne more thing — any specific company you're targeting, or just general practice?",
        () => setStep("company"),
      );
    }, STEP_GAP_MS);
  };

  const pickCompany = (opt: { label: string; value: Company }) => {
    setCompany(opt.value);
    sayUser(opt.label);
    setStep("done");
    setTimeout(() => {
      sayAi(
        "Nice. One last (optional) thing — when's your interview? I'll show a countdown on your dashboard so we can plan practice around it.",
        () => setStep("date"),
      );
    }, STEP_GAP_MS);
  };

  const pickDate = (d: Date) => {
    setInterviewDate(d);
    sayUser(`Interview on ${format(d, "PPP")}`);
    setStep("done");
    setTimeout(() => goReady(false), STEP_GAP_MS);
  };

  const skipDate = () => {
    sayUser("Skip — no date yet");
    setStep("done");
    setTimeout(() => {
      sayAi("No worries — you can add it later from the dashboard.", () => goReady(false));
    }, STEP_GAP_MS);
  };

  // ---------- skip handlers ----------
  const skipRole = () => {
    sayUser("Skip — general interview");
    setAllSkipped((s) => ({ ...s, role: true }));
    setSkippedAll(true);
    setStep("done");
    setTimeout(() => {
      sayAi(
        "No problem 👍 I'll run a general interview covering common behavioral and situational questions. Let's go!",
        () => goReady(true),
      );
    }, STEP_GAP_MS);
  };

  const skipLevel = () => {
    sayUser("Skip — any level");
    setAllSkipped((s) => ({ ...s, level: true }));
    setStep("done");
    setTimeout(() => {
      sayAi("Got it 👍 I'll mix in questions suitable for all experience levels.", () => {
        setTimeout(() => {
          sayAi(
            "One more thing — any specific company you're targeting, or just general practice?",
            () => setStep("company"),
          );
        }, STEP_GAP_MS);
      });
    }, STEP_GAP_MS);
  };

  const skipCompany = () => {
    sayUser("Skip — general practice");
    setAllSkipped((s) => ({ ...s, company: true }));
    setStep("done");
    setTimeout(() => {
      sayAi("No worries 👍 I'll use a well-rounded question set that works across companies.", () =>
        goReady(false),
      );
    }, STEP_GAP_MS);
  };

  const goReady = (fullSkip: boolean) => {
    const text = fullSkip
      ? "All good 👍 I'll run a general mock interview — a mix of behavioral and situational questions suitable for any role and experience level.\n\n• 5–6 real interview questions\n• Follow-ups based on your answers\n• A detailed scorecard at the end\n\nReady when you are."
      : "All set ✅ Here's what's coming:\n\n• 5–6 real interview questions\n• Follow-ups based on your answers\n• A detailed scorecard at the end\n\nTake your time with each answer. No rush. Ready?";
    setTimeout(() => {
      sayAi(text, () => setStep("ready"));
    }, STEP_GAP_MS);
  };

  const begin = () => {
    const profile: Profile = {
      role: role || "General candidate",
      level: level ?? "Mid",
      focus: ["Behavioral", "Situational"],
      company: company ?? "General",
      interviewDate: interviewDate ? format(interviewDate, "yyyy-MM-dd") : undefined,
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
          {bubbles.map((b, i) => {
            if (b.kind === "typing") return <TypingBubble key={i} />;
            if (b.kind === "ai") return <AiBubble key={i} text={b.text} />;
            return <UserBubble key={i} text={b.text} />;
          })}

          {/* STEP: role chips */}
          {step === "role" && (
            <StepBlock>
              <ChipGrid>
                {ROLE_OPTIONS.map((r) => (
                  <Chip key={r} onClick={() => pickRole(r)}>
                    {r}
                  </Chip>
                ))}
              </ChipGrid>
              <SkipLink
                onClick={skipRole}
                tooltip="We'll run a general interview covering common questions"
              >
                Skip — surprise me with a general interview
              </SkipLink>
            </StepBlock>
          )}

          {/* STEP: role "Other" input */}
          {step === "roleOther" && (
            <StepBlock>
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
                  placeholder="Type your role (e.g. DevOps Engineer at a startup)"
                  className="flex-1 rounded-full border border-border bg-background px-5 py-3 text-sm outline-none focus:border-coral transition"
                />
                <button
                  type="submit"
                  disabled={!otherInput.trim()}
                  className="rounded-full bg-foreground text-background px-5 py-3 text-sm font-medium disabled:opacity-40 transition"
                  aria-label="Submit role"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </StepBlock>
          )}

          {/* STEP: level chips */}
          {step === "level" && (
            <StepBlock>
              <ChipGrid>
                {LEVEL_OPTIONS.map((opt) => (
                  <Chip key={opt.label} onClick={() => pickLevel(opt)}>
                    {opt.label}
                  </Chip>
                ))}
              </ChipGrid>
              <SkipLink
                onClick={skipLevel}
                tooltip="Questions will be a mix of easy and challenging"
              >
                Skip — keep it balanced for all levels
              </SkipLink>
            </StepBlock>
          )}

          {/* STEP: company chips */}
          {step === "company" && (
            <StepBlock>
              <ChipGrid>
                {COMPANY_OPTIONS.map((opt) => (
                  <Chip key={opt.label} onClick={() => pickCompany(opt)}>
                    {opt.label}
                  </Chip>
                ))}
              </ChipGrid>
              <SkipLink
                onClick={skipCompany}
                tooltip="Questions won't be tailored to any specific company"
              >
                Skip — no specific company in mind
              </SkipLink>
            </StepBlock>
          )}

          {/* STEP: interview date (optional) */}
          {step === "date" && (
            <StepBlock>
              <div className="pl-11">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full sm:w-auto justify-start gap-2 rounded-full border-border bg-background px-5 py-6 text-sm font-normal",
                        !interviewDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="h-4 w-4" />
                      {interviewDate ? format(interviewDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={interviewDate}
                      onSelect={(d) => d && pickDate(d)}
                      disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <SkipLink
                onClick={skipDate}
                tooltip="You can add your interview date later from the dashboard"
              >
                Skip — I don't have a date yet
              </SkipLink>
            </StepBlock>
          )}


          {/* STEP: ready */}
          {step === "ready" && (
            <StepBlock>
              <div className="pl-11 space-y-3">
                <button
                  onClick={begin}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-foreground text-background px-5 py-3.5 text-sm font-medium hover:opacity-90 active:scale-[0.99] transition shadow-warm"
                >
                  Let's go <ArrowRight className="h-4 w-4" />
                </button>
                <div className="text-center">
                  <button
                    onClick={() => navigate({ to: "/scorecard", search: { id: "sample" } })}
                    className="text-[13px] text-muted-foreground hover:text-foreground underline underline-offset-4 inline-flex items-center gap-1 py-3 px-2 min-h-[44px]"
                  >
                    Not ready yet — show me a sample scorecard first →
                  </button>
                </div>
              </div>
            </StepBlock>
          )}
        </div>
        {/* Tiny hint (avoids unused-state warning + gives flow context) */}
        {skippedAll && allSkipped.role && step === "ready" && (
          <p className="mt-3 text-[11px] text-center text-muted-foreground">
            General interview mode — no preferences saved.
          </p>
        )}
      </main>
    </div>
  );
}

// ---------- presentational pieces ----------

function StepBlock({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-in">{children}</div>;
}

function ChipGrid({ children }: { children: React.ReactNode }) {
  return <div className="pl-11 grid grid-cols-2 sm:flex sm:flex-wrap gap-2">{children}</div>;
}

function Chip({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="min-h-[44px] rounded-full border border-coral/20 bg-peach text-ink hover:bg-coral-soft hover:border-coral active:scale-[0.97] focus:bg-foreground focus:text-background focus:border-foreground transition px-4 py-2.5 text-sm text-left"
    >
      {children}
    </button>
  );
}

function SkipLink({
  children,
  onClick,
  tooltip,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tooltip: string;
}) {
  return (
    <div className="pl-11 mt-3 flex justify-center">
      <button
        onClick={onClick}
        title={tooltip}
        aria-label={`${children} — ${tooltip}`}
        className="group relative min-h-[44px] px-3 py-2 text-[13px] text-muted-foreground hover:text-foreground underline underline-offset-4 decoration-muted-foreground/40 hover:decoration-foreground transition inline-flex items-center gap-1"
      >
        {children} <span aria-hidden>→</span>
        <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground text-background text-[11px] px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition shadow-warm hidden sm:block">
          {tooltip}
        </span>
      </button>
    </div>
  );
}

function AiBubble({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <div className="h-8 w-8 shrink-0 rounded-full gradient-warm flex items-center justify-center text-xs font-display font-semibold text-ink">
        H
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-secondary px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line">
        {text}
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end animate-fade-in">
      <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-foreground text-background px-4 py-2.5 text-sm leading-relaxed">
        {text}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <div className="h-8 w-8 shrink-0 rounded-full gradient-warm flex items-center justify-center text-xs font-display font-semibold text-ink">
        H
      </div>
      <div className="rounded-2xl rounded-tl-md bg-secondary px-4 py-3 inline-flex items-center gap-1">
        <Dot delay="0ms" />
        <Dot delay="150ms" />
        <Dot delay="300ms" />
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
      style={{ animationDelay: delay, animationDuration: "1s" }}
    />
  );
}
