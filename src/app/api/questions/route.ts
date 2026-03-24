import { NextRequest, NextResponse } from "next/server";
import {
  getRandomQuestions,
  getAllSubjects,
  getSubjectStats,
  getTotalCount,
} from "@/lib/questions-db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const action = searchParams.get("action") || "random";

  if (action === "subjects") {
    return NextResponse.json({ subjects: getAllSubjects() });
  }

  if (action === "stats") {
    return NextResponse.json({
      total: getTotalCount(),
      subjects: getSubjectStats(),
    });
  }

  // Default: return random questions
  const count = Math.min(Number(searchParams.get("count")) || 10, 50);
  const subject = searchParams.get("subject") || undefined;
  const questions = getRandomQuestions(count, subject);

  // Strip correct answer for quiz mode
  const stripped = questions.map(({ cop, exp, ...rest }) => ({
    ...rest,
    _id: rest.id, // keep id for answer checking
  }));

  return NextResponse.json({ questions: stripped });
}
