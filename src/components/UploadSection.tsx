import React, { useState, useRef } from "react";
import { Upload, FileText, Trash2, BookOpen, Sparkles, Check } from "lucide-react";
import { StudySource, SourceType } from "../types";
import { generateUUID } from "../utils/uuid";

interface UploadSectionProps {
  onGenerate: (sources: StudySource[], focusDepth: string, explainStyle: string, flashcardCount: number, quizCount: number) => void;
  isGenerating: boolean;
}

export default function UploadSection({ onGenerate, isGenerating }: UploadSectionProps) {
  const [sources, setSources] = useState<StudySource[]>([]);
  const [manualTitle, setManualTitle] = useState("");
  const [manualText, setManualText] = useState("");
  const [focusDepth, setFocusDepth] = useState("exhaustive");
  const [explainStyle, setExplainStyle] = useState("feynman");
  const [flashcardCount, setFlashcardCount] = useState(10);
  const [quizCount, setQuizCount] = useState(10);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const processFiles = (files: FileList) => {
    setErrorMsg("");
    Array.from(files).forEach((file) => {
      const isPDF = file.type === "application/pdf" || file.name.endsWith(".pdf");
      const isText = file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md");

      if (!isPDF && !isText) {
        setErrorMsg("Only PDF (.pdf) and text files (.txt, .md) are currently supported.");
        return;
      }

      const reader = new FileReader();
      
      if (isPDF) {
        // Read as Base64 Data URL for Gemini Multimodal processing
        reader.readAsDataURL(file);
        reader.onload = () => {
          const base64Content = reader.result as string;
          const newSource: StudySource = {
            id: generateUUID(),
            name: file.name,
            type: "pdf",
            content: base64Content,
            size: file.size,
          };
          setSources((prev) => [...prev, newSource]);
        };
      } else {
        // Read as plain text
        reader.readAsText(file);
        reader.onload = () => {
          const textContent = reader.result as string;
          const newSource: StudySource = {
            id: generateUUID(),
            name: file.name,
            type: "text",
            content: textContent,
            size: file.size,
          };
          setSources((prev) => [...prev, newSource]);
        };
      }
    });
  };

  const addManualNotes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;

    const name = manualTitle.trim() || `Lecture Notes ${sources.length + 1}`;
    const newSource: StudySource = {
      id: generateUUID(),
      name,
      type: "notes",
      content: manualText,
      size: manualText.length,
    };

    setSources((prev) => [...prev, newSource]);
    setManualTitle("");
    setManualText("");
  };

  const removeSource = (id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const triggerGenerate = () => {
    if (sources.length === 0) {
      setErrorMsg("Please upload at least one PDF or lecture note first!");
      return;
    }
    onGenerate(sources, focusDepth, explainStyle, flashcardCount, quizCount);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div id="upload-panel" className="w-full space-y-6">
      {/* Drag & Drop File Upload Area */}
      <div
        id="drag-drop-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all ${
          isDragging
            ? "border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/20"
            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 bg-white dark:bg-slate-900 shadow-sm"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.md"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-full text-indigo-600 dark:text-indigo-400 mb-4">
          <Upload className="w-8 h-8" />
        </div>
        <h3 className="font-display font-semibold text-slate-850 dark:text-slate-100 text-lg mb-1">
          Upload PDF or Study Material
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
          Drag and drop your syllabus, lecture notes, textbook chapters, or slides
        </p>
        <span className="text-xs font-mono px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-650 dark:text-slate-400">
          Supports PDFs & Rich Text (.txt, .md)
        </span>
      </div>

      {errorMsg && (
        <div id="upload-error" className="p-3 bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 rounded-lg text-sm border border-red-100 dark:border-red-900/40">
          {errorMsg}
        </div>
      )}

      {/* Manual Notes Pasting Form */}
      <div id="manual-notes-section" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <h4 className="font-sans font-bold text-slate-800 dark:text-slate-100 text-sm mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          Or Paste Lecture Transcripts / Handouts
        </h4>
        <form onSubmit={addManualNotes} className="space-y-3">
          <input
            id="notes-title-input"
            type="text"
            placeholder="Title of notes (e.g., Biology Chapter 4)"
            value={manualTitle}
            onChange={(e) => setManualTitle(e.target.value)}
            className="w-full text-sm px-3.5 py-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-slate-100 font-sans transition-all"
          />
          <textarea
            id="notes-text-area"
            placeholder="Paste your syllabus, study guides, slides text highlights, transcripts, or notes..."
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            rows={4}
            className="w-full text-sm px-3.5 py-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-slate-100 font-sans resize-y transition-all"
          />
          <div className="flex justify-end">
            <button
              id="add-notes-btn"
              type="submit"
              disabled={!manualText.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 dark:hover:bg-indigo-700 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
            >
              Add Material
            </button>
          </div>
        </form>
      </div>

      {/* Uploaded Materials Queue */}
      {sources.length > 0 && (
        <div id="uploaded-queue" className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-505 uppercase tracking-widest">
            Sources Loaded ({sources.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sources.map((source) => (
              <div
                key={source.id}
                id={`source-${source.id}`}
                className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`p-2 rounded-lg ${
                    source.type === "pdf" ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold" : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold"
                  }`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[190px]" title={source.name}>
                      {source.name}
                    </p>
                    <p className="text-[10px] text-slate-450 dark:text-slate-500 font-mono">
                      {source.type.toUpperCase()} • {formatSize(source.size)}
                    </p>
                  </div>
                </div>
                <button
                  id={`remove-source-${source.id}`}
                  onClick={() => removeSource(source.id)}
                  className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                  title="Remove file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Configuration Options */}
      <div id="ai-options-panel" className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <h4 className="font-sans font-bold text-slate-800 dark:text-slate-100 text-sm">
          System Learning Strategy Co-Pilot
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Study Depth */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              LEARNING OUTCOME GOAL
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="depth-exhaustive-btn"
                onClick={() => setFocusDepth("exhaustive")}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                  focusDepth === "exhaustive"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                }`}
              >
                <div>
                  <p className="font-bold">No-Topic-Omitted</p>
                  <p className="text-[10px] opacity-85 font-normal">Exhaustive course review</p>
                </div>
                {focusDepth === "exhaustive" && <Check className="w-3.5 h-3.5 shrink-0 ml-1 text-white" />}
              </button>

              <button
                id="depth-standard-btn"
                onClick={() => setFocusDepth("summary")}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                  focusDepth === "summary"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-350 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                }`}
              >
                <div>
                  <p className="font-bold">High-Yield Summaries</p>
                  <p className="text-[10px] opacity-85 font-normal">Swift revision & outline</p>
                </div>
                {focusDepth === "summary" && <Check className="w-3.5 h-3.5 shrink-0 ml-1 text-white" />}
              </button>
            </div>
          </div>

          {/* Explanation Style */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              EXPLANATION LAYOUT STYLE
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="style-feynman-btn"
                onClick={() => setExplainStyle("feynman")}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                  explainStyle === "feynman"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                }`}
              >
                <div>
                  <p className="font-bold">Feynman Method</p>
                  <p className="text-[10px] opacity-85 font-normal">Analogies & simple layers</p>
                </div>
                {explainStyle === "feynman" && <Check className="w-3.5 h-3.5 shrink-0 ml-1 text-white" />}
              </button>

              <button
                id="style-rigorous-btn"
                onClick={() => setExplainStyle("rigorous")}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                  explainStyle === "rigorous"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                }`}
              >
                <div>
                  <p className="font-bold">Academic Rigor</p>
                  <p className="text-[10px] opacity-85 font-normal">Technical terms & formulas</p>
                </div>
                {explainStyle === "rigorous" && <Check className="w-3.5 h-3.5 shrink-0 ml-1 text-white" />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Number of Quizzes and Flashcards config */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              FLASHCARD QUANTITY
            </label>
            <input
              type="number"
              min="5"
              max="50"
              value={flashcardCount}
              onChange={(e) => setFlashcardCount(parseInt(e.target.value) || 10)}
              className="w-full text-sm px-3.5 py-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-slate-100 font-sans transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              PRACTICE EXAM QUESTIONS
            </label>
            <input
              type="number"
              min="5"
              max="30"
              value={quizCount}
              onChange={(e) => setQuizCount(parseInt(e.target.value) || 10)}
              className="w-full text-sm px-3.5 py-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-slate-100 font-sans transition-all"
            />
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <button
        id="generate-guide-btn"
        onClick={triggerGenerate}
        disabled={isGenerating || sources.length === 0}
        className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-sans font-bold py-3.5 px-6 rounded-xl shadow-sm disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed transition-all text-sm flex justify-center items-center gap-2 cursor-pointer hover:shadow"
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Analyzing Sources & Compiling Ultimate Study Set...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>Generate Ideal Study Guide & Exam Prep Pack</span>
          </>
        )}
      </button>
    </div>
  );
}
