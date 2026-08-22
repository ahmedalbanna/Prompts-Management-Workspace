import React, { useState } from "react";
import { Prompt, TestCase, EvaluationResult, OllamaModel } from "../types";
import { evaluatePrompts } from "../ollama";
import {
  Play,
  Loader2,
  Columns,
  CheckCircle,
  AlertTriangle,
  Variable,
  FileText,
  Cpu,
  Clock,
  TrendingUp,
  Plus,
  Trash2,
} from "lucide-react";

interface EvaluationsLabProps {
  prompt: Prompt;
  models: OllamaModel[];
  onUpdateTestCases: (updatedTestCases: TestCase[]) => void;
}

export default function EvaluationsLab({
  prompt,
  models,
  onUpdateTestCases,
}: EvaluationsLabProps) {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [error, setError] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTcName, setNewTcName] = useState("");
  const [newTcVariables, setNewTcVariables] = useState<Record<string, string>>({});

  const templateVariables = React.useMemo(() => {
    const regex = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
    const matches = [];
    let match;
    while ((match = regex.exec(prompt.template)) !== null) {
      matches.push(match[1].trim());
    }
    return Array.from(new Set(matches));
  }, [prompt.template]);

  const handleOpenAddModal = () => {
    const defaultVals: Record<string, string> = {};
    templateVariables.forEach((v) => {
      defaultVals[v] = "";
    });
    setNewTcVariables(defaultVals);
    setNewTcName(`Test Case ${prompt.testCases.length + 1}`);
    setShowAddModal(true);
  };

  const handleVariableChange = (varName: string, val: string) => {
    setNewTcVariables((prev) => ({ ...prev, [varName]: val }));
  };

  const handleSaveTestCase = () => {
    if (!newTcName.trim()) return;
    const newTc: TestCase = {
      id: `tc-user-${Date.now()}`,
      name: newTcName,
      variables: newTcVariables,
    };
    onUpdateTestCases([...prompt.testCases, newTc]);
    setShowAddModal(false);
  };

  const handleDeleteTestCase = (tcId: string) => {
    onUpdateTestCases(prompt.testCases.filter((tc) => tc.id !== tcId));
  };

  const handleRunEvaluation = async () => {
    if (prompt.testCases.length === 0) {
      setError("Please add at least one test case to run evaluations.");
      return;
    }
    setIsEvaluating(true);
    setError("");
    setResults([]);
    try {
      const model = prompt.model || models[0]?.name || "gemma:2b";
      const res = await evaluatePrompts({
        systemInstruction: prompt.systemInstruction,
        template: prompt.template,
        model,
        temperature: prompt.temperature,
        testCases: prompt.testCases.map((tc) => ({
          id: tc.id,
          variables: tc.variables,
        })),
      });
      const mapped: EvaluationResult[] = res.map((r, i) => ({
        id: prompt.testCases[i]?.id || `r-${i}`,
        name: prompt.testCases[i]?.name || `Case ${i + 1}`,
        success: r.success,
        output: r.output,
        error: r.error,
        durationMs: r.durationMs,
        tokens: r.tokens,
      }));
      setResults(mapped);
    } catch (err: any) {
      setError(err.message || "An error occurred during evaluation.");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-6 p-1" id="evaluations-laboratory">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-container rounded-3xl p-6" id="evaluations-control-bar">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2 font-display">
            <Columns className="h-5 w-5 text-indigo-400" /> Multi-TestCase Evaluations Lab
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Compare active prompt templates across {prompt.testCases.length} variable scenarios in parallel.
          </p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            id="add-testcase-btn"
            onClick={handleOpenAddModal}
            className="px-3.5 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="h-3.5 w-3.5 text-indigo-400" /> Add Test Scenario
          </button>
          <button
            id="run-evaluations-btn"
            disabled={isEvaluating}
            onClick={handleRunEvaluation}
            className="px-4.5 py-2 bg-indigo-500/80 hover:bg-indigo-600 disabled:bg-indigo-500/40 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md border border-indigo-400/20 cursor-pointer"
          >
            {isEvaluating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Evaluating...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" /> Run Evaluations
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-300 p-3.5 rounded-xl border border-red-500/20 text-xs font-medium leading-relaxed font-sans">
          {error}
        </div>
      )}

      {prompt.testCases.length === 0 ? (
        <div className="glass-container rounded-3xl p-12 text-center text-slate-400 space-y-4">
          <Variable className="h-10 w-10 text-indigo-400 mx-auto" />
          <h4 className="text-sm font-bold text-white font-display">No test scenarios configured</h4>
          <p className="text-xs text-slate-300 max-w-sm mx-auto leading-normal">
            Every professional prompt must be evaluated against edge cases. Create a test scenario detailing parameters to compare models side-by-side.
          </p>
          <button
            id="create-first-testcase-btn"
            onClick={handleOpenAddModal}
            className="px-4.5 py-2.5 bg-indigo-500/80 hover:bg-indigo-600 text-white font-semibold text-xs rounded-xl border border-indigo-400/20 shadow-md inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Create Test Scenario
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" id="scenarios-evaluation-cards-grid">
          {prompt.testCases.map((tc) => {
            const evalResult = results.find((r) => r.id === tc.id);
            return (
              <div
                id={`evaluation-card-${tc.id}`}
                key={tc.id}
                className="glass-container rounded-3xl overflow-hidden flex flex-col justify-between min-h-[460px] border border-white/10"
              >
                <div className="p-4.5 bg-white/5 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-xs truncate max-w-44 font-display" title={tc.name}>{tc.name}</h4>
                    <span className="text-[9px] text-slate-400 font-mono font-semibold uppercase tracking-wider">SCENARIO PAYLOAD</span>
                  </div>
                  <button
                    id={`delete-testcase-${tc.id}`}
                    onClick={() => handleDeleteTestCase(tc.id)}
                    className="p-1.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                    title="Prune test scenario"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="p-4.5 space-y-3 bg-white/2 flex-none border-b border-white/5 max-h-40 overflow-y-auto">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Variables:</span>
                  <div className="space-y-2">
                    {Object.entries(tc.variables).map(([k, v]) => (
                      <div key={k} className="text-[11px] font-sans">
                        <span className="font-semibold text-slate-300 font-mono">@{k}:</span>
                        <p className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-slate-200 mt-1 whitespace-pre-line leading-relaxed truncate max-h-16" title={v}>
                          {v || <em className="text-slate-500">Empty</em>}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4.5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5 flex-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">OUTPUT RESULT:</span>
                    {!evalResult && !isEvaluating && (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 space-y-1.5">
                        <FileText className="h-6 w-6 text-slate-600" />
                        <span className="text-[11px] text-slate-400">Standby. Awaiting evaluation execution...</span>
                      </div>
                    )}
                    {isEvaluating && (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 space-y-2.5">
                        <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
                        <span className="text-[11px] text-indigo-300 font-semibold">Running scenario thread...</span>
                      </div>
                    )}
                    {evalResult && !evalResult.success && (
                      <div className="bg-red-500/10 text-red-300 p-3.5 rounded-xl border border-red-500/20 text-xs leading-relaxed font-sans">
                        <div className="flex items-center gap-1 font-semibold mb-1">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Failed
                        </div>
                        {evalResult.error}
                      </div>
                    )}
                    {evalResult && evalResult.success && (
                      <div className="bg-white/5 p-4 border border-white/10 rounded-2xl text-xs text-slate-100 leading-relaxed font-sans max-h-56 overflow-y-auto whitespace-pre-wrap">
                        {evalResult.output}
                      </div>
                    )}
                  </div>
                  {evalResult && evalResult.success && (
                    <div className="pt-3.5 border-t border-white/5 grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-400 text-center bg-white/5 -mx-4.5 -mb-4.5 p-4 rounded-b-3xl">
                      <div className="space-y-0.5 border-r border-white/5">
                        <span>Latency</span>
                        <p className="text-white font-bold flex items-center justify-center gap-0.5 mt-0.5">
                          <Clock className="h-3 w-3 text-indigo-400" /> {((evalResult.durationMs || 0) / 1000).toFixed(2)}s
                        </p>
                      </div>
                      <div className="space-y-0.5 border-r border-white/5">
                        <span>Word Count</span>
                        <p className="text-white font-bold flex items-center justify-center gap-0.5 mt-0.5">
                          <TrendingUp className="h-3 w-3 text-indigo-400" /> {evalResult.output?.split(/\s+/).filter(Boolean).length || 0} words
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <span>Tokens</span>
                        <p className="text-white font-bold flex items-center justify-center gap-0.5 mt-0.5">
                          <Cpu className="h-3 w-3 text-indigo-400" /> {evalResult.tokens?.total || 0}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-container rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl shadow-black/40 border border-white/15 max-h-[90vh] overflow-y-auto">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5 font-display">
              <Variable className="h-4 w-4 text-indigo-400" /> Configure Test Scenario
            </h4>
            <p className="text-xs text-slate-300 leading-normal font-sans">
              Set customized values for template variables to evaluate how your prompt responds to specific client requirements.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-sans">Scenario Identifier (Name)</label>
                <input
                  id="new-scenario-name-input"
                  type="text"
                  value={newTcName}
                  onChange={(e) => setNewTcName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white transition-all font-sans placeholder-slate-500"
                  placeholder="e.g., Extreme Stress test, Empty payload"
                />
              </div>
              {templateVariables.length === 0 ? (
                <p className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 leading-relaxed">
                  No variables found in prompt body. You must specify variables in double curly braces (e.g. <code>{"{{variable}}"}</code>) to add values here.
                </p>
              ) : (
                <div className="space-y-3 border-t border-white/5 pt-3 max-h-60 overflow-y-auto pr-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Variable Parameters:</span>
                  {templateVariables.map((v) => (
                    <div key={v} className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-300 font-mono">@{v}</label>
                      <textarea
                        id={`new-scenario-var-${v}`}
                        rows={2}
                        value={newTcVariables[v] || ""}
                        onChange={(e) => handleVariableChange(v, e.target.value)}
                        className="w-full text-xs p-2.5 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-500"
                        placeholder={`Enter testing values for variable ${v}...`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5">
              <button
                id="cancel-add-scenario-btn"
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="save-new-scenario-btn"
                onClick={handleSaveTestCase}
                className="px-4.5 py-2 bg-indigo-500/80 hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl border border-indigo-400/20 cursor-pointer transition-colors"
              >
                Save Scenario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
