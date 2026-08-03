// HireMate prototype data + helpers (mocked AI, localStorage persistence)

export type Level = "Junior" | "Mid" | "Senior";
export type Company = "Big Tech" | "Startup" | "Consulting" | "General";
export type Profile = {
  role: string;
  level: Level;
  focus: string[];
  company?: Company;
  companyName?: string; // display label (e.g. "Netflix", "Acme Corp")
  resumeName?: string;
  interviewDate?: string; // ISO date (YYYY-MM-DD)
};

export type Metric = {
  clarity: number;
  structure: number;
  confidence: number;
  relevance: number;
};

export type HighlightSpan = {
  start: number;
  end: number;
  type: "strong" | "vague" | "missing-impact";
  tip: string;
};

export type QA = {
  id: string;
  question: string;
  answer: string;
  difficulty: "easy" | "medium" | "hard";
  feedback: string;
  highlight: string;
  improve: string;
  metrics: Metric;
  improvedAnswer: string;
  howToImprove: string[];
  missing: string[];
  worked: string[];
  tryNext: string[];
  spans: HighlightSpan[];
  tooShort?: boolean;
};

export type Interview = {
  id: string;
  date: string;
  role: string;
  level: Level;
  qas: QA[];
  overall: Metric;
  score: number;
};

const KEY_PROFILE = "hiremate.profile";
const KEY_HISTORY = "hiremate.history";

export const getProfile = (): Profile | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY_PROFILE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
export const saveProfile = (p: Profile) =>
  localStorage.setItem(KEY_PROFILE, JSON.stringify(p));

