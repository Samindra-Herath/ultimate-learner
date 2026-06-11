import React, { useState } from "react";
import { Clock, Trash2, Edit3, Check, X, FileText, ChevronRight } from "lucide-react";
import { StudyGuide } from "../types";

interface HistorySidebarProps {
  history: StudyGuide[];
  currentGuideId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
}

export default function HistorySidebar({
  history,
  currentGuideId,
  onSelect,
  onDelete,
  onRename,
}: HistorySidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  const startEditing = (guide: StudyGuide, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(guide.id);
    setEditingText(guide.title);
  };

  const saveRename = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (editingText.trim()) {
      onRename(id, editingText.trim());
    }
    setEditingId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <div id="history-container" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 h-full transition-colors">
      <div className="flex items-center gap-2 border-b border-slate-150 dark:border-slate-800 pb-3">
        <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        <h3 className="font-sans font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-widest">
          Recent Sessions
        </h3>
      </div>

      {history.length === 0 ? (
        <div id="empty-history" className="text-center py-8 text-xs text-slate-400 dark:text-slate-500 font-sans leading-relaxed">
          No active session notes found. Upload your materials above to build a study set.
        </div>
      ) : (
        <div id="history-list" className="space-y-1.5 max-h-[380px] lg:max-h-[500px] overflow-y-auto pr-1">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 mb-1">Previous sessions</p>
          {history.map((guide) => {
            const isSelected = guide.id === currentGuideId;
            const isEditing = guide.id === editingId;

            return (
              <div
                key={guide.id}
                id={`history-item-${guide.id}`}
                onClick={() => !isEditing && onSelect(guide.id)}
                className={`group px-3 py-2.5 rounded-lg transition-all border ${
                  isSelected
                    ? "bg-slate-105 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-indigo-705 dark:text-indigo-400 font-medium"
                    : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850/60 border-slate-150 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                } ${!isEditing ? "cursor-pointer" : "cursor-default"}`}
              >
                {isEditing ? (
                  <form onSubmit={(e) => saveRename(guide.id, e)} className="flex items-center gap-2">
                    <input
                      id="rename-input"
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="flex-1 text-xs px-2 py-1 border border-indigo-350 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                      autoFocus
                    />
                    <button
                      id="save-rename-btn"
                      type="submit"
                      className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id="cancel-rename-btn"
                      type="button"
                      onClick={cancelRename}
                      className="p-1 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 transition-colors ${
                          isSelected ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-700 group-hover:bg-indigo-400 dark:group-hover:bg-indigo-500"
                        }`} />
                        <span className="text-xs font-semibold truncate pr-1" title={guide.title}>
                          {guide.title}
                        </span>
                      </div>
                      
                      {/* Action buttons visible on hover or if selected */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shrink-0">
                        <button
                          id={`rename-btn-${guide.id}`}
                          onClick={(e) => startEditing(guide, e)}
                          className="p-1 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors"
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
                          className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-505 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors"
                          title="Delete study guide"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400/90 dark:text-slate-500 pl-4.5">
                      <span>{guide.topics?.length || 0} topics</span>
                      <span>
                        {new Date(guide.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
