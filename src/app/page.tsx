"use client";

import { useState, useEffect, useCallback } from "react";
import { QuizCard } from "@/components/quiz-card";
import { ChatPanel } from "@/components/chat-panel";
import { SubjectPicker } from "@/components/subject-picker";
import { ScoreBar } from "@/components/score-bar";

interface Question {
  id: string;
  question: string;
  opa: string;
  opb: string;
  opc: string;
  opd: string;
  subject_name: string;
  topic_name: string | null;
}

type View = "landing" | "quiz" | "chat";

export default function Home() {
  const [view, setView] = useState<View>("landing");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<{ subject: string; count: number }[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatQuestionId, setChatQuestionId] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [quizCount, setQuizCount] = useState(10);

  useEffect(() => {
    fetch("/api/questions?action=stats")
      .then((r) => r.json())
      .then((data) => {
        setSubjects(data.subjects);
        setTotalCount(data.total);
      });
  }, []);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setScore({ correct: 0, incorrect: 0 });
    const params = new URLSearchParams({ count: String(quizCount) });
    if (selectedSubject) params.set("subject", selectedSubject);
    const res = await fetch(`/api/questions?${params}`);
    const data = await res.json();
    setQuestions(data.questions);
    setLoading(false);
    setView("quiz");
  }, [selectedSubject, quizCount]);

  function handleAnswer(_id: string, _selected: string, correct: boolean) {
    setScore((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      incorrect: prev.incorrect + (correct ? 0 : 1),
    }));
  }

  function handleAskAI(questionId: string) {
    setChatQuestionId(questionId);
    setView("chat");
  }

  // --- Landing ---
  if (view === "landing") {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-zinc-800/50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm font-bold">
                M
              </div>
              <span className="text-base font-semibold tracking-tight">
                MedPrep AI
              </span>
            </div>
            <a
              href="https://github.com/beepboop2025/medprep-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
          <div className="max-w-2xl text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 text-xs text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Powered by Claude · {totalCount.toLocaleString()} questions
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1]">
              Ace your medical
              <br />
              <span className="text-blue-500">exams with AI</span>
            </h1>

            <p className="text-lg text-zinc-400 max-w-lg mx-auto leading-relaxed">
              Practice {totalCount.toLocaleString()} MCQs across {subjects.length} subjects with
              instant feedback and an AI tutor that explains every answer.
            </p>

            {/* CTAs */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={loadQuestions}
                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-all text-sm"
              >
                Start Practicing
              </button>
              <button
                onClick={() => {
                  setChatQuestionId(null);
                  setView("chat");
                }}
                className="px-6 py-3 rounded-xl border border-zinc-800 text-zinc-300 font-medium hover:border-zinc-600 hover:text-white transition-all text-sm"
              >
                Ask AI Tutor
              </button>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-4 pt-6 max-w-md mx-auto">
              {[
                { label: "Questions", value: totalCount.toLocaleString() },
                { label: "Subjects", value: String(subjects.length) },
                { label: "AI Model", value: "Claude" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 text-center"
                >
                  <div className="text-xl font-bold font-mono text-zinc-100">
                    {stat.value}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Subject pills */}
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {subjects.slice(0, 10).map(({ subject }) => (
                <button
                  key={subject}
                  onClick={() => {
                    setSelectedSubject(subject);
                    loadQuestions();
                  }}
                  className="text-xs px-3 py-1 rounded-full border border-zinc-800/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-all"
                >
                  {subject}
                </button>
              ))}
              {subjects.length > 10 && (
                <span className="text-xs px-3 py-1 text-zinc-600">
                  +{subjects.length - 10} more
                </span>
              )}
            </div>
          </div>
        </main>

        <footer className="border-t border-zinc-800/50 py-6 text-center text-xs text-zinc-600">
          Built with Next.js, AI SDK &amp; Claude · Dataset: MedMCQA
        </footer>
      </div>
    );
  }

  // --- Quiz / Chat ---
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setView("landing")}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-xs font-bold">
              M
            </div>
            <span className="text-sm font-semibold tracking-tight">
              MedPrep AI
            </span>
          </button>

          <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-0.5">
            <button
              onClick={() => setView("quiz")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === "quiz"
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Quiz
            </button>
            <button
              onClick={() => {
                setChatQuestionId(null);
                setView("chat");
              }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === "chat"
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              AI Tutor
            </button>
          </div>

          <div className="text-xs text-zinc-600 font-mono hidden sm:block">
            {selectedSubject || "All Subjects"} · {quizCount}q
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {view === "quiz" ? (
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
            <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
              <ScoreBar
                correct={score.correct}
                incorrect={score.incorrect}
                total={quizCount}
              />

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
                <label className="text-xs text-zinc-500 uppercase tracking-wider">
                  Questions per round
                </label>
                <div className="flex gap-2">
                  {[5, 10, 20, 50].map((n) => (
                    <button
                      key={n}
                      onClick={() => setQuizCount(n)}
                      className={`flex-1 py-1.5 rounded-lg text-sm font-mono transition-all ${
                        quizCount === n
                          ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                          : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider">
                    Subject
                  </span>
                  <button
                    onClick={loadQuestions}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    New Round
                  </button>
                </div>
                <div className="max-h-[50vh] overflow-y-auto pr-1 -mr-1">
                  <SubjectPicker
                    subjects={subjects}
                    selected={selectedSubject}
                    onSelect={setSelectedSubject}
                  />
                </div>
              </div>
            </aside>

            <main className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin w-6 h-6 border-2 border-zinc-700 border-t-blue-500 rounded-full" />
                </div>
              ) : (
                questions.map((q, i) => (
                  <QuizCard
                    key={q.id}
                    question={q}
                    index={i}
                    total={questions.length}
                    onAnswer={handleAnswer}
                    onAskAI={handleAskAI}
                  />
                ))
              )}

              {!loading && questions.length > 0 && (
                <button
                  onClick={loadQuestions}
                  className="w-full py-3 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-all text-sm"
                >
                  Load New Questions
                </button>
              )}
            </main>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto h-[calc(100vh-8rem)]">
            <ChatPanel
              questionId={chatQuestionId}
              onClose={() => setView("quiz")}
            />
          </div>
        )}
      </div>
    </div>
  );
}
