"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  id: string;
  question: string;
  opa: string;
  opb: string;
  opc: string;
  opd: string;
  subject_name: string;
  topic_name: string | null;
}

interface QuizCardProps {
  question: QuizQuestion;
  index: number;
  total: number;
  onAnswer: (questionId: string, selected: string, correct: boolean) => void;
  onAskAI: (questionId: string) => void;
}

const OPTIONS = ["A", "B", "C", "D"] as const;
const OPTION_KEYS: Record<string, "opa" | "opb" | "opc" | "opd"> = {
  A: "opa",
  B: "opb",
  C: "opc",
  D: "opd",
};

export function QuizCard({ question, index, total, onAnswer, onAskAI }: QuizCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<{
    correct: boolean;
    correctAnswer: string;
    explanation: string | null;
  } | null>(null);
  const [checking, setChecking] = useState(false);

  async function handleSelect(option: string) {
    if (result) return; // Already answered
    setSelected(option);
    setChecking(true);

    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, selected: option }),
      });
      const data = await res.json();
      setResult(data);
      onAnswer(question.id, option, data.correct);
    } catch {
      setChecking(false);
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-zinc-500">
          {index + 1} / {total}
        </span>
        <div className="flex gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
            {question.subject_name}
          </span>
          {question.topic_name && question.topic_name !== "None" && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800/50 text-zinc-500">
              {question.topic_name}
            </span>
          )}
        </div>
      </div>

      {/* Question */}
      <p className="text-zinc-100 text-lg leading-relaxed">{question.question}</p>

      {/* Options */}
      <div className="space-y-2">
        {OPTIONS.map((letter) => {
          const key = OPTION_KEYS[letter];
          const text = question[key];
          const isSelected = selected === letter;
          const isCorrect = result?.correctAnswer === letter;
          const isWrong = isSelected && result && !result.correct;

          return (
            <button
              key={letter}
              onClick={() => handleSelect(letter)}
              disabled={!!result || checking}
              className={cn(
                "w-full text-left px-4 py-3 rounded-lg border transition-all",
                "flex items-start gap-3",
                !result && !isSelected && "border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/50",
                !result && isSelected && "border-blue-500 bg-blue-500/10",
                isCorrect && "border-emerald-500 bg-emerald-500/10",
                isWrong && "border-red-500 bg-red-500/10",
                result && !isCorrect && !isWrong && "border-zinc-800/50 opacity-50",
                (!!result || checking) && "cursor-default"
              )}
            >
              <span
                className={cn(
                  "shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-mono font-medium",
                  !result && "bg-zinc-800 text-zinc-400",
                  isCorrect && "bg-emerald-500 text-white",
                  isWrong && "bg-red-500 text-white"
                )}
              >
                {isCorrect ? "✓" : isWrong ? "✗" : letter}
              </span>
              <span className="text-zinc-300 pt-0.5">{text}</span>
            </button>
          );
        })}
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-3 pt-2">
          <div
            className={cn(
              "text-sm font-medium",
              result.correct ? "text-emerald-400" : "text-red-400"
            )}
          >
            {result.correct ? "Correct!" : `Incorrect — the answer is ${result.correctAnswer}`}
          </div>

          {result.explanation && (
            <div className="text-sm text-zinc-400 leading-relaxed bg-zinc-800/50 rounded-lg p-4 border border-zinc-800">
              {result.explanation}
            </div>
          )}

          <button
            onClick={() => onAskAI(question.id)}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Ask AI to explain further
          </button>
        </div>
      )}
    </div>
  );
}