export const getHistory = (): Interview[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
export const saveInterview = (i: Interview) => {
  const all = getHistory();
  all.unshift(i);
  localStorage.setItem(KEY_HISTORY, JSON.stringify(all.slice(0, 30)));
};

// --- Role-specific question bank ---
type Bank = Record<"easy" | "medium" | "hard", string[]>;

const BANKS: Record<string, Bank> = {
  pm: {
    easy: [
      "Walk me through a product you love and why it works.",
      "What's a recent feature launch you admired? What made it land?",
      "How do you decide what to build next when everything feels important?",
    ],
    medium: [
      "Imagine you're PM for a feature with low adoption. What's your first move?",
      "How would you measure success for a new onboarding flow?",
      "Design a feature to help remote teams feel more connected. Walk me through your thinking.",
      "A stakeholder pushes a feature you disagree with. How do you respond?",
      "How would you improve the YouTube search experience?",
      "Estimate the daily revenue of a coffee shop near a busy office.",
    ],
    hard: [
      "You're PM for Instagram Reels. Engagement is up but creator retention is down. What do you do?",
      "Design a product for grocery shoppers with dietary restrictions. North-star metric?",
      "Your team has 6 weeks and a feature that needs 12. How do you cut scope without losing the bet?",
      "A core metric drops 20% overnight. Walk me through your investigation.",
    ],
  },
  swe: {
    easy: [
      "Explain the difference between an array and a linked list. When would you pick each?",
      "What happens when you type a URL into the browser and hit enter?",
      "Walk me through how you'd reverse a string in your favorite language.",
      "What's the difference between == and === in JavaScript?",
    ],
    medium: [
      "Walk me through how you'd design a URL shortener at scale.",
      "Explain the difference between SQL and NoSQL — when would you pick each?",
      "How would you debug a production endpoint that's randomly slow?",
      "Describe how you'd reduce a React app's time-to-interactive.",
      "Given an array of integers, find two that sum to a target. Walk me through your approach and the complexity.",
      "Design the data model for a multi-tenant SaaS app.",
    ],
    hard: [
      "Design a notification system that handles 1M concurrent users.",
      "How would you architect a real-time collaborative document editor?",
      "Design Twitter's timeline service. What are the trade-offs at 500M users?",
      "Implement an LRU cache. Walk me through your data structures and the time complexity of each operation.",
    ],
  },
  data: {
    easy: [
      "Walk me through how you'd find duplicate rows in a dataset.",
      "What's the difference between a JOIN and a UNION in SQL?",
      "How would you explain a confidence interval to a non-technical stakeholder?",
    ],
    medium: [
      "A KPI dropped 15% week-over-week. Walk me through your investigation.",
      "How would you design an A/B test for a new checkout flow?",
      "Write a SQL query to find the top 3 products by revenue per month.",
      "How would you measure whether a marketing campaign actually drove signups?",
    ],
    hard: [
      "How would you build a churn prediction model with limited labeled data?",
      "Design a dashboard for a CEO who wants 'one number' to track product health. What's the number, and why?",
      "Walk me through how you'd detect anomalies in a time-series of payments.",
    ],
  },
  ba: {
    easy: [
      "Walk me through how you'd gather requirements for a new internal tool.",
      "What's the difference between a user story and a use case?",
      "How do you prioritize requests from multiple stakeholders?",
    ],
    medium: [
      "A stakeholder gives you a vague request. How do you turn it into a clear scope?",
      "Walk me through a process improvement you led and the impact.",
      "How would you map the current state vs future state of a broken workflow?",
    ],
    hard: [
      "You inherit a project mid-flight with conflicting stakeholder goals. What's your first 2 weeks?",
      "Design the requirements doc for migrating a legacy CRM to a new platform.",
    ],
  },
  ux: {
    easy: [
      "Walk me through your design process from brief to ship.",
      "What's a recent design decision you made that you'd reconsider today?",
      "How do you balance user needs with business goals?",
    ],
    medium: [
      "Critique a product's onboarding flow you've used recently.",
      "How would you redesign the airline check-in experience?",
      "Walk me through how you'd test a new design with users on a 1-week timeline.",
    ],
    hard: [
      "Design an accessibility-first banking app for users 65+.",
      "Your engineering team says your design is 'too complex to build.' How do you respond?",
    ],
  },
  behavioral: {
    easy: [
      "Tell me about yourself.",
      "Why are you interested in this role?",
      "What's a project you're most proud of?",
    ],
    medium: [
      "Tell me about a time you disagreed with a teammate. How did you resolve it?",
      "Describe a challenge you faced and how you handled it.",
      "Tell me about a time you handled conflict on a team.",
      "Share a moment you failed. What did you take away from it?",
      "How do you prioritize when everything feels urgent?",
      "Tell me about a time you had to give difficult feedback.",
    ],
    hard: [
      "Tell me about the hardest decision you've made in the last year.",
      "Describe a time you went against the consensus and were proven right — or wrong.",
      "Walk me through a moment you led without authority.",
    ],
  },
};

function bucketsForRole(role: string): string[] {
  const r = role.toLowerCase();
  if (r.includes("behavioral") || r.includes("hr")) return ["behavioral"];
  if (r.includes("engineer") || r.includes("developer") || r.includes("swe") || r.includes("software")) {
    return ["swe", "behavioral"];
  }
  if (r.includes("product manager") || r.includes("product")) return ["pm", "behavioral"];
  if (r.includes("data")) return ["data", "behavioral"];
  if (r.includes("business analyst") || r.includes("business")) return ["ba", "behavioral"];
  if (r.includes("ux") || r.includes("design")) return ["ux", "behavioral"];
  return ["behavioral", "pm"];
}

const SEEN_KEY = "hiremate.seenQuestions";
function getSeen(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "[]");
  } catch {
    return [];
  }
}
function markSeen(q: string) {
  if (typeof window === "undefined") return;
  const all = getSeen();
  all.push(q);
  // keep last 60 to allow eventual recycling
  localStorage.setItem(SEEN_KEY, JSON.stringify(all.slice(-60)));
}

export function generateQuestion(
  role: string,
  difficulty: "easy" | "medium" | "hard",
  asked: string[],
): { question: string; difficulty: "easy" | "medium" | "hard" } {
  const buckets = bucketsForRole(role);
  const pool = buckets.flatMap((b) => BANKS[b]?.[difficulty] ?? []);
  const seen = new Set([...asked, ...getSeen()]);
  let fresh = pool.filter((q) => !seen.has(q));
  // Fallback: try other difficulties from the same buckets before recycling
  if (!fresh.length) {
    const wider = buckets.flatMap((b) => [
      ...(BANKS[b]?.easy ?? []),
      ...(BANKS[b]?.medium ?? []),
      ...(BANKS[b]?.hard ?? []),
    ]);
    fresh = wider.filter((q) => !seen.has(q));
  }
  const list = fresh.length ? fresh : pool;
  const question = list[Math.floor(Math.random() * list.length)];
  markSeen(question);
  return { question, difficulty };
}

