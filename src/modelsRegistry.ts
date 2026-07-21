import { ModelOption, ProviderConfig, ProviderType } from "./types";

export class Registry {
  // Predefined Model List across Cloud & Local Providers
  public static readonly ALL_MODELS: ModelOption[] = [
    // --- GOOGLE GEMINI (CLOUD) ---
    {
      id: "gemini-3.5-flash",
      name: "Gemini 3.5 Flash",
      provider: "gemini",
      category: "cloud",
      description: "Fast, intelligent general multimodal model for prompt development.",
      isLocal: false,
      contextWindow: 1048576,
      badge: "CLOUD",
    },
    {
      id: "gemini-3.1-pro-preview",
      name: "Gemini 3.1 Pro Preview",
      provider: "gemini",
      category: "cloud",
      description: "High-reasoning, heavy logic and complex problem solver.",
      isLocal: false,
      contextWindow: 2097152,
      badge: "CLOUD",
    },
    {
      id: "gemini-3.1-flash-lite",
      name: "Gemini 3.1 Flash Lite",
      provider: "gemini",
      category: "cloud",
      description: "Ultra lightweight, high-throughput low-latency model.",
      isLocal: false,
      contextWindow: 1048576,
      badge: "CLOUD",
    },

    // --- OPENAI (CLOUD) ---
    {
      id: "openai:gpt-4o",
      name: "GPT-4o (OpenAI)",
      provider: "openai",
      category: "cloud",
      description: "Flagship high-precision OpenAI model.",
      isLocal: false,
      contextWindow: 128000,
      badge: "CLOUD",
    },
    {
      id: "openai:gpt-4o-mini",
      name: "GPT-4o Mini (OpenAI)",
      provider: "openai",
      category: "cloud",
      description: "Efficient, low-cost model for lightweight evaluation.",
      isLocal: false,
      contextWindow: 128000,
      badge: "CLOUD",
    },

    // --- ANTHROPIC (CLOUD) ---
    {
      id: "anthropic:claude-3-5-sonnet",
      name: "Claude 3.5 Sonnet (Anthropic)",
      provider: "anthropic",
      category: "cloud",
      description: "Industry-leading coding, analysis, and reasoning model.",
      isLocal: false,
      contextWindow: 200000,
      badge: "CLOUD",
    },
    {
      id: "anthropic:claude-3-haiku",
      name: "Claude 3 Haiku (Anthropic)",
      provider: "anthropic",
      category: "cloud",
      description: "Ultra-fast response speed for near-instant execution.",
      isLocal: false,
      contextWindow: 200000,
      badge: "CLOUD",
    },

    // --- OLLAMA (LOCAL SERVER) ---
    {
      id: "ollama:llama3.2",
      name: "Llama 3.2 (Ollama Local)",
      provider: "ollama",
      category: "local",
      description: "Meta's state-of-the-art open model running locally via Ollama.",
      isLocal: true,
      contextWindow: 128000,
      badge: "LOCAL OLLAMA",
    },
    {
      id: "ollama:mistral",
      name: "Mistral 7B (Ollama Local)",
      provider: "ollama",
      category: "local",
      description: "Popular local model optimized for instruction following.",
      isLocal: true,
      contextWindow: 32000,
      badge: "LOCAL OLLAMA",
    },
    {
      id: "ollama:gemma2",
      name: "Gemma 2 (Ollama Local)",
      provider: "ollama",
      category: "local",
      description: "Google's lightweight open model executing on local machine.",
      isLocal: true,
      contextWindow: 8192,
      badge: "LOCAL OLLAMA",
    },
    {
      id: "ollama:phi3",
      name: "Phi-3 Mini (Ollama Local)",
      provider: "ollama",
      category: "local",
      description: "Microsoft's highly compressed small local language model.",
      isLocal: true,
      contextWindow: 128000,
      badge: "LOCAL OLLAMA",
    },

    // --- LM STUDIO (LOCAL OPENAI API) ---
    {
      id: "lmstudio:qwen2.5-coder",
      name: "Qwen 2.5 Coder (LM Studio)",
      provider: "lmstudio",
      category: "local",
      description: "Open source coding champion model running locally via LM Studio.",
      isLocal: true,
      contextWindow: 32000,
      badge: "LOCAL LM STUDIO",
    },
    {
      id: "lmstudio:local-model",
      name: "Active Loaded Model (LM Studio)",
      provider: "lmstudio",
      category: "local",
      description: "Whatever model is currently loaded in your LM Studio server.",
      isLocal: true,
      contextWindow: 16384,
      badge: "LOCAL LM STUDIO",
    },

    // --- LOCAL DETERMINISTIC ENGINE (ZERO LATENCY / OFFLINE) ---
    {
      id: "local-engine:deterministic-simulator",
      name: "Local Offline Engine (Simulator)",
      provider: "local_engine",
      category: "local",
      description: "Zero API Key, zero latency offline prompt compiler for instant local debugging.",
      isLocal: true,
      contextWindow: 32768,
      badge: "OFFLINE ENGINE",
    },
  ];

