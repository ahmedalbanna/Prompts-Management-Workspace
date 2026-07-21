import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Prompt, PromptVersion, TestCase } from "./types";
import { INITIAL_PROMPTS } from "./initialPrompts";

// Layout Shell Architecture
import { LayoutShell } from "./components/LayoutShell";
import QuickPromptNavigator from "./components/QuickPromptNavigator";
import CommandPaletteModal from "./components/CommandPaletteModal";

// Workspace Views
import PromptCatalog from "./components/PromptCatalog";
import PromptEditor from "./components/PromptEditor";
import VersionHistory from "./components/VersionHistory";
import AiOptimizer from "./components/AiOptimizer";
import EvaluationsLab from "./components/EvaluationsLab";
import AnalyticsPanel from "./components/AnalyticsPanel";
import SqliteInspector from "./components/SqliteInspector";
import ModelProvidersManager from "./components/ModelProvidersManager";

import { 
  Layers, 
  Sliders, 
  Columns, 
  Sparkles, 
  BarChart, 
  GitBranch, 
  User, 
  Database,
  RefreshCw,
  CheckCircle2,
  Cpu,
  Search,
  PanelLeft,
  PanelRight,
  Info,
  Clock,
  Tag
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Load prompts state
  const [prompts, setPrompts] = useState<Prompt[]>(() => {
    const saved = localStorage.getItem("prompt_craft_prompts");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved prompts, reverting to defaults", e);
      }
    }
    return INITIAL_PROMPTS;
  });

  const [isSqliteConnected, setIsSqliteConnected] = useState(false);

  // Fetch prompts directly from SQLite backend database
  const fetchPromptsFromSQLite = useCallback(async () => {
    try {
      const res = await fetch("/api/db/prompts");
      const data = await res.json();
      if (data.success && Array.isArray(data.prompts) && data.prompts.length > 0) {
        setPrompts(data.prompts);
        setIsSqliteConnected(true);
      }
    } catch (err) {
      console.warn("SQLite endpoint unavailable, using local client cache", err);
    }
  }, []);

  useEffect(() => {
    fetchPromptsFromSQLite();
  }, [fetchPromptsFromSQLite]);

  // Selected prompt tracking
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(() => {
    return prompts.length > 0 ? prompts[0].id : null;
  });

  const selectedPrompt = useMemo(() => {
    return prompts.find(p => p.id === selectedPromptId) || null;
  }, [prompts, selectedPromptId]);

  // Save prompts to localStorage cache whenever they change
  useEffect(() => {
    localStorage.setItem("prompt_craft_prompts", JSON.stringify(prompts));
  }, [prompts]);

  // Helper to persist prompt to SQLite backend database
  const syncPromptToSQLite = async (promptToSync: Prompt) => {
    try {
      await fetch("/api/db/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(promptToSync),
      });
      setIsSqliteConnected(true);
    } catch (err) {
      console.warn("Failed to sync prompt to SQLite database", err);
    }
  };

  // Navigation state: "catalog" | "editor" | "evaluations" | "optimize" | "analytics" | "sqlite" | "providers"
  const [activeTab, setActiveTab] = useState<string>("catalog");

  // Layout Shell slot visibility states
  const [isLeftSlotOpen, setIsLeftSlotOpen] = useState(false);
  const [isRightSlotOpen, setIsRightSlotOpen] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<React.ReactNode | null>(null);

  // Active User Persona (Ahmed Albanna, Sarah Jenkins, Alex Martinez)
  const [activePersona, setActivePersona] = useState("Ahmed Albanna");

  // Keyboard shortcut listener for Command Palette (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openCommandPalette();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prompts, selectedPromptId]);

  const openCommandPalette = () => {
    setActiveOverlay(
      <CommandPaletteModal
        prompts={prompts}
        onSelectPrompt={(id) => {
          setSelectedPromptId(id);
          setActiveTab("editor");
        }}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onCreateNew={handleCreateNewPrompt}
        onClose={() => setActiveOverlay(null)}
      />
    );
  };

  // Handlers for prompts actions

  // 1. Save / Commit updated prompt parameter state
  const handleSavePrompt = (updatedPrompt: Prompt, commitMessage: string) => {
    const newVersion: PromptVersion = {
      id: `ver-${Date.now()}`,
      versionString: `${updatedPrompt.versions.length + 1}.0.0`,
      commitMessage,
      systemInstruction: updatedPrompt.systemInstruction,
      template: updatedPrompt.template,
      model: updatedPrompt.model,
      temperature: updatedPrompt.temperature,
      createdAt: new Date().toISOString(),
    };

    // Append new version and set as current
    const savedPrompt = {
      ...updatedPrompt,
      versions: [...updatedPrompt.versions, newVersion],
      currentVersionIndex: updatedPrompt.versions.length,
      updatedAt: new Date().toISOString(),
    };

    setPrompts(prev => prev.map(p => p.id === savedPrompt.id ? savedPrompt : p));
    syncPromptToSQLite(savedPrompt);
  };

  // 2. Revert prompt to a specific version in timeline
  const handleRevertPrompt = (version: PromptVersion) => {
    if (!selectedPrompt) return;

    // Create a new regression/restored commit block
    const regressionMessage = `Restored to Revision version ${version.versionString} (${version.commitMessage})`;
    
    const revertedPrompt: Prompt = {
      ...selectedPrompt,
      systemInstruction: version.systemInstruction,
      template: version.template,
      model: version.model,
      temperature: version.temperature,
      updatedAt: new Date().toISOString(),
    };

    handleSavePrompt(revertedPrompt, regressionMessage);
  };

  // 3. Add / Edit test scenarios
  const handleUpdateTestCases = (updatedTestCases: TestCase[]) => {
    if (!selectedPrompt) return;
    
    const updated = {
      ...selectedPrompt,
      testCases: updatedTestCases,
      updatedAt: new Date().toISOString()
    };

    setPrompts(prev => prev.map(p => p.id === updated.id ? updated : p));
    syncPromptToSQLite(updated);
  };

  // 4. Create a completely brand new blank prompt template
  const handleCreateNewPrompt = () => {
    const newId = `prompt-user-${Date.now()}`;
    const newPrompt: Prompt = {
      id: newId,
      title: "Untitled Prompt Template",
      description: "Enter a brief description of what this prompt template produces.",
      category: "General",
      tags: ["Draft"],
      systemInstruction: "You are a helpful assistant.",
      template: "Enter your prompt draft here. Specify variables in curly-braces, e.g., {{variable_name}}",
      model: "gemini-3.5-flash",
      temperature: 0.7,
      maxOutputTokens: 2048,
      versions: [
        {
          id: `ver-init-${Date.now()}`,
          versionString: "1.0.0",
          commitMessage: "Prompt initialization",
          systemInstruction: "You are a helpful assistant.",
          template: "Enter your prompt draft here. Specify variables in curly-braces, e.g., {{variable_name}}",
          model: "gemini-3.5-flash",
          temperature: 0.7,
          maxOutputTokens: 2048,
          createdAt: new Date().toISOString()
        }
      ],
      currentVersionIndex: 0,
      testCases: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPrompts(prev => [newPrompt, ...prev]);
    setSelectedPromptId(newId);
    setActiveTab("editor");
    syncPromptToSQLite(newPrompt);
  };

  // 5. Load an AI optimized template straight into workstation
  const handleLoadOptimized = (data: {
    title: string;
    description: string;
    category: string;
    systemInstruction: string;
    template: string;
    tags: string[];
  }) => {
    const newId = `prompt-opt-${Date.now()}`;
    const newPrompt: Prompt = {
      id: newId,
      title: data.title,
      description: data.description,
      category: data.category,
      tags: data.tags,
      systemInstruction: data.systemInstruction,
      template: data.template,
      model: "gemini-3.5-flash",
      temperature: 0.6,
      maxOutputTokens: 2048,
      versions: [
        {
          id: `ver-init-${Date.now()}`,
          versionString: "1.0.0",
          commitMessage: "Initial prompt compiled using AI Optimizer",
          systemInstruction: data.systemInstruction,
          template: data.template,
          model: "gemini-3.5-flash",
          temperature: 0.6,
          maxOutputTokens: 2048,
          createdAt: new Date().toISOString()
        }
      ],
      currentVersionIndex: 0,
      testCases: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPrompts(prev => [newPrompt, ...prev]);
    setSelectedPromptId(newId);
    setActiveTab("editor");
    syncPromptToSQLite(newPrompt);
  };

  // 6. Execute the test prompt request server-side
  const handleRunTest = async (payload: {
    systemInstruction: string;
    template: string;
    variables: Record<string, string>;
    model: string;
    temperature: number;
    maxOutputTokens: number;
  }) => {
    const response = await fetch("/api/prompts/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        promptId: selectedPromptId,
      })
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Execution failed.");
    }

    return {
      output: data.output,
      durationMs: data.durationMs,
      tokens: data.tokens,
    };
  };

  const handleResetCatalog = async () => {
    if (window.confirm("Are you sure you want to restore all pre-loaded prompts in SQLite? This will overwrite active custom edits.")) {
      try {
        const res = await fetch("/api/db/reset", { method: "POST" });
        const data = await res.json();
        if (data.success && Array.isArray(data.prompts)) {
          setPrompts(data.prompts);
          if (data.prompts.length > 0) {
            setSelectedPromptId(data.prompts[0].id);
          }
          setActiveTab("catalog");
          alert("SQLite database restored to seed defaults!");
          return;
        }
      } catch (err) {
        console.warn("Failed to reset SQLite DB via API, using local fallback", err);
      }

      setPrompts(INITIAL_PROMPTS);
      if (INITIAL_PROMPTS.length > 0) {
        setSelectedPromptId(INITIAL_PROMPTS[0].id);
      }
      setActiveTab("catalog");
    }
  };

  /* SLOT CONTENT RENDERERS */

  // 1. TOP SLOT (Header, Brand, Nav Tabs, Slot Toggles)
  const renderTopSlot = () => (
    <div className="px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-3">
          {/* Toggle Left Slot Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsLeftSlotOpen(prev => !prev)}
            className={`p-2 rounded-xl transition-all cursor-pointer border ${
              isLeftSlotOpen 
                ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20" 
                : "bg-white/5 border-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
            }`}
            title="Toggle Sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </motion.button>

          <div className="flex items-center gap-3 group">
            <div className="bg-indigo-600 rounded-xl p-2.5 flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <GitBranch className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-black text-white tracking-widest uppercase">
                PromptCraft <span className="text-indigo-400">Studio</span>
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">v4.0.0 Stable</span>
                <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] text-emerald-500/80 font-mono font-bold">WASM_STORAGE_ACTIVE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modules navigation selectors */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-950/40 border border-white/5 p-1 rounded-xl" id="modules-navigation">
          {[
            { id: "catalog", label: "Library", icon: Layers },
            { id: "editor", label: "Workstation", icon: Sliders, disabled: !selectedPromptId },
            { id: "evaluations", label: "Evaluations", icon: Columns, disabled: !selectedPromptId },
            { id: "optimize", label: "Refiner", icon: Sparkles },
            { id: "analytics", label: "Analytics", icon: BarChart },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              disabled={tab.disabled}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 text-[11px] font-bold cursor-pointer ${
                tab.disabled ? "opacity-30 cursor-not-allowed" : ""
              } ${
                activeTab === tab.id
                  ? "bg-white/10 text-white shadow-sm border border-white/10"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              }`}
            >
              <tab.icon className={`h-3.5 w-3.5 ${activeTab === tab.id ? "text-indigo-400" : ""}`} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Quick Search Command Palette Trigger & Right Slot Toggle */}
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openCommandPalette}
          className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-950/40 border border-white/5 text-slate-500 hover:text-slate-200 hover:border-white/10 transition-all cursor-pointer group"
        >
          <Search className="h-3.5 w-3.5 text-indigo-500/70 group-hover:text-indigo-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider">Search Workspace</span>
          <span className="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded-md text-slate-600 group-hover:text-slate-400">⌘K</span>
        </motion.button>

        <div className="h-4 w-[1px] bg-white/5 mx-1" />

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab("providers")}
            className={`p-2 rounded-xl transition-all cursor-pointer border ${
              activeTab === "providers"
                ? "bg-indigo-600/20 border-indigo-500/40 text-white"
                : "bg-white/5 border-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
            }`}
            title="Model Providers"
          >
            <Cpu className="h-4 w-4" />
          </button>
          <button
            onClick={() => setActiveTab("sqlite")}
            className={`p-2 rounded-xl transition-all cursor-pointer border ${
              activeTab === "sqlite"
                ? "bg-indigo-600/20 border-indigo-500/40 text-white"
                : "bg-white/5 border-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
            }`}
            title="Database Manager"
          >
            <Database className="h-4 w-4" />
          </button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsRightSlotOpen(prev => !prev)}
            className={`p-2 rounded-xl transition-all cursor-pointer border ${
              isRightSlotOpen 
                ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20" 
                : "bg-white/5 border-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
            }`}
            title="Toggle Inspector"
          >
            <PanelRight className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );

  // 2. LEFT SLOT (Quick Prompt Navigator)
  const renderLeftSlot = () => (
    <QuickPromptNavigator
      prompts={prompts}
      selectedPromptId={selectedPromptId}
      onSelectPrompt={(id) => {
        setSelectedPromptId(id);
        setActiveTab("editor");
      }}
      onCreateNew={handleCreateNewPrompt}
      onOptimizeTrigger={() => setActiveTab("optimize")}
    />
  );

  // 3. CONTENT SLOT (Active Main Workspace View)
  const renderContentSlot = () => (
    <div className="w-full h-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          {activeTab === "catalog" && (
            <PromptCatalog
              prompts={prompts}
              selectedPromptId={selectedPromptId}
              onSelectPrompt={(id) => {
                setSelectedPromptId(id);
                setActiveTab("editor");
              }}
              onCreateNew={handleCreateNewPrompt}
              onOptimizeTabTrigger={() => setActiveTab("optimize")}
            />
          )}

          {activeTab === "editor" && selectedPrompt && (
            <PromptEditor
              prompt={selectedPrompt}
              onSave={handleSavePrompt}
              onRunTest={handleRunTest}
              onOpenOptimizeDialog={() => setActiveTab("optimize")}
              onOpenVersionsSidebar={() => setIsRightSlotOpen(true)}
            />
          )}

          {activeTab === "evaluations" && selectedPrompt && (
            <EvaluationsLab
              prompt={selectedPrompt}
              onUpdateTestCases={handleUpdateTestCases}
            />
          )}

          {activeTab === "optimize" && (
            <AiOptimizer onLoadOptimized={handleLoadOptimized} />
          )}

          {activeTab === "analytics" && (
            <AnalyticsPanel
              prompts={prompts}
              selectedPrompt={selectedPrompt}
            />
          )}

          {activeTab === "providers" && (
            <ModelProvidersManager />
          )}

          {activeTab === "sqlite" && (
            <SqliteInspector
              onRefreshPrompts={fetchPromptsFromSQLite}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  // 4. RIGHT SLOT (Version History & Inspector Panel)
  const renderRightSlot = () => {
    if (activeTab === "editor" && selectedPrompt) {
      return (
        <VersionHistory
          prompt={selectedPrompt}
          onRevert={handleRevertPrompt}
          onClose={() => setIsRightSlotOpen(false)}
        />
      );
    }

    // Default Contextual Inspector when not in editor
    return (
      <div className="flex flex-col gap-6 text-xs">
        {selectedPrompt ? (
          <div className="flex flex-col gap-5">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-3 shadow-sm">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Resource Context</span>
                <span className="font-bold text-white text-base leading-tight">{selectedPrompt.title}</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">{selectedPrompt.description}</p>
              
              <div className="flex items-center gap-3 mt-1 pt-3 border-t border-white/5">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold text-slate-600 uppercase">Category</span>
                  <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 font-bold border border-indigo-500/20 w-fit">
                    {selectedPrompt.category}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold text-slate-600 uppercase">Revisions</span>
                  <span className="text-slate-300 flex items-center gap-1.5 font-mono font-bold">
                    <Clock className="h-3 w-3 text-indigo-400" /> {selectedPrompt.versions.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 px-1">
              <span className="font-black text-slate-500 uppercase tracking-[0.2em] text-[9px] flex items-center gap-2">
                <Tag className="h-3 w-3 text-indigo-500" /> Taxonomy distribution
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedPrompt.tags.map(t => (
                  <span key={t} className="px-2.5 py-1 rounded-lg bg-slate-950 border border-white/5 text-slate-400 text-[10px] font-bold hover:text-white transition-colors cursor-default">
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/5 flex flex-col gap-3">
              <span className="font-black text-slate-500 uppercase tracking-[0.2em] text-[9px] flex items-center gap-2">
                <Cpu className="h-3 w-3 text-indigo-500" /> Runtime config
              </span>
              <div className="bg-slate-900 border border-white/5 p-3 rounded-xl flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 font-bold">Primary Engine</span>
                  <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase">{selectedPrompt.model}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 font-bold">Temperature</span>
                  <span className="text-[10px] text-slate-300 font-mono font-bold">{selectedPrompt.temperature}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 font-bold">Token Budget</span>
                  <span className="text-[10px] text-slate-300 font-mono font-bold">{selectedPrompt.maxOutputTokens}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center gap-4 px-6">
            <div className="p-4 rounded-full bg-white/5 text-slate-700">
              <Info className="h-8 w-8" />
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              Select a prompt from the catalog or navigator to inspect its structural metadata and runtime configuration.
            </p>
          </div>
        )}
      </div>
    );
  };

  // 5. BOTTOM SLOT (Footer, Persona Switcher, Status Bar)
  const renderBottomSlot = () => (
    <div className="px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-6 text-[10px] font-bold tracking-wider uppercase text-slate-500">
      {/* Interactive active user persona selection */}
      <div className="flex items-center gap-4" id="active-user-persona-section">
        <div className="flex items-center gap-2 text-slate-400">
          <User className="h-3.5 w-3.5 text-indigo-500" /> Active Persona
        </div>
        <div className="flex items-center gap-1.5 bg-slate-950/60 border border-white/5 p-1 rounded-xl">
          {["Ahmed Albanna", "Sarah Jenkins", "Alex Martinez"].map(user => (
            <button
              id={`user-persona-${user.toLowerCase().replace(/\s+/g, "-")}`}
              key={user}
              onClick={() => setActivePersona(user)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activePersona === user
                  ? "bg-white/10 text-white shadow-sm border border-white/5 font-black"
                  : "text-slate-600 hover:text-slate-400"
              }`}
            >
              {user}
            </button>
          ))}
        </div>
      </div>

      {/* Database quota and workspace synchronization status */}
      <div className="flex items-center gap-6" id="db-quota-status-section">
        <div className="flex items-center gap-4">
          <button
            id="sqlite-footer-status-btn"
            onClick={() => setActiveTab("sqlite")}
            className="flex items-center gap-2 text-emerald-500 hover:text-emerald-400 transition-colors cursor-pointer group"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Database className="h-3.5 w-3.5" />
            <span className="group-hover:underline">SQLITE_PERSISTENCE_UP</span>
          </button>
          
          <div className="h-3 w-[1px] bg-white/5" />

          <div className="flex items-center gap-2 text-slate-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" />
            <span>{prompts.length} Prompts Synchronized</span>
          </div>
        </div>

        <button
          id="reset-prompt-db-btn"
          onClick={handleResetCatalog}
          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer flex items-center gap-2 border border-white/5"
        >
          <RefreshCw className="h-3 w-3" /> Factory Reset
        </button>
      </div>
    </div>
  );


  return (
    <LayoutShell
      topSlot={renderTopSlot()}
      leftSlot={renderLeftSlot()}
      contentSlot={renderContentSlot()}
      rightSlot={renderRightSlot()}
      bottomSlot={renderBottomSlot()}
      overlaySlot={activeOverlay}
      isLeftOpen={isLeftSlotOpen}
      onToggleLeft={() => setIsLeftSlotOpen(prev => !prev)}
      isRightOpen={isRightSlotOpen}
      onToggleRight={() => setIsRightSlotOpen(prev => !prev)}
      leftTitle="Prompt Navigator"
      rightTitle={activeTab === "editor" ? "Version Commit Tree" : "Prompt Metadata"}
    />
  );
}
