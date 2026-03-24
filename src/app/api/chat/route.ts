import { streamText, convertToModelMessages } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import {
  getQuestionById,
  formatQuestionForAI,
  correctOptionLetter,
  searchQuestions,
} from "@/lib/questions-db";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const questionId = url.searchParams.get("questionId");
  const { messages } = await req.json();

  // Extract the latest user message for RAG search
  const lastUserMsg = [...messages]
    .reverse()
    .find((m: { role: string }) => m.role === "user");
  const userQuery =
    lastUserMsg?.content ||
    lastUserMsg?.parts?.find((p: { type: string }) => p.type === "text")?.text ||
    "";

  let systemContext = `You are MedPrep AI, an expert medical exam tutor powered by Claude. You specialize in helping students prepare for medical licensing exams (USMLE, NEET-PG, PLAB, etc.).

Your approach:
- When a student asks about a medical topic, explain it clearly with clinical relevance
- When reviewing a question, analyze ALL options — explain why the correct answer is right AND why each wrong answer is wrong
- Use mnemonics when helpful
- Reference high-yield facts for exam preparation
- If the student is struggling, break concepts into simpler parts
- Be encouraging but accurate — never give incorrect medical information
- When you reference questions from the database, cite the subject and topic

You have access to a database of 4,000+ medical MCQs across 21 subjects.`;

  // If a specific question is referenced (from "Ask AI" button)
  if (questionId) {
    const q = getQuestionById(questionId);
    if (q) {
      const letter = correctOptionLetter(q.cop);
      systemContext += `\n\n--- CURRENT QUESTION CONTEXT ---\n${formatQuestionForAI(q)}\n\nCorrect Answer: ${letter}\n${q.exp ? `Explanation: ${q.exp}` : ""}`;
    }
  }

  // RAG: retrieve relevant questions for the user's query
  if (userQuery && !questionId) {
    const relevant = searchQuestions(userQuery, 5);
    if (relevant.length > 0) {
      systemContext += "\n\n--- RELEVANT QUESTIONS FROM DATABASE ---";
      for (const q of relevant) {
        const letter = correctOptionLetter(q.cop);
        systemContext += `\n\n${formatQuestionForAI(q)}\nCorrect: ${letter}`;
        if (q.exp && q.exp !== "None") {
          systemContext += `\nExplanation: ${q.exp}`;
        }
      }
      systemContext +=
        "\n\n(Use these questions as reference material to support your answer. Cite specific questions when relevant.)";
    }
  }

  const result = streamText({
    model: anthropic("claude-sonnet-4-6-20250514"),
    system: systemContext,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