// Adaptive: scale next difficulty based on previous metric average
export function nextDifficulty(prev?: Metric): "easy" | "medium" | "hard" {
  if (!prev) return "medium";
  const avg = (prev.clarity + prev.structure + prev.confidence + prev.relevance) / 4;
  if (avg >= 80) return "hard";
  if (avg >= 60) return "medium";
  return "easy";
}




// ===== Feedback engine =====
// Independent per-metric evaluators. Every "Try next time" tip is derived
// from a gap that also pulled its metric down — coaching and scores cannot
// contradict each other.

const HEDGE_RE = /\b(i think|i guess|maybe|kinda|kind of|sort of|probably|might|perhaps)\b/gi;
const FILLER_RE = /\b(um|uh|like|you know|basically|literally|actually|stuff|things)\b/gi;
const OWNERSHIP_RE = /\b(i (led|built|owned|shipped|decided|drove|designed|architected|delivered|launched|created|ran|managed))\b/gi;
const PASSIVE_RE = /\b(was|were)\s+\w+ed\b/gi;
const METRIC_RE = /(\d+\s?%|\d+x|\d+\s?(users|customers|ms|seconds|minutes|hours|days|weeks|months|k|m|bn|dollars|\$))/gi;
const CONNECTOR_RE = /\b(first|second|then|next|after that|finally|because|so that|as a result|therefore)\b/gi;

const SITUATION_RE = /\b(last (quarter|year|month|week)|at my|when i was|the team was|we were|context was|background)\b/i;
const TASK_RE = /\b(my (job|task|goal|role) was|i was asked|i needed to|owned|responsible for|the goal was)\b/i;
const ACTION_RE = /\b(i (led|built|shipped|decided|drove|designed|ran|created|proposed|coordinated|split|paired|scoped|prioritized|refactored|debugged))\b/i;
const RESULT_RE = /\b(as a result|the result|we shipped|we launched|we hit|we grew|we cut|we reduced|we improved|impact was|ended up|outcome)\b/i;

type SentenceInfo = { text: string; start: number; end: number };

function splitSentences(text: string): SentenceInfo[] {
  const out: SentenceInfo[] = [];
  const re = /[^.!?]+[.!?]?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const raw = m[0];
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const start = m.index + raw.indexOf(trimmed);
    out.push({ text: trimmed, start, end: start + trimmed.length });
  }
  return out;
}

function countMatches(re: RegExp, text: string): number {
  const m = text.match(re);
  return m ? m.length : 0;
}

// Detect question type
function questionType(question: string): "behavioral" | "technical" | "opinion" {
  if (/tell me|describe|share|time you|walk me through a time|proud of|failed|disagreed|conflict|handled/i.test(question)) return "behavioral";
  if (/design|architect|debug|scale|explain|database|sql|system|implement|complexity|reduce|measure|estimate|a\/b/i.test(question)) return "technical";
  return "opinion";
}

// ----- Per-metric evaluators -----

type Eval = { score: number; wins: string[]; gaps: { tag: string; tip: string }[] };

function evalClarity(answer: string, sentences: SentenceInfo[]): Eval {
  const wins: string[] = [];
  const gaps: { tag: string; tip: string }[] = [];
  const wc = answer.split(/\s+/).filter(Boolean).length;
  const sc = Math.max(sentences.length, 1);
  const avgLen = wc / sc;

  let score = 70;
  if (avgLen > 28) {
    score -= 20;
    gaps.push({ tag: "Long sentences", tip: `Your sentences average ${Math.round(avgLen)} words — break them up at natural pauses so each idea lands on its own.` });
  } else if (avgLen < 5 && sc > 2) {
    score -= 10;
    gaps.push({ tag: "Choppy phrasing", tip: "Your sentences are very short — try connecting related ideas so the answer flows." });
  } else {
    score += 8;
    wins.push("Sentence length is easy to follow — one idea per sentence.");
  }

  const fillers = countMatches(FILLER_RE, answer);
  if (fillers >= 3) {
    score -= 15;
    gaps.push({ tag: "Filler words", tip: `You used ${fillers} filler words (like/basically/stuff). Cut them — they dilute otherwise strong points.` });
  } else if (fillers === 0) {
    score += 5;
    wins.push("No filler words — every sentence carries weight.");
  }

  // Specificity: proper nouns or numbers
  const proper = (answer.match(/\b[A-Z][a-z]{2,}\b/g) ?? []).length;
  const numbers = countMatches(METRIC_RE, answer);
  if (proper + numbers >= 2) {
    score += 8;
    wins.push("Concrete details (names, numbers) make this feel real, not rehearsed.");
  } else {
    gaps.push({ tag: "Vague specifics", tip: "Name a specific tool, team, or number. Concrete details make the answer memorable." });
    score -= 5;
  }

  return { score: clamp(score), wins, gaps };
}

