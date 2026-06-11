import React, { useState, useRef, useEffect } from "react";
import {
  Clock, Trash2, Edit3, Check, X, FileText, ChevronRight, ChevronDown,
  FolderPlus, Folder, FolderOpen, MoreHorizontal, ArrowRightLeft,
} from "lucide-react";
import { StudyGuide, StudyFolder, FolderColor } from "../types";

// --- Color mapping for folder dots / accents ---
const FOLDER_COLOR_MAP: Record<FolderColor, { dot: string; bg: string; border: string; text: string }> = {
  blue:   { dot: "bg-blue-500",   bg: "bg-blue-50 dark:bg-blue-950/20",   border: "border-blue-200 dark:border-blue-900/40",   text: "text-blue-700 dark:text-blue-300" },
  green:  { dot: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-200 dark:border-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300" },
  purple: { dot: "bg-purple-500", bg: "bg-purple-50 dark:bg-purple-950/20", border: "border-purple-200 dark:border-purple-900/40", text: "text-purple-700 dark:text-purple-300" },
  orange: { dot: "bg-orange-500", bg: "bg-orange-50 dark:bg-orange-950/20", border: "border-orange-200 dark:border-orange-900/40", text: "text-orange-700 dark:text-orange-300" },
  red:    { dot: "bg-red-500",    bg: "bg-red-50 dark:bg-red-950/20",    border: "border-red-200 dark:border-red-900/40",    text: "text-red-700 dark:text-red-300" },
  teal:   { dot: "bg-teal-500",   bg: "bg-teal-50 dark:bg-teal-950/20",   border: "border-teal-200 dark:border-teal-900/40",   text: "text-teal-700 dark:text-teal-300" },
};

interface HistorySidebarProps {
  history: StudyGuide[];
  currentGuideId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  // Folder props
  folders: StudyFolder[];
  onCreateFolder: (name: string) => void;
  onRenameFolder: (id: string, newName: string) => void;
  onDeleteFolder: (id: string) => void;
  onMoveGuide: (guideId: string, folderId: string | null) => void;
}

export default function HistorySidebar({
  history,
  currentGuideId,
  onSelect,
  onDelete,
  onRename,
  folders,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveGuide,
}: HistorySidebarProps) {
  // --- Local UI state ---
  const [editingGuideId, setEditingGuideId] = useState<string | null>(null);
  const [editingGuideText, setEditingGuideText] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderText, setEditingFolderText] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [moveMenuGuideId, setMoveMenuGuideId] = useState<string | null>(null);
  // Drag-and-drop state
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null); // null = not hovering, "__unfiled__" = unfiled zone
  const dragExpandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const newFolderInputRef = useRef<HTMLInputElement>(null);
  const moveMenuRef = useRef<HTMLDivElement>(null);

  // Auto-focus new folder input
  useEffect(() => {
    if (isCreatingFolder && newFolderInputRef.current) {
      newFolderInputRef.current.focus();
    }
  }, [isCreatingFolder]);

  // Close move menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moveMenuRef.current && !moveMenuRef.current.contains(e.target as Node)) {
        setMoveMenuGuideId(null);
      }
    }
    if (moveMenuGuideId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [moveMenuGuideId]);

  // Auto-expand folders that contain the currently selected guide
  useEffect(() => {
    if (currentGuideId) {
      const guide = history.find(g => g.id === currentGuideId);
      if (guide?.folderId) {
        setExpandedFolders(prev => {
          const next = new Set(prev);
          next.add(guide.folderId!);
          return next;
        });
      }
    }
  }, [currentGuideId, history]);

  // --- Toggle folder expand/collapse ---
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  // --- Guide rename ---
  const startEditingGuide = (guide: StudyGuide, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGuideId(guide.id);
    setEditingGuideText(guide.title);
  };
  const saveGuideRename = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (editingGuideText.trim()) onRename(id, editingGuideText.trim());
    setEditingGuideId(null);
  };
  const cancelGuideRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGuideId(null);
  };

  // --- Folder rename ---
  const startEditingFolder = (folder: StudyFolder, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolderId(folder.id);
    setEditingFolderText(folder.name);
  };
  const saveFolderRename = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editingFolderText.trim()) onRenameFolder(id, editingFolderText.trim());
    setEditingFolderId(null);
  };
  const cancelFolderRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolderId(null);
  };

  // --- Create folder ---
  const submitCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName("");
      setIsCreatingFolder(false);
    }
  };

  // --- Drag-and-drop handlers ---
  const handleGuideDragStart = (e: React.DragEvent, guideId: string) => {
    e.dataTransfer.setData("text/plain", guideId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleFolderDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverFolderId !== folderId) {
      setDragOverFolderId(folderId);
      // Auto-expand collapsed folder after hovering 600ms
      if (folderId !== "__unfiled__" && !expandedFolders.has(folderId)) {
        if (dragExpandTimerRef.current) clearTimeout(dragExpandTimerRef.current);
        dragExpandTimerRef.current = setTimeout(() => {
          setExpandedFolders(prev => {
            const next = new Set(prev);
            next.add(folderId);
            return next;
          });
        }, 600);
      }
    }
  };

  const handleFolderDragLeave = (e: React.DragEvent) => {
    // Only clear if we're actually leaving the drop zone (not entering a child)
    const related = e.relatedTarget as Node | null;
    if (!e.currentTarget.contains(related)) {
      setDragOverFolderId(null);
      if (dragExpandTimerRef.current) {
        clearTimeout(dragExpandTimerRef.current);
        dragExpandTimerRef.current = null;
      }
    }
  };

  const handleFolderDrop = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    setDragOverFolderId(null);
    if (dragExpandTimerRef.current) {
      clearTimeout(dragExpandTimerRef.current);
      dragExpandTimerRef.current = null;
    }
    const guideId = e.dataTransfer.getData("text/plain");
    if (guideId) {
      // Don't move if already in this folder
      const guide = history.find(g => g.id === guideId);
      if (guide && (guide.folderId ?? null) !== folderId) {
        onMoveGuide(guideId, folderId);
      }
    }
  };

  const handleDragEnd = () => {
    setDragOverFolderId(null);
    if (dragExpandTimerRef.current) {
      clearTimeout(dragExpandTimerRef.current);
      dragExpandTimerRef.current = null;
    }
  };

  // --- Categorize guides ---
  const guidesInFolder = (folderId: string) => history.filter(g => g.folderId === folderId);
  const unfiledGuides = history.filter(g => !g.folderId);
  const hasFolders = folders.length > 0;

  // --- Render a single guide item ---
  const renderGuideItem = (guide: StudyGuide) => {
    const isSelected = guide.id === currentGuideId;
    const isEditing = guide.id === editingGuideId;
    const totalTopics = guide.topics?.length || 0;
    const completedTopicsCount = guide.progress?.completedTopicIds?.length || 0;
    const completionPercent = totalTopics > 0 ? Math.round((completedTopicsCount / totalTopics) * 100) : 0;
    const attempts = guide.progress?.examAttempts || [];
    const latestAttempt = attempts.length > 0 ? attempts[attempts.length - 1] : null;

    return (
      <div
        key={guide.id}
        id={`history-item-${guide.id}`}
        draggable={!isEditing}
        onDragStart={(e) => handleGuideDragStart(e, guide.id)}
        onDragEnd={handleDragEnd}
        onClick={() => !isEditing && onSelect(guide.id)}
        className={`group px-3 py-2.5 rounded-lg transition-all border ${
          isSelected
            ? "bg-slate-105 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-indigo-705 dark:text-indigo-400 font-medium"
            : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850/60 border-slate-150 dark:border-slate-800 text-slate-655 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
        } ${!isEditing ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
      >
        {isEditing ? (
          <form onSubmit={(e) => saveGuideRename(guide.id, e)} className="flex items-center gap-2">
            <input
              id={`rename-guide-input-${guide.id}`}
              type="text"
              value={editingGuideText}
              onChange={(e) => setEditingGuideText(e.target.value)}
              className="flex-1 text-xs px-2 py-1 border border-indigo-350 dark:border-slate-700 dark:bg-slate-955 dark:text-slate-100 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
              autoFocus
            />
            <button type="submit" className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded cursor-pointer">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={cancelGuideRename} className="p-1 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-1">
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 transition-colors ${
                  isSelected ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-700 group-hover:bg-indigo-400 dark:group-hover:bg-indigo-500"
                }`} />
                <span className="text-xs font-semibold truncate pr-1" title={guide.title}>
                  {guide.title}
                </span>
              </div>

              {/* Action buttons — visible on hover (desktop) or always (mobile via CSS) */}
              <div className="guide-actions flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shrink-0">
                {/* Move to folder */}
                <div className="relative">
                  <button
                    id={`move-btn-${guide.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMoveMenuGuideId(moveMenuGuideId === guide.id ? null : guide.id);
                    }}
                    className="p-1 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                    title="Move to folder"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                  </button>
                  {moveMenuGuideId === guide.id && (
                    <div
                      ref={moveMenuRef}
                      className="absolute right-0 top-full mt-1 z-50 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 text-xs"
                    >
                      <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Move to…</p>
                      {folders.map(f => {
                        const colors = FOLDER_COLOR_MAP[f.color];
                        const isCurrentFolder = guide.folderId === f.id;
                        return (
                          <button
                            key={f.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isCurrentFolder) onMoveGuide(guide.id, f.id);
                              setMoveMenuGuideId(null);
                            }}
                            disabled={isCurrentFolder}
                            className={`w-full text-left px-3 py-1.5 flex items-center gap-2 transition-colors ${
                              isCurrentFolder
                                ? "text-slate-300 dark:text-slate-600 cursor-default"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
                            <span className="truncate">{f.name}</span>
                            {isCurrentFolder && <Check className="w-3 h-3 ml-auto text-indigo-500 shrink-0" />}
                          </button>
                        );
                      })}
                      {guide.folderId && (
                        <>
                          <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveGuide(guide.id, null);
                              setMoveMenuGuideId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            Remove from folder
                          </button>
                        </>
                      )}
                      {folders.length === 0 && (
                        <p className="px-3 py-2 text-slate-400 dark:text-slate-500 italic">No folders yet</p>
                      )}
                    </div>
                  )}
                </div>
                <button
                  id={`rename-btn-${guide.id}`}
                  onClick={(e) => startEditingGuide(guide, e)}
                  className="p-1 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  title="Rename study guide"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  id={`delete-btn-${guide.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(guide.id);
                  }}
                  className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-505 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  title="Delete study guide"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1 pl-4.5 pt-0.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400/90 dark:text-slate-500">
                <span>{totalTopics} topics • {completionPercent}% done</span>
                <span>
                  {new Date(guide.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              {/* Mini Progress Bar */}
              {totalTopics > 0 && (
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 mt-0.5">
                  <div
                    className="bg-indigo-500 dark:bg-indigo-400 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              )}

              {/* Latest Quiz Attempt Badge */}
              {latestAttempt && (
                <div className="flex items-center gap-1 mt-1 text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                  <span>Latest Quiz: {latestAttempt.score}/{latestAttempt.totalQuestions} ({Math.round((latestAttempt.score / latestAttempt.totalQuestions) * 100)}%)</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- Render a folder accordion section ---
  const renderFolder = (folder: StudyFolder) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isEditingThis = editingFolderId === folder.id;
    const memberGuides = guidesInFolder(folder.id);
    const colors = FOLDER_COLOR_MAP[folder.color];
    const FolderIcon = isExpanded ? FolderOpen : Folder;

    const isDragOver = dragOverFolderId === folder.id;

    return (
      <div
        key={folder.id}
        id={`folder-${folder.id}`}
        className="space-y-1"
        onDragOver={(e) => handleFolderDragOver(e, folder.id)}
        onDragLeave={handleFolderDragLeave}
        onDrop={(e) => handleFolderDrop(e, folder.id)}
      >
        {/* Folder Header */}
        <div
          onClick={() => !isEditingThis && toggleFolder(folder.id)}
          className={`group flex items-center justify-between px-2.5 py-2 rounded-lg transition-all cursor-pointer border ${
            isDragOver
              ? "ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900 border-indigo-400 dark:border-indigo-500 scale-[1.02] shadow-md"
              : `${colors.border} ${colors.bg} hover:opacity-90`
          }`}
        >
          {isEditingThis ? (
            <form onSubmit={(e) => saveFolderRename(folder.id, e)} className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
              <input
                id={`rename-folder-input-${folder.id}`}
                type="text"
                value={editingFolderText}
                onChange={(e) => setEditingFolderText(e.target.value)}
                className="flex-1 text-xs px-2 py-1 border border-indigo-350 dark:border-slate-700 dark:bg-slate-955 dark:text-slate-100 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                autoFocus
              />
              <button type="submit" className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded cursor-pointer">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={cancelFolderRename} className="p-1 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {isExpanded ? (
                  <ChevronDown className={`w-3 h-3 shrink-0 ${colors.text}`} />
                ) : (
                  <ChevronRight className={`w-3 h-3 shrink-0 ${colors.text}`} />
                )}
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors.dot}`} />
                <FolderIcon className={`w-3.5 h-3.5 shrink-0 ${colors.text}`} />
                <span className={`text-xs font-bold truncate ${colors.text}`}>
                  {folder.name}
                </span>
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 shrink-0">
                  ({memberGuides.length})
                </span>
              </div>

              {/* Folder action buttons */}
              <div className="folder-actions flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  id={`rename-folder-btn-${folder.id}`}
                  onClick={(e) => startEditingFolder(folder, e)}
                  className="p-1 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors cursor-pointer"
                  title="Rename folder"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  id={`delete-folder-btn-${folder.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFolder(folder.id);
                  }}
                  className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors cursor-pointer"
                  title="Delete folder (guides move to Unfiled)"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Folder contents (accordion body) */}
        {isExpanded && (
          <div className="pl-3 space-y-1 border-l-2 ml-3 border-slate-100 dark:border-slate-800">
            {memberGuides.length > 0 ? (
              memberGuides.map(renderGuideItem)
            ) : (
              <p className="text-[10px] text-slate-400 dark:text-slate-600 italic px-3 py-2">
                No sessions yet
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="history-container" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 h-full transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-sans font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-widest">
            Recent Sessions
          </h3>
        </div>
        <button
          id="create-folder-btn"
          onClick={() => setIsCreatingFolder(true)}
          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Create new folder"
        >
          <FolderPlus className="w-4 h-4" />
        </button>
      </div>

      {/* Create folder inline form */}
      {isCreatingFolder && (
        <form onSubmit={submitCreateFolder} className="flex items-center gap-2">
          <input
            ref={newFolderInputRef}
            id="new-folder-name-input"
            type="text"
            placeholder="Folder name…"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="flex-1 text-xs px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-sans transition-all"
          />
          <button
            type="submit"
            disabled={!newFolderName.trim()}
            className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-default"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => { setIsCreatingFolder(false); setNewFolderName(""); }}
            className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Main content */}
      {history.length === 0 && folders.length === 0 ? (
        <div id="empty-history" className="text-center py-8 text-xs text-slate-400 dark:text-slate-500 font-sans leading-relaxed">
          No active session notes found. Upload your materials above to build a study set.
        </div>
      ) : (
        <div id="history-list" className="space-y-2 max-h-[380px] lg:max-h-[500px] overflow-y-auto pr-1">
          {/* Render folders first */}
          {folders.map(renderFolder)}

          {/* Unfiled section — shown when folders exist AND (there are unfiled guides OR something is being dragged) */}
          {hasFolders && (unfiledGuides.length > 0 || dragOverFolderId !== null) && (
            <div
              className={`space-y-1.5 pt-2 rounded-lg transition-all ${
                dragOverFolderId === "__unfiled__"
                  ? "ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900 bg-slate-50 dark:bg-slate-800/40 p-2"
                  : ""
              }`}
              onDragOver={(e) => handleFolderDragOver(e, "__unfiled__")}
              onDragLeave={handleFolderDragLeave}
              onDrop={(e) => handleFolderDrop(e, null)}
            >
              <div className="flex items-center gap-2 px-2">
                <div className="flex-1 h-px bg-slate-150 dark:bg-slate-800" />
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest shrink-0">
                  {dragOverFolderId === "__unfiled__" ? "Drop to unfile" : "Unfiled"}
                </span>
                <div className="flex-1 h-px bg-slate-150 dark:bg-slate-800" />
              </div>
              {unfiledGuides.map(renderGuideItem)}
            </div>
          )}

          {/* No folders — flat list (original behavior) */}
          {!hasFolders && history.length > 0 && (
            <>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 mb-1">Previous sessions</p>
              {history.map(renderGuideItem)}
            </>
          )}
        </div>
      )}
    </div>
  );
}
