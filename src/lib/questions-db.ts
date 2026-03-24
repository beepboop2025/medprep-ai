import { readFileSync } from "fs";
import { join } from "path";

export interface Question {
  id: string;
  question: string;
  opa: string;
  opb: string;
  opc: string;
  opd: string;
  cop: number; // 1=A, 2=B, 3=C, 4=D
  exp: string | null;
  subject_name: string;
  topic_name: string | null;
  choice_type: string;
}

let _questions: Question[] | null = null;

function getQuestions(): Question[] {
  if (_questions) return _questions;
  const filePath = join(process.cwd(), "src", "lib", "questions.json");
  const raw = readFileSync(filePath, "utf-8");
  _questions = raw
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  return _questions!;
}

export function getAllSubjects(): string[] {
  const subjects = new Set(getQuestions().map((q) => q.subject_name));
  return Array.from(subjects).sort();
}

export function getQuestionsBySubject(subject: string): Question[] {
  return getQuestions().filter((q) => q.subject_name === subject);
}

export function getRandomQuestions(count: number, subject?: string): Question[] {
  const pool = subject ? getQuestionsBySubject(subject) : getQuestions();
  // Fisher-Yates shuffle (partial — only shuffle `count` elements)
  const arr = [...pool];
  const n = Math.min(count, arr.length);
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(Math.random() * (arr.length - i));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}

export function getQuestionById(id: string): Question | undefined {
  return getQuestions().find((q) => q.id === id);
}

export function getSubjectStats(): { subject: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const q of getQuestions()) {
    counts.set(q.subject_name, (counts.get(q.subject_name) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([subject, count]) => ({ subject, count }))
    .sort((a, b) => b.count - a.count);
}

export function getTotalCount(): number {
  return getQuestions().length;
}

const OPTION_MAP: Record<number, string> = { 1: "A", 2: "B", 3: "C", 4: "D" };

export function correctOptionLetter(cop: number): string {
  return OPTION_MAP[cop] || "A";
}

// --- RAG: keyword-based search ---

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "can", "of", "in", "to", "for",
  "with", "on", "at", "by", "from", "as", "into", "through", "during",
  "before", "after", "above", "below", "between", "and", "but", "or",
  "not", "no", "nor", "so", "yet", "both", "either", "neither", "each",
  "every", "all", "any", "few", "more", "most", "other", "some", "such",
  "than", "too", "very", "just", "about", "up", "out", "it", "its",
  "this", "that", "these", "those", "which", "what", "who", "whom",
  "how", "when", "where", "why", "if", "then", "because", "while",
  "following", "true", "false", "correct", "incorrect", "except",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

// Build inverted index lazily
let _index: Map<string, Set<number>> | null = null;
let _docTokens: Map<number, Set<string>> | null = null;

function buildIndex() {
  if (_index) return;
  _index = new Map();
  _docTokens = new Map();

  const questions = getQuestions();
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const text = `${q.question} ${q.opa} ${q.opb} ${q.opc} ${q.opd} ${q.subject_name} ${q.topic_name || ""}`;
    const tokens = new Set(tokenize(text));
    _docTokens.set(i, tokens);

    for (const token of tokens) {
      if (!_index.has(token)) _index.set(token, new Set());
      _index.get(token)!.add(i);
    }
  }
}

export function searchQuestions(query: string, limit: number = 5): Question[] {
  buildIndex();
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const questions = getQuestions();
  const scores = new Map<number, number>();

  // IDF-weighted scoring: rarer terms get higher weight
  const totalDocs = questions.length;
  for (const token of queryTokens) {
    const docs = _index!.get(token);
    if (!docs) continue;
    const idf = Math.log(totalDocs / (docs.size + 1));
    for (const docIdx of docs) {
      scores.set(docIdx, (scores.get(docIdx) || 0) + idf);
    }
  }

  // Sort by score descending, take top N
  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([idx]) => questions[idx]);
}

export function formatQuestionForAI(q: Question): string {
  return [
    q.question,
    "",
    `A) ${q.opa}`,
    `B) ${q.opb}`,
    `C) ${q.opc}`,
    `D) ${q.opd}`,
    "",
    `[Subject: ${q.subject_name}${q.topic_name ? ` | Topic: ${q.topic_name}` : ""}]`,
  ].join("\n");
}