function evalConfidence(answer: string): Eval {
  const wins: string[] = [];
  const gaps: { tag: string; tip: string }[] = [];
  let score = 70;

  const hedges = countMatches(HEDGE_RE, answer);
  const ownership = countMatches(OWNERSHIP_RE, answer);
  const passives = countMatches(PASSIVE_RE, answer);

  if (hedges >= 2) {
    score -= 20;
    gaps.push({ tag: "Hedging language", tip: `You hedged ${hedges} times ("I think", "maybe"). Replace with decisive verbs — "I decided", "I led" — to sound in-command.` });
  } else if (hedges === 1) {
    score -= 8;
    gaps.push({ tag: "One hedge", tip: 'You said "I think" once — swap it for "I know" or drop the qualifier entirely.' });
  }

  if (ownership >= 2) {
    score += 15;
    wins.push("Strong ownership language — 'I led', 'I shipped' — you clearly own the story.");
  } else if (ownership === 0) {
    score -= 10;
    gaps.push({ tag: "No ownership verbs", tip: "You never said what YOU did. Use \"I led / I built / I decided\" to claim your part." });
  }

  if (passives >= 2) {
    score -= 10;
    gaps.push({ tag: "Passive voice", tip: 'Rewrite passives ("was decided", "were built") in active voice so it\'s clear who acted.' });
  }

  return { score: clamp(score), wins, gaps };
}

function evalRelevance(question: string, answer: string): Eval {
  const wins: string[] = [];
  const gaps: { tag: string; tip: string }[] = [];
  let score = 50;

  const o = overlap(question, answer);
  score += Math.round(o * 40);

  const qt = questionType(question);
  const hasMetric = METRIC_RE.test(answer);
  METRIC_RE.lastIndex = 0;

  if (o < 0.15) {
    score -= 15;
    gaps.push({ tag: "Drifts from question", tip: "Your answer doesn't repeat any of the key nouns from the question. Restate the question in your first sentence to anchor the response." });
  } else if (o >= 0.4) {
    wins.push("Directly addresses the question — no wandering.");
    score += 5;
  }

  if (qt === "technical" && /measure|metric|kpi|success/i.test(question) && !hasMetric) {
    score -= 10;
    gaps.push({ tag: "Missing metric", tip: "The question asks how you'd measure success — name a concrete metric (conversion %, DAU, latency ms)." });
  }

  const wc = answer.split(/\s+/).filter(Boolean).length;
  if (wc > 120 && o < 0.25) {
    score -= 10;
    gaps.push({ tag: "Tangential", tip: "Long answer, low overlap with the question — trim the setup and get to the answer sooner." });
  }

  return { score: clamp(score), wins, gaps };
}

