import React, { useState, useMemo } from "react";
import { Prompt } from "../types";
import { 
  Search, 
  Tag, 
  Folder, 
  Play, 
  Clock, 
  Cpu, 
  Layers, 
  Plus, 
  Flame, 
  Sparkles,
  FileCode,
  ArrowRight
} from "lucide-react";

interface PromptCatalogProps {
  prompts: Prompt[];
  selectedPromptId: string | null;
  onSelectPrompt: (id: string) => void;
  onCreateNew: () => void;
  onOptimizeTabTrigger: () => void;
}

export default function PromptCatalog({
  prompts,
  selectedPromptId,
  onSelectPrompt,
  onCreateNew,
  onOptimizeTabTrigger,
}: PromptCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Get all unique categories
  const categories = useMemo(() => {
    const list = new Set<string>();
    prompts.forEach(p => {
      if (p.category) list.add(p.category);
    });
    return ["All", ...Array.from(list)];
  }, [prompts]);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    prompts.forEach(p => {
      p.tags.forEach(t => tags.add(t));
    });
    return Array.from(tags);
  }, [prompts]);

  // Filter prompts
  const filteredPrompts = useMemo(() => {
    return prompts.filter(p => {
      const matchesSearch = 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.template.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.systemInstruction.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = activeCategory === "All" || p.category === activeCategory;
      const matchesTag = !selectedTag || p.tags.includes(selectedTag);

      return matchesSearch && matchesCategory && matchesTag;
    });
  }, [prompts, searchQuery, activeCategory, selectedTag]);

  // Highlight variables helper
  const detectVariablesCount = (text: string) => {
    const matches = text.match(/{{\s*[a-zA-Z0-9_]+\s*}}/g);
    return matches ? new Set(matches.map(m => m.replace(/[{}]/g, "").trim())).size : 0;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-1" id="prompt-catalog-container">
      {/* Sidebar Filters */}
      <div className="lg:col-span-1 space-y-5" id="catalog-filters-sidebar">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
          <input
            id="catalog-search-input"
            type="text"
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-sans"
          />
        </div>

        {/* Categories Rail */}
        <div className="glass-container rounded-3xl p-5 space-y-3" id="categories-rail">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-display">
            <Folder className="h-3 w-3 text-indigo-400" /> Categories
          </h3>
          <div className="space-y-1">
            {categories.map(cat => (
              <button
                id={`cat-filter-${cat.toLowerCase().replace(/\s+/g, "-")}`}
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setSelectedTag(null);
                }}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-sm transition-all flex items-center justify-between cursor-pointer ${
                  activeCategory === cat
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span>{cat}</span>
                <span className="text-xs text-slate-500 font-mono">
                  {cat === "All" 
                    ? prompts.length 
                    : prompts.filter(p => p.category === cat).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tag Cloud */}
        <div className="glass-container rounded-3xl p-5 space-y-3" id="tag-cloud-container">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-display">
            <Tag className="h-3 w-3 text-indigo-400" /> Taxonomy Tags
          </h3>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {allTags.map(tag => (
              <button
                id={`tag-filter-${tag.toLowerCase()}`}
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-all flex items-center gap-1 font-mono border cursor-pointer ${
                  selectedTag === tag
                    ? "bg-indigo-500/40 border-indigo-400/60 text-indigo-100 font-semibold"
                    : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
          {selectedTag && (
            <button
              id="clear-tag-filter"
              onClick={() => setSelectedTag(null)}
              className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline font-medium block pt-1.5 cursor-pointer"
            >
              Clear tag filter
            </button>
          )}
        </div>

        {/* AI Quick Start Callout */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-5 space-y-3" id="ai-quick-start-callout">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <h4 className="text-sm font-bold text-amber-200">Need inspiration?</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            Convert a simple phrase or unstructured prompt idea into a high-performance system-structured template using our AI Optimizer.
          </p>
          <button
            id="go-to-optimizer-hub"
            onClick={onOptimizeTabTrigger}
            className="w-full text-xs bg-amber-500/20 border border-amber-500/30 text-amber-200 hover:bg-amber-500/35 font-semibold py-2 px-3 rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            Launch Prompt Refiner <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Prompts Cards Area */}
      <div className="lg:col-span-3 space-y-4" id="prompts-cards-area">
        <div className="flex items-center justify-between" id="catalog-header-actions">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-400" />
              Prompt Library
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing {filteredPrompts.length} of {prompts.length} structured templates
            </p>
          </div>
          
          <button
            id="create-new-prompt-btn"
            onClick={onCreateNew}
            className="px-4 py-2.5 bg-indigo-500/80 hover:bg-indigo-600 text-white font-semibold text-sm rounded-xl shadow-md border border-indigo-400/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Create Prompt
          </button>
        </div>

        {filteredPrompts.length === 0 ? (
          <div className="glass-container rounded-3xl p-12 text-center space-y-3" id="empty-catalog-state">
            <div className="inline-flex p-3 bg-white/5 border border-white/5 rounded-full text-slate-400">
              <FileCode className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-white">No prompts found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search query, selecting another category, or write a new custom prompt template.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="prompts-grid">
            {filteredPrompts.map(prompt => {
              const varCount = detectVariablesCount(prompt.template);
              const isSelected = prompt.id === selectedPromptId;
              const hasRecentActivity = prompt.versions.length > 1;

              return (
                <div
                  id={`prompt-card-${prompt.id}`}
                  key={prompt.id}
                  onClick={() => onSelectPrompt(prompt.id)}
                  className={`glass-card rounded-3xl p-6 hover:border-white/20 hover:bg-white/10 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 group relative ${
                    isSelected 
                      ? "ring-2 ring-indigo-500/60 border-indigo-400/80" 
                      : "border-white/10"
                  }`}
                >
                  {/* Glowing edits flame indicator */}
                  {prompt.versions.length >= 2 && (
                    <div className="absolute top-5 right-5 flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-medium">
                      <Flame className="h-3 w-3 text-amber-400" /> {prompt.versions.length} edits
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                      <Folder className="h-3.5 w-3.5 text-slate-500" />
                      <span>{prompt.category}</span>
                    </div>

                    <h3 className="font-bold text-white group-hover:text-indigo-300 transition-colors text-base pr-8 font-display">
                      {prompt.title}
                    </h3>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed font-sans">
                      {prompt.description || "No description provided."}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-white/5">
                    <div className="flex flex-wrap gap-1">
                      {prompt.tags.map(t => (
                        <span key={t} className="bg-white/5 text-slate-300 font-mono text-[10px] px-2.5 py-0.5 border border-white/5 rounded-lg">
                          #{t}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Cpu className="h-3.5 w-3.5 text-slate-500" />
                        <span>{prompt.model}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold px-2 py-0.5 border border-indigo-500/20 rounded-md font-mono">
                          {varCount} {varCount === 1 ? "Var" : "Vars"}
                        </span>
                        
                        <div className="flex items-center gap-0.5 text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform">
                          <span>Workstation</span>
                          <Play className="h-2.5 w-2.5 fill-current" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
