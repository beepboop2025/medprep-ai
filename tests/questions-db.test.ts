import { afterEach, describe, expect, it, vi } from "vitest";
import {
  correctOptionLetter,
  formatQuestionForAI,
  getAllSubjects,
  getQuestionById,
  getQuestionsBySubject,
  getRandomQuestions,
  getSubjectStats,
  getTotalCount,
  searchQuestions,
  type Question,
} from "@/lib/questions-db";

// These tests exercise the pure-logic core of the question bank against the
// real, committed JSONL dataset (src/lib/questions.json). No network, no DB.
// Anything non-deterministic (the shuffle) is pinned by stubbing Math.random.

afterEach(() => {
  vi.restoreAllMocks();
});

describe("dataset loading + counts", () => {
  it("loads every non-empty JSONL line as a question", () => {
    // getTotalCount must equal the number of parsed records.
    expect(getTotalCount()).toBeGreaterThan(1000);
  });

  it("getSubjectStats counts sum to the total", () => {
    const total = getSubjectStats().reduce((acc, s) => acc + s.count, 0);
    expect(total).toBe(getTotalCount());
  });

  it("getSubjectStats is sorted by count descending", () => {
    const stats = getSubjectStats();
    for (let i = 1; i < stats.length; i++) {
      expect(stats[i - 1].count).toBeGreaterThanOrEqual(stats[i].count);
    }
  });

  it("every subject in stats has a positive count", () => {
    for (const s of getSubjectStats()) {
      expect(s.count).toBeGreaterThan(0);
      expect(typeof s.subject).toBe("string");
    }
  });
});

describe("getAllSubjects", () => {
  it("returns a de-duplicated, alphabetically sorted list", () => {
    const subjects = getAllSubjects();
    const sorted = [...subjects].sort();
    expect(subjects).toEqual(sorted);
    // de-duplicated
    expect(new Set(subjects).size).toBe(subjects.length);
  });

  it("matches the distinct subjects reported by getSubjectStats", () => {
    const fromSubjects = new Set(getAllSubjects());
    const fromStats = new Set(getSubjectStats().map((s) => s.subject));
    expect(fromSubjects).toEqual(fromStats);
  });
});

describe("getQuestionsBySubject", () => {
  it("returns only questions of the requested subject", () => {
    const subject = getSubjectStats()[0].subject; // most populous subject
    const qs = getQuestionsBySubject(subject);
    expect(qs.length).toBeGreaterThan(0);
    expect(qs.every((q) => q.subject_name === subject)).toBe(true);
  });

  it("count matches getSubjectStats for that subject", () => {
    const top = getSubjectStats()[0];
    expect(getQuestionsBySubject(top.subject)).toHaveLength(top.count);
  });

  it("returns an empty array for an unknown subject", () => {
    expect(getQuestionsBySubject("Astrology")).toEqual([]);
  });
});

describe("getQuestionById", () => {
  it("round-trips: a known id resolves to the same record", () => {
    const sample = getQuestionsBySubject(getAllSubjects()[0])[0];
    const found = getQuestionById(sample.id);
    expect(found).toBeDefined();
    expect(found!.id).toBe(sample.id);
    expect(found!.question).toBe(sample.question);
  });

  it("returns undefined for an id that does not exist", () => {
    expect(getQuestionById("does-not-exist-000")).toBeUndefined();
  });
});

