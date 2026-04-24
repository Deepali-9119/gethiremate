// Lightweight session persistence for interview history.
// Frontend-only, stored under "hiremate_sessions" in localStorage.

import type { QA, Metric } from "./hiremate";

export type StoredSession = {
  id: string;
  role: string;
  date: string; // ISO timestamp
  overall_score: number;
  breakdown_scores: Metric;
  strengths: string[];
  improvements: string[];
};

export const SESSIONS_KEY = "hiremate_sessions";

export function getSessions(): StoredSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredSession[]) : [];
  } catch {
    return [];
  }
}

export function appendSession(session: StoredSession): StoredSession[] {
  if (typeof window === "undefined") return [];
  const existing = getSessions();
  const next = [...existing, session];
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(next));
  return next;
}

// Pull 2–3 strengths and 2–3 improvements from per-question feedback.
export function summarizeQAs(qas: QA[]): { strengths: string[]; improvements: string[] } {
  const strengths: string[] = [];
  const improvements: string[] = [];
  const seenS = new Set<string>();
  const seenI = new Set<string>();

  for (const qa of qas) {
    if (qa.highlight && !seenS.has(qa.highlight)) {
      seenS.add(qa.highlight);
      strengths.push(qa.highlight);
    }
    for (const tip of qa.howToImprove ?? []) {
      if (tip && !seenI.has(tip)) {
        seenI.add(tip);
        improvements.push(tip);
      }
    }
    if (qa.improve && !seenI.has(qa.improve)) {
      seenI.add(qa.improve);
      improvements.push(qa.improve);
    }
  }

  return {
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 3),
  };
}
