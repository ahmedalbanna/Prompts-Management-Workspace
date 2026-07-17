import React, { useState } from "react";
import { Sparkles, Loader2, ArrowRight, Copy, Plus, Clipboard, Check } from "lucide-react";

interface AiOptimizerProps {
  onLoadOptimized: (data: {
    title: string;
    description: string;
    category: string;
    systemInstruction: string;
    template: string;
    tags: string[];
  }) => void;
}

export default function AiOptimizer({ onLoadOptimized }: AiOptimizerProps) {
  const [draftTemplate, setDraftTemplate] = useState("");
  const [systemContext, setSystemContext] = useState("");
  const [optimizationGoal, setOptimizationGoal] = useState("Add structured guidelines, define clear persona constraints, and insert curly-brace variable placeholders.");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState("");

  // Result States
  const [result, setResult] = useState<{
    systemInstruction: string;
    optimizedTemplate: string;
    explanation: string;
  } | null>(null);

  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleRunOptimization = async () => {
    if (!draftTemplate.trim()) {
      setError("Please input a draft prompt template to optimize.");
      return;
    }

    setIsOptimizing(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/prompts/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftTemplate,
          systemContext,
          optimizationGoal,
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to compile prompt optimization.");
      }

      setResult({
        systemInstruction: data.systemInstruction,
        optimizedTemplate: data.optimizedTemplate,
        explanation: data.explanation,
      });
    } catch (err: any) {
      setError(err.message || "An error occurred during prompt optimization.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleImportToEditor = () => {
    if (!result) return;
    
    // Auto generate descriptive titles
    onLoadOptimized({
      title: "Optimized Prompt Craft",
      description: "AI-engineered structured template focused on high-performance inference.",
      category: "AI Refined",
      systemInstruction: result.systemInstruction,
      template: result.optimizedTemplate,
      tags: ["AI-Refined", "Optimized"]
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-1" id="ai-optimizer-workspace">
      
      {/* Input controls (5/12) */}
      <div className="lg:col-span-5 space-y-4" id="optimizer-inputs-card">
        <div className="glass-container rounded-3xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            <h3 className="font-bold text-white text-sm font-display">AI Prompt Engineering Studio</h3>
          </div>
          <p className="text-xs text-slate-300 leading-normal">
            Compose raw prompt requirements below. Gemini will transform them into professional role-playing prompts equipped with specific constraint controls.
          </p>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-sans">Draft Prompt Idea</label>
              <textarea
                id="draft-template-textarea"
                rows={5}
                value={draftTemplate}
                onChange={e => setDraftTemplate(e.target.value)}
                className="w-full text-xs p-3.5 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-sans leading-relaxed placeholder-slate-500"
                placeholder="e.g. Write a python script to calculate fibonacci sequence. Let me input index."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-sans">Role / System Context (Optional)</label>
              <input
                id="system-context-input"
                type="text"
                value={systemContext}
                onChange={e => setSystemContext(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-sans placeholder-slate-500"
                placeholder="e.g. Elite Algorithm Engineer, Math tutor"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-sans">Optimization Goal</label>
              <input
                id="optimization-goal-input"
                type="text"
                value={optimizationGoal}
                onChange={e => setOptimizationGoal(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-sans placeholder-slate-500"
                placeholder="Primary optimization criteria..."
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 text-red-300 p-3.5 rounded-xl border border-red-500/20 text-xs font-medium leading-relaxed font-sans">
              {error}
            </div>
          )}

          <div className="pt-3 border-t border-white/5 flex items-center justify-end">
            <button
              id="optimize-draft-btn"
              disabled={isOptimizing}
              onClick={handleRunOptimization}
              className="px-4.5 py-2.5 bg-indigo-500/80 hover:bg-indigo-600 disabled:bg-indigo-500/40 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md border border-indigo-400/20 cursor-pointer"
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Compiling logic...
                </>
              ) : (
                <>
                  Optimize Draft <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Side-by-Side Results compare (7/12) */}
      <div className="lg:col-span-7 space-y-4" id="optimizer-results-column">
        
        {!result && !isOptimizing && (
          <div className="glass-container rounded-3xl p-12 text-center text-slate-400 min-h-[450px] flex flex-col items-center justify-center space-y-4">
            <Sparkles className="h-10 w-10 text-indigo-400/80" />
            <h4 className="text-sm font-bold text-white font-display">Studio Standby</h4>
            <p className="text-xs text-slate-300 max-w-sm mx-auto leading-normal font-sans">
              Enter details on the left and trigger compilation. The optimized system guidelines and parameterized variables will compile here.
            </p>
          </div>
        )}

        {isOptimizing && (
          <div className="glass-container rounded-3xl p-12 text-center text-slate-400 min-h-[450px] flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 text-indigo-400 animate-spin" />
            <h4 className="text-sm font-bold text-indigo-300 font-display">Structuring Semantic Controls</h4>
            <p className="text-xs text-slate-300 max-w-sm mx-auto leading-normal font-sans">
              Gemini is rewriting system guidelines, establishing precise schema expectations, and injecting double-curly brace placeholders...
            </p>
          </div>
        )}

        {result && (
          <div className="space-y-4" id="optimization-results-panel">
            
            {/* Action Top Bar */}
            <div className="bg-indigo-500/15 border border-indigo-500/30 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-indigo-200">Optimization Completed successfully!</h4>
                <p className="text-[10px] text-indigo-300 mt-0.5 font-mono">Prompt engineered specifically for Google Gemini models.</p>
              </div>

              <button
                id="load-optimized-into-workstation-btn"
                onClick={handleImportToEditor}
                className="px-3.5 py-2 bg-indigo-500/80 hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl flex items-center gap-1 transition-all border border-indigo-400/20 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Load into Workstation
              </button>
            </div>

            {/* Generated System Instruction */}
            <div className="glass-container rounded-3xl p-6 space-y-3 relative">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">SYSTEM INSTRUCTIONS</span>
                <button
                  id="copy-optimized-system-instructions"
                  onClick={() => handleCopy(result.systemInstruction, "sys")}
                  className="text-slate-300 hover:text-white p-1.5 flex items-center gap-1.5 text-[10px] font-semibold border border-white/10 hover:bg-white/10 rounded-xl bg-white/5 cursor-pointer transition-colors"
                >
                  {copiedSection === "sys" ? <Check className="h-3 w-3 text-emerald-400" /> : <Clipboard className="h-3 w-3" />}
                  <span>{copiedSection === "sys" ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <p className="text-xs text-slate-100 leading-relaxed font-sans whitespace-pre-wrap pt-1 bg-white/5 p-4 rounded-2xl border border-white/10">
                {result.systemInstruction}
              </p>
            </div>

            {/* Generated Body Template */}
            <div className="glass-container rounded-3xl p-6 space-y-3 relative">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">PROMPT BODY TEMPLATE</span>
                <button
                  id="copy-optimized-template-body"
                  onClick={() => handleCopy(result.optimizedTemplate, "temp")}
                  className="text-slate-300 hover:text-white p-1.5 flex items-center gap-1.5 text-[10px] font-semibold border border-white/10 hover:bg-white/10 rounded-xl bg-white/5 cursor-pointer transition-colors"
                >
                  {copiedSection === "temp" ? <Check className="h-3 w-3 text-emerald-400" /> : <Clipboard className="h-3 w-3" />}
                  <span>{copiedSection === "temp" ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <p className="text-xs text-slate-100 leading-relaxed font-mono whitespace-pre-wrap pt-1 bg-white/5 p-4 rounded-2xl border border-white/10">
                {result.optimizedTemplate}
              </p>
            </div>

            {/* Explanation / Justification card */}
            <div className="glass-container rounded-3xl p-6 space-y-2">
              <span className="text-xs font-bold text-slate-400 font-mono">JUSTIFICATION & ANALYSIS</span>
              <p className="text-xs text-slate-200 leading-relaxed font-sans pt-1">
                {result.explanation}
              </p>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
