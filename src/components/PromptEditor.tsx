import React, { useState, useEffect, useMemo } from "react";
import { Prompt, PromptVersion, TestCase } from "../types";
import { Registry } from "../modelsRegistry";
import { 
  Save, 
  Play, 
  Sparkles, 
  Info, 
  Cpu, 
  Sliders, 
  Variable, 
  FileText, 
  CheckCircle, 
  RotateCcw, 
  ExternalLink,
  ChevronRight,
  Loader2,
  Copy,
  Terminal,
  Clock,
  Code
} from "lucide-react";

interface PromptEditorProps {
  prompt: Prompt;
  onSave: (updatedPrompt: Prompt, commitMessage: string) => void;
  onRunTest: (payload: {
    systemInstruction: string;
    template: string;
    variables: Record<string, string>;
    model: string;
    temperature: number;
    maxOutputTokens: number;
  }) => Promise<{
    output: string;
    durationMs: number;
    tokens: { prompt: number; candidates: number; total: number };
  }>;
  onOpenOptimizeDialog: () => void;
  onOpenVersionsSidebar: () => void;
}

export default function PromptEditor({
  prompt,
  onSave,
  onRunTest,
  onOpenOptimizeDialog,
  onOpenVersionsSidebar,
}: PromptEditorProps) {
  // Primary local edit states
  const [title, setTitle] = useState(prompt.title);
  const [description, setDescription] = useState(prompt.description);
  const [category, setCategory] = useState(prompt.category);
  const [tagsInput, setTagsInput] = useState(prompt.tags.join(", "));
  const [systemInstruction, setSystemInstruction] = useState(prompt.systemInstruction);
  const [template, setTemplate] = useState(prompt.template);
  const [model, setModel] = useState(prompt.model);
  const [temperature, setTemperature] = useState(prompt.temperature);
  const [maxOutputTokens, setMaxOutputTokens] = useState(prompt.maxOutputTokens || 2048);

  // Sync state if prompt changes (selected another prompt)
  useEffect(() => {
    setTitle(prompt.title);
    setDescription(prompt.description);
    setCategory(prompt.category);
    setTagsInput(prompt.tags.join(", "));
    setSystemInstruction(prompt.systemInstruction);
    setTemplate(prompt.template);
    setModel(prompt.model);
    setTemperature(prompt.temperature);
    setMaxOutputTokens(prompt.maxOutputTokens || 2048);
    setTestOutput("");
    setTestMetrics(null);
  }, [prompt]);

  // Dynamic variable parsing
  const detectedVariables = useMemo(() => {
    const regex = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
    const matches = [];
    let match;
    while ((match = regex.exec(template)) !== null) {
      matches.push(match[1].trim());
    }
    return Array.from(new Set(matches)); // Unique list
  }, [template]);

  // Variables values state
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  // Initialize values from prompt's first test case if available, or empty
  useEffect(() => {
    const initialVals: Record<string, string> = {};
    detectedVariables.forEach(v => {
      initialVals[v] = "";
    });

    // Try to load values from the prompt's first test case
    if (prompt.testCases && prompt.testCases.length > 0) {
      const firstTc = prompt.testCases[0];
      detectedVariables.forEach(v => {
        if (firstTc.variables[v] !== undefined) {
          initialVals[v] = firstTc.variables[v];
        }
      });
    }
    setVariableValues(initialVals);
  }, [detectedVariables, prompt]);

  // Commit modal trigger state
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");

  // Testing execution state
  const [isTesting, setIsTesting] = useState(false);
  const [testOutput, setTestOutput] = useState("");
  const [testMetrics, setTestMetrics] = useState<{
    durationMs: number;
    tokens: { prompt: number; candidates: number; total: number };
  } | null>(null);
  const [testingError, setTestingError] = useState("");

  const handleVariableChange = (varName: string, val: string) => {
    setVariableValues(prev => ({ ...prev, [varName]: val }));
  };

  const handlePreFillTestCase = (tc: TestCase) => {
    const updatedVals = { ...variableValues };
    detectedVariables.forEach(v => {
      if (tc.variables[v] !== undefined) {
        updatedVals[v] = tc.variables[v];
      }
    });
    setVariableValues(updatedVals);
  };

  const handleSaveClick = () => {
    setShowCommitModal(true);
    setCommitMessage(`Revision: Update parameters of ${title}`);
  };

  const confirmSave = () => {
    const tagsArray = tagsInput
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const updatedPrompt: Prompt = {
      ...prompt,
      title,
      description,
      category,
      tags: tagsArray,
      systemInstruction,
      template,
      model,
      temperature,
      maxOutputTokens,
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedPrompt, commitMessage);
    setShowCommitModal(false);
  };

  const handleRunPlayground = async () => {
    setIsTesting(true);
    setTestingError("");
    setTestOutput("");
    setTestMetrics(null);

    try {
      const result = await onRunTest({
        systemInstruction,
        template,
        variables: variableValues,
        model,
        temperature,
        maxOutputTokens,
      });

      setTestOutput(result.output);
      setTestMetrics({
        durationMs: result.durationMs,
        tokens: result.tokens,
      });
    } catch (err: any) {
      setTestingError(err.message || "Failed to execute template playground.");
    } finally {
      setIsTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Alert or small visual state indicator could be set
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 p-1" id="prompt-editor-workstation">
      
      {/* LEFT COLUMN: Prompt Parameters & Editor (7/12 width) */}
      <div className="xl:col-span-7 space-y-5" id="editor-settings-column">
        
        {/* Core Metadata Form */}
        <div className="glass-container rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-display">
              <Sliders className="h-4 w-4 text-indigo-400" /> General Information
            </h3>
            
            <div className="flex items-center gap-2">
              <button
                id="view-history-btn"
                onClick={onOpenVersionsSidebar}
                className="px-3 py-1.5 text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-slate-300 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Clock className="h-3.5 w-3.5 text-indigo-400" /> History ({prompt.versions.length})
              </button>
              
              <button
                id="trigger-optimizer-dialog"
                onClick={onOpenOptimizeDialog}
                className="px-3 py-1.5 text-xs font-semibold bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-300 flex items-center gap-1.5 hover:bg-indigo-500/30 cursor-pointer transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> AI Refine
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-sans">Prompt Title</label>
              <input
                id="edit-title-input"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full text-sm font-medium px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white transition-all font-sans"
                placeholder="Platform Parity Planner"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-sans">Category</label>
              <input
                id="edit-category-input"
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white transition-all font-sans"
                placeholder="Software Engineering"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-sans">Prompt Description</label>
            <input
              id="edit-description-input"
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white transition-all font-sans"
              placeholder="Short description of this prompt..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1 font-sans">
                <Cpu className="h-3.5 w-3.5 text-indigo-400" /> AI Model
              </label>
              <select
                id="edit-model-select"
                value={model}
                onChange={e => setModel(e.target.value)}
                className="w-full text-sm px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white transition-all font-sans [&>option]:bg-slate-950 [&>option]:text-white cursor-pointer"
              >
                <optgroup label="☁️ Cloud Models">
                  {Registry.ALL_MODELS.filter(m => !m.isLocal).map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} [{m.badge}]
                    </option>
                  ))}
                </optgroup>
                <optgroup label="💻 Local AI Models">
                  {Registry.ALL_MODELS.filter(m => m.isLocal).map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} [{m.badge}]
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-sans">Temperature ({temperature})</label>
              <div className="flex items-center h-10">
                <input
                  id="edit-temperature-range"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={e => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 h-1 bg-white/10 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-sans">Max Tokens ({maxOutputTokens})</label>
              <input
                id="edit-max-tokens-input"
                type="number"
                min="64"
                max="8192"
                step="64"
                value={maxOutputTokens}
                onChange={e => setMaxOutputTokens(parseInt(e.target.value))}
                className="w-full text-sm px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white transition-all font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-sans">Tags (comma separated)</label>
            <input
              id="edit-tags-input"
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white transition-all font-sans"
              placeholder="React, CSS, Frontend"
            />
          </div>
        </div>

        {/* System Instructions Panel */}
        <div className="glass-container rounded-3xl p-6 space-y-3">
          <div className="flex items-center gap-1.5">
            <span className="bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg font-mono">System</span>
            <label className="text-sm font-bold text-white font-display">System Instructions (Role & Directives)</label>
          </div>
          <textarea
            id="edit-system-instruction-textarea"
            rows={3}
            value={systemInstruction}
            onChange={e => setSystemInstruction(e.target.value)}
            className="w-full text-sm p-4 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-sans transition-all placeholder-slate-500"
            placeholder="You are an expert AI assistant..."
          />
        </div>

        {/* Prompt Body / Template */}
        <div className="glass-container rounded-3xl p-6 space-y-3 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg font-mono">User</span>
              <label className="text-sm font-bold text-white font-display">Prompt Body Template</label>
            </div>
            {detectedVariables.length > 0 && (
              <span className="text-xs text-indigo-300 font-mono flex items-center gap-1">
                <Variable className="h-3.5 w-3.5" /> {detectedVariables.length} custom variables found
              </span>
            )}
          </div>

          <textarea
            id="edit-template-textarea"
            rows={12}
            value={template}
            onChange={e => setTemplate(e.target.value)}
            className="w-full text-sm p-4 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono transition-all leading-relaxed placeholder-slate-500"
            placeholder="Compare the core features of {{module_name}}..."
          />

          <p className="text-[11px] text-slate-400 leading-normal flex items-start gap-1">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-indigo-400" />
            <span>
              Tip: Enclose words in double-curly braces (e.g. <code>{"{{variable_name}}"}</code>) to instantly generate dynamic payload forms in the right workstation panel.
            </span>
          </p>

          <div className="flex items-center justify-end pt-2 gap-2">
            <button
              id="copy-prompt-json-btn"
              onClick={() => copyToClipboard(JSON.stringify(prompt, null, 2))}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all border border-white/10 cursor-pointer"
              title="Copy prompt template as JSON"
            >
              <Code className="h-3.5 w-3.5 text-indigo-400" /> Copy JSON
            </button>
            
            <button
              id="save-prompt-changes-btn"
              onClick={handleSaveClick}
              className="px-4.5 py-2.5 bg-indigo-500/80 hover:bg-indigo-600 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md border border-indigo-400/20 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" /> Save Revision (VCS)
            </button>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Interactive Playground Sandbox (5/12 width) */}
      <div className="xl:col-span-5 space-y-5" id="playground-sandbox-column">
        
        {/* Dynamic Variable Slots Form */}
        <div className="glass-container rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-display">
              <Variable className="h-4 w-4 text-indigo-400" /> Variable Payload Forms
            </h3>

            {prompt.testCases.length > 0 && (
              <div className="relative group">
                <span className="text-[10px] text-slate-400 font-mono cursor-pointer border-b border-dashed border-white/20 hover:text-white">
                  Pre-fill from Test Cases
                </span>
                <div className="hidden group-hover:block absolute right-0 top-5 bg-slate-900 border border-white/10 rounded-xl shadow-xl py-1.5 w-56 z-20 text-xs">
                  {prompt.testCases.map(tc => (
                    <button
                      id={`prefill-testcase-${tc.id}`}
                      key={tc.id}
                      onClick={() => handlePreFillTestCase(tc)}
                      className="w-full text-left px-3.5 py-2 hover:bg-white/10 text-slate-300 hover:text-white font-medium truncate cursor-pointer transition-colors"
                    >
                      {tc.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {detectedVariables.length === 0 ? (
            <div className="bg-white/2 border border-dashed border-white/10 rounded-2xl p-5 text-center">
              <p className="text-xs text-slate-400 leading-normal">
                No variables detected in the prompt template body. Add variables like <code>{"{{example_variable}}"}</code> to dynamically test payload changes.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1" id="variables-fields-container">
              {detectedVariables.map(varName => (
                <div key={varName} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 font-mono flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></span>
                      {varName}
                    </label>
                  </div>
                  <textarea
                    id={`var-input-${varName}`}
                    rows={2}
                    value={variableValues[varName] || ""}
                    onChange={e => handleVariableChange(varName, e.target.value)}
                    className="w-full text-xs p-2.5 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-sans placeholder-slate-500"
                    placeholder={`Enter value for ${varName}...`}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
              Playground Engine: {model}
            </span>

            <button
              id="run-playground-btn"
              disabled={isTesting}
              onClick={handleRunPlayground}
              className="px-4.5 py-2.5 bg-indigo-500/80 hover:bg-indigo-600 disabled:bg-indigo-500/40 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md border border-indigo-400/20 cursor-pointer"
            >
              {isTesting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" /> Execute Prompt
                </>
              )}
            </button>
          </div>
        </div>

        {/* Console / Output Studio */}
        <div className="glass-container rounded-3xl p-6 space-y-4 flex flex-col justify-between min-h-96">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-display">
                <Terminal className="h-4 w-4 text-slate-400" /> Output Sandbox
              </h3>

              {testOutput && (
                <button
                  id="copy-sandbox-output"
                  onClick={() => copyToClipboard(testOutput)}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-slate-300 transition-colors flex items-center gap-1 text-[10px] font-semibold cursor-pointer"
                >
                  <Copy className="h-3 w-3 text-indigo-400" /> Copy Output
                </button>
              )}
            </div>

            {testingError && (
              <div className="bg-red-500/10 text-red-300 p-3.5 rounded-xl border border-red-500/20 text-xs font-medium leading-relaxed font-sans">
                {testingError}
              </div>
            )}

            {!testOutput && !isTesting && !testingError && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500 text-center space-y-3.5">
                <FileText className="h-9 w-9 text-slate-600" />
                <h4 className="text-xs font-semibold text-slate-300">No active response</h4>
                <p className="text-[11px] text-slate-400 max-w-xs leading-normal">
                  Configure variables above and click "Execute Prompt" to stream output directly into this workstation.
                </p>
              </div>
            )}

            {isTesting && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500 text-center space-y-4">
                <Loader2 className="h-9 w-9 text-indigo-400 animate-spin" />
                <h4 className="text-xs font-semibold text-indigo-300">Running Gemini LLM Engine</h4>
                <p className="text-[11px] text-slate-400 max-w-xs leading-normal">
                  Compiling template variables and requesting generation server-side to secure secrets...
                </p>
              </div>
            )}

            {testOutput && (
              <div className="prose prose-invert max-w-none text-slate-100 text-xs leading-relaxed max-h-[400px] overflow-y-auto font-sans bg-white/5 p-4 border border-white/10 rounded-2xl whitespace-pre-wrap">
                {testOutput}
              </div>
            )}
          </div>

          {/* Telemetry Footer */}
          {testMetrics && (
            <div className="pt-3.5 border-t border-white/5 flex flex-wrap gap-3 items-center justify-between text-[11px] text-slate-400 font-mono bg-white/5 -mx-6 -mb-6 p-4 rounded-b-3xl">
              <div className="flex items-center gap-1 text-emerald-400 font-bold">
                <CheckCircle className="h-3.5 w-3.5" />
                <span>SUCCESS</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <span>Latency:</span>
                  <span className="text-white font-semibold">{(testMetrics.durationMs / 1000).toFixed(2)}s</span>
                </div>

                <div className="flex items-center gap-1">
                  <span>Tokens:</span>
                  <span className="text-white font-semibold">
                    {testMetrics.tokens.total} total
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* COMMIT REVISION VCS MODAL */}
      {showCommitModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-container rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl shadow-black/40 border border-white/15">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5 font-display">
              <Code className="h-4 w-4 text-indigo-400" /> Save Prompt Commit
            </h4>
            <p className="text-xs text-slate-300 leading-normal">
              Enter a description of what you edited or improved in this revision. This saves an atomic snapshot to the timeline allowing immediate reverts.
            </p>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Commit Message</label>
              <input
                id="commit-message-input"
                type="text"
                value={commitMessage}
                onChange={e => setCommitMessage(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white transition-all font-sans"
                placeholder="e.g., Improved parameters, optimized variable instructions"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                id="cancel-commit-btn"
                onClick={() => setShowCommitModal(false)}
                className="px-3.5 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-commit-btn"
                onClick={confirmSave}
                className="px-4.5 py-2 bg-indigo-500/80 hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl transition-all border border-indigo-400/20 cursor-pointer"
              >
                Commit Snapshot
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
