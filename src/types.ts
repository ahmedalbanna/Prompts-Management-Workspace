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
  model: string; // e.g., 'gemini-3.5-flash', 'gemini-3.1-pro-preview'
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
