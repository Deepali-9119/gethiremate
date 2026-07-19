import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { useEffect, useRef, useState } from "react";
import { saveProfile, type Company, type Level, type Profile } from "@/lib/hiremate";
import { ArrowRight, CalendarIcon, Search } from "lucide-react";
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
type StepId = "role" | "level" | "company" | "companyOther" | "date" | "ready" | "done";

type Bubble =
  | { kind: "ai"; text: string }
  | { kind: "user"; text: string }
  | { kind: "typing" };

const ROLE_OPTIONS = [
  "Product Manager",
  "Software Engineer",
  "Business Analyst",
  "Marketing",
  "Consultant",
  "Designer",
  "Sales",
  "Finance",
  "Teacher",
  "Customer Success",
  "HR",
];

const LEVEL_OPTIONS: { label: string; value: Level }[] = [
  { label: "Fresher / Student", value: "Junior" },
  { label: "1–3 years", value: "Junior" },
  { label: "3–5 years", value: "Mid" },
  { label: "5+ years", value: "Senior" },
];

type CompanyChoice = { label: string; value: Company; kind?: "other" };
const COMPANY_OPTIONS: CompanyChoice[] = [
  { label: "Google", value: "Big Tech" },
  { label: "Amazon", value: "Big Tech" },
  { label: "Microsoft", value: "Big Tech" },
  { label: "Meta", value: "Big Tech" },
  { label: "Apple", value: "Big Tech" },
  { label: "Netflix", value: "Big Tech" },
  { label: "Startup", value: "Startup" },
  { label: "General Practice", value: "General" },
  { label: "Other", value: "General", kind: "other" },
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
  const [companyName, setCompanyName] = useState<string | undefined>(undefined);
  const [roleQuery, setRoleQuery] = useState("");
  const [companyOtherInput, setCompanyOtherInput] = useState("");
  const [interviewDate, setInterviewDate] = useState<Date | undefined>(undefined);
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
  const chooseRole = (r: string) => {
    setRole(r);
    sayUser(r);
    setRoleQuery("");
    setStep("done");
    setTimeout(() => {
      sayAi(
        `Great choice. ${r} interviews can be tricky — but that's exactly what I'm built for. 💪\n\nWe'll adjust question difficulty based on your experience. How much experience do you have?`,
        () => setStep("level"),
      );
    }, STEP_GAP_MS);
  };

  const submitRoleQuery = () => {
    const v = roleQuery.trim();
    if (!v) return;
    chooseRole(v);
  };

  const pickLevel = (opt: { label: string; value: Level }) => {
    setLevel(opt.value);
    sayUser(opt.label);
    setStep("done");
    setTimeout(() => {
      sayAi(
        "Got it. I'll calibrate the questions to your level.\n\nIf you're preparing for a specific company we'll tailor questions accordingly. Any company in mind, or just general practice?",
        () => setStep("company"),
      );
    }, STEP_GAP_MS);
  };

  const pickCompany = (opt: CompanyChoice) => {
    if (opt.kind === "other") {
      setStep("companyOther");
      return;
    }
    setCompany(opt.value);
    setCompanyName(opt.label);
    sayUser(opt.label);
    setStep("done");
    setTimeout(() => {
      sayAi(
        "Nice. One last (optional) thing — when's your interview? I'll show a countdown on your dashboard so we can plan practice around it.",
        () => setStep("date"),
      );
    }, STEP_GAP_MS);
  };

  const submitCompanyOther = () => {
    const v = companyOtherInput.trim();
    if (!v) return;
    setCompany("General");
    setCompanyName(v);
    sayUser(v);
    setCompanyOtherInput("");
    setStep("done");
    setTimeout(() => {
      sayAi(
        `Got it — I'll keep ${v} in mind. One last (optional) thing — when's your interview?`,
        () => setStep("date"),
      );
    }, STEP_GAP_MS);
  };

  const pickDate = (d: Date) => {
    setInterviewDate(d);
    sayUser(`Interview on ${format(d, "PPP")}`);
    setStep("done");
    setTimeout(() => emitReadySummary(false), STEP_GAP_MS);
  };

  // ---------- skip handlers (single ack bubble each) ----------
  const skipRole = () => {
    sayUser("Skip — general interview");
    setStep("done");
    setTimeout(() => {
      sayAi(
        "No problem 👍 I'll run a well-rounded interview suitable for most roles.\n\n• 5–6 real interview questions\n• Follow-ups based on your answers\n• A detailed scorecard at the end\n\nReady when you are.",
        () => setStep("ready"),
      );
    }, STEP_GAP_MS);
  };

  const skipLevel = () => {
    sayUser("Skip — any level");
    setStep("done");
    setTimeout(() => {
      sayAi(
        "Got it 👍 I'll keep the difficulty balanced. Any specific company you're targeting, or just general practice?",
        () => setStep("company"),
      );
    }, STEP_GAP_MS);
  };

  const skipCompany = () => {
    sayUser("Skip — general practice");
    setStep("done");
    setTimeout(() => {
      sayAi(
        "No worries 👍 I'll keep it broad. Last thing (optional) — when's your interview?",
        () => setStep("date"),
      );
    }, STEP_GAP_MS);
  };

  const skipDate = () => {
    sayUser("Skip — no date yet");
    setStep("done");
    setTimeout(() => emitReadySummary(false), STEP_GAP_MS);
  };

  const emitReadySummary = (fullSkip: boolean) => {
    const text = fullSkip
      ? "All good 👍 I'll run a general mock interview — a mix of behavioral and situational questions suitable for any role and experience level.\n\n• 5–6 real interview questions\n• Follow-ups based on your answers\n• A detailed scorecard at the end\n\nReady when you are."
      : "All set ✅ Here's what's coming:\n\n• 5–6 real interview questions\n• Follow-ups based on your answers\n• A detailed scorecard at the end\n\nTake your time with each answer. No rush. Ready?";
    sayAi(text, () => setStep("ready"));
  };

  const begin = () => {
    const profile: Profile = {
      role: role || "General candidate",
      level: level ?? "Mid",
      focus: ["Behavioral", "Situational"],
      company: company ?? "General",
      companyName,
      interviewDate: interviewDate ? format(interviewDate, "yyyy-MM-dd") : undefined,
    };
    saveProfile(profile);
    navigate({ to: "/interview" });
  };

  // Filter role chips by search query
  const q = roleQuery.trim().toLowerCase();
  const filteredRoles = q
    ? ROLE_OPTIONS.filter((r) => r.toLowerCase().includes(q))
    : ROLE_OPTIONS;
  const showCustomRoleCTA = q.length > 0 && filteredRoles.length === 0;

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

          {/* STEP: role — search + chips */}
          {step === "role" && (
            <StepBlock>
              <div className="pl-11 space-y-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitRoleQuery();
                  }}
                  className="relative"
                >
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    value={roleQuery}
                    onChange={(e) => setRoleQuery(e.target.value)}
                    placeholder="Search your role..."
                    className="w-full rounded-full border border-border bg-background pl-10 pr-4 py-3 text-sm outline-none focus:border-coral transition"
                  />
                </form>
                {showCustomRoleCTA ? (
                  <button
                    onClick={submitRoleQuery}
                    className="min-h-[44px] w-full sm:w-auto rounded-full border border-coral bg-foreground text-background hover:opacity-90 active:scale-[0.97] transition px-4 py-2.5 text-sm inline-flex items-center gap-2"
                  >
                    Use "{roleQuery.trim()}" as your role <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                    {filteredRoles.map((r) => (
                      <Chip key={r} onClick={() => chooseRole(r)}>
                        {r}
                      </Chip>
                    ))}
                  </div>
                )}
              </div>
              <SkipLink
                onClick={skipRole}
                tooltip="We'll run a general interview covering common questions"
              >
                Skip — surprise me with a general interview
              </SkipLink>
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

          {/* STEP: company — Other freeform */}
          {step === "companyOther" && (
            <StepBlock>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitCompanyOther();
                }}
                className="pl-11 flex gap-2"
              >
                <input
                  autoFocus
                  value={companyOtherInput}
                  onChange={(e) => setCompanyOtherInput(e.target.value)}
                  placeholder="Type a company (e.g. Stripe, Zomato)"
                  className="flex-1 rounded-full border border-border bg-background px-5 py-3 text-sm outline-none focus:border-coral transition"
                />
                <button
                  type="submit"
                  disabled={!companyOtherInput.trim()}
                  className="rounded-full bg-foreground text-background px-5 py-3 text-sm font-medium disabled:opacity-40 transition"
                  aria-label="Submit company"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
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
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.2s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.1s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" />
      </div>
    </div>
  );
}
