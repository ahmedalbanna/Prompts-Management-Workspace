import React, { useState, useEffect } from "react";
import { ProviderConfig, ModelOption } from "../types";
import { Registry } from "../modelsRegistry";
import { 
  Cpu, 
  Cloud, 
  HardDrive, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Settings2, 
  Globe, 
  Terminal, 
  Key, 
  Zap, 
  ShieldCheck, 
  Sliders, 
  Sparkles,
  ExternalLink
} from "lucide-react";

interface ModelProvidersManagerProps {
  onProvidersUpdated?: () => void;
}

export default function ModelProvidersManager({ onProvidersUpdated }: ModelProvidersManagerProps) {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/providers");
      const data = await res.json();
      if (data.success && Array.isArray(data.providers) && data.providers.length > 0) {
        setProviders(data.providers);
      } else {
        setProviders(Registry.DEFAULT_PROVIDERS);
      }
    } catch (err) {
      console.warn("Failed to fetch providers, using registry defaults", err);
      setProviders(Registry.DEFAULT_PROVIDERS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleTestConnection = async (provider: ProviderConfig) => {
    setTestingId(provider.id);
    setNotification(null);
    try {
      const res = await fetch("/api/providers/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: provider.id,
          endpointUrl: provider.endpointUrl,
          apiKey: provider.apiKey,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Update local status & latency
        setProviders(prev => prev.map(p => p.id === provider.id ? {
          ...p,
          status: data.status || "online",
          latencyMs: data.latencyMs,
          lastChecked: new Date().toISOString()
        } : p));

        setNotification({ type: "success", text: data.message || `Connected to ${provider.name}!` });
      } else {
        setNotification({ type: "error", text: data.error || `Failed to connect to ${provider.name}.` });
      }
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || `Connection error to ${provider.name}` });
    } finally {
      setTestingId(null);
    }
  };

  const handleSaveProvider = async (provider: ProviderConfig) => {
    setSavingId(provider.id);
    setNotification(null);
    try {
      const res = await fetch("/api/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(provider),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: "success", text: `Provider settings for ${provider.name} saved to SQLite!` });
        if (onProvidersUpdated) onProvidersUpdated();
      } else {
        setNotification({ type: "error", text: data.error || "Failed to save provider config." });
      }
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to save provider config." });
    } finally {
      setSavingId(null);
    }
  };

  const updateProviderField = (id: string, field: keyof ProviderConfig, value: any) => {
    setProviders(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const cloudProviders = providers.filter(p => p.category === "cloud");
  const localProviders = providers.filter(p => p.category === "local");

  return (
    <div className="space-y-6 p-1" id="model-providers-workspace">
      
      {/* Top Header Banner */}
      <div className="glass-container rounded-3xl p-6 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/20 border border-indigo-500/30 p-3 rounded-2xl text-indigo-400">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-display">AI Model Providers & Local Engines</h2>
              <span className="bg-indigo-500/15 text-indigo-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-indigo-500/30">
                HYBRID CLOUD & LOCAL
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">
              Connect local AI servers (Ollama, LM Studio) or cloud provider keys (Gemini, OpenAI, Anthropic).
            </p>
          </div>
        </div>

        <button
          id="refresh-providers-btn"
          onClick={fetchProviders}
          disabled={loading}
          className="px-3.5 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer self-end md:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-indigo-400 ${loading ? "animate-spin" : ""}`} /> Refresh Registries
        </button>
      </div>

      {notification && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center gap-2.5 font-mono ${
          notification.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
            : "bg-rose-500/10 border-rose-500/20 text-rose-300"
        }`}>
          {notification.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <XCircle className="h-4 w-4 shrink-0 text-rose-400" />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* SECTION 1: LOCAL AI ENGINES & SELF-HOSTED PROVIDERS */}
      <div className="space-y-4" id="local-ai-providers-section">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-indigo-400" /> Local AI Model Engines & Self-Hosted Servers
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">Zero Cloud Latency & Privacy Preserved</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {localProviders.map(provider => (
            <div key={provider.id} className="glass-container p-5 rounded-3xl border border-white/10 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
                      <Terminal className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white font-display">{provider.name}</h4>
                      <span className="text-[10px] text-emerald-400 font-mono uppercase">Local Machine</span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                    provider.status === "online" 
                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                  }`}>
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" /> {provider.status.toUpperCase()}
                  </span>
                </div>

                {/* Endpoint URL Input */}
                {provider.id !== "local_engine" ? (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1 font-mono">Server Endpoint URL</label>
                    <input
                      type="text"
                      value={provider.endpointUrl || ""}
                      onChange={e => updateProviderField(provider.id, "endpointUrl", e.target.value)}
                      className="w-full text-xs font-mono px-3 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-indigo-300"
                      placeholder="http://localhost:11434"
                    />
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-sans">
                    Deterministic offline test engine running directly in node/browser with zero latency and zero setup required.
                  </p>
                )}

                {/* Models List Badge */}
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Available Models ({provider.availableModels?.length || 0}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {provider.availableModels?.map(m => (
                      <span key={m} className="px-2 py-0.5 bg-white/5 text-slate-300 text-[10px] font-mono rounded-lg border border-white/10">
                        {m.replace("ollama:", "").replace("lmstudio:", "").replace("local-engine:", "")}
                      </span>
                    ))}
                  </div>
                </div>

                {provider.latencyMs !== undefined && (
                  <p className="text-[10px] text-slate-400 font-mono">
                    Ping Latency: <strong className="text-emerald-400">{provider.latencyMs}ms</strong>
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <button
                  onClick={() => handleTestConnection(provider)}
                  disabled={testingId === provider.id}
                  className="flex-1 px-3 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-semibold rounded-xl border border-indigo-500/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Zap className={`h-3.5 w-3.5 ${testingId === provider.id ? "animate-spin" : ""}`} /> Test Ping
                </button>

                <button
                  onClick={() => handleSaveProvider(provider)}
                  disabled={savingId === provider.id}
                  className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> Save
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: CLOUD AI PROVIDERS */}
      <div className="space-y-4" id="cloud-ai-providers-section">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display flex items-center gap-2">
            <Cloud className="h-4 w-4 text-indigo-400" /> Cloud AI Model Providers
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">Google Gemini, OpenAI, Anthropic</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {cloudProviders.map(provider => (
            <div key={provider.id} className="glass-container p-5 rounded-3xl border border-white/10 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
                      <Cloud className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white font-display">{provider.name}</h4>
                      <span className="text-[10px] text-indigo-300 font-mono uppercase">Cloud Infrastructure</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" /> READY
                  </span>
                </div>

                {/* API Key Configurator */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 font-mono flex items-center gap-1">
                    <Key className="h-3 w-3 text-amber-400" /> {provider.id === "gemini" ? "Gemini API Key (Platform Managed)" : `${provider.name} API Key`}
                  </label>
                  <input
                    type="password"
                    value={provider.id === "gemini" ? "••••••••••••••••••••••••" : provider.apiKey || ""}
                    onChange={e => updateProviderField(provider.id, "apiKey", e.target.value)}
                    disabled={provider.id === "gemini"}
                    className="w-full text-xs font-mono px-3 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white disabled:opacity-60"
                    placeholder="sk-..."
                  />
                </div>

                {/* Models List */}
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Supported Models:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {provider.availableModels?.map(m => (
                      <span key={m} className="px-2 py-0.5 bg-white/5 text-slate-300 text-[10px] font-mono rounded-lg border border-white/10">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <button
                  onClick={() => handleTestConnection(provider)}
                  disabled={testingId === provider.id}
                  className="flex-1 px-3 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-semibold rounded-xl border border-indigo-500/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Zap className={`h-3.5 w-3.5 ${testingId === provider.id ? "animate-spin" : ""}`} /> Verify Status
                </button>

                {provider.id !== "gemini" && (
                  <button
                    onClick={() => handleSaveProvider(provider)}
                    disabled={savingId === provider.id}
                    className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" /> Save
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
