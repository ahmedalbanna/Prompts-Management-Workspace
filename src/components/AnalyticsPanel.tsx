import React, { useMemo } from "react";
import { Prompt } from "../types";
import { 
  BarChart, 
  Tag, 
  TrendingUp, 
  FileText, 
  CheckCircle, 
  BookOpen, 
  FileCode,
  Gauge
} from "lucide-react";

interface AnalyticsPanelProps {
  prompts: Prompt[];
  selectedPrompt: Prompt | null;
}

export default function AnalyticsPanel({
  prompts,
  selectedPrompt,
}: AnalyticsPanelProps) {
  
  // 1. Calculate Automated Readability Index (ARI) of selected prompt template
  const ariMetrics = useMemo(() => {
    if (!selectedPrompt) return null;
    const text = selectedPrompt.template || "";
    
    // Simple regex counts
    const characters = text.replace(/\s+/g, "").length;
    const words = text.split(/\s+/).filter(Boolean).length;
    // Sentences count based on periods, question marks, or exclamation marks
    const sentences = text.split(/[.!?]+/).filter(Boolean).length || 1;

    if (words === 0) return { score: 0, grade: "Empty" };

    // ARI formula: 4.71 * (characters / words) + 0.5 * (words / sentences) - 21.43
    const score = Math.max(1, Math.round(4.71 * (characters / words) + 0.5 * (words / sentences) - 21.43));
    
    let grade = "Kindergarten";
    let desc = "Extremely easy to comprehend";
    
    if (score <= 4) {
      grade = "Elementary School";
      desc = "Very easy to read";
    } else if (score <= 8) {
      grade = "Middle School";
      desc = "Standard conversational clarity";
    } else if (score <= 12) {
      grade = "High School";
      desc = "Appropriate for general audience";
    } else if (score <= 14) {
      grade = "College Level";
      desc = "Requires dedicated concentration";
    } else {
      grade = "Post-Graduate Research";
      desc = "Extremely dense scholarly structure";
    }

    return { score, grade, desc, characters, words, sentences };
  }, [selectedPrompt]);

  // 2. Calculate Code-to-Prose Ratio
  const codeToProseRatio = useMemo(() => {
    if (!selectedPrompt) return { codePercentage: 0, prosePercentage: 0 };
    const text = selectedPrompt.template || "";
    
    // Count lines starting or containing code markers
    const lines = text.split("\n");
    let codeLines = 0;
    let insideBlock = false;

    lines.forEach(l => {
      const trimmed = l.trim();
      if (trimmed.startsWith("```")) {
        insideBlock = !insideBlock;
        codeLines++;
      } else if (insideBlock) {
        codeLines++;
      } else if (trimmed.startsWith("-") || trimmed.startsWith("*") || trimmed.startsWith("#") || trimmed.length === 0) {
        // structural markdown
      } else if (trimmed.includes("function") || trimmed.includes("const ") || trimmed.includes("import ") || trimmed.includes("{") || trimmed.includes("}")) {
        codeLines++;
      }
    });

    const totalLines = lines.length || 1;
    const codePercentage = Math.round((codeLines / totalLines) * 100);
    const prosePercentage = 100 - codePercentage;

    return { codePercentage, prosePercentage };
  }, [selectedPrompt]);

  // 3. Structural Sentiment / Tone Analysis (Keyword analysis)
  const toneMetrics = useMemo(() => {
    if (!selectedPrompt) return { positive: 40, neutral: 50, negative: 10 };
    
    const text = (selectedPrompt.template + " " + selectedPrompt.systemInstruction).toLowerCase();
    
    const posKeywords = ["optimal", "excellent", "success", "clean", "beautiful", "high-performance", "perfect", "ensure", "expert", "best", "revert"];
    const negKeywords = ["error", "fail", "limit", "critical", "edge case", "prevent", "restrict", "danger", "exception", "decline", "prune"];

    let posCount = 0;
    let negCount = 0;

    posKeywords.forEach(kw => {
      const regex = new RegExp(`\\b${kw}\\b`, "g");
      const matches = text.match(regex);
      if (matches) posCount += matches.length;
    });

    negKeywords.forEach(kw => {
      const regex = new RegExp(`\\b${kw}\\b`, "g");
      const matches = text.match(regex);
      if (matches) negCount += matches.length;
    });

    const totalKeywords = posCount + negCount;
    if (totalKeywords === 0) {
      return { positive: 20, neutral: 70, negative: 10 };
    }

    const positive = Math.round((posCount / totalKeywords) * 80) + 10;
    const negative = Math.round((negCount / totalKeywords) * 15) + 5;
    const neutral = 100 - (positive + negative);

    return { positive, neutral, negative };
  }, [selectedPrompt]);

  // 4. Global Tag Densities across all prompts
  const tagDensities = useMemo(() => {
    const counts: Record<string, number> = {};
    prompts.forEach(p => {
      p.tags.forEach(t => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6); // Top 6 tags
  }, [prompts]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-1" id="analytics-insights-dashboard">
      
      {/* COLUMN 1: Readability & Prose ratios (Selected prompt focused) */}
      <div className="space-y-6" id="selected-prompt-analytics">
        
        {selectedPrompt ? (
          <div className="glass-container rounded-3xl p-6 space-y-5 border border-white/10">
            <h3 className="text-sm font-bold text-white border-b border-white/5 pb-3.5 flex items-center gap-2 font-display">
              <BookOpen className="h-4.5 w-4.5 text-indigo-400" /> Content Intelligence ({selectedPrompt.title})
            </h3>

            {/* Readability Score */}
            {ariMetrics && (
              <div className="space-y-2.5" id="readability-index-box">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Automated Readability Index (ARI)</span>
                  <span className="bg-indigo-500/10 text-indigo-300 text-xs font-bold px-3 py-1.5 rounded-xl font-mono border border-indigo-500/25">
                    Score: {ariMetrics.score}
                  </span>
                </div>

                <div className="bg-white/5 p-4.5 border border-white/5 rounded-2xl space-y-1">
                  <h4 className="font-bold text-white text-sm font-display">{ariMetrics.grade}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{ariMetrics.desc}</p>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-[11px] text-slate-400 font-mono text-center pt-1">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                    <span>Characters</span>
                    <p className="text-white font-bold mt-0.5">{ariMetrics.characters}</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                    <span>Words</span>
                    <p className="text-white font-bold mt-0.5">{ariMetrics.words}</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                    <span>Sentences</span>
                    <p className="text-white font-bold mt-0.5">{ariMetrics.sentences}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Code to Prose Ratio */}
            <div className="space-y-2.5" id="code-to-prose-ratio-box">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Code-to-Prose Ratio</span>
              
              <div className="space-y-2 pt-1">
                {/* Visual Ratio Bar */}
                <div className="w-full h-3.5 bg-slate-900/40 border border-white/5 rounded-full overflow-hidden flex">
                  <div 
                    className="bg-indigo-500 h-full transition-all" 
                    style={{ width: `${codeToProseRatio.prosePercentage}%` }}
                    title={`Prose: ${codeToProseRatio.prosePercentage}%`}
                  />
                  <div 
                    className="bg-amber-500 h-full transition-all" 
                    style={{ width: `${codeToProseRatio.codePercentage}%` }}
                    title={`Code: ${codeToProseRatio.codePercentage}%`}
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] font-mono text-slate-400 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full inline-block"></span>
                    <span>Prose ({codeToProseRatio.prosePercentage}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block"></span>
                    <span>Code Structure ({codeToProseRatio.codePercentage}%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sentiment / Tone Insight */}
            <div className="space-y-2.5" id="tone-sentiment-bar-box">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">System Directives Tone Insights</span>
              
              <div className="space-y-2 pt-1">
                {/* Multi segment bar */}
                <div className="w-full h-3.5 bg-slate-900/40 border border-white/5 rounded-full overflow-hidden flex">
                  <div 
                    className="bg-emerald-500 h-full transition-all" 
                    style={{ width: `${toneMetrics.positive}%` }}
                  />
                  <div 
                    className="bg-neutral-500 h-full transition-all" 
                    style={{ width: `${toneMetrics.neutral}%` }}
                  />
                  <div 
                    className="bg-red-500 h-full transition-all" 
                    style={{ width: `${toneMetrics.negative}%` }}
                  />
                </div>

                <div className="flex flex-col gap-1 text-[10px] font-mono text-slate-400 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block"></span>
                    <span>Positive Assertions ({toneMetrics.positive}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-neutral-500 rounded-full inline-block"></span>
                    <span>Neutral Guidance ({toneMetrics.neutral}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-red-500 rounded-full inline-block"></span>
                    <span>Strict Constraints ({toneMetrics.negative}%)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="glass-container rounded-3xl p-10 text-center text-slate-400 border border-white/10 space-y-2">
            <FileText className="h-8 w-8 text-indigo-400 mx-auto mb-1" />
            <p className="text-xs text-slate-300 font-sans">Select a prompt template to review content intelligence.</p>
          </div>
        )}

      </div>

      {/* COLUMN 2: Global Library statistics (Tag distributions) */}
      <div className="space-y-6" id="library-global-analytics">
        
        <div className="glass-container rounded-3xl p-6 space-y-5 border border-white/10">
          <h3 className="text-sm font-bold text-white border-b border-white/5 pb-3.5 flex items-center gap-2 font-display">
            <BarChart className="h-4.5 w-4.5 text-indigo-400" /> Taxonomy & Library Distributions
          </h3>

          {/* Tag Densities */}
          <div className="space-y-3.5" id="tag-densities-box">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-indigo-400" /> Popular Classification Tags Density
            </span>

            {tagDensities.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center font-sans">No taxonomy tags logged.</p>
            ) : (
              <div className="space-y-3.5 pt-1">
                {tagDensities.map(({ tag, count }) => {
                  const maxCount = tagDensities[0]?.count || 1;
                  const pct = Math.round((count / maxCount) * 100);

                  return (
                    <div key={tag} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono text-slate-300">
                        <span>#{tag}</span>
                        <span className="font-semibold text-white">{count} {count === 1 ? "prompt" : "prompts"}</span>
                      </div>
                      
                      <div className="w-full bg-slate-900/40 h-2 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="bg-indigo-500 h-full transition-all" 
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* General Quota Indicators */}
          <div className="space-y-3.5 pt-2" id="quota-coverage-indicators-box">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
              <Gauge className="h-4 w-4 text-indigo-400" /> Prompt Workspace Capacity
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono text-slate-400 bg-white/5 p-4.5 border border-white/10 rounded-2xl">
              <div className="space-y-0.5">
                <span>Total Active Templates</span>
                <p className="text-white font-bold text-lg font-display">{prompts.length}</p>
              </div>

              <div className="space-y-0.5">
                <span>Stored VCS Commit Revisions</span>
                <p className="text-white font-bold text-lg font-display">
                  {prompts.reduce((acc, p) => acc + p.versions.length, 0)} commits
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
