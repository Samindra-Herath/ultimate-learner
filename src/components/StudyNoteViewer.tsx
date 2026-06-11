import React, { useState } from "react";
import {
  Download,
  BookOpen,
  Sparkles,
  Award,
  BookMarked,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  TrendingUp,
  RefreshCw,
  Lightbulb,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { StudyGuide, TopicDetails, Flashcard, ExamQuestion } from "../types";
import { exportStudyGuideToPDF } from "../utils/pdfExporter";
import MarkdownRenderer from "./MarkdownRenderer";

interface StudyNoteViewerProps {
  guide: StudyGuide;
}

export default function StudyNoteViewer({ guide }: StudyNoteViewerProps) {
  const [activeTab, setActiveTab] = useState<"notes" | "flashcards" | "exam">("notes");
  
  // Topic and Checklists progress tracking
  const [completedTopics, setCompletedTopics] = useState<Record<string, boolean>>({});
  const [selectedTopic, setSelectedTopic] = useState<TopicDetails | null>(
    guide.topics && guide.topics.length > 0 ? guide.topics[0] : null
  );

  // Layout controls (Syllabus checklist outline)
  const [isOutlineOpen, setIsOutlineOpen] = useState(true);

  // Feynman co-pilot modal
  const [showFeynmanCoPilot, setShowFeynmanCoPilot] = useState(false);

  // Flashcards state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Practice Exam state
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Calculate syllabus coverage
  const totalTopics = guide.topics?.length || 0;
  const completedCount = Object.values(completedTopics).filter(Boolean).length;
  const coveragePercent = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

  const toggleTopicCompleted = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompletedTopics((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSelectTopic = (topic: TopicDetails) => {
    setSelectedTopic(topic);
    setIsFlipped(false);
  };

  // Exam handlers
  const handleAnswerSelect = (questionId: string, option: string) => {
    if (examSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleSubmitExam = () => {
    let corrCount = 0;
    guide.practiceExam.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswer) {
        corrCount++;
      }
    });
    setScore(corrCount);
    setExamSubmitted(true);
  };

  const handleResetExam = () => {
    setUserAnswers({});
    setExamSubmitted(false);
    setScore(0);
  };

  return (
    <div id="study-note-viewer" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* LEFT COLUMN: Topic Coverage & Syllabus Outline (Checkbox Mindmap) */}
      {isOutlineOpen && (
        <div id="syllabus-sidebar" className="lg:col-span-4 xl:col-span-3 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-2xl p-5 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-sans font-bold text-slate-850 dark:text-slate-205 text-sm flex items-center gap-1.5">
              <BookMarked className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Syllabus Coverage
            </h3>
            <span className="text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-450 px-2 py-0.5 rounded font-bold">
              {coveragePercent}% DONE
            </span>
          </div>

          {/* Coverage Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
              <div
                className="bg-indigo-650 dark:bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${coveragePercent}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono flex justify-between uppercase">
              <span>{completedCount}/{totalTopics} Mastered</span>
              <span>100% Comprehensive</span>
            </p>
          </div>

          {/* Topic List */}
          <div id="topic-checklist" className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
            {guide.topics?.map((topic, i) => {
              const isSelected = selectedTopic?.id === topic.id;
              const isDone = completedTopics[topic.id];
              return (
                <div
                  key={topic.id}
                  id={`syllabus-item-${topic.id}`}
                  onClick={() => handleSelectTopic(topic)}
                  className={`flex items-start justify-between p-2.5 rounded-lg transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-slate-900 dark:bg-indigo-600 border-slate-900 dark:border-indigo-600 text-white shadow-sm"
                      : "bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0 pr-1">
                    <button
                      id={`checkbox-${topic.id}`}
                      onClick={(e) => toggleTopicCompleted(topic.id, e)}
                      className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                        isDone
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : isSelected
                          ? "border-slate-500 hover:bg-slate-800 dark:border-indigo-400 dark:hover:bg-indigo-700"
                          : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                      }`}
                    >
                      {isDone && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </button>
                     <div className="min-w-0 flex-1">
                       <p className="text-xs font-semibold break-words whitespace-normal leading-snug">
                         {topic.title}
                       </p>
                       <p className={`text-[9.5px] font-mono break-words whitespace-normal uppercase tracking-wider mt-0.5 ${
                         isSelected ? "text-indigo-200" : "text-slate-400 dark:text-slate-500"
                       }`}>
                         {topic.category || "General Outcome"}
                       </p>
                     </div>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                    isSelected ? "text-white" : "text-slate-400 dark:text-slate-505"
                  }`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Study Note Stats Card */}
        <div className="bg-slate-900 dark:bg-slate-950 border dark:border-slate-805 text-white rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden transition-colors">
          <div className="relative z-10 space-y-3.5">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-400" />
              <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-indigo-400">
                AI Reasoning Connected
              </h4>
            </div>
            <p className="text-xs text-slate-300 dark:text-slate-400 leading-relaxed">
              Cross-referencing and compiling all loaded syllabus units for long-term active recall memory retention.
            </p>
            <div className="flex gap-4 pt-2.5 border-t border-slate-800 dark:border-slate-900">
              <div>
                <p className="text-lg font-bold font-mono text-indigo-400">{guide.flashcards?.length || 0}</p>
                <p className="text-[9px] text-slate-400 dark:text-slate-550 uppercase tracking-widest font-mono font-bold">Cards</p>
              </div>
              <div>
                <p className="text-lg font-bold font-mono text-indigo-400">{guide.practiceExam?.length || 0}</p>
                <p className="text-[9px] text-slate-400 dark:text-slate-550 uppercase tracking-widest font-mono font-bold">Exam Items</p>
              </div>
            </div>
          </div>
          {/* Glowing background accent detail from design */}
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-500 opacity-20 blur-3xl"></div>
        </div>
      </div>
      )}

      {/* RIGHT COLUMN: Interactive Study Hub */}
      <div id="study-panel" className={isOutlineOpen ? "lg:col-span-8 xl:col-span-9 space-y-6" : "lg:col-span-12 space-y-6"}>
        
        {/* Navigation & Actions Banner */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
          
          {/* Custom Tabs */}
          <div className="flex bg-slate-100/80 dark:bg-slate-955 p-0.5 rounded-xl w-full sm:w-auto border border-slate-200/50 dark:border-slate-800">
            <button
              id="tab-notes-btn"
              onClick={() => setActiveTab("notes")}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === "notes"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 dark:text-slate-450 hover:text-slate-805 dark:hover:text-slate-200"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              Study Note Notes
            </button>
            <button
              id="tab-flashcards-btn"
              onClick={() => setActiveTab("flashcards")}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === "flashcards"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 dark:text-slate-455 hover:text-slate-805 dark:hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Active Flashcards
            </button>
            <button
              id="tab-exam-btn"
              onClick={() => setActiveTab("exam")}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === "exam"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 dark:text-slate-455 hover:text-slate-805 dark:hover:text-slate-200"
              }`}
            >
              <Award className="w-3.5 h-3.5 text-indigo-500" />
              Practice Exam
            </button>
          </div>

          {/* Exporter UI Button */}
          <button
            id="download-pdf-btn"
            onClick={() => exportStudyGuideToPDF(guide)}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold font-sans rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>

        {/* Display & Workspace Optimization Layout Toolbar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl px-5 py-3 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs transition-colors">
          <div className="flex items-center gap-2 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className="font-sans font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Reading Workspace Optimizer</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsOutlineOpen(!isOutlineOpen)}
              className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                isOutlineOpen 
                  ? "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-750" 
                  : "bg-indigo-50 dark:bg-indigo-950/35 border-indigo-200/25 text-indigo-700 dark:text-indigo-400 font-extrabold"
              }`}
              title="Toggle Left Syllabus Outline Sidebar"
            >
              {isOutlineOpen ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {isOutlineOpen ? "Minimize Outline" : "Syllabus Outline (Hidden)"}
            </button>

            <button
              onClick={() => setIsOutlineOpen(!isOutlineOpen)}
              className={`px-3.5 py-1.5 rounded-lg border text-[11px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                !isOutlineOpen
                  ? "bg-indigo-600 hover:bg-indigo-650 border-indigo-600 text-white"
                  : "bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 border-indigo-100 dark:border-indigo-900/40 text-indigo-750 dark:text-indigo-305"
              }`}
              title="Toggle distraction-free full-screen reading mode"
            >
              {!isOutlineOpen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  Exit Focus Mode
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  Focus Reading Mode
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Canvas Area */}
        <div id="study-panel-canvas">
          
          {/* TAB 1: EXHAUSTIVE NOTES & DISCOVERY */}
          {activeTab === "notes" && selectedTopic && (
            <div className="space-y-6">
              
              {/* Lecture Node Reader content */}
              <div className="w-full space-y-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[9px] font-extrabold uppercase rounded font-mono tracking-widest border border-emerald-150 dark:border-emerald-900/40">
                      Synthesized
                    </span>
                    <span className="text-[10px] font-mono tracking-wider text-slate-400 dark:text-slate-500 font-bold uppercase">
                      {selectedTopic.category || "Theoretical Foundational"}
                    </span>
                  </div>
                  
                  <h2 className="font-display font-bold text-slate-900 dark:text-slate-100 text-2xl md:text-3xl pt-2 pb-1">
                    {selectedTopic.title}
                  </h2>

                  <p className="text-xs italic leading-relaxed text-slate-550 dark:text-slate-400 border-l-2 border-indigo-500 pl-4 py-1">
                    {selectedTopic.summary}
                  </p>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
                    <h4 className="font-sans font-bold text-slate-800 dark:text-slate-350 text-xs uppercase tracking-wider">
                      Study Material Analysis
                    </h4>
                    
                    {/* Rich text body parser */}
                    <div className="text-slate-850 dark:text-slate-300">
                      <MarkdownRenderer content={selectedTopic.fullExplanation} />
                    </div>

                    {/* Interactive Click triggers simplify */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <button
                        id="explain-simply-trigger"
                        onClick={() => setShowFeynmanCoPilot(true)}
                        className="text-xs text-indigo-700 dark:text-indigo-400 hover:text-indigo-805 dark:hover:text-indigo-305 font-bold flex items-center justify-center gap-1.5 bg-indigo-55 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 px-3.5 py-2 rounded-lg border border-indigo-100 dark:border-indigo-900/40 transition-all cursor-pointer"
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        Explain Simply (Feynman Mode)
                      </button>
                      <button
                        id="mark-comprehended"
                        onClick={(e) => toggleTopicCompleted(selectedTopic.id, e)}
                        className={`text-xs font-bold px-4 py-2 rounded-lg border transition-all cursor-pointer ${
                          completedTopics[selectedTopic.id]
                            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                            : "bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-205 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {completedTopics[selectedTopic.id] ? "✓ Concept Mastered" : "Mark Mastered"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>              {/* TAB 1 MODAL: THE FEYNMAN SIMPLIFY PANEL */}
              {showFeynmanCoPilot && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
                  <div id="feynman-copilot-card" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative transition-colors flex flex-col space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                      <div className="flex items-center gap-3 text-indigo-650 dark:text-indigo-400">
                        <Sparkles className="w-6 h-6 shrink-0 text-indigo-500" />
                        <h3 className="font-display font-bold text-lg md:text-xl tracking-tight text-slate-800 dark:text-slate-100">
                          Simply Explained
                        </h3>
                      </div>
                      <button
                        onClick={() => setShowFeynmanCoPilot(false)}
                        className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-100/50 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-700 px-4 py-2 rounded-xl transition-all cursor-pointer"
                        title="Close panel"
                      >
                        Close
                      </button>
                    </div>

                    <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 italic leading-relaxed text-center font-medium my-2">
                      &quot;If you can&apos;t explain it simply, you don&apos;t understand it well enough.&quot;
                    </p>

                    <div className="space-y-6 flex-1">
                      {/* Intuitive core idea */}
                      <div className="space-y-2 bg-indigo-50/30 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <span className="text-xs font-mono tracking-widest uppercase bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-extrabold px-2.5 py-1 rounded inline-block shadow-sm">
                          The Core Idea
                        </span>
                        <p className="text-base md:text-lg text-slate-800 dark:text-slate-200 leading-[1.6] pt-1 font-medium">
                          {selectedTopic.simplified.coreIdea}
                        </p>
                      </div>

                      {/* Analogy box */}
                      <div className="space-y-2 bg-amber-50 dark:bg-amber-950/20 p-5 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 shadow-sm">
                        <span className="text-xs font-mono tracking-widest uppercase bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400 font-extrabold px-2.5 py-1 rounded border border-amber-200 dark:border-amber-900/50 inline-block shadow-sm">
                          Real-World Analogy
                        </span>
                        <p className="text-base md:text-lg text-slate-700 dark:text-slate-300 leading-[1.6] pt-1 font-sans italic">
                          {selectedTopic.simplified.analogy}
                        </p>
                      </div>

                      {/* 3 Step mental model */}
                      <div className="space-y-4 bg-indigo-50/50 dark:bg-indigo-950/20 p-5 rounded-2xl border border-indigo-200/60 dark:border-indigo-900/40 shadow-sm">
                        <span className="text-xs font-mono tracking-widest uppercase bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 font-extrabold px-2.5 py-1 rounded border border-indigo-200 dark:border-indigo-900/50 inline-block shadow-sm">
                          Concept Breakdown
                        </span>
                        <div className="space-y-3 block">
                          {selectedTopic.simplified.keySteps?.map((step, i) => (
                            <div key={i} className="flex gap-4 items-start bg-white/50 dark:bg-slate-900/40 p-4 rounded-xl border border-indigo-100/30 dark:border-indigo-800/30">
                              <span className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900 border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-black font-mono text-base flex items-center justify-center shrink-0 shadow-sm">
                                {i + 1}
                              </span>
                              <p className="text-sm md:text-base text-slate-700 dark:text-slate-300 font-sans leading-[1.6] font-medium pt-1">
                                {step}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* TAB 2: ACTIVE FLASHCARDS STUDY ENGINE */}
          {activeTab === "flashcards" && guide.flashcards && guide.flashcards.length > 0 && (
            <div className="max-w-xl mx-auto space-y-6 flex flex-col items-center">
              
              <div className="text-center">
                <h3 className="font-display font-bold text-slate-800 dark:text-slate-105 text-lg md:text-xl">
                  Active-Recall Flashcards
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Click the card to Flip between term/concept and detailed answer
                </p>
              </div>

              {/* Realistic Flashcard Box */}
              <div
                id="interactive-flashcard"
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full aspect-[1.6/1] cursor-pointer relative group perspective"
              >
                <div
                  className={`w-full h-full duration-500 preserve-3d relative ${
                    isFlipped ? "rotate-y-180" : ""
                  }`}
                >
                  
                  {/* card front */}
                  <div className="absolute inset-0 w-full h-full backface-hidden bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col justify-between shadow-md group-hover:border-indigo-400 transition-colors">
                    <div className="flex justify-between items-center text-[10px] font-mono text-indigo-650 dark:text-indigo-400 font-semibold tracking-wider uppercase">
                      <span>Interactive Recall</span>
                      <span>Card {currentCardIndex + 1} of {guide.flashcards.length}</span>
                    </div>
                    <div className="text-center font-display font-bold text-slate-805 dark:text-slate-100 text-lg md:text-xl px-4 select-none">
                      {guide.flashcards[currentCardIndex]?.front}
                    </div>
                    <div className="text-center text-[11px] font-mono text-slate-400 dark:text-slate-500">
                      Click to flip & read solution
                    </div>
                  </div>

                  {/* card back */}
                  <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-slate-800 dark:bg-slate-955 text-white rounded-2xl p-8 flex flex-col justify-between shadow-lg">
                    <div className="flex justify-between items-center text-[10px] font-mono text-indigo-355 dark:text-indigo-400 font-semibold tracking-wider uppercase">
                      <span>Concept Verified</span>
                      <span>Card {currentCardIndex + 1} of {guide.flashcards.length}</span>
                    </div>
                    <div className="overflow-y-auto max-h-[140px] text-center font-sans font-medium text-slate-202 dark:text-slate-300 text-sm md:text-base px-2 py-1 leading-relaxed selection:bg-indigo-600">
                      {guide.flashcards[currentCardIndex]?.back}
                    </div>
                    <div className="text-center text-[11px] font-mono text-slate-450 dark:text-slate-500">
                      Click to flip back
                    </div>
                  </div>

                </div>
              </div>

              {/* Controllers */}
              <div className="flex items-center gap-4">
                <button
                  id="prev-card-btn"
                  disabled={currentCardIndex === 0}
                  onClick={() => {
                    setIsFlipped(false);
                    setTimeout(() => setCurrentCardIndex((prev) => Math.max(0, prev - 1)), 150);
                  }}
                  className="px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-205 dark:border-slate-800 text-xs font-bold text-slate-650 dark:text-slate-300 disabled:opacity-40 rounded-xl transition-all cursor-pointer"
                >
                  Previous
                </button>
                <span className="font-mono text-xs text-slate-505 dark:text-slate-405 font-semibold">
                  {currentCardIndex + 1} / {guide.flashcards.length}
                </span>
                <button
                  id="next-card-btn"
                  disabled={currentCardIndex === guide.flashcards.length - 1}
                  onClick={() => {
                    setIsFlipped(false);
                    setTimeout(() => setCurrentCardIndex((prev) => Math.min(guide.flashcards.length - 1, prev + 1)), 150);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white disabled:opacity-40 rounded-xl transition-all cursor-pointer"
                >
                  Next Card
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SELF-GRADING PRACTICE EXAM */}
          {activeTab === "exam" && guide.practiceExam && guide.practiceExam.length > 0 && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="font-display font-bold text-slate-805 dark:text-slate-100 text-lg md:text-xl">
                    Comprehensive Prep Practice Exam
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Test your syllabus comprehension. Complete all questions, then click Submit to view your grade and solutions.
                  </p>
                </div>
                {examSubmitted ? (
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 font-mono font-bold text-sm rounded-lg ${
                      score >= guide.practiceExam.length * 0.7
                        ? "bg-emerald-50 dark:bg-emerald-955/20 text-emerald-700 dark:text-emerald-400"
                        : "bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-400"
                    }`}>
                      YOUR SCORE: {score} / {guide.practiceExam.length} ({Math.round((score / guide.practiceExam.length) * 105)}%)
                    </span>
                    <button
                      id="reset-exam-btn"
                      onClick={handleResetExam}
                      className="p-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-201 dark:border-slate-800 text-slate-650 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
                      title="Reset Exam"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    id="submit-exam-btn"
                    onClick={handleSubmitExam}
                    disabled={Object.keys(userAnswers).length === 0}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold font-sans rounded-xl disabled:opacity-40 transition-colors shadow cursor-pointer text-center"
                  >
                    Submit & Grade Exam
                  </button>
                )}
              </div>

              {/* Questions Stream */}
              <div className="space-y-6">
                {guide.practiceExam.map((q, idx) => {
                  const userAnswer = userAnswers[q.id];
                  const hasAnswered = !!userAnswer;
                  return (
                    <div
                      key={q.id}
                      id={`exam-question-${q.id}`}
                      className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-750 dark:text-indigo-400 font-bold font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <h4 className="font-sans font-bold text-slate-800 dark:text-slate-100 text-sm leading-relaxed">
                          {q.question}
                        </h4>
                      </div>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8">
                        {q.options?.map((opt, optIdx) => {
                          const isOptionSelected = userAnswer === opt;
                          const isCorrectOpt = opt === q.correctAnswer;
                          
                          let optStyle = "border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-slate-50/20 dark:bg-slate-950/20 dark:text-slate-350";
                          if (isOptionSelected) {
                            optStyle = "border-indigo-600 dark:border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/40 font-semibold dark:text-white";
                          }

                          if (examSubmitted) {
                            if (isCorrectOpt) {
                              optStyle = "border-emerald-500 dark:border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-805 dark:text-emerald-400 font-bold ring-2 ring-emerald-100 dark:ring-emerald-950/40";
                            } else if (isOptionSelected) {
                              optStyle = "border-red-400 dark:border-red-650 bg-red-50/40 dark:bg-red-950/30 text-red-750 dark:text-red-405 font-semibold";
                            } else {
                              optStyle = "border-slate-105 dark:border-slate-850 bg-slate-50/5 dark:bg-slate-950/5 opacity-60";
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              id={`q-${q.id}-opt-${optIdx}`}
                              disabled={examSubmitted}
                              onClick={() => handleAnswerSelect(q.id, opt)}
                              className={`p-3.5 rounded-xl border text-left text-xs transition-all relative flex items-center gap-3 ${
                                !examSubmitted ? "cursor-pointer" : "cursor-default"
                              } ${optStyle}`}
                            >
                              <span className={`w-5 h-5 rounded-full text-[10px] font-bold font-mono flex items-center justify-center border shrink-0 ${
                                isOptionSelected
                                  ? "bg-indigo-600 dark:bg-indigo-505 border-indigo-600 dark:border-indigo-505 text-white"
                                  : "border-slate-300 dark:border-slate-700 text-slate-505 dark:text-slate-400 bg-white dark:bg-slate-955"
                              }`}>
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="leading-tight">{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Solutions and Explanations revealed after submission */}
                      {examSubmitted && (
                        <div className="mt-4 pl-8 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-xs font-mono font-bold uppercase tracking-wider">
                              Correct Answer: {q.correctAnswer}
                            </span>
                          </div>
                          <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-1">
                            <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1">
                              <HelpCircle className="w-3 h-3 text-indigo-400" />
                              Pedagogical Explanation
                            </p>
                            <p className="text-xs text-slate-655 dark:text-slate-350 leading-relaxed font-sans">
                              {q.explanation}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
