import React, { useState } from "react";
import { Prompt } from "../types";
import { Search, Sliders, Columns, Sparkles, BarChart, Database, Cpu, Plus, FileText, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CommandPaletteModalProps {
  prompts: Prompt[];
  onSelectPrompt: (id: string) => void;
  onNavigateTab: (tab: string) => void;
  onCreateNew: () => void;
  onClose: () => void;
}

export default function CommandPaletteModal({
  prompts,
  onSelectPrompt,
  onNavigateTab,
  onCreateNew,
  onClose,
}: CommandPaletteModalProps) {
  const [query, setQuery] = useState("");

  const filteredPrompts = prompts.filter(p =>
    p.title.toLowerCase().includes(query.toLowerCase()) ||
    p.description.toLowerCase().includes(query.toLowerCase()) ||
    p.category.toLowerCase().includes(query.toLowerCase())
  );

  const actions = [
    { id: "action-new", label: "Create New Prompt", icon: Plus, tab: "editor", action: onCreateNew, color: "text-emerald-400" },
    { id: "action-catalog", label: "Open Library Catalog", icon: FileText, tab: "catalog", color: "text-indigo-400" },
    { id: "action-refiner", label: "AI Prompt Refiner", icon: Sparkles, tab: "optimize", color: "text-amber-400" },
    { id: "action-analytics", label: "Insights & Metrics", icon: BarChart, tab: "analytics", color: "text-rose-400" },
    { id: "action-providers", label: "Manage Providers", icon: Cpu, tab: "providers", color: "text-cyan-400" },
    { id: "action-sqlite", label: "SQLite DB Inspector", icon: Database, tab: "sqlite", color: "text-indigo-400" },
  ];

  const filteredActions = actions.filter(a =>
    a.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-5 font-sans text-slate-100">
      <div className="flex items-center gap-4 bg-slate-950/50 border border-white/5 p-4 rounded-2xl group focus-within:border-indigo-500/30 transition-all">
        <Search className="h-5 w-5 text-indigo-500 group-focus-within:text-indigo-400 transition-colors" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search prompts, categories, or workstation commands..."
          autoFocus
          className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-600 focus:outline-none font-medium"
        />
        <div className="flex items-center gap-1">
          <kbd className="text-[10px] font-mono bg-white/5 px-2 py-1 rounded text-slate-500 border border-white/5">ESC</kbd>
        </div>
      </div>

      <div className="flex flex-col gap-6 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
        {/* Quick Actions section */}
        <AnimatePresence>
          {filteredActions.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-2"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 px-2 mb-1">Workspace Actions</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredActions.map(act => {
                  const Icon = act.icon;
                  return (
                    <button
                      key={act.id}
                      onClick={() => {
                        if (act.action) {
                          act.action();
                        } else if (act.tab) {
                          onNavigateTab(act.tab);
                        }
                        onClose();
                      }}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 hover:border-white/10 border border-transparent transition-all text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-slate-950/50 ${act.color} group-hover:scale-110 transition-transform`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-[11px] font-bold text-white uppercase tracking-wider">{act.label}</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-700 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prompts section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
              Library Records
            </span>
            <span className="text-[10px] font-mono text-slate-700">{filteredPrompts.length} MATCHES</span>
          </div>
          
          <div className="flex flex-col gap-1.5">
            {filteredPrompts.map((prompt, idx) => (
              <motion.button
                key={prompt.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => {
                  onSelectPrompt(prompt.id);
                  onClose();
                }}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-indigo-600/10 border border-transparent hover:border-indigo-500/20 transition-all text-left cursor-pointer group"
              >
                <div className="flex flex-col gap-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-slate-600 group-hover:text-indigo-400" />
                    <span className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition-colors">{prompt.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 truncate pl-5">{prompt.description}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-lg shrink-0 uppercase tracking-tighter">
                    {prompt.category}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.button>
            ))}
          </div>

          {filteredPrompts.length === 0 && (
            <div className="py-12 text-center flex flex-col items-center gap-3">
              <Search className="h-10 w-10 text-slate-800" />
              <p className="text-xs italic text-slate-500">No prompts matching "{query}" found in your workspace.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