function evalStructure(question: string, answer: string, sentences: SentenceInfo[]): Eval {
  const wins: string[] = [];
  const gaps: { tag: string; tip: string }[] = [];
  const qt = questionType(question);

  if (qt === "behavioral") {
    const s = SITUATION_RE.test(answer);
    const t = TASK_RE.test(answer);
    const a = ACTION_RE.test(answer);
    const r = RESULT_RE.test(answer) || METRIC_RE.test(answer);
    METRIC_RE.lastIndex = 0;
    const present = [s, t, a, r].filter(Boolean).length;

    let score = 25 + present * 15; // 0→25, 4→85

    const missing: string[] = [];
    if (!s) missing.push("Situation");
    if (!t) missing.push("Task");
    if (!a) missing.push("Action");
    if (!r) missing.push("Result");

    if (present === 4) {
      score += 8;
      wins.push("Full STAR structure — Situation, Task, Action, and Result all present.");
    }
    if (present === 3 && !r) {
      score = Math.min(score, 60);
      gaps.push({ tag: "No result", tip: "You described the Situation and Action but skipped the Result — say what changed after you shipped (metric, outcome, decision)." });
    } else if (missing.length === 1) {
      gaps.push({ tag: `Missing ${missing[0]}`, tip: `You're one piece short: name the ${missing[0]} in one sentence to complete the STAR arc.` });
    } else if (missing.length >= 2) {
      score = Math.min(score, 50);
      gaps.push({ tag: "Incomplete STAR", tip: `Your answer jumps into ${a ? "Action" : "the middle"} — set up ${missing.slice(0, 2).join(" and ")} first (one sentence each).` });
    }

    return { score: clamp(score), wins, gaps };
  }

  if (qt === "technical") {
    const connectors = countMatches(CONNECTOR_RE, answer);
    const tradeoff = /trade.?off|however|but|downside|drawback|instead|versus|vs\./i.test(answer);
    const constraints = /constraint|assume|scale|latency|throughput|read|write|budget/i.test(answer);

    let score = 50;
    if (constraints) { score += 15; wins.push("You set constraints up front — a senior habit."); }
    else gaps.push({ tag: "No constraints", tip: "Open with the constraints you're solving for (scale, latency, read/write ratio) before proposing a design." });

    if (connectors >= 2) { score += 10; wins.push("Clear step-by-step sequencing (first / then / finally)."); }
    else gaps.push({ tag: "No sequencing", tip: 'Signpost your steps — "First… then… finally…" — so the interviewer can follow the logic.' });

    if (tradeoff) { score += 15; wins.push("Named a trade-off — shows you weighed alternatives, not just picked one."); }
    else gaps.push({ tag: "No trade-off", tip: "End with a trade-off: what would you give up for this design, and why is that the right call here?" });

    return { score: clamp(score), wins, gaps };
  }

  // opinion / general
  const connectors = countMatches(CONNECTOR_RE, answer);
  let score = 55 + (connectors >= 2 ? 15 : 0) + (sentences.length >= 3 ? 10 : 0);
  if (connectors >= 2) wins.push("Logical connectors make the argument easy to follow.");
  else gaps.push({ tag: "No sequencing", tip: 'Use "first / because / so" to signal the shape of your argument.' });
  return { score: clamp(score), wins, gaps };
}

// ----- Spans (in-answer highlights) -----

