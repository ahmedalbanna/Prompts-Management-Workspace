import React, { useState, useEffect } from "react";
import { 
  Database, 
  Terminal, 
  Table, 
  RefreshCw, 
  HardDrive, 
  CheckCircle, 
  AlertCircle, 
  Play, 
  Layers, 
  FileCode, 
  RotateCcw,
  Sparkles
} from "lucide-react";

interface SqliteStats {
  filePath: string;
  fileSizeBytes: number;
  promptsCount: number;
  versionsCount: number;
  testCasesCount: number;
  logsCount: number;
  tables: string[];
}

interface SqliteInspectorProps {
  onRefreshPrompts: () => void;
}

export default function SqliteInspector({ onRefreshPrompts }: SqliteInspectorProps) {
  const [stats, setStats] = useState<SqliteStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // SQL Explorer state
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "terminal" | "browser">("overview");
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM prompts LIMIT 10;");
  const [queryColumns, setQueryColumns] = useState<string[]>([]);
  const [queryRows, setQueryRows] = useState<any[][]>([]);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);

  // Selected table for browser
  const [selectedTable, setSelectedTable] = useState("prompts");

  const fetchStats = async () => {
    setLoadingStats(true);
    setError(null);
    try {
      const res = await fetch("/api/db/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.error || "Failed to load SQLite stats");
      }
    } catch (err: any) {
      setError(err.message || "Failed to communicate with SQLite server endpoint");
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRunQuery = async (customQuery?: string) => {
    const q = customQuery || sqlQuery;
    setIsExecutingQuery(true);
    setQueryError(null);
    try {
      const res = await fetch("/api/db/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (data.success) {
        setQueryColumns(data.columns || []);
        setQueryRows(data.rows || []);
      } else {
        setQueryError(data.error || "SQL Execution error.");
      }
    } catch (err: any) {
      setQueryError(err.message || "Failed to run query");
    } finally {
      setIsExecutingQuery(false);
    }
  };

  const handleResetDatabase = async () => {
    if (!window.confirm("Are you sure you want to reset the SQLite database back to original initial prompts?")) {
      return;
    }
    try {
      const res = await fetch("/api/db/reset", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        fetchStats();
        onRefreshPrompts();
        alert("SQLite database successfully reset and seeded!");
      } else {
        alert("Failed to reset SQLite database: " + data.error);
      }
    } catch (err: any) {
      alert("Error resetting SQLite db: " + err.message);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6 p-1" id="sqlite-inspector-workspace">
      
      {/* Top Banner Control Header */}
      <div className="glass-container rounded-3xl p-6 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/20 border border-indigo-500/30 p-3 rounded-2xl text-indigo-400">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-display">Local SQLite Database Manager</h2>
              <span className="bg-emerald-500/15 text-emerald-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-emerald-400" /> ONLINE & ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">
              Native SQLite storage engine running on host (`promptcraft.sqlite`)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-center">
          <button
            id="refresh-sqlite-stats-btn"
            onClick={fetchStats}
            disabled={loadingStats}
            className="px-3.5 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-indigo-400 ${loadingStats ? "animate-spin" : ""}`} /> Refresh Stats
          </button>

          <button
            id="reset-sqlite-db-btn"
            onClick={handleResetDatabase}
            className="px-3.5 py-2 bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/25 text-rose-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 text-rose-400" /> Reset SQLite DB
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-300 p-4 rounded-2xl border border-red-500/20 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Database Overview Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="sqlite-metrics-cards">
          
          <div className="glass-container p-4.5 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <HardDrive className="h-3.5 w-3.5 text-indigo-400" /> Disk Payload
            </span>
            <p className="text-lg font-bold text-white font-display">{formatBytes(stats.fileSizeBytes)}</p>
            <p className="text-[10px] text-slate-400 truncate font-mono" title={stats.filePath}>
              {stats.filePath.split("/").pop()}
            </p>
          </div>

          <div className="glass-container p-4.5 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-indigo-400" /> Active Templates
            </span>
            <p className="text-lg font-bold text-white font-display">{stats.promptsCount} Prompts</p>
            <p className="text-[10px] text-slate-400 font-mono">
              In `prompts` table
            </p>
          </div>

          <div className="glass-container p-4.5 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <FileCode className="h-3.5 w-3.5 text-indigo-400" /> Commit Versions
            </span>
            <p className="text-lg font-bold text-white font-display">{stats.versionsCount} Commits</p>
            <p className="text-[10px] text-slate-400 font-mono">
              In `prompt_versions` table
            </p>
          </div>

          <div className="glass-container p-4.5 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> Execution Logs
            </span>
            <p className="text-lg font-bold text-white font-display">{stats.logsCount} Runs</p>
            <p className="text-[10px] text-slate-400 font-mono">
              In `execution_logs` table
            </p>
          </div>

        </div>
      )}

      {/* Nav Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3" id="sqlite-subtabs">
        <button
          id="tab-sqlite-overview"
          onClick={() => setActiveSubTab("overview")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === "overview"
              ? "bg-indigo-500/20 text-white border border-indigo-500/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Database className="h-3.5 w-3.5" /> Database Tables
        </button>

        <button
          id="tab-sqlite-terminal"
          onClick={() => {
            setActiveSubTab("terminal");
            if (queryRows.length === 0) {
              handleRunQuery("SELECT * FROM prompts LIMIT 5;");
            }
          }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === "terminal"
              ? "bg-indigo-500/20 text-white border border-indigo-500/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Terminal className="h-3.5 w-3.5" /> SQL Query Explorer
        </button>
      </div>

      {/* SUBTAB 1: Database Tables overview */}
      {activeSubTab === "overview" && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-container p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
              <Table className="h-4 w-4 text-indigo-400" /> SQLite Tables Schema
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                <span className="text-indigo-300 font-bold">1. prompts</span>
                <p className="text-[11px] text-slate-400">Stores prompt titles, system instructions, model config, and temperature.</p>
              </div>

              <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                <span className="text-indigo-300 font-bold">2. prompt_versions</span>
                <p className="text-[11px] text-slate-400">Tracks commit version history with line diffs and author metadata.</p>
              </div>

              <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                <span className="text-indigo-300 font-bold">3. test_cases</span>
                <p className="text-[11px] text-slate-400">Holds test scenario variable payloads for parallel evaluations.</p>
              </div>

              <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                <span className="text-indigo-300 font-bold">4. execution_logs</span>
                <p className="text-[11px] text-slate-400">Records response outputs, latency timings, and token metrics.</p>
              </div>
            </div>
          </div>

          <div className="glass-container p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-indigo-400" /> Storage Engine Info
            </h3>

            <div className="space-y-2 text-xs font-mono text-slate-300">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Engine Type:</span>
                <span className="text-white font-bold">SQLite 3.x (sql.js / WASM + Node)</span>
              </div>

              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">File Path:</span>
                <span className="text-indigo-300 font-bold truncate max-w-[200px]" title={stats.filePath}>
                  promptcraft.sqlite
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Disk Size:</span>
                <span className="text-white font-bold">{formatBytes(stats.fileSizeBytes)}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Data Integrity:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" /> PERSISTED
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: Interactive Terminal Explorer */}
      {activeSubTab === "terminal" && (
        <div className="glass-container p-6 rounded-3xl border border-white/10 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                <Terminal className="h-4.5 w-4.5 text-indigo-400" /> SQL Query Explorer
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Run custom read-only SELECT queries directly against your local SQLite database.
              </p>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-500 font-mono">PRESETS:</span>
              <button
                onClick={() => {
                  const q = "SELECT id, title, category, model, temperature FROM prompts;";
                  setSqlQuery(q);
                  handleRunQuery(q);
                }}
                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-[10px] font-mono border border-white/10 cursor-pointer"
              >
                prompts
              </button>

              <button
                onClick={() => {
                  const q = "SELECT id, prompt_id, version_string, commit_message, created_at FROM prompt_versions;";
                  setSqlQuery(q);
                  handleRunQuery(q);
                }}
                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-[10px] font-mono border border-white/10 cursor-pointer"
              >
                versions
              </button>

              <button
                onClick={() => {
                  const q = "SELECT * FROM execution_logs ORDER BY created_at DESC LIMIT 10;";
                  setSqlQuery(q);
                  handleRunQuery(q);
                }}
                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-[10px] font-mono border border-white/10 cursor-pointer"
              >
                logs
              </button>
            </div>
          </div>

          {/* SQL Input Area */}
          <div className="space-y-2">
            <div className="relative">
              <textarea
                value={sqlQuery}
                onChange={e => setSqlQuery(e.target.value)}
                rows={3}
                className="w-full bg-slate-950/80 border border-white/10 text-emerald-400 font-mono text-xs rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 leading-relaxed"
                placeholder="Enter SQL SELECT query..."
              />
              <button
                onClick={() => handleRunQuery()}
                disabled={isExecutingQuery}
                className="absolute bottom-3 right-3 px-4 py-2 bg-indigo-500/80 hover:bg-indigo-600 disabled:bg-indigo-500/40 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-md border border-indigo-400/20 cursor-pointer"
              >
                <Play className={`h-3.5 w-3.5 ${isExecutingQuery ? "animate-spin" : ""}`} /> Execute Query
              </button>
            </div>
          </div>

          {queryError && (
            <div className="bg-red-500/10 text-red-300 p-3.5 rounded-xl border border-red-500/20 text-xs font-mono">
              Error: {queryError}
            </div>
          )}

          {/* Query Results Table */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Result Set ({queryRows.length} rows returned):
            </span>

            <div className="border border-white/10 rounded-2xl overflow-x-auto bg-slate-950/40 max-h-80 overflow-y-auto">
              {queryColumns.length === 0 ? (
                <p className="text-xs text-slate-500 p-6 text-center font-mono">
                  No records returned or execute query above.
                </p>
              ) : (
                <table className="w-full text-left text-xs font-mono text-slate-200">
                  <thead className="bg-white/10 border-b border-white/10 text-indigo-300 font-bold sticky top-0">
                    <tr>
                      {queryColumns.map(col => (
                        <th key={col} className="p-3 font-semibold uppercase tracking-wider whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {queryRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                        {row.map((val, cIdx) => (
                          <td key={cIdx} className="p-3 max-w-xs truncate" title={String(val)}>
                            {val === null || val === undefined ? (
                              <em className="text-slate-600">null</em>
                            ) : (
                              String(val)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
