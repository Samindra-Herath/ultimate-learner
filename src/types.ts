export type SourceType = "pdf" | "text" | "notes";

export interface StudySource {
  id: string;
  name: string;
  type: SourceType;
  content: string; // Plain text or base64-encoded PDF
  size: number;
}

export interface SimplifiedExplanation {
  coreIdea: string;
  analogy: string;
  keySteps: string[];
}

export interface TopicDetails {
  id: string;
  title: string;
  category: string;
  summary: string;
  fullExplanation: string; // Exhaustive academic content
  simplified: SimplifiedExplanation; // Elegant 3-step Feynman explanation
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface ExamQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface StudyGuide {
  id: string;
  title: string;
  createdAt: string;
  sources: Array<{ id: string; name: string; type: SourceType }>;
  topics: TopicDetails[];
  flashcards: Flashcard[];
  practiceExam: ExamQuestion[];
  quickSummary: string;
}