function buildSpans(answer: string, sentences: SentenceInfo[]): HighlightSpan[] {
  const spans: HighlightSpan[] = [];
  for (const s of sentences) {
    const t = s.text;
    const hasHedge = HEDGE_RE.test(t); HEDGE_RE.lastIndex = 0;
    const hasFiller = FILLER_RE.test(t); FILLER_RE.lastIndex = 0;
    const hasOwnership = OWNERSHIP_RE.test(t); OWNERSHIP_RE.lastIndex = 0;
    const hasMetric = METRIC_RE.test(t); METRIC_RE.lastIndex = 0;
    const hasResult = RESULT_RE.test(t);
    const hasAction = ACTION_RE.test(t);

    if (hasMetric || hasResult || (hasOwnership && t.split(/\s+/).length > 8)) {
      spans.push({ start: s.start, end: s.end, type: "strong", tip: hasMetric ? "Concrete number — this is what makes answers memorable." : hasResult ? "Named the outcome — the interviewer now knows what changed." : "Strong ownership — 'I' + action verb makes your role clear." });
    } else if (hasHedge || hasFiller) {
      spans.push({ start: s.start, end: s.end, type: "vague", tip: hasHedge ? 'Hedging weakens this sentence. Try "I decided" instead of "I think we should".' : "Filler words (like/basically/stuff) dilute the point — cut them and the sentence gets stronger." });
    } else if (hasAction && !hasMetric && !hasResult) {
      // Action described but no outcome nearby
      spans.push({ start: s.start, end: s.end, type: "missing-impact", tip: "You described what you did but not the impact. Add one sentence: what changed after this?" });
    }
  }
  return spans;

// ----- STAR rewrite (coaching example, built from the candidate's own words) -----

export type StarRewrite = {
  situation: string;
  task: string;
  action: string;
  result: string;
  improvedAnswer: string;
  changes: string[];
  filledSlots: ("situation" | "task" | "action" | "result")[];
};

const HEDGE_STRIP_RE = /\b(i think that|i think|i guess|i mean|maybe|kinda|kind of|sort of|probably|perhaps)\b[,]?\s*/gi;
const FILLER_STRIP_RE = /\b(um|uh|you know|basically|literally|actually)\b[,]?\s*/gi;

function tidy(sentence: string): string {
  let s = sentence
    .replace(HEDGE_STRIP_RE, "")
    .replace(FILLER_STRIP_RE, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^[,;:\s]+/, "")
    .trim();
  if (!s) return "";
  s = s.charAt(0).toUpperCase() + s.slice(1);
  if (!/[.!?]$/.test(s)) s += ".";
  return s;
}

function joinTidy(list: string[]): string {
  return list.map(tidy).filter(Boolean).join(" ");
}

export function buildStarRewrite(
  question: string,
  answer: string,
  sentences: SentenceInfo[],
): StarRewrite {
  const buckets: Record<"situation" | "task" | "action" | "result", string[]> = {
    situation: [],
    task: [],
    action: [],
    result: [],
  };

  sentences.forEach((s, i) => {
    const t = s.text;
    METRIC_RE.lastIndex = 0;
    const hasMetric = METRIC_RE.test(t);
    METRIC_RE.lastIndex = 0;
    if (RESULT_RE.test(t) || hasMetric) buckets.result.push(t);
    else if (TASK_RE.test(t)) buckets.task.push(t);
    else if (ACTION_RE.test(t) || /\bi\s+\w+ed\b/i.test(t)) buckets.action.push(t);
    else if (SITUATION_RE.test(t) || i === 0) buckets.situation.push(t);
    else buckets.action.push(t);
  });

  const filledSlots: StarRewrite["filledSlots"] = [];

  let situation = joinTidy(buckets.situation);
  if (!situation) {
    situation = "[Set the scene in one line: where you were, when it happened, and why it mattered.]";
    filledSlots.push("situation");
  }

  let task = joinTidy(buckets.task);
  if (!task) {
    task = "[Name what you were responsible for: the goal you owned and the constraint you faced.]";
    filledSlots.push("task");
  }

  let action = joinTidy(buckets.action);
  if (!action) {
    action = "[Describe the two or three moves you personally made — start each with \"I\".]";
    filledSlots.push("action");
  }

  let result = joinTidy(buckets.result);
  METRIC_RE.lastIndex = 0;
  const answerHasMetric = METRIC_RE.test(answer);
  METRIC_RE.lastIndex = 0;
  if (!result) {
    result = "[Add the measurable outcome: %, time saved, revenue, or users affected — plus one line on what you learned.]";
    filledSlots.push("result");
  } else if (!answerHasMetric) {
    result += " [Add one number here — %, hours saved, users affected — so the impact is undeniable.]";
  }

  const improvedAnswer = `${situation} ${task} ${action} ${result}`.replace(/\s{2,}/g, " ").trim();

  // What actually changed between the original and the rewrite
  const changes: string[] = [];
  if (!answerHasMetric) changes.push("Added metrics — a number turns a story into evidence.");
  if (filledSlots.length) changes.push("Improved structure — the answer now runs Situation → Task → Action → Result.");
  if (!RESULT_RE.test(answer) || filledSlots.includes("result")) changes.push("Stronger impact — the answer now ends on the outcome, not the activity.");
  HEDGE_RE.lastIndex = 0;
  FILLER_RE.lastIndex = 0;
  if (countMatches(HEDGE_RE, answer) + countMatches(FILLER_RE, answer) > 0)
    changes.push("Clearer communication — hedges and filler words removed.");
  if (!SITUATION_RE.test(answer) || filledSlots.includes("situation"))
    changes.push("Better storytelling — opens with context so the interviewer can picture the scene.");
  if (!changes.length)
    changes.push("Tightened phrasing — same story, fewer words between the interviewer and the point.");

  return { situation, task, action, result, improvedAnswer, changes, filledSlots };
}

// ----- Main entry -----



export function scoreAnswer(question: string, answer: string): QA {
  const a = answer.trim();
  const words = a.split(/\s+/).filter(Boolean);
  const wc = words.length;

  const isGeneric = /^(ok(ay)?|yes|yeah|yep|no|nope|nah|sure|maybe|idk|dunno|n\/a|na|none|nothing)[.!?\s]*$/i.test(a);
  if (a.length < 12 || isGeneric) {
    const tooShortMsg =
      "It looks like your answer is too short. Try giving a more detailed response so I can provide meaningful feedback.";
    const lowMetrics: Metric = { clarity: 20, structure: 20, confidence: 20, relevance: 20 };
    return {
      id: crypto.randomUUID(),
      question,
      answer: a,
      difficulty: "medium",
      feedback: tooShortMsg,
      highlight: tooShortMsg,
      improve: "",
      metrics: lowMetrics,
      improvedAnswer: "",
      howToImprove: [],
      missing: [],
      worked: [],
      tryNext: [],
      spans: [],
      tooShort: true,
    };
  }

  const sentences = splitSentences(a);

  const clarity = evalClarity(a, sentences);
  const confidence = evalConfidence(a);
  const relevance = evalRelevance(question, a);
  const structure = evalStructure(question, a, sentences);

  const metrics: Metric = {
    clarity: Math.round(clarity.score),
    structure: Math.round(structure.score),
    confidence: Math.round(confidence.score),
    relevance: Math.round(relevance.score),
  };

  // Aggregate coaching — never mix worked with gaps
  const worked: string[] = [];
  const tryNext: string[] = [];
  const missing: string[] = [];

  // Only include a "worked" line when the metric actually scored well
  const gate = 75;
  if (metrics.clarity >= gate) worked.push(...clarity.wins);
  if (metrics.confidence >= gate) worked.push(...confidence.wins);
  if (metrics.relevance >= gate) worked.push(...relevance.wins);
  if (metrics.structure >= gate) worked.push(...structure.wins);

  // Gaps drive both tryNext copy and the short missing tags
  for (const g of [...structure.gaps, ...relevance.gaps, ...confidence.gaps, ...clarity.gaps]) {
    tryNext.push(g.tip);
    missing.push(g.tag);
  }

  // Fallbacks
  if (!worked.length) {
    if (wc > 30) worked.push("You gave the question a real attempt — enough substance to coach against.");
    else worked.push("You stayed on topic — that's the foundation.");
  }
  if (!tryNext.length) tryNext.push("Practice this answer out loud once — pacing is your last 10%.");

  // Cap to keep the card scannable
  const workedTop = worked.slice(0, 3);
  const tryNextTop = tryNext.slice(0, 3);
  const missingTop = Array.from(new Set(missing)).slice(0, 4);

  const spans = buildSpans(a, sentences);

  // Legacy joined strings for older consumers (dashboard/scorecard summaries)
  const highlight = workedTop[0] ?? "";
  const improve = tryNextTop[0] ?? "";
  const feedback = `${highlight} ${improve}`.trim();

  return {
    id: crypto.randomUUID(),
    question,
    answer: a,
    difficulty: "medium",
    feedback,
    highlight,
    improve,
    metrics,
    improvedAnswer: "",
    howToImprove: tryNextTop,
    missing: missingTop,
    worked: workedTop,
    tryNext: tryNextTop,
    spans,
  };
}


function clamp(n: number) {
  return Math.max(20, Math.min(98, n));
}
function overlap(q: string, a: string) {
  const stop = new Set(["the", "a", "an", "to", "of", "and", "in", "on", "for", "is", "it", "you", "your", "how", "what", "why", "would", "do"]);
  const qw = new Set(q.toLowerCase().match(/[a-z]{4,}/g)?.filter((w) => !stop.has(w)) ?? []);
  const aw = new Set(a.toLowerCase().match(/[a-z]{4,}/g) ?? []);
  if (!qw.size) return 0;
  let hit = 0;
  qw.forEach((w) => aw.has(w) && hit++);
  return hit / qw.size;
}

export function aggregate(qas: QA[]): { overall: Metric; score: number } {
  const n = qas.length || 1;
  const overall: Metric = {
    clarity: Math.round(qas.reduce((s, q) => s + q.metrics.clarity, 0) / n),
    structure: Math.round(qas.reduce((s, q) => s + q.metrics.structure, 0) / n),
    confidence: Math.round(qas.reduce((s, q) => s + q.metrics.confidence, 0) / n),
    relevance: Math.round(qas.reduce((s, q) => s + q.metrics.relevance, 0) / n),
  };
  const score = Math.round(
    (overall.clarity + overall.structure + overall.confidence + overall.relevance) / 4,
  );
  return { overall, score };
}

export function weakAreas(history: Interview[]): { key: keyof Metric; avg: number }[] {
  if (!history.length) return [];
  const keys: (keyof Metric)[] = ["clarity", "structure", "confidence", "relevance"];
  return keys
    .map((k) => ({
      key: k,
      avg: Math.round(history.reduce((s, h) => s + h.overall[k], 0) / history.length),
    }))
    .sort((a, b) => a.avg - b.avg);
}
