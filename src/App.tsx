import React, { useState, useEffect } from "react";
import { Sparkles, Plus, GraduationCap, AlertCircle, BookOpen, Clock, Heart, ArrowLeft, Lightbulb, Sun, Moon } from "lucide-react";
import { StudyGuide, StudySource, StudyProgress, StudyFolder, FolderColor, FOLDER_COLORS } from "./types";
import UploadSection from "./components/UploadSection";
import StudyNoteViewer from "./components/StudyNoteViewer";
import HistorySidebar from "./components/HistorySidebar";
import { generateUUID } from "./utils/uuid";

const STORAGE_KEY = "ultimate_learner_guides";
const FOLDERS_STORAGE_KEY = "ultimate_learner_folders";
const MAX_FOLDERS = 20;

/** Safe localStorage writer — catches QuotaExceededError and returns false */
function safeSave(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      console.error("localStorage quota exceeded for key:", key);
    }
    return false;
  }
}

/** Auto-assign next folder color by cycling through the palette */
function nextAutoColor(folders: StudyFolder[]): FolderColor {
  return FOLDER_COLORS[folders.length % FOLDER_COLORS.length];
}

export default function App() {
  const [history, setHistory] = useState<StudyGuide[]>([]);
  const [folders, setFolders] = useState<StudyFolder[]>([]);
  const [currentGuideId, setCurrentGuideId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ultimate_study_prep_dark") === "true";
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("ultimate_study_prep_dark", String(darkMode));
  }, [darkMode]);

  // Load history + folders from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        let parsed = JSON.parse(stored) as StudyGuide[];
        // Sanitize history to inject missing child IDs for backward compatibility and avoid key warning errors
        parsed = parsed.map((guide) => {
          const updated = { ...guide };
          if (updated.topics) {
            updated.topics = updated.topics.map((t, idx) => ({
              ...t,
              id: t.id || `topic-${idx}-${generateUUID().slice(0, 8)}`,
            }));
          }
          if (updated.flashcards) {
            updated.flashcards = updated.flashcards.map((f, idx) => ({
              ...f,
              id: f.id || `card-${idx}-${generateUUID().slice(0, 8)}`,
            }));
          }
          if (updated.practiceExam) {
            updated.practiceExam = updated.practiceExam.map((eq, idx) => ({
              ...eq,
              id: eq.id || `question-${idx}-${generateUUID().slice(0, 8)}`,
            }));
          }
          if (!updated.progress) {
            updated.progress = {
              completedTopicIds: [],
              masteredFlashcardIds: [],
              examAttempts: [],
            };
          } else {
            updated.progress = {
              completedTopicIds: updated.progress.completedTopicIds || [],
              masteredFlashcardIds: updated.progress.masteredFlashcardIds || [],
              examAttempts: updated.progress.examAttempts || [],
            };
          }
          return updated;
        });
        setHistory(parsed);
        if (parsed.length > 0) {
          setCurrentGuideId(parsed[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load study history from cache:", e);
    }

    // Load folders
    try {
      const storedFolders = localStorage.getItem(FOLDERS_STORAGE_KEY);
      if (storedFolders) {
        setFolders(JSON.parse(storedFolders) as StudyFolder[]);
      }
    } catch (e) {
      console.error("Failed to load folders from cache:", e);
    }
  }, []);

  // Save history to localStorage (with quota error handling)
  const saveHistory = (newHistory: StudyGuide[]) => {
    setHistory(newHistory);
    if (!safeSave(STORAGE_KEY, newHistory)) {
      setStorageWarning("Storage full — your changes won't persist after reload. Consider deleting old sessions.");
    }
  };

  // Save folders to localStorage
  const saveFolders = (newFolders: StudyFolder[]) => {
    setFolders(newFolders);
    if (!safeSave(FOLDERS_STORAGE_KEY, newFolders)) {
      setStorageWarning("Storage full — your changes won't persist after reload. Consider deleting old sessions.");
    }
  };

  // Cross-tab sync via storage event
  useEffect(() => {
    function onStorageChange(e: StorageEvent) {
      if (e.key === STORAGE_KEY && e.newValue) {
        try { setHistory(JSON.parse(e.newValue)); } catch { /* ignore malformed */ }
      }
      if (e.key === FOLDERS_STORAGE_KEY && e.newValue) {
        try { setFolders(JSON.parse(e.newValue)); } catch { /* ignore malformed */ }
      }
    }
    window.addEventListener("storage", onStorageChange);
    return () => window.removeEventListener("storage", onStorageChange);
  }, []);

  const handleUpdateProgress = (guideId: string, progress: StudyProgress) => {
    const updatedHistory = history.map((g) => {
      if (g.id === guideId) {
        return { ...g, progress };
      }
      return g;
    });
    saveHistory(updatedHistory);
  };

  // Rotating loading captions
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isGenerating) {
      timer = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % 4);
      }, 5000);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(timer);
  }, [isGenerating]);

  // Handle generating study guide
  const handleGenerateGuide = async (
    sources: StudySource[],
    focusDepth: string,
    explainStyle: string,
    flashcardCount: number,
    quizCount: number
  ) => {
    setIsGenerating(true);
    setErrorMessage(null);
    setLoadingStep(0);

    try {
      const response = await fetch("/api/generate-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sources: sources.map((s) => ({
            name: s.name,
            type: s.type,
            content: s.content,
          })),
          focusDepth,
          explainStyle,
          flashcardCount,
          quizCount
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      const generatedGuide: StudyGuide = await response.json();
      
      // Inject ID & Date metadata
      generatedGuide.id = generateUUID();
      generatedGuide.createdAt = new Date().toISOString();
      generatedGuide.sources = sources.map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
      }));

      // Inject unique IDs for nested items to prevent key-prop warnings and fix selection/completeness states
      if (generatedGuide.topics) {
        generatedGuide.topics = generatedGuide.topics.map((t, idx) => ({
          ...t,
          id: t.id || `topic-${idx}-${generateUUID().slice(0, 8)}`,
        }));
      }
      if (generatedGuide.flashcards) {
        generatedGuide.flashcards = generatedGuide.flashcards.map((f, idx) => ({
          ...f,
          id: f.id || `card-${idx}-${generateUUID().slice(0, 8)}`,
        }));
      }
      if (generatedGuide.practiceExam) {
        generatedGuide.practiceExam = generatedGuide.practiceExam.map((eq, idx) => ({
          ...eq,
          id: eq.id || `question-${idx}-${generateUUID().slice(0, 8)}`,
        }));
      }

      // Initialize empty progress for newly generated guides
      generatedGuide.progress = {
        completedTopicIds: [],
        masteredFlashcardIds: [],
        examAttempts: [],
      };

      // Add to beginning of history list
      const updatedHistory = [generatedGuide, ...history];
      saveHistory(updatedHistory);
      setCurrentGuideId(generatedGuide.id);
    } catch (err: any) {
      console.error("Failed to compile study pack:", err);
      setErrorMessage(err.message || "An unexpected error occurred during synthesis.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectGuide = (id: string) => {
    setCurrentGuideId(id);
    setErrorMessage(null);
  };

  const handleDeleteGuide = (id: string) => {
    const fresh = history.filter((g) => g.id !== id);
    saveHistory(fresh);
    if (currentGuideId === id) {
      setCurrentGuideId(fresh.length > 0 ? fresh[0].id : null);
    }
  };

  const handleRenameGuide = (id: string, newTitle: string) => {
    const updated = history.map((g) => {
      if (g.id === id) {
        return { ...g, title: newTitle };
      }
      return g;
    });
    saveHistory(updated);
  };

  const triggerCreateNew = () => {
    setCurrentGuideId(null);
    setErrorMessage(null);
  };

  // --- Folder CRUD Handlers ---

  const handleCreateFolder = (name: string) => {
    if (folders.length >= MAX_FOLDERS) {
      setStorageWarning(`Maximum ${MAX_FOLDERS} folders reached. Consider consolidating or using descriptive names.`);
      return;
    }
    const newFolder: StudyFolder = {
      id: generateUUID(),
      name,
      color: nextAutoColor(folders),
      createdAt: new Date().toISOString(),
    };
    saveFolders([...folders, newFolder]);
  };

  const handleRenameFolder = (id: string, newName: string) => {
    saveFolders(folders.map(f => f.id === id ? { ...f, name: newName } : f));
  };

  const handleDeleteFolder = (id: string) => {
    // 1. Remove the folder
    saveFolders(folders.filter(f => f.id !== id));
    // 2. Unfile all guides that belonged to it — immutable map
    const updatedGuides = history.map(g =>
      g.folderId === id ? { ...g, folderId: undefined } : g
    );
    saveHistory(updatedGuides);
  };

  const handleMoveGuide = (guideId: string, folderId: string | null) => {
    const updated = history.map(g =>
      g.id === guideId ? { ...g, folderId: folderId ?? undefined } : g
    );
    saveHistory(updated);
  };

  const activeGuide = history.find((g) => g.id === currentGuideId);

  // Loading Steps texts
  const loadingMessages = [
    { text: "Reading source files & extracting critical core vocabulary...", cite: "AI parsing multimodal context." },
    { text: "Laying out rigorous academic chapters with zero content omissions...", cite: "Systematic learning graph alignment." },
    { text: "Simultaneously deriving simple Feynman analogies & interactive step maps...", cite: "Simplifying complex core theoretical structures." },
    { text: "Assembling custom flashcards & self-grading mock prep practice exams...", cite: "Publishing complete study dossier." },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* HEADER BANNER */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-sm flex items-center justify-center font-bold font-sans">
              U
            </div>
            <div>
              <h1 className="font-display font-bold text-slate-800 dark:text-slate-100 text-lg tracking-tight leading-none flex items-center gap-1.5">
                Ultimate Learner
              </h1>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-wider uppercase">
                AI exam co-pilot • v2.4.0
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-500 animate-spin-once" /> : <Moon className="w-4.5 h-4.5 text-indigo-400" />}
            </button>

            {currentGuideId && (
              <button
                id="header-create-new-btn"
                onClick={triggerCreateNew}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                New Study Session
              </button>
            )}
          </div>
        </div>
      </header>

      {/* DYNAMIC PROGRESS INJECTOR (FULL SCREEN DURING AI BUILD PROCESS) */}
      {isGenerating ? (
        <div id="ai-generating-overlay" className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm space-y-6 text-center animate-fade-in">
            {/* Spinning Indicator */}
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-slate-100 dark:border-slate-850 rounded-full" />
              <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin" />
              <GraduationCap className="w-6 h-6 text-indigo-600" />
            </div>

            <div className="space-y-2">
              <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-lg">
                Building Academic Study Guide
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono uppercase tracking-widest">
                GEMINI AI ANALYTICAL REASONING ACTIVE
              </p>
            </div>

            {/* Rotating load text with fade animation */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4.5 min-h-[100px] flex flex-col justify-center gap-1.5">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-350 leading-relaxed">
                🎯 {loadingMessages[loadingStep].text}
              </p>
              <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                {loadingMessages[loadingStep].cite}
              </p>
            </div>

            <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
              The model reads all file contents deeply without skipping details, constructing rich explanations and intuitive Feynman analogies. This typically takes up to a minute depending on resources.
            </p>
          </div>
        </div>
      ) : (
        <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* GENERAL SYNDICATION ERROR */}
          {errorMessage && (
            <div id="general-error-banner" className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-red-800 dark:text-red-300">
                  Syllabus Processing Error
                </h4>
                <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
                  {errorMessage}
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setErrorMessage(null)}
                    className="text-xs text-red-800 underline font-bold"
                  >
                    Dismiss error
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STORAGE QUOTA WARNING */}
          {storageWarning && (
            <div id="storage-warning-banner" className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">
                  Storage Warning
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  {storageWarning}
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setStorageWarning(null)}
                    className="text-xs text-amber-800 dark:text-amber-300 underline font-bold cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MAIN PAGE DIVISION */}
          {!currentGuideId ? (
            
            // 1. LANDING PANEL: FIRST-TIME OR NEW GENERATION STATE
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Uplink center */}
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/55 text-indigo-700 dark:text-indigo-300 font-bold px-2.5 py-1 rounded-full">
                      Exam Prep & Revision System
                    </span>
                    <h2 className="font-display font-bold text-slate-850 dark:text-white tracking-tight text-2xl md:text-3xl">
                      Upload Material & Create Your Ultimate Master Class Study-Set
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl font-sans">
                      Our system utilizes native multimodal AI reasoning to parses text and PDFs completely. It guarantees a highly rigorous, comprehensive set of study guides, Feynman simplified explanations, interactive practice flashcards, and mcq exams that misses zero content areas.
                    </p>
                  </div>

                  <UploadSection onGenerate={handleGenerateGuide} isGenerating={isGenerating} />
                </div>
              </div>

              {/* Sidebar list items */}
              <div className="lg:col-span-4 space-y-6">
                <HistorySidebar
                  history={history}
                  currentGuideId={currentGuideId}
                  onSelect={handleSelectGuide}
                  onDelete={handleDeleteGuide}
                  onRename={handleRenameGuide}
                  folders={folders}
                  onCreateFolder={handleCreateFolder}
                  onRenameFolder={handleRenameFolder}
                  onDeleteFolder={handleDeleteFolder}
                  onMoveGuide={handleMoveGuide}
                />

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                  <h4 className="font-sans font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-1.5 text-indigo-650 dark:text-indigo-400">
                    <Lightbulb className="w-4 h-4" />
                    How to master your exams
                  </h4>
                  <div className="space-y-3">
                    <div className="flex gap-2.5 items-start">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                        <strong>Upload resources:</strong> Feed the system with lecture notebooks, slide decks, or text material.
                      </p>
                    </div>
                    <div className="flex gap-2.5 items-start">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                        <strong>Review Exhaustive Lectures:</strong> Check off chapters as you comprehend them. Double-click or tap any theory for simplified Feynman breakdowns.
                      </p>
                    </div>
                    <div className="flex gap-2.5 items-start">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                        <strong>Acquire Muscle Memory:</strong> Study active flashcards and submit self-grading multiple choice practice exams until you master the topic.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            
            // 2. ACTIVE VIEW STATE: STUDY WORKSPACE
            <div className="space-y-6">
              
              {/* Back to Workspace creator */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <button
                  id="go-back-dashboard-btn"
                  onClick={triggerCreateNew}
                  className="text-xs text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-200 font-semibold font-sans flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl shadow-sm hover:shadow"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Syllabus Upload Center
                </button>

                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                  <button
                    id="toggle-history-sidebar"
                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                    className={`text-xs font-semibold font-sans flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer shadow-sm ${
                      isHistoryOpen 
                        ? "bg-slate-100 dark:bg-slate-800 border-indigo-555 text-indigo-650 dark:text-indigo-400 font-bold" 
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-250"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {isHistoryOpen ? "Hide Sessions Sidebar" : "Show Sessions Sidebar"}
                  </button>
                  <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded font-bold border border-slate-200/20">
                    Active Study Guide Selected
                  </span>
                </div>
              </div>

              {/* Main Guide syndicator view */}
              {activeGuide ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Workspace History Logs */}
                  {isHistoryOpen && (
                    <div className="lg:col-span-3 space-y-6">
                      <HistorySidebar
                        history={history}
                        currentGuideId={currentGuideId}
                        onSelect={handleSelectGuide}
                        onDelete={handleDeleteGuide}
                        onRename={handleRenameGuide}
                        folders={folders}
                        onCreateFolder={handleCreateFolder}
                        onRenameFolder={handleRenameFolder}
                        onDeleteFolder={handleDeleteFolder}
                        onMoveGuide={handleMoveGuide}
                      />
                    </div>
                  )}

                  {/* Ultimate Viewer */}
                  <div className={isHistoryOpen ? "lg:col-span-9" : "lg:col-span-12"}>
                    <div className="space-y-1 mb-6">
                      <h2 className="font-display font-bold text-slate-850 dark:text-white tracking-tight text-3xl">
                        {activeGuide.title}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-450 font-mono">
                        Mastery Set and Interactive Practice Exams
                      </p>
                    </div>

                    <StudyNoteViewer guide={activeGuide} onUpdateProgress={handleUpdateProgress} />
                  </div>

                </div>
              ) : (
                <div className="py-20 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Study guide not found inside records bookshelf.</p>
                </div>
              )}

            </div>
          )}
        </main>
      )}

      {/* SYSTEM STATUS FOOTER */}
      <footer className="h-12 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 mt-12">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Systems Online</span>
          </div>
          <span className="text-[10px] text-slate-300 dark:text-slate-700">|</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">v2.4.0 High-Availability Cluster</span>
        </div>
        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
          Cloud Storage: 14.2 GB / 50 GB Used
        </div>
      </footer>
    </div>
  );
}
