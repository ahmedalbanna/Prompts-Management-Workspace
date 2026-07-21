import React, { useState, useMemo } from "react";
import { Prompt } from "../types";
import { Search, Folder, Tag, Plus, ChevronRight, FileText, Sparkles, Star, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface QuickPromptNavigatorProps {
  prompts: Prompt[];
  selectedPromptId: string | null;
  onSelectPrompt: (id: string) => void;
  onCreateNew: () => void;
  onOptimizeTrigger: () => void;
}

export default function QuickPromptNavigator({
  prompts,
  selectedPromptId,
  onSelectPrompt,
  onCreateNew,
  onOptimizeTrigger,
}: QuickPromptNavigatorProps) {
  const [search, setSearch] = useState("");

  const filteredPrompts = useMemo(() => {
    return prompts.filter(p => 
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    );
  }, [prompts, search]);

  // Derived sections
  const starredPrompts = useMemo(() => prompts.filter(p => p.tags.includes("Starred")), [prompts]);
  const recentPrompts = useMemo(() => [...prompts].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 3), [prompts]);
  const categories = useMemo(() => Array.from(new Set(prompts.map(p => p.category || "General"))), [prompts]);

  return (
    <div className="flex flex-col gap-5 text-xs">
      {/* Primary Actions */}
      <div className="grid grid-cols-2 gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCreateNew}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer border border-indigo-400/20"
        >
          <Plus className="h-3.5 w-3.5" /> New
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onOptimizeTrigger}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 font-bold transition-all cursor-pointer border border-white/10 backdrop-blur-sm"
        >
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> Refine
        </motion.button>
      </div>

      {/* Filter Input */}
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search workstation..."
          className="w-full bg-slate-950/40 border border-white/5 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:bg-slate-950/60 transition-all"
        />
      </div>

      <div className="flex flex-col gap-6 custom-scrollbar overflow-y-auto pr-1">
        {/* Starred Section */}
        {!search && starredPrompts.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 font-black text-slate-500 uppercase tracking-[0.15em] text-[9px] px-1">
              <Star className="h-3 w-3 text-amber-400 fill-amber-400/20" /> Favorites
            </div>
            <div className="flex flex-col gap-1">
              {starredPrompts.map(p => (
                <PromptItem 
                  key={p.id} 
                  prompt={p} 
                  isSelected={p.id === selectedPromptId} 
                  onClick={() => onSelectPrompt(p.id)} 
                />
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="flex flex-col gap-5">
          {categories.map(cat => {
            const catPrompts = filteredPrompts.filter(p => (p.category || "General") === cat);
            if (catPrompts.length === 0) return null;

            return (
              <div key={cat} className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 font-black text-slate-500 uppercase tracking-[0.15em] text-[9px]">
                    <Folder className="h-3 w-3 text-indigo-500" /> {cat}
                  </div>
                  <span className="text-[10px] font-mono text-slate-600">{catPrompts.length}</span>
                </div>

                <div className="flex flex-col gap-1">
                  {catPrompts.map(prompt => (
                    <PromptItem 
                      key={prompt.id} 
                      prompt={prompt} 
                      isSelected={prompt.id === selectedPromptId} 
                      onClick={() => onSelectPrompt(prompt.id)} 
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {filteredPrompts.length === 0 && (
          <div className="py-8 text-center flex flex-col items-center gap-2 opacity-50">
            <Search className="h-8 w-8 text-slate-700" />
            <p className="text-[11px] italic text-slate-500">No matching prompts found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const PromptItem: React.FC<{ 
  prompt: Prompt; 
  isSelected: boolean; 
  onClick: () => void; 
}> = ({ prompt, isSelected, onClick }) => {
  return (
    <motion.button
      layout
      onClick={onClick}
      className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between group cursor-pointer border ${
        isSelected
          ? "bg-indigo-600/15 border-indigo-500/40 text-white shadow-sm"
          : "border-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200"
      }`}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${isSelected ? "bg-indigo-500 text-white" : "bg-white/5 group-hover:bg-white/10"}`}>
          <FileText className="h-3.5 w-3.5" />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className={`truncate text-xs ${isSelected ? "font-bold" : "font-medium"}`}>{prompt.title}</span>
          <span className="text-[10px] text-slate-600 truncate group-hover:text-slate-500 transition-colors">
            {new Date(prompt.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
      <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition-all ${isSelected ? "text-indigo-400 translate-x-0" : "opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0"}`} />
    </motion.button>
  );
};

