import { NextRequest, NextResponse } from "next/server";
import { getQuestionById, correctOptionLetter } from "@/lib/questions-db";

export async function POST(req: NextRequest) {
  const { questionId, selected } = await req.json();

  const q = getQuestionById(questionId);
  if (!q) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const correctLetter = correctOptionLetter(q.cop);
  const isCorrect = selected === correctLetter;

  return NextResponse.json({
    correct: isCorrect,
    correctAnswer: correctLetter,
    explanation: q.exp && q.exp !== "None" ? q.exp : null,
    subject: q.subject_name,
    topic: q.topic_name,
  });
}
