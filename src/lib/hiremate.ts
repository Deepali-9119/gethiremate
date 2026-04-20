// HireMate prototype data + helpers (mocked AI, localStorage persistence)

export type Level = "Junior" | "Mid" | "Senior";
export type Profile = {
  role: string;
  level: Level;
  focus: string[];
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

// --- Mock adaptive question bank ---
const BANK: Record<string, string[]> = {
  behavioral: [
    "Tell me about a time you disagreed with a teammate. How did you resolve it?",
    "Describe a project you're most proud of and why.",
    "Share a moment you failed. What did you take away from it?",
    "How do you prioritize when everything feels urgent?",
  ],
  technical: [
    "Walk me through how you'd design a URL shortener at scale.",
    "Explain the difference between SQL and NoSQL — when would you pick each?",
    "How would you debug a production endpoint that's randomly slow?",
    "Describe how you'd reduce a React app's time-to-interactive.",
  ],
  product: [
    "Imagine you're PM for a feature with low adoption. What's your first move?",
    "How would you measure success for a new onboarding flow?",
    "A stakeholder pushes a feature you disagree with. How do you respond?",
  ],
  system: [
    "Design a notification system that handles 1M users.",
    "How would you architect a real-time collaborative document editor?",
  ],
};

export function generateQuestion(
  role: string,
  difficulty: "easy" | "medium" | "hard",
  asked: string[],
): { question: string; difficulty: "easy" | "medium" | "hard" } {
  const r = role.toLowerCase();
  const buckets: string[] = [];
  if (r.includes("engineer") || r.includes("developer") || r.includes("swe")) {
    buckets.push("technical", "system", "behavioral");
  } else if (r.includes("product")) {
    buckets.push("product", "behavioral");
  } else {
    buckets.push("behavioral", "product");
  }
  const pool = buckets.flatMap((b) => BANK[b] ?? []);
  const fresh = pool.filter((q) => !asked.includes(q));
  const list = fresh.length ? fresh : pool;
  const question = list[Math.floor(Math.random() * list.length)];
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

  return {
    id: crypto.randomUUID(),
    question,
    answer: a,
    difficulty: "medium",
    feedback,
    highlight,
    improve,
    metrics,
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
