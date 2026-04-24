// HireMate prototype data + helpers (mocked AI, localStorage persistence)

export type Level = "Junior" | "Mid" | "Senior";
export type Company = "Big Tech" | "Startup" | "Consulting" | "General";
export type Profile = {
  role: string;
  level: Level;
  focus: string[];
  company?: Company;
  resumeName?: string;
};

export type Metric = {
  clarity: number;
  structure: number;
  confidence: number;
  relevance: number;
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

// Mock feedback scoring — deterministic-ish from answer length & keywords
export function scoreAnswer(question: string, answer: string): QA {
  const a = answer.trim();
  const words = a.split(/\s+/).filter(Boolean);
  const wc = words.length;

  // Too-short / generic answers: skip positive feedback entirely.
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
      tooShort: true,
    };
  }

  const hasStructure = /first|second|then|finally|step|because|so that/i.test(a);
  const hasMetric = /\d+%|\d+\s?(users|ms|x|hours|weeks)/i.test(a);
  const hasSTAR = /(situation|task|action|result)/i.test(a);

  const clarity = clamp(40 + Math.min(wc, 120) * 0.4 + (a.includes(",") ? 5 : 0));
  const structure = clamp(45 + (hasStructure ? 25 : 0) + (hasSTAR ? 15 : 0) + Math.min(wc, 80) * 0.1);
  const confidence = clamp(
    55 + (wc > 40 ? 15 : 0) - (/(maybe|i think|kinda|sort of|i guess)/i.test(a) ? 15 : 0),
  );
  const relevance = clamp(
    50 + (overlap(question, a) * 30) + (hasMetric ? 10 : 0),
  );

  const metrics: Metric = {
    clarity: Math.round(clarity),
    structure: Math.round(structure),
    confidence: Math.round(confidence),
    relevance: Math.round(relevance),
  };

  const avg = (metrics.clarity + metrics.structure + metrics.confidence + metrics.relevance) / 4;
  const opener =
    avg >= 80
      ? "Really strong answer — this is interview-ready. "
      : avg >= 65
        ? "You're on the right track. "
        : avg >= 50
          ? "Good start, but let's sharpen this. "
          : "Solid attempt — let's build on it together. ";

  const highlightCore =
    hasMetric
      ? "Strong use of concrete numbers — that lands."
      : hasStructure
        ? "Nice logical flow, easy to follow."
        : wc > 60
          ? "Good depth in your reasoning."
          : "Clear and direct — no fluff.";
  const highlight = opener + highlightCore;

  const improve =
    !hasSTAR && /tell me|describe|share/i.test(question)
      ? "Try the STAR format: Situation → Task → Action → Result."
      : !hasMetric
        ? "Anchor your impact with a number (%, users, time saved)."
        : wc < 40
          ? "Stretch the answer — add one specific example."
          : "Trim filler words like 'kinda' and 'I think' to sound more decisive.";

  const feedback = `${highlight} ${improve}`;

  // Missing element tags
  const missing: string[] = [];
  if (!hasMetric) missing.push("Missing metric");
  if (!hasStructure && !hasSTAR) missing.push("No clear structure");
  if (wc < 40) missing.push("Lacks depth");
  if (overlap(question, a) < 0.15) missing.push("Drifts from question");
  if (/(maybe|i think|kinda|sort of|i guess)/i.test(a)) missing.push("Hedging language");

  // How to improve — actionable bullets
  const howToImprove: string[] = [];
  if (!hasSTAR && /tell me|describe|share/i.test(question)) {
    howToImprove.push("Structure your answer using the STAR method (Situation → Task → Action → Result).");
  }
  if (!hasMetric) howToImprove.push("Add a specific metric — %, users impacted, time saved, revenue.");
  if (wc < 40) howToImprove.push("Add one concrete example to ground the answer.");
  if (wc > 180) howToImprove.push("Be more concise — aim for 90–120 words.");
  if (/(maybe|i think|kinda|sort of|i guess)/i.test(a)) {
    howToImprove.push("Replace hedges ('I think', 'kinda') with ownership verbs ('I led', 'I shipped').");
  }
  if (!howToImprove.length) howToImprove.push("Practice this answer out loud once — pacing is your last 10%.");

  const improvedAnswer = buildImprovedAnswer(question, a);

  return {
    id: crypto.randomUUID(),
    question,
    answer: a,
    difficulty: "medium",
    feedback,
    highlight,
    improve,
    metrics,
    improvedAnswer,
    howToImprove,
    missing,
  };
}

function buildImprovedAnswer(question: string, answer: string): string {
  const isBehavioral = /tell me|describe|share|time you|proud of|failed|disagreed|prioritize/i.test(question);
  const isTechnical = /design|architect|debug|scale|reduce|explain|database|sql|system/i.test(question);
  const seed = answer.split(/[.!?]/)[0]?.trim().slice(0, 90) || "a recent project I led";

  if (isBehavioral) {
    return [
      `Situation — Last quarter, ${seed.toLowerCase()}; the team was blocked and the deadline was two weeks out.`,
      `Task — I owned unblocking us without slipping the date.`,
      `Action — I split the work into three tracks, paired with engineering daily, and cut scope on the lowest-impact piece.`,
      `Result — We shipped on time, cut the bug rate by 40%, and the pattern became our default for the next two launches.`,
    ].join(" ");
  }
  if (isTechnical) {
    return [
      `First, I'd clarify constraints — read/write ratio, expected scale, latency budget.`,
      `Then the core path: an API in front of a primary store, with a cache for hot reads.`,
      `For scale, shard by user_id, push static assets to a CDN, and queue writes async — that gets us under 100ms p95 in similar systems.`,
      `Trade-off: stronger consistency would cost ~30ms; for this use case, eventual is the right call.`,
    ].join(" ");
  }
  return [
    `Short version: ${seed}.`,
    `What made it work was a clear hypothesis up front and one metric we agreed to move.`,
    `In six weeks we lifted that metric by 25% — and the team kept using the process long after.`,
  ].join(" ");
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