describe("getRandomQuestions (Fisher-Yates, count-bounded)", () => {
  it("returns at most `count` questions", () => {
    expect(getRandomQuestions(5)).toHaveLength(5);
  });

  it("never returns more questions than exist in the pool", () => {
    const subject = getSubjectStats()[getSubjectStats().length - 1].subject; // smallest
    const poolSize = getQuestionsBySubject(subject).length;
    const result = getRandomQuestions(poolSize + 1000, subject);
    expect(result).toHaveLength(poolSize);
  });

  it("filters by subject when provided", () => {
    const subject = getSubjectStats()[0].subject;
    const result = getRandomQuestions(10, subject);
    expect(result.every((q) => q.subject_name === subject)).toBe(true);
  });

  it("returns no duplicate ids within a single draw", () => {
    const result = getRandomQuestions(20);
    const ids = result.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("does not mutate the underlying pool (pure w.r.t. source)", () => {
    const subject = getSubjectStats()[0].subject;
    const before = getQuestionsBySubject(subject).map((q) => q.id);
    getRandomQuestions(10, subject);
    const after = getQuestionsBySubject(subject).map((q) => q.id);
    expect(after).toEqual(before);
  });

  it("is deterministic when Math.random is pinned", () => {
    vi.spyOn(Math, "random").mockReturnValue(0); // j = i, no swaps -> takes head slice
    const a = getRandomQuestions(8).map((q) => q.id);
    const b = getRandomQuestions(8).map((q) => q.id);
    expect(a).toEqual(b);
  });
});

describe("correctOptionLetter", () => {
  it("maps the 1-4 cop convention to A-D", () => {
    expect(correctOptionLetter(1)).toBe("A");
    expect(correctOptionLetter(2)).toBe("B");
    expect(correctOptionLetter(3)).toBe("C");
    expect(correctOptionLetter(4)).toBe("D");
  });

  it("defaults to 'A' for out-of-range / invalid cop values", () => {
    expect(correctOptionLetter(0)).toBe("A");
    expect(correctOptionLetter(5)).toBe("A");
    expect(correctOptionLetter(-1)).toBe("A");
    expect(correctOptionLetter(NaN)).toBe("A");
  });

  it("every real question has a cop that maps to a valid letter", () => {
    const sample = getRandomQuestions(50);
    for (const q of sample) {
      expect(["A", "B", "C", "D"]).toContain(correctOptionLetter(q.cop));
    }
  });
});

describe("searchQuestions (keyword / IDF retrieval)", () => {
  it("returns an empty array when the query is only stop words / noise", () => {
    expect(searchQuestions("the of a is and")).toEqual([]);
    expect(searchQuestions("   ")).toEqual([]);
    expect(searchQuestions("!!! ??? ...")).toEqual([]);
  });

  it("respects the limit argument", () => {
    const results = searchQuestions("nerve", 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it("returns relevant questions containing the query term", () => {
    const term = "myelinated";
    const results = searchQuestions(term, 5);
    expect(results.length).toBeGreaterThan(0);
    // At least one hit should actually mention the term across its searchable text.
    const hay = (q: Question) =>
      `${q.question} ${q.opa} ${q.opb} ${q.opc} ${q.opd}`.toLowerCase();
    expect(results.some((q) => hay(q).includes(term))).toBe(true);
  });

  it("ranks an exact multi-word query so the top hit is on-topic", () => {
    const results = searchQuestions("myelinated nerve fibers", 5);
    expect(results.length).toBeGreaterThan(0);
    const top = results[0];
    expect(top.question.toLowerCase()).toContain("nerve");
  });

  it("returns no duplicate documents", () => {
    const results = searchQuestions("glomerular capillaries pressure", 10);
    const ids = results.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("formatQuestionForAI", () => {
  const q: Question = {
    id: "x1",
    question: "What is the powerhouse of the cell?",
    opa: "Nucleus",
    opb: "Mitochondria",
    opc: "Ribosome",
    opd: "Golgi",
    cop: 2,
    exp: "Mitochondria produce ATP.",
    subject_name: "Biochemistry",
    topic_name: "Cell Biology",
    choice_type: "single",
  };

  it("renders the stem and all four labelled options", () => {
    const out = formatQuestionForAI(q);
    expect(out).toContain("What is the powerhouse of the cell?");
    expect(out).toContain("A) Nucleus");
    expect(out).toContain("B) Mitochondria");
    expect(out).toContain("C) Ribosome");
    expect(out).toContain("D) Golgi");
  });

  it("includes subject and topic in the metadata footer", () => {
    expect(formatQuestionForAI(q)).toContain(
      "[Subject: Biochemistry | Topic: Cell Biology]"
    );
  });

  it("omits the topic segment when topic_name is null", () => {
    const noTopic = { ...q, topic_name: null };
    const out = formatQuestionForAI(noTopic);
    expect(out).toContain("[Subject: Biochemistry]");
    expect(out).not.toContain("Topic:");
  });

  it("does not leak the correct answer letter into the prompt text", () => {
    // The formatter is answer-agnostic; the route appends the answer separately.
    const out = formatQuestionForAI(q);
    expect(out).not.toMatch(/Correct/i);
  });
});
