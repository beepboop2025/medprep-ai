"use client";

import { cn } from "@/lib/utils";

interface SubjectPickerProps {
  subjects: { subject: string; count: number }[];
  selected: string | null;
  onSelect: (subject: string | null) => void;
}

export function SubjectPicker({ subjects, selected, onSelect }: SubjectPickerProps) {
  return (
    <div className="space-y-2">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "w-full text-left px-3 py-2 rounded-lg text-sm transition-all",
          !selected
            ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
        )}
      >
        All Subjects
        <span className="float-right text-xs text-zinc-600">
          {subjects.reduce((a, b) => a + b.count, 0)}
        </span>
      </button>
      {subjects.map(({ subject, count }) => (
        <button
          key={subject}
          onClick={() => onSelect(subject)}
          className={cn(
            "w-full text-left px-3 py-2 rounded-lg text-sm transition-all",
            selected === subject
              ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          )}
        >
          {subject}
          <span className="float-right text-xs text-zinc-600">{count}</span>
        </button>
      ))}
    </div>
  );
}
