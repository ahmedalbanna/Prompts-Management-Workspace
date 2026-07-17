import React, { useState, useEffect, useMemo } from "react";
import { Prompt, PromptVersion, TestCase } from "./types";
import { INITIAL_PROMPTS } from "./initialPrompts";

// Component imports
import PromptCatalog from "./components/PromptCatalog";
import PromptEditor from "./components/PromptEditor";
import VersionHistory from "./components/VersionHistory";
import AiOptimizer from "./components/AiOptimizer";
import EvaluationsLab from "./components/EvaluationsLab";
import AnalyticsPanel from "./components/AnalyticsPanel";

import { 
  Layers, 
  Sliders, 
  Columns, 
  Sparkles, 
  BarChart, 
  GitBranch, 
  User, 
  ChevronRight,
  Database,
  RefreshCw,
  Plus
} from "lucide-react";

export default function App() {
  // Load prompts from localStorage or default to initial
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

  // Selected prompt tracking
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(() => {
    return prompts.length > 0 ? prompts[0].id : null;
  });

  const selectedPrompt = useMemo(() => {
    return prompts.find(p => p.id === selectedPromptId) || null;
  }, [prompts, selectedPromptId]);

  // Save prompts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("prompt_craft_prompts", JSON.stringify(prompts));
  }, [prompts]);

  // Navigation state: "catalog" | "editor" | "evaluations" | "optimize" | "analytics"
  const [activeTab, setActiveTab] = useState<string>("catalog");

  // Versions sidebar state (sliding drawer inside workspace editor)
  const [showVersionsSidebar, setShowVersionsSidebar] = useState(false);

  // Active User Persona (Ahmed Albanna, Sarah Jenkins, Alex Martinez)
  const [activePersona, setActivePersona] = useState("Ahmed Albanna");

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
    };

    setPrompts(prev => prev.map(p => p.id === savedPrompt.id ? savedPrompt : p));
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
      body: JSON.stringify(payload)
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

  const handleResetCatalog = () => {
    if (window.confirm("Are you sure you want to restore all pre-loaded prompts? This will overwrite active custom edits.")) {
      setPrompts(INITIAL_PROMPTS);
      if (INITIAL_PROMPTS.length > 0) {
        setSelectedPromptId(INITIAL_PROMPTS[0].id);
      }
      setActiveTab("catalog");
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col justify-between relative overflow-x-hidden font-sans" id="app-workspace-root">
      
      {/* Ambient background glows */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/15 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute top-[30%] right-[10%] w-[30%] h-[40%] bg-cyan-600/10 blur-[100px] rounded-full"></div>
      </div>
      
      {/* Top Professional Control Header */}
      <header className="glass-container sticky top-0 z-40 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 border-t-0 border-r-0 border-l-0 shadow-lg shadow-black/10">
        <div className="flex items-center gap-2.5 z-10">
          <div className="bg-indigo-500 rounded-xl p-2 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <GitBranch className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              PromptCraft Studio
            </h1>
            <p className="text-[11px] text-slate-400 font-medium font-sans">
              Enterprise Prompts Management, VCS Snapshotting & Side-by-Side Evaluations
            </p>
          </div>
        </div>

        {/* Modules navigation selectors */}
        <nav className="flex items-center gap-1 bg-white/5 border border-white/5 p-1.5 rounded-xl text-xs font-semibold text-slate-400 z-10" id="modules-navigation">
          <button
            id="tab-nav-catalog"
            onClick={() => setActiveTab("catalog")}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "catalog"
                ? "bg-white/10 text-white shadow-xs font-bold border border-white/10"
                : "hover:bg-white/5 hover:text-white"
            }`}
          >
            <Layers className="h-3.5 w-3.5" /> Prompt Library
          </button>

          <button
            id="tab-nav-editor"
            disabled={!selectedPromptId}
            onClick={() => setActiveTab("editor")}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              !selectedPromptId ? "opacity-40 cursor-not-allowed" : ""
            } ${
              activeTab === "editor"
                ? "bg-white/10 text-white shadow-xs font-bold border border-white/10"
                : "hover:bg-white/5 hover:text-white"
            }`}
          >
            <Sliders className="h-3.5 w-3.5" /> Workstation Editor
          </button>

          <button
            id="tab-nav-evaluations"
            disabled={!selectedPromptId}
            onClick={() => setActiveTab("evaluations")}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              !selectedPromptId ? "opacity-40 cursor-not-allowed" : ""
            } ${
              activeTab === "evaluations"
                ? "bg-white/10 text-white shadow-xs font-bold border border-white/10"
                : "hover:bg-white/5 hover:text-white"
            }`}
          >
            <Columns className="h-3.5 w-3.5" /> Evaluations Lab
          </button>

          <button
            id="tab-nav-optimize"
            onClick={() => setActiveTab("optimize")}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "optimize"
                ? "bg-white/10 text-white shadow-xs font-bold border border-white/10"
                : "hover:bg-white/5 hover:text-white"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" /> Prompt Refiner
          </button>

          <button
            id="tab-nav-analytics"
            onClick={() => setActiveTab("analytics")}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "analytics"
                ? "bg-white/10 text-white shadow-xs font-bold border border-white/10"
                : "hover:bg-white/5 hover:text-white"
            }`}
          >
            <BarChart className="h-3.5 w-3.5" /> Insights
          </button>
        </nav>
      </header>

      {/* Primary Workstation Body Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 z-10" id="primary-workstation-body">
        
        {/* Active Tab rendering */}
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
            {/* Split Editor Pane (7/12 or 12/12 based on history panel) */}
            <div className={`${showVersionsSidebar ? "lg:col-span-8" : "lg:col-span-12"} transition-all duration-300`}>
              <PromptEditor
                prompt={selectedPrompt}
                onSave={handleSavePrompt}
                onRunTest={handleRunTest}
                onOpenOptimizeDialog={() => setActiveTab("optimize")}
                onOpenVersionsSidebar={() => setShowVersionsSidebar(!showVersionsSidebar)}
              />
            </div>

            {/* Slide-out Versions Sidebar (VCS History) */}
            {showVersionsSidebar && (
              <div className="lg:col-span-4 rounded-xl overflow-hidden self-start">
                <VersionHistory
                  prompt={selectedPrompt}
                  onRevert={handleRevertPrompt}
                  onClose={() => setShowVersionsSidebar(false)}
                />
              </div>
            )}
          </div>
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

      </main>

      {/* bottom docked persona controller and quota feed */}
      <footer className="glass-container border-t border-b-0 border-r-0 border-l-0 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 z-10 shadow-lg">
        
        {/* Interactive active user persona selection */}
        <div className="flex items-center gap-3 font-sans" id="active-user-persona-section">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <User className="h-4 w-4 text-indigo-400" /> Active Persona:
          </div>
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 p-1 rounded-lg">
            {["Ahmed Albanna", "Sarah Jenkins", "Alex Martinez"].map(user => (
              <button
                id={`user-persona-${user.toLowerCase().replace(/\s+/g, "-")}`}
                key={user}
                onClick={() => setActivePersona(user)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  activePersona === user
                    ? "bg-white/10 text-white shadow-xs font-semibold border border-white/10"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {user}
              </button>
            ))}
          </div>
        </div>

        {/* Database quota and workspace synchronization status */}
        <div className="flex items-center gap-4 font-mono text-[11px]" id="db-quota-status-section">
          <div className="flex items-center gap-1 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>VCS-REPOSITORIES @ ONLINE</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Database className="h-3.5 w-3.5 text-slate-400" />
            <span>LOCAL: 100% OK</span>
          </div>

          <button
            id="reset-prompt-db-btn"
            onClick={handleResetCatalog}
            className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 transition-colors cursor-pointer font-sans"
          >
            <RefreshCw className="h-3 w-3" /> Restore Pre-loaded Prompts
          </button>
        </div>

      </footer>

    </div>
  );
}
