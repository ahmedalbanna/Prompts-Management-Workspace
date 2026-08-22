import React, { useState } from "react";
import { Prompt, PromptVersion } from "../types";
import { 
  GitCommit, 
  RotateCcw, 
  ArrowLeft, 
  Eye, 
  Layers, 
  Check, 
  Columns, 
  AlertTriangle,
  Flame
} from "lucide-react";

interface VersionHistoryProps {
  prompt: Prompt;
  onRevert: (version: PromptVersion) => void;
  onClose: () => void;
}

export default function VersionHistory({
  prompt,
  onRevert,
  onClose,
}: VersionHistoryProps) {
  const [selectedOldVersion, setSelectedOldVersion] = useState<PromptVersion | null>(null);
  const [selectedNewVersion, setSelectedNewVersion] = useState<PromptVersion | null>(null);
  const [showDiffModal, setShowDiffModal] = useState(false);

  // Split lines and compile differences
  const getLineDiffs = (oldStr: string, newStr: string) => {
    const oldLines = oldStr.split("\n");
    const newLines = newStr.split("\n");
    
    // We can do a line-by-line match for simple, high-performance side-by-side displays
    const maxLength = Math.max(oldLines.length, newLines.length);
    const diffs: Array<{
      lineNum: number;
      oldText: string | null;
      newText: string | null;
      type: "unchanged" | "added" | "removed" | "modified";
    }> = [];

    for (let i = 0; i < maxLength; i++) {
      const oldLine = oldLines[i] !== undefined ? oldLines[i] : null;
      const newLine = newLines[i] !== undefined ? newLines[i] : null;

      if (oldLine === newLine) {
        diffs.push({ lineNum: i + 1, oldText: oldLine, newText: newLine, type: "unchanged" });
      } else if (oldLine !== null && newLine === null) {
        diffs.push({ lineNum: i + 1, oldText: oldLine, newText: null, type: "removed" });
      } else if (oldLine === null && newLine !== null) {
        diffs.push({ lineNum: i + 1, oldText: null, newText: newLine, type: "added" });
      } else {
        diffs.push({ lineNum: i + 1, oldText: oldLine, newText: newLine, type: "modified" });
      }
    }
    return diffs;
  };

  const handleOpenDiff = (version: PromptVersion) => {
    setSelectedOldVersion(version);
    // New version defaults to the active prompt configuration
    setSelectedNewVersion({
      id: "active",
      versionString: "Active Design",
      commitMessage: "Current modifications in playground",
      systemInstruction: prompt.systemInstruction,
      template: prompt.template,
      model: prompt.model,
      temperature: prompt.temperature,
      createdAt: new Date().toISOString()
    });
    setShowDiffModal(true);
  };

  const activeVersion = prompt.versions[prompt.currentVersionIndex] || null;

  return (
    <div className="glass-container rounded-3xl p-6 space-y-5 border border-white/10" id="vcs-history-workstation">
      <div className="flex items-center justify-between border-b border-white/5 pb-3.5">
        <div className="flex items-center gap-2">
          <GitCommit className="h-5 w-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-bold text-white font-display">VCS Commit History</h3>
            <p className="text-[11px] text-slate-400 font-mono">PROMPT: {prompt.title}</p>
          </div>
        </div>
        <button
          id="close-history-btn"
          onClick={onClose}
          className="text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          Close Panel
        </button>
      </div>

      {/* SVG Branching Timeline Visualization */}
      <div className="relative border border-white/10 rounded-2xl p-5 bg-white/5" id="svg-branching-timeline-box">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5 font-mono">
          <Layers className="h-3.5 w-3.5 text-indigo-400" /> Branching Commit Graph
        </h4>

        {prompt.versions.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6 font-sans">No commit history available.</p>
        ) : (
          <div className="relative flex flex-col space-y-6 pl-8 py-2">
            
            {/* SVG Connector Trunk */}
            <svg className="absolute left-3 top-0 bottom-0 w-2 h-full text-indigo-500/30" pointerEvents="none">
              <line
                x1="4" y1="0"
                x2="4" y2="100%"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            </svg>

            {prompt.versions.map((ver, idx) => {
              const isActive = activeVersion?.id === ver.id;
              
              return (
                <div key={ver.id} className="relative flex items-start gap-4" id={`timeline-node-${ver.id}`}>
                  {/* Pulsating status nodes */}
                  <div className="absolute -left-[25px] top-1">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 bg-slate-900 flex items-center justify-center transition-all ${
                      isActive 
                        ? "border-indigo-500 scale-125 ring-4 ring-indigo-500/20" 
                        : "border-slate-700"
                    }`}>
                      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                    </div>
                  </div>

                  {/* Commit card detailing changes */}
                  <div className={`flex-1 border rounded-2xl p-4 bg-white/5 space-y-2.5 transition-all ${
                    isActive 
                      ? "ring-2 ring-indigo-500/30 border-indigo-500/50" 
                      : "border-white/10 hover:border-white/20 shadow-xs"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white font-mono">v{ver.versionString}</span>
                        {isActive && (
                          <span className="bg-indigo-500/15 text-indigo-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-indigo-500/25 uppercase">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(ver.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 font-medium leading-relaxed font-sans">
                      {ver.commitMessage || "No commit message provided."}
                    </p>

                    <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-300 font-mono">
                      <span>Model: {ver.model}</span>
                      <span>Temp: {ver.temperature}</span>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-end gap-2">
                      <button
                        id={`compare-version-${ver.id}`}
                        onClick={() => handleOpenDiff(ver)}
                        className="px-2.5 py-1 text-[10px] border border-white/10 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 font-semibold flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Columns className="h-3 w-3" /> Compare diff
                      </button>

                      {!isActive && (
                        <button
                          id={`revert-to-${ver.id}`}
                          onClick={() => onRevert(ver)}
                          className="px-3 py-1 text-[10px] bg-indigo-500/80 hover:bg-indigo-600 text-white rounded-lg border border-indigo-400/20 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <RotateCcw className="h-3 w-3" /> Revert
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* UNIFIED COMPARATIVE DIFF MODAL */}
      {showDiffModal && selectedOldVersion && selectedNewVersion && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-container rounded-3xl border border-white/15 shadow-2xl shadow-black/50 max-w-5xl w-full max-h-[90vh] flex flex-col justify-between overflow-hidden">
            
            {/* Header */}
            <div className="p-5.5 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 font-display">
                  <Columns className="h-4.5 w-4.5 text-indigo-400" /> Commit Diff Comparator
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Comparing v{selectedOldVersion.versionString} with {selectedNewVersion.versionString}
                </p>
              </div>
              <button
                id="close-diff-modal"
                onClick={() => setShowDiffModal(false)}
                className="text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Close Diff
              </button>
            </div>

            {/* Side-by-Side Content Blocks */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-white/2">
              
              {/* Params Compare */}
              <div className="grid grid-cols-2 gap-4 text-xs border-b border-white/5 pb-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-400 font-mono uppercase">v{selectedOldVersion.versionString} Metadata</h4>
                  <ul className="space-y-1 text-slate-200 font-mono text-[11px]">
                    <li>Model: {selectedOldVersion.model}</li>
                    <li>Temperature: {selectedOldVersion.temperature}</li>
                    <li>System Instruction: {selectedOldVersion.systemInstruction?.length || 0} chars</li>
                  </ul>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-slate-400 font-mono uppercase">{selectedNewVersion.versionString} Metadata</h4>
                  <ul className="space-y-1 text-slate-200 font-mono text-[11px]">
                    <li>Model: {selectedNewVersion.model}</li>
                    <li>Temperature: {selectedNewVersion.temperature}</li>
                    <li>System Instruction: {selectedNewVersion.systemInstruction?.length || 0} chars</li>
                  </ul>
                </div>
              </div>

              {/* Template Body Line-by-Line Diff */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 font-mono uppercase">TEMPLATE BODY DIFFERENCES:</h4>
                <div className="border border-white/10 rounded-2xl overflow-hidden bg-slate-950/40 text-xs font-mono max-h-[50vh] overflow-y-auto">
                  {getLineDiffs(selectedOldVersion.template, selectedNewVersion.template).map((diff, idx) => {
                    let bgClass = "bg-transparent text-slate-200 border-b border-white/2";
                    let sign = " ";
                    if (diff.type === "added") {
                      bgClass = "bg-emerald-500/10 text-emerald-300 border-l-4 border-emerald-500/80 border-b border-white/2";
                      sign = "+";
                    } else if (diff.type === "removed") {
                      bgClass = "bg-red-500/10 text-red-300 border-l-4 border-red-500/80 line-through border-b border-white/2";
                      sign = "-";
                    } else if (diff.type === "modified") {
                      bgClass = "bg-amber-500/10 text-amber-300 border-l-4 border-amber-500/80 border-b border-white/2";
                      sign = "~";
                    }

                    return (
                      <div key={idx} className={`p-2.5 flex gap-4 ${bgClass}`}>
                        <span className="w-8 shrink-0 text-slate-500 text-right select-none">{diff.lineNum}</span>
                        <span className="w-4 shrink-0 font-bold select-none">{sign}</span>
                        
                        <div className="grid grid-cols-2 gap-4 flex-1">
                          <span className="truncate" title={diff.oldText || ""}>{diff.oldText || ""}</span>
                          <span className="truncate" title={diff.newText || ""}>{diff.newText || ""}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4.5 border-t border-white/5 flex items-center justify-between bg-white/5 text-xs">
              <span className="text-slate-400 font-mono">Line calculations calculated live</span>
              <button
                id="close-diff-modal-footer"
                onClick={() => setShowDiffModal(false)}
                className="px-5 py-2 bg-indigo-500/80 hover:bg-indigo-600 text-white rounded-xl border border-indigo-400/20 font-semibold cursor-pointer transition-colors"
              >
                Okay, got it
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