  // Default initial Provider Configurations
  public static readonly DEFAULT_PROVIDERS: ProviderConfig[] = [
    {
      id: "gemini",
      name: "Google Gemini",
      category: "cloud",
      isEnabled: true,
      status: "online",
      availableModels: ["gemini-3.5-flash", "gemini-3.1-pro-preview", "gemini-3.1-flash-lite"],
    },
    {
      id: "openai",
      name: "OpenAI",
      category: "cloud",
      isEnabled: true,
      apiKey: "",
      status: "online",
      availableModels: ["openai:gpt-4o", "openai:gpt-4o-mini"],
    },
    {
      id: "anthropic",
      name: "Anthropic Claude",
      category: "cloud",
      isEnabled: true,
      apiKey: "",
      status: "online",
      availableModels: ["anthropic:claude-3-5-sonnet", "anthropic:claude-3-haiku"],
    },
    {
      id: "ollama",
      name: "Ollama (Local Server)",
      category: "local",
      isEnabled: true,
      endpointUrl: "http://localhost:11434",
      status: "online",
      availableModels: ["ollama:llama3.2", "ollama:mistral", "ollama:gemma2", "ollama:phi3"],
    },
    {
      id: "lmstudio",
      name: "LM Studio (Local Server)",
      category: "local",
      isEnabled: true,
      endpointUrl: "http://localhost:1234/v1",
      status: "online",
      availableModels: ["lmstudio:qwen2.5-coder", "lmstudio:local-model"],
    },
    {
      id: "local_engine",
      name: "Local Offline Engine",
      category: "local",
      isEnabled: true,
      status: "online",
      availableModels: ["local-engine:deterministic-simulator"],
    },
  ];
}

// Utility to parse model info
export function parseModelProvider(modelId: string): { provider: ProviderType; isLocal: boolean; cleanName: string } {
  if (modelId.startsWith("ollama:")) {
    return { provider: "ollama", isLocal: true, cleanName: modelId.replace("ollama:", "") };
  }
  if (modelId.startsWith("lmstudio:")) {
    return { provider: "lmstudio", isLocal: true, cleanName: modelId.replace("lmstudio:", "") };
  }
  if (modelId.startsWith("local-engine:")) {
    return { provider: "local_engine", isLocal: true, cleanName: "Local Engine Simulator" };
  }
  if (modelId.startsWith("openai:")) {
    return { provider: "openai", isLocal: false, cleanName: modelId.replace("openai:", "") };
  }
  if (modelId.startsWith("anthropic:")) {
    return { provider: "anthropic", isLocal: false, cleanName: modelId.replace("anthropic:", "") };
  }
  return { provider: "gemini", isLocal: false, cleanName: modelId };
}
