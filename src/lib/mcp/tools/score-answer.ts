import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "score_answer",
  title: "Score interview answer",
  description:
    "Evaluate a candidate's answer to an interview question. Returns a score breakdown (clarity, structure, confidence, relevance), strengths, and areas of improvement.",
  inputSchema: {
    question: z.string().min(1).describe("The interview question that was asked."),
    answer: z.string().min(1).describe("The candidate's answer to score."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ question, answer }) => {
    const { scoreAnswer } = await import("@/lib/hiremate");
    const qa = scoreAnswer(question, answer);
    const summary = qa.tooShort
      ? "Answer too short to evaluate meaningfully."
      : `What worked:\n- ${qa.worked.join("\n- ")}\n\nTry next time:\n- ${qa.tryNext.join("\n- ")}`;
    return {
      content: [{ type: "text", text: summary }],
      structuredContent: {
        metrics: qa.metrics,
        worked: qa.worked,
        tryNext: qa.tryNext,
        missing: qa.missing,
        spans: qa.spans,
        tooShort: qa.tooShort ?? false,
      },
    };
  },
});
