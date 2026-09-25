// Shared types for the Learn tab's content model.

export type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type LessonBlock =
  | { type: "heading"; text: string }
  | { type: "p"; text: string }
  | { type: "example"; title?: string; text: string }
  | { type: "analogy"; text: string }
  | { type: "terms"; items: { term: string; def: string }[] }
  | { type: "list"; ordered?: boolean; items: string[] }
  | { type: "app"; text: string; href: string; linkLabel: string }
  | { type: "compare"; headers: string[]; rows: string[][] }
  | { type: "callout"; variant: "tip" | "warning"; text: string }
  | { type: "resources"; items: { title: string; url: string; source: string; kind: "article" | "video" }[] }
  | { type: "video"; items: { title: string; url: string; source: string }[] };

export type Lesson = {
  slug: string;
  title: string;
  summary: string;
  minutes: number;
  blocks: LessonBlock[];
  quiz: QuizQuestion[];
};

export type LearnModule = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  lessons: Lesson[];
  /** Integrative review test covering every lesson in this module. */
  test: QuizQuestion[];
};

export type FinalExam = {
  title: string;
  description: string;
  questions: QuizQuestion[];
};
