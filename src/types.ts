export type ProviderType = "gemini" | "openai" | "anthropic" | "ollama" | "lmstudio" | "local_engine";

export type ProviderCategory = "cloud" | "local";

export interface ModelOption {
  id: string;
  name: string;
  provider: ProviderType;
  category: ProviderCategory;
  description: string;
  isLocal: boolean;
  contextWindow?: number;
  badge?: string;
}

export interface ProviderConfig {
  id: ProviderType;
  name: string;
  category: ProviderCategory;
  isEnabled: boolean;
  endpointUrl?: string;
  apiKey?: string;
  status: "online" | "offline" | "unconfigured" | "testing";
  availableModels: string[];
  latencyMs?: number;
  lastChecked?: string;
}

export interface PromptVersion {
  id: string;
  versionString: string;
  commitMessage: string;
  systemInstruction: string;
  template: string;
  model: string;
  temperature: number;
  maxOutputTokens?: number;
  createdAt: string;
}

export interface TestCase {
  id: string;
  name: string;
  variables: Record<string, string>;
  lastResult?: {
    output: string;
    durationMs: number;
    tokens: {
      prompt: number;
      candidates: number;
      total: number;
    };
    evaluatedAt: string;
  };
}

export interface Prompt {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  systemInstruction: string;
  template: string; // the markdown/prompt content with {{variables}}
  model: string; // e.g., 'gemini-3.5-flash', 'ollama:llama3.2', etc.
  temperature: number;
  maxOutputTokens?: number;
  versions: PromptVersion[];
  currentVersionIndex: number; // pointer to active version in array
  testCases: TestCase[];
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationResult {
  id: string;
  name: string;
  success: boolean;
  output?: string;
  error?: string;
  durationMs?: number;
  tokens?: {
    prompt: number;
    candidates: number;
    total: number;
  };
}

