import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export default defineTool({
  name: "generate_interview_question",
  title: "Generate interview question",
  description:
    "Generate a mock interview question from HireMate's question bank for a given role and difficulty.",
  inputSchema: {
    role: z
      .string()
      .min(1)
      .describe("Target job role, e.g. 'Product Manager', 'Software Engineer', 'HR'."),
    difficulty: z
      .enum(DIFFICULTIES)
      .default("medium")
      .describe("Question difficulty: easy, medium, or hard."),
    asked: z
      .array(z.string())
      .default([])
      .describe("Questions already asked in this session, to avoid repeats."),
  },
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: false },
  handler: async ({ role, difficulty, asked }) => {
    const { generateQuestion } = await import("@/lib/hiremate");
    const result = generateQuestion(role, difficulty, asked);
    return {
      content: [
        {
          type: "text",
          text: `[${result.difficulty}] ${result.question}`,
        },
      ],
      structuredContent: result,
    };
  },
});
