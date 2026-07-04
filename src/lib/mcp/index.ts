import { defineMcp } from "@lovable.dev/mcp-js";
import generateInterviewQuestion from "./tools/generate-interview-question";
import scoreAnswer from "./tools/score-answer";

export default defineMcp({
  name: "hiremate-mcp",
  title: "HireMate MCP",
  version: "0.1.0",
  instructions:
    "Tools for HireMate mock interview practice. Use `generate_interview_question` to draw a fresh interview question for a role/difficulty, and `score_answer` to get a per-answer scorecard with strengths and improvements.",
  tools: [generateInterviewQuestion, scoreAnswer],
});
