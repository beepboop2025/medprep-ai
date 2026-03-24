"use client";

import { cn } from "@/lib/utils";

interface ScoreBarProps {
  correct: number;
  incorrect: number;
  total: number;
}

export function ScoreBar({ correct, incorrect, total }: ScoreBarProps) {
  const answered = correct + incorrect;
  const pct = answered > 0 ? Math.round((correct / answered) * 100) : 0;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-400">Session Score</span>
        <span className={cn(
          "text-2xl font-mono font-bold",
          pct >= 70 ? "text-emerald-400" : pct >= 50 ? "text-yellow-400" : "text-red-400"
        )}>
          {answered > 0 ? `${pct}%` : "—"}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden flex">
        {correct > 0 && (
          <div
            className="bg-emerald-500 transition-all duration-500"
            style={{ width: `${(correct / total) * 100}%` }}
          />
        )}
        {incorrect > 0 && (
          <div
            className="bg-red-500 transition-all duration-500"
            style={{ width: `${(incorrect / total) * 100}%` }}
          />
        )}
      </div>

      <div className="flex justify-between text-xs text-zinc-500 font-mono">
        <span className="text-emerald-500">{correct} correct</span>
        <span>{answered}/{total} answered</span>
        <span className="text-red-500">{incorrect} wrong</span>
      </div>
    </div>
  );
}
