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

export interface ExamAttempt {
  id: string;
  timestamp: string;
  score: number;
  totalQuestions: number;
  userAnswers: Record<string, string>; // questionId -> selectedOption
}

export interface StudyProgress {
  completedTopicIds: string[];
  masteredFlashcardIds: string[];
  examAttempts: ExamAttempt[];
}

// --- Folder Organization ---

export const FOLDER_COLORS = ['blue', 'green', 'purple', 'orange', 'red', 'teal'] as const;
export type FolderColor = typeof FOLDER_COLORS[number];

export interface StudyFolder {
  id: string;
  name: string;
  color: FolderColor;
  createdAt: string;
}

export interface StudyGuide {
  id: string;
  title: string;
  createdAt: string;
  folderId?: string; // Links to StudyFolder.id; undefined = unfiled
  sources: Array<{ id: string; name: string; type: SourceType }>;
  topics: TopicDetails[];
  flashcards: Flashcard[];
  practiceExam: ExamQuestion[];
  quickSummary: string;
  progress?: StudyProgress; // Added progress history tracking field
}

